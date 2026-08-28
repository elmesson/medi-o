import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertUnidadeAcesso } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const unidadeId = searchParams.get("unidadeId");
  const status = searchParams.get("status");
  const tipo = searchParams.get("tipo");
  const referencia = searchParams.get("referencia");
  const alvoIds = unidadeId ? [unidadeId] : auth.unidades;
  if (unidadeId) assertUnidadeAcesso(auth.unidades, unidadeId);
  const where: any = { unidadeId: { in: alvoIds } };
  if (status) where.status = status;
  if (tipo) where.tipo = tipo;
  if (referencia) where.referencia = referencia;
  const faturas = await prisma.fatura.findMany({ where, orderBy: [{ dataVencimento: "desc" }], include: { unidade: true } });
  return NextResponse.json(faturas);
}

export async function POST(req: NextRequest) {
  // upload comprovante PIX
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json();
  const { faturaId, arquivoUrl, valor } = body;
  const fatura = await prisma.fatura.findUnique({ where: { id: faturaId } });
  if (!fatura) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  assertUnidadeAcesso(auth.unidades, fatura.unidadeId);
  const comp = await prisma.comprovantePix.create({ data: { faturaId, inquilinoId: auth.userId, arquivoUrl, valor } });
  return NextResponse.json(comp);
}
