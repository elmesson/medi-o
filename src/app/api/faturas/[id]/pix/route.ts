import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertUnidadeAcesso } from "@/lib/requireAuth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const fatura = await prisma.fatura.findUnique({ where: { id: params.id } });
  if (!fatura) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  assertUnidadeAcesso(auth.unidades, fatura.unidadeId);
  return NextResponse.json({ pixQrCode: fatura.pixQrCode, pixQrImage: fatura.pixQrImage, pixTxId: fatura.pixTxId, valor: fatura.valorTotal });
}
