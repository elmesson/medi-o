import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

// GET /api/bi/consumo?ano=2026 -> agregações + ranking + variação YoY
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const ano = searchParams.get("ano") || new Date().getFullYear().toString();

  const leituras = await prisma.leitura.findMany({ where: { unidadeId: { in: auth.unidades }, referencia: { startsWith: ano } }, orderBy: { referencia: "asc" } });
  const faturas = await prisma.fatura.findMany({ where: { unidadeId: { in: auth.unidades }, referencia: { startsWith: ano } } });

  // agregação por tipo
  const byTipo = (tipo: string) => leituras.filter(l=>l.tipo===tipo);
  const total = (arr: typeof leituras) => arr.reduce((a,b)=>a+b.consumo,0);
  const media = (arr: typeof leituras) => arr.length? total(arr)/arr.length : 0;

  // variação YoY: compara com ano anterior
  const anoAnt = String(Number(ano)-1);
  const leiturasAnt = await prisma.leitura.findMany({ where: { unidadeId: { in: auth.unidades }, referencia: { startsWith: anoAnt } } });
  const varYoY = (tipo: string) => {
    const cur = total(byTipo(tipo)), prev = leiturasAnt.filter(l=>l.tipo===tipo).reduce((a,b)=>a+b.consumo,0);
    if (!prev) return null;
    return ((cur - prev)/prev*100);
  };

  // ranking mensal dentro do ano (maior consumo)
  const ranking = [...leituras].sort((a,b)=>b.consumo - a.consumo).slice(0,5).map(l=>({ referencia: l.referencia, tipo: l.tipo, consumo: l.consumo, unidadeId: l.unidadeId }));

  const res = NextResponse.json({
    ano,
    totais: { energia: total(byTipo("ENERGIA")), agua: total(byTipo("AGUA")), gas: total(byTipo("GAS")) },
    medias: { energia: media(byTipo("ENERGIA")), agua: media(byTipo("AGUA")), gas: media(byTipo("GAS")) },
    variacaoYoY: { energia: varYoY("ENERGIA"), agua: varYoY("AGUA"), gas: varYoY("GAS") },
    ranking,
    faturasTotal: faturas.reduce((a,b)=>a+Number(b.valorTotal),0),
    faturasPorTipo: Object.fromEntries(["ENERGIA","AGUA","GAS","CONDOMINIO"].map(t=>[t, faturas.filter(f=>f.tipo===t).reduce((a,b)=>a+Number(b.valorTotal),0)])),
  });
  // ISR cache 60s + stale-while-revalidate
  res.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res;
}
