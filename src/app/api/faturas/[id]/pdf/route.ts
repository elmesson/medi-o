import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertUnidadeAcesso } from "@/lib/requireAuth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const fatura = await prisma.fatura.findUnique({ where: { id: params.id }, include: { unidade: true } });
  if (!fatura) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  assertUnidadeAcesso(auth.unidades, fatura.unidadeId);
  // Em produção: gerar PDF com jspdf aqui. Para demo, retorna JSON + headers simulando PDF
  return NextResponse.json({
    fatura: { ...fatura, valorTotal: fatura.valorTotal.toString() },
    downloadUrl: `/api/faturas/${params.id}/pdf`,
    mensagem: "Gere PDF com jsPDF: criar doc, addTable com rateio, critério, datas, status. Retornar com Content-Type application/pdf."
  });
}
