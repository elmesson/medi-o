import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/leituras -> import lote { leituras: [{ unidadeId, tipo, referencia, leituraAnterior, leituraAtual, tarifa }] }
// Em prod: proteger com requireAdmin() + audit log
export async function POST(req: NextRequest) {
  const { leituras } = await req.json();
  if (!Array.isArray(leituras)) return NextResponse.json({ error: "leituras array obrigatório" }, { status: 400 });
  const created = [];
  for (const l of leituras) {
    const consumo = Number(l.leituraAtual) - Number(l.leituraAnterior);
    const r = await prisma.leitura.upsert({
      where: { unidadeId_tipo_referencia: { unidadeId: l.unidadeId, tipo: l.tipo, referencia: l.referencia } },
      update: { leituraAnterior: l.leituraAnterior, leituraAtual: l.leituraAtual, consumo, tarifa: l.tarifa, dataLeitura: new Date() },
      create: { unidadeId: l.unidadeId, tipo: l.tipo, referencia: l.referencia, leituraAnterior: l.leituraAnterior, leituraAtual: l.leituraAtual, consumo, tarifa: l.tarifa, dataLeitura: new Date() }
    });
    created.push(r);
    // alerta consumo excessivo >20% média
    const hist = await prisma.leitura.findMany({ where: { unidadeId: l.unidadeId, tipo: l.tipo }, orderBy: { referencia: "desc" }, take: 12 });
    const media = hist.reduce((a,b)=>a+b.consumo,0)/hist.length;
    if (consumo > media*1.2) {
      const vinculo = await prisma.unidadeInquilino.findFirst({ where: { unidadeId: l.unidadeId } });
      if (vinculo) await prisma.notificacao.create({ data: { inquilinoId: vinculo.inquilinoId, tipo: "ALERTA_CONSUMO", canal: "SISTEMA", titulo: `Alerta ${l.tipo}`, mensagem: `Consumo ${consumo} 20% acima da média ${media.toFixed(0)} em ${l.referencia}` } });
    }
  }
  return NextResponse.json({ ok: true, criadas: created.length });
}
export async function GET() {
  const leituras = await prisma.leitura.findMany({ orderBy: { referencia: "desc" }, take: 50, include: { unidade: true } });
  return NextResponse.json(leituras);
}
export async function PUT(req: NextRequest) {
  const { id, leituraAnterior, leituraAtual, tarifa, bandeira } = await req.json();
  const consumo = Number(leituraAtual) - Number(leituraAnterior);
  const leitura = await prisma.leitura.update({ where: { id }, data: { leituraAnterior, leituraAtual, consumo, tarifa, bandeira } });
  return NextResponse.json(leitura);
}
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.leitura.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
