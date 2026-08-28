import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const now = new Date();
  const refAtual = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  // leituras atuais e histórico 12 meses por tipo
  const leituras = await prisma.leitura.findMany({
    where: { unidadeId: { in: auth.unidades } },
    orderBy: [{ referencia: "desc" }],
  });

  // agrupar por tipo
  function byTipo(tipo: string) {
    return leituras.filter(l=>l.tipo===tipo).slice(0,12).reverse();
  }

  const energiaHist = byTipo("ENERGIA");
  const aguaHist = byTipo("AGUA");
  const gasHist = byTipo("GAS");

  const consumoAtual = {
    energia: energiaHist.at(-1)?.consumo ?? 0,
    agua: aguaHist.at(-1)?.consumo ?? 0,
    gas: gasHist.at(-1)?.consumo ?? 0,
  };

  // média 12m e tendência
  function media(arr: typeof leituras) { return arr.length ? arr.reduce((a,b)=>a+b.consumo,0)/arr.length : 0; }
  function tendencia(arr: typeof leituras): "up"|"down"|"flat" {
    if (arr.length<2) return "flat";
    const last = arr.at(-1)!.consumo, prev = arr.at(-2)!.consumo;
    if (last > prev*1.05) return "up";
    if (last < prev*0.95) return "down";
    return "flat";
  }

  const faturas = await prisma.fatura.findMany({ where: { unidadeId: { in: auth.unidades } }, orderBy: { dataVencimento: "asc" } });
  const emAberto = faturas.filter(f=> f.status==="ABERTA");
  const vencidas = faturas.filter(f=> f.status==="VENCIDA" || (f.status==="ABERTA" && new Date(f.dataVencimento) < now));
  const totalMes = faturas.filter(f=> f.referencia===refAtual).reduce((a,b)=> a+Number(b.valorTotal), 0);
  const proximoVenc = emAberto.sort((a,b)=> +new Date(a.dataVencimento)- +new Date(b.dataVencimento))[0] || null;

  // alertas de consumo excessivo (>20% acima da média)
  const alertas: string[] = [];
  if (energiaHist.length && consumoAtual.energia > media(energiaHist)*1.2) alertas.push("Consumo de energia 20% acima da média");
  if (aguaHist.length && consumoAtual.agua > media(aguaHist)*1.2) alertas.push("Consumo de água 20% acima da média");
  if (gasHist.length && consumoAtual.gas > media(gasHist)*1.2) alertas.push("Consumo de gás 20% acima da média");

  return NextResponse.json({
    consumoAtual, medias: { energia: media(energiaHist), agua: media(aguaHist), gas: media(gasHist) },
    tendencias: { energia: tendencia(energiaHist), agua: tendencia(aguaHist), gas: tendencia(gasHist) },
    historico12m: {
      energia: energiaHist.map(l=>({ ref: l.referencia, consumo: l.consumo })),
      agua: aguaHist.map(l=>({ ref: l.referencia, consumo: l.consumo })),
      gas: gasHist.map(l=>({ ref: l.referencia, consumo: l.consumo })),
    },
    faturas: { totalMes, emAberto: emAberto.length, vencidas: vencidas.length, proximoVencimento: proximoVenc },
    alertas,
    unidades: auth.unidades,
  });
}
