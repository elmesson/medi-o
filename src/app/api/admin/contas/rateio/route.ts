import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import { geraPixPayload } from "@/lib/pix/emv";

async function requireGestao() {
  const token = cookies().get("admin_access_token")?.value || cookies().get("access_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    if (!["ADMINISTRADOR","PROPRIETARIO"].includes((payload as any).papel)) return null;
    return payload as any;
  } catch { return null; }
}

// POST { faturaId } ou { unidadeId, referencia, tipo } -> recalcula rateio por Tipo de cobrança
export async function POST(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { faturaId, unidadeId: uid, referencia: ref, tipo: t } = await req.json().catch(()=>({}));
  let faturaBase:any = null;
  let unidadeId:string, referencia:string, tipo:string, total:number, criterioRateio:string|null, dataEmissao:Date, dataVencimento:Date, bandeira:any, exibirDemonstrativo:boolean;

  if (faturaId) {
    faturaBase = await prisma.fatura.findUnique({ where: { id: faturaId }, include: { unidade: true } });
    if (!faturaBase) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    unidadeId = faturaBase.unidadeId; referencia = faturaBase.referencia; tipo = faturaBase.tipo;
    total = Number(faturaBase.valorTotal);
    // se já é per-inquilino, pega o total somando todas do mesmo grupo para recalcular
    const grupo = await prisma.fatura.findMany({ where: { unidadeId, referencia, tipo } });
    if (grupo.length>1) {
      // soma para ter total original quando já dividido (ou pega o maior se integral)
      const sum = grupo.reduce((s:any,f:any)=> s+Number(f.valorTotal),0);
      // se sum != total, usa sum como total (caso já dividido, precisa reconstituir)
      // tenta achar fatura integral sem inquilino como base
      const integral = grupo.find((x:any)=> !x.inquilinoId);
      total = integral ? Number(integral.valorTotal) : sum;
    }
    criterioRateio = faturaBase.criterioRateio;
    dataEmissao = faturaBase.dataEmissao;
    dataVencimento = faturaBase.dataVencimento;
    bandeira = (faturaBase as any).bandeira;
    exibirDemonstrativo = (faturaBase as any).exibirDemonstrativo;
  } else {
    if (!uid || !ref || !t) return NextResponse.json({ error: "faturaId ou unidadeId+referencia+tipo obrigatório" }, { status: 400 });
    unidadeId = uid; referencia = ref; tipo = t;
    const prim = await prisma.fatura.findFirst({ where: { unidadeId, referencia, tipo }, orderBy: { createdAt: "asc" } });
    if (!prim) return NextResponse.json({ error: "Nenhuma fatura encontrada para recalcular" }, { status: 404 });
    faturaBase = prim;
    total = Number(prim.valorTotal);
    const grupo = await prisma.fatura.findMany({ where: { unidadeId, referencia, tipo } });
    if (grupo.length>1) total = grupo.reduce((s:any,f:any)=> s+Number(f.valorTotal),0);
    // se grupo tem integral, usa integral
    const integral = grupo.find((x:any)=> !x.inquilinoId);
    if (integral) total = Number(integral.valorTotal);
    criterioRateio = prim.criterioRateio;
    dataEmissao = prim.dataEmissao;
    dataVencimento = prim.dataVencimento;
    bandeira = (prim as any).bandeira;
    exibirDemonstrativo = (prim as any).exibirDemonstrativo;
  }

  if (tipo==="CONDOMINIO" || tipo==="TAXA_EXTRA") return NextResponse.json({ error: "CONDOMINIO/TAXA_EXTRA não usa rateio por inquilino" }, { status: 400 });

  // exige leitura
  const leitura = await prisma.leitura.findUnique({ where: { unidadeId_tipo_referencia: { unidadeId, tipo, referencia } } });
  if (!leitura) return NextResponse.json({ error: `Leitura pendente para ${tipo} ${referencia} unidade ${unidadeId}`, code:"LEITURA_PENDENTE" }, { status: 400 });

  const unidadeComInqs = await prisma.unidade.findUnique({ where: { id: unidadeId }, include: { inquilinos: { include: { inquilino: true } } } });
  const vinculos = unidadeComInqs?.inquilinos || [];
  if (vinculos.length===0) return NextResponse.json({ error: "Unidade sem inquilinos para rateio" }, { status: 400 });
  if (vinculos.length===1) return NextResponse.json({ error: "Apenas 1 inquilino, não precisa rateio", fatura: faturaBase }, { status: 400 });

  // deleta faturas antigas do grupo (para recriar com rateio correto)
  await prisma.fatura.deleteMany({ where: { unidadeId, referencia, tipo } });

  const consumo = Number(leitura.consumo);
  const tarifa = leitura.tarifa ? Number(leitura.tarifa) : null;
  const pixConfig = await prisma.pixConfig.findFirst({ where: { ativo: true }, orderBy: { createdAt: "desc" } });

  const cobrancas = vinculos.map(v=>{
    const inq=v.inquilino;
    const tc = tipo==="ENERGIA" ? (inq.tipoCobrancaEnergia||"COMPARTILHADA") : tipo==="AGUA" ? (inq.tipoCobrancaAgua||"COMPARTILHADA") : (inq.tipoCobrancaGas||"COMPARTILHADA");
    const pct = tipo==="ENERGIA" ? inq.porcentagemEnergia : tipo==="AGUA" ? inq.porcentagemAgua : inq.porcentagemGas;
    return { inq, tipoCobranca: tc, porcentagem: pct?Number(pct):null };
  });
  const porcList = cobrancas.filter(c=> c.tipoCobranca==="PORCENTAGEM" && c.porcentagem!=null);
  const outros = cobrancas.filter(c=> c.tipoCobranca!=="PORCENTAGEM" || c.porcentagem==null);
  const sumPorc = porcList.reduce((s,c)=> s+(c.porcentagem||0),0);
  if (sumPorc>100.0001) return NextResponse.json({ error: `Soma porcentagens ${sumPorc}% >100%` }, { status:400 });
  const restante = total - total*(sumPorc/100);
  const valorPorOutros = outros.length ? restante/outros.length : 0;

  const criadas:any[]=[];
  for(const c of cobrancas){
    let share:number; let crit:string;
    if(c.tipoCobranca==="PORCENTAGEM" && c.porcentagem!=null){
      share = total*(c.porcentagem/100);
      crit = `PORCENTAGEM ${c.porcentagem}% • ${c.inq.nome} • Consumo ${consumo} • ${criterioRateio||""}`.trim();
    } else if(c.tipoCobranca==="RATIO"){
      share = valorPorOutros;
      crit = `RATIO • Consumo ${consumo} ${tipo==="ENERGIA"?"kWh":"m³"} • Tarifa ${tarifa ?? "-"} • ${criterioRateio||""}`.trim();
    } else {
      share = valorPorOutros;
      crit = `COMPARTILHADA • ${vinculos.length} inquilino(s) • Consumo ${consumo} • ${criterioRateio||""}`.trim();
    }
    share = Math.round(share*100)/100;
    const txid = `pix-${referencia}-${tipo}-${c.inq.id.slice(0,4)}-${Date.now()}-${Math.random().toString(36).slice(2,2)}`.slice(0,25);
    const pixQrCode = pixConfig ? geraPixPayload({ chave: pixConfig.chave, valor: share, txid, nome: pixConfig.titularNome, cidade: pixConfig.titularCidade }) : `00020126580014BR.GOV.BCB.PIX0136fake-${share}520400005303986540${share.toFixed(2)}5802BR5925ELMESSON`;
    const f = await prisma.fatura.create({
      data: {
        unidadeId, inquilinoId: c.inq.id, tipo, referencia, valorTotal: share, rateioValor: share, criterioRateio: crit,
        dataEmissao, dataVencimento, status: "ABERTA", pixTxId: txid, pixQrCode,
        valorDemonstrativo: share, descricaoDemonstrativo: crit, exibirDemonstrativo: exibirDemonstrativo ?? true, bandeira,
      },
      include: { unidade: true, inquilino: true }
    });
    criadas.push(f);
  }
  return NextResponse.json({ ok:true, totalOriginal: total, criadas, rateio: cobrancas.map(c=> ({ nome:c.inq.nome, tipoCobranca:c.tipoCobranca, porcentagem:c.porcentagem, valor: criadas.find(x=> x.inquilinoId===c.inq.id)?.valorTotal })) });
}
