import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";

async function requireGestao() {
  const token = cookies().get("admin_access_token")?.value || cookies().get("access_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    if (!["MASTER","ADMINISTRADOR","PROPRIETARIO"].includes((payload as any).papel)) return null;
    return payload as any;
  } catch { return null; }
}

export async function GET() {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });

  const [faturas, despesas, leituras, inquilinos, unidades] = await Promise.all([
    prisma.fatura.findMany(),
    prisma.condominioDespesa.findMany({ include: { rateios: true } }),
    prisma.leitura.findMany(),
    prisma.inquilino.findMany(),
    prisma.unidade.findMany(),
  ]);

  // Contas
  const contasPorTipo = Object.fromEntries(["ENERGIA","AGUA","GAS","CONDOMINIO","TAXA_EXTRA"].map(t=>[t, faturas.filter(f=>f.tipo===t).length]));
  const contasPorStatus = Object.fromEntries(["ABERTA","PAGA","VENCIDA","EM_CONTESTACAO"].map(s=>[s, faturas.filter(f=>f.status===s).length]));
  const valorTotalContas = faturas.reduce((s,f)=> s+Number(f.valorTotal),0);
  const valorDemonstrativo = faturas.filter(f=> (f as any).exibirDemonstrativo!==false || f.tipo==="CONDOMINIO").reduce((s,f)=> s+Number((f as any).valorDemonstrativo|| f.valorTotal),0);

  // Condomínio
  const condPorCategoria = Object.fromEntries(["ENERGIA","AGUA","GAS","OUTROS"].map(c=>[c, despesas.filter(d=>d.categoria===c).length]));
  const condPorCobranca = Object.fromEntries(["RATIO","COMPARTILHADA","PORCENTAGEM"].map(t=>[t, despesas.filter(d=>d.tipoCobranca===t).length]));
  const valorCondominio = despesas.reduce((s,d)=> s+Number(d.valor),0);

  // Leituras
  const leiturasPorTipo = Object.fromEntries(["ENERGIA","AGUA","GAS"].map(t=>[t, leituras.filter(l=>l.tipo===t).length]));
  const consumoMedio = {
    ENERGIA: leituras.filter(l=>l.tipo==="ENERGIA").reduce((s,l)=>s+l.consumo,0) / (leituras.filter(l=>l.tipo==="ENERGIA").length||1),
    AGUA: leituras.filter(l=>l.tipo==="AGUA").reduce((s,l)=>s+l.consumo,0) / (leituras.filter(l=>l.tipo==="AGUA").length||1),
    GAS: leituras.filter(l=>l.tipo==="GAS").reduce((s,l)=>s+l.consumo,0) / (leituras.filter(l=>l.tipo==="GAS").length||1),
  };
  const alertas = leituras.filter(l=> l.consumo > 300).length; // simplificado

  // Inquilinos
  const inqAtivos = inquilinos.filter(i=>i.ativo).length;
  const inqInativos = inquilinos.filter(i=>!i.ativo).length;
  const inqPorCobranca = {
    ENERGIA: Object.fromEntries(["RATIO","COMPARTILHADA","PORCENTAGEM"].map(t=>[t, inquilinos.filter(i=> (i as any)[`tipoCobrancaEnergia`]===t).length])),
    AGUA: Object.fromEntries(["RATIO","COMPARTILHADA","PORCENTAGEM"].map(t=>[t, inquilinos.filter(i=> (i as any)[`tipoCobrancaAgua`]===t).length])),
    GAS: Object.fromEntries(["RATIO","COMPARTILHADA","PORCENTAGEM"].map(t=>[t, inquilinos.filter(i=> (i as any)[`tipoCobrancaGas`]===t).length])),
  };
  const medidores = {
    energia: inquilinos.filter(i=> (i as any).codigoMedidorEnergia || (i as any).codigoMedidor).length,
    agua: inquilinos.filter(i=> (i as any).codigoMedidorAgua).length,
    gas: inquilinos.filter(i=> (i as any).codigoMedidorGas).length,
  };

  return NextResponse.json({
    contas: { total: faturas.length, porTipo: contasPorTipo, porStatus: contasPorStatus, valorTotal: valorTotalContas, valorDemonstrativo },
    condominio: { total: despesas.length, porCategoria: condPorCategoria, porCobranca: condPorCobranca, valorTotal: valorCondominio, unidades: unidades.length },
    leituras: { total: leituras.length, porTipo: leiturasPorTipo, consumoMedio, alertas },
    inquilinos: { total: inquilinos.length, ativos: inqAtivos, inativos: inqInativos, porCobranca: inqPorCobranca, medidores },
  });
}
