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
    const papel = (payload as any).papel;
    if (!["ADMINISTRADOR","PROPRIETARIO"].includes(papel)) return null;
    return payload as any;
  } catch { return null; }
}

export async function GET() {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const lista = await prisma.fatura.findMany({ orderBy: { referencia: "desc" }, take: 200, include: { unidade: true, inquilino: true } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido (MASTER/ADMINISTRADOR/PROPRIETARIO)" }, { status: 403 });
  const { unidadeId, tipo, referencia, valorTotal, criterioRateio, dataEmissao, dataVencimento, status, valorDemonstrativo, descricaoDemonstrativo, exibirDemonstrativo, bandeira } = await req.json();
  if (!unidadeId || !tipo || !referencia || !valorTotal) return NextResponse.json({ error: "unidadeId, tipo, referencia, valorTotal obrigatórios" }, { status: 400 });
  const isCondo = tipo === "CONDOMINIO";
  const bandeiraVal = tipo === "ENERGIA" ? (bandeira || null) : null;
  // Regra: para ENERGIA/AGUA/GAS/TAXA_EXTRA o sistema só pode faturar após leitura
  // Identifica todos inquilinos da unidade e exige leitura unidadeId+tipo+referencia
  if (["ENERGIA","AGUA","GAS"].includes(tipo)) {
    const leitura = await prisma.leitura.findUnique({ where: { unidadeId_tipo_referencia: { unidadeId, tipo, referencia } } });
    if (!leitura) {
      const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId }, include: { inquilinos: { include: { inquilino: true } } } });
      const inquilinos = unidade?.inquilinos?.map(v=> ({
        id: v.inquilino.id, nome: v.inquilino.nome,
        medidor: tipo==="ENERGIA" ? v.inquilino.codigoMedidorEnergia : tipo==="AGUA" ? v.inquilino.codigoMedidorAgua : v.inquilino.codigoMedidorGas,
        tipoCobranca: tipo==="ENERGIA" ? v.inquilino.tipoCobrancaEnergia : tipo==="AGUA" ? v.inquilino.tipoCobrancaAgua : v.inquilino.tipoCobrancaGas,
      })) || [];
      return NextResponse.json({
        error: `Leitura pendente: realize a leitura de ${tipo} da unidade ${unidade?.identificacao || unidadeId} referência ${referencia} antes de gerar fatura. O sistema não tem inteligência para calcular valor sem consumo.`,
        code: "LEITURA_PENDENTE",
        unidade: unidade ? { id: unidade.id, identificacao: unidade.identificacao } : null,
        inquilinos,
        referencia, tipo, unidadeId
      }, { status: 400 });
    }
  }
  const pixConfig = await prisma.pixConfig.findFirst({ where: { ativo: true }, orderBy: { createdAt: "desc" } });
  // Busca inquilinos da unidade para rateio por Tipo de cobrança
  const unidadeComInqs = await prisma.unidade.findUnique({ where: { id: unidadeId }, include: { inquilinos: { include: { inquilino: true } } } });
  const vinculos = unidadeComInqs?.inquilinos || [];
  const leitura = ["ENERGIA","AGUA","GAS"].includes(tipo) ? await prisma.leitura.findUnique({ where: { unidadeId_tipo_referencia: { unidadeId, tipo, referencia } } }) : null;
  const consumo = leitura ? Number(leitura.consumo) : null;
  const tarifa = leitura ? (leitura.tarifa ? Number(leitura.tarifa) : null) : null;

  // Se não tem inquilino ou é CONDOMINIO/TAXA_EXTRA: 1 fatura para unidade (mantém comportamento)
  if (vinculos.length === 0 || isCondo || tipo === "TAXA_EXTRA") {
    const txid = `pix-${referencia}-${tipo}-${unidadeId.slice(0,4)}-${Date.now()}`.slice(0,25);
    const pixQrCode = pixConfig
      ? geraPixPayload({ chave: pixConfig.chave, valor: Number(valorTotal), txid, nome: pixConfig.titularNome, cidade: pixConfig.titularCidade })
      : `00020126580014BR.GOV.BCB.PIX0136fake-${valorTotal}520400005303986540${Number(valorTotal).toFixed(2)}5802BR5925ELMESSON`;
    const fatura = await prisma.fatura.create({
      data: {
        unidadeId, tipo, referencia, valorTotal, criterioRateio, dataEmissao: dataEmissao ? new Date(dataEmissao) : new Date(), dataVencimento: new Date(dataVencimento), status: status || "ABERTA",
        pixTxId: txid, pixQrCode,
        valorDemonstrativo: valorDemonstrativo !== undefined && valorDemonstrativo !== "" ? valorDemonstrativo : null,
        descricaoDemonstrativo: descricaoDemonstrativo || null,
        exibirDemonstrativo: isCondo ? true : (exibirDemonstrativo !== undefined ? exibirDemonstrativo : true),
        bandeira: bandeiraVal,
      },
      include: { unidade: true, inquilino: true }
    });
    return NextResponse.json(fatura);
  }

  // Rateio por Tipo de cobrança (RATIO/COMPARTILHADA/PORCENTAGEM) usando leitura
  const total = Number(valorTotal);
  // Mapeia tipoCobranca por inquilino para este tipo
  const cobrancas = vinculos.map(v=>{
    const inq = v.inquilino;
    const tc = tipo==="ENERGIA" ? (inq.tipoCobrancaEnergia||"COMPARTILHADA") : tipo==="AGUA" ? (inq.tipoCobrancaAgua||"COMPARTILHADA") : (inq.tipoCobrancaGas||"COMPARTILHADA");
    const pct = tipo==="ENERGIA" ? inq.porcentagemEnergia : tipo==="AGUA" ? inq.porcentagemAgua : inq.porcentagemGas;
    return { vinculo: v, inq, tipoCobranca: tc, porcentagem: pct ? Number(pct) : null };
  });
  // Separa PORCENTAGEM e demais
  const porcList = cobrancas.filter(c=> c.tipoCobranca==="PORCENTAGEM" && c.porcentagem!=null);
  const outros = cobrancas.filter(c=> c.tipoCobranca!=="PORCENTAGEM" || c.porcentagem==null);
  const sumPorc = porcList.reduce((s,c)=> s + (c.porcentagem||0), 0);
  if (sumPorc > 100.0001) return NextResponse.json({ error: `Soma das porcentagens (${sumPorc}%) excede 100% para ${tipo} na unidade ${unidadeComInqs?.identificacao}` }, { status: 400 });
  const valorPorcTotal = total * (sumPorc/100);
  const restante = total - valorPorcTotal;
  const valorPorOutros = outros.length ? restante / outros.length : 0;

  const criadas:any[] = [];
  for (const c of cobrancas) {
    let share:number;
    let crit:string;
    if (c.tipoCobranca==="PORCENTAGEM" && c.porcentagem!=null) {
      share = total * (c.porcentagem/100);
      crit = `PORCENTAGEM ${c.porcentagem}% • ${c.inq.nome} • Consumo ${consumo ?? "-"}${tarifa ? ` • Tarifa ${tarifa}`:""} • ${criterioRateio||""}`.trim();
    } else if (c.tipoCobranca==="RATIO") {
      // RATIO: proporcional ao consumo — como leitura é única por unidade, usa fração igual mas registra consumo
      share = valorPorOutros;
      crit = `RATIO • Consumo ${consumo ?? "-"} ${tipo==="ENERGIA"?"kWh":"m³"} • Tarifa ${tarifa ?? "-"} • ${criterioRateio||"Rateio proporcional"}`.trim();
    } else {
      // COMPARTILHADA
      share = valorPorOutros;
      crit = `COMPARTILHADA • ${vinculos.length} inquilino(s) • Consumo ${consumo ?? "-"} • ${criterioRateio||"Divisão igual"}`.trim();
    }
    share = Math.round(share*100)/100;
    const txid = `pix-${referencia}-${tipo}-${c.inq.id.slice(0,4)}-${Date.now()}-${Math.random().toString(36).slice(2,4)}`.slice(0,25);
    const pixQrCode = pixConfig
      ? geraPixPayload({ chave: pixConfig.chave, valor: share, txid, nome: pixConfig.titularNome, cidade: pixConfig.titularCidade })
      : `00020126580014BR.GOV.BCB.PIX0136fake-${share}520400005303986540${share.toFixed(2)}5802BR5925ELMESSON`;
    const f = await prisma.fatura.create({
      data: {
        unidadeId, inquilinoId: c.inq.id, tipo, referencia,
        valorTotal: share,
        rateioValor: share,
        criterioRateio: crit,
        dataEmissao: dataEmissao ? new Date(dataEmissao) : new Date(),
        dataVencimento: new Date(dataVencimento),
        status: status || "ABERTA",
        pixTxId: txid, pixQrCode,
        valorDemonstrativo: exibirDemonstrativo===false && !isCondo ? null : share,
        descricaoDemonstrativo: descricaoDemonstrativo || crit,
        exibirDemonstrativo: isCondo ? true : (exibirDemonstrativo !== undefined ? exibirDemonstrativo : true),
        bandeira: bandeiraVal,
      },
      include: { unidade: true, inquilino: true }
    });
    criadas.push(f);
  }
  // Retorna array quando gerou por inquilino, para frontend listar
  return NextResponse.json(criadas.length===1 ? criadas[0] : criadas);
}

export async function PUT(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { id, valorTotal, criterioRateio, dataVencimento, status, tipo, referencia, valorDemonstrativo, descricaoDemonstrativo, exibirDemonstrativo, bandeira } = await req.json();
  const data:any = {};
  if (valorTotal !== undefined) data.valorTotal = valorTotal;
  if (criterioRateio !== undefined) data.criterioRateio = criterioRateio;
  if (dataVencimento) data.dataVencimento = new Date(dataVencimento);
  if (status) data.status = status;
  if (tipo) data.tipo = tipo;
  if (referencia) data.referencia = referencia;
  if (valorDemonstrativo !== undefined) data.valorDemonstrativo = valorDemonstrativo === "" ? null : valorDemonstrativo;
  if (descricaoDemonstrativo !== undefined) data.descricaoDemonstrativo = descricaoDemonstrativo;
  if (exibirDemonstrativo !== undefined) {
    // condomínio sempre true
    const current = await prisma.fatura.findUnique({ where: { id } });
    const isCondo = (tipo || current?.tipo) === "CONDOMINIO";
    data.exibirDemonstrativo = isCondo ? true : exibirDemonstrativo;
  }
  if (bandeira !== undefined) {
    const current = await prisma.fatura.findUnique({ where: { id } });
    const tipoFinal = tipo || current?.tipo;
    data.bandeira = tipoFinal === "ENERGIA" ? bandeira : null;
  }
  const fatura = await prisma.fatura.update({ where: { id }, data, include: { unidade: true } });
  return NextResponse.json(fatura);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.fatura.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
