import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

// GET /api/ai/insights -> previsão simples (regressão linear) + detecção anomalia z-score
export async function GET() {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const leituras = await prisma.leitura.findMany({ where: { unidadeId: { in: auth.unidades }, tipo: "ENERGIA" }, orderBy: { referencia: "asc" } });
  const vals = leituras.map(l=> l.consumo);
  const n = vals.length || 1;
  // regressão linear y = a*x + b
  const xs = vals.map((_,i)=>i);
  const meanX = xs.reduce((a,b)=>a+b,0)/n;
  const meanY = vals.reduce((a,b)=>a+b,0)/n;
  const num = xs.reduce((s,x,i)=> s + (x-meanX)*(vals[i]-meanY),0);
  const den = xs.reduce((s,x)=> s + (x-meanX)**2,0) || 1;
  const a = num/den, b = meanY - a*meanX;
  const previsao = a*n + b;
  // z-score anomalia último mês
  const std = Math.sqrt(vals.reduce((s,y)=> s + (y-meanY)**2,0)/n) || 1;
  const z = (vals.at(-1)! - meanY)/std;
  const anomalia = Math.abs(z) > 2 ? `Consumo anômalo (z=${z.toFixed(2)})` : null;

  const dicas = [];
  if (previsao > meanY*1.1) dicas.push("Previsão de alta no próximo mês — revise uso de ar-condicionado/chuveiro elétrico.");
  if (anomalia) dicas.push(anomalia);
  dicas.push(`Média histórica ${meanY.toFixed(0)} kWh — sua meta ideal.`);

  return NextResponse.json({ previsao: Math.max(0, Math.round(previsao)), media: meanY, z: z.toFixed(2), anomalia, dicas, modelo: "regressão linear (mock, troque por Prophet/Vertex AI)" });
}
