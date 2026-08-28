import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/pix -> webhook PSP (EFI/Gerencianet) { txid, status, valor }
// Em prod: validar assinatura HMAC do PSP, idempotência por txid
export async function POST(req: NextRequest) {
  const { txid, status, valor } = await req.json();
  if (!txid) return NextResponse.json({ error: "txid obrigatório" }, { status: 400 });
  const fatura = await prisma.fatura.findUnique({ where: { pixTxId: txid } });
  if (!fatura) return NextResponse.json({ error: "fatura não encontrada" }, { status: 404 });
  if (status === "CONCLUIDA" || status === "PAGO") {
    await prisma.fatura.update({ where: { id: fatura.id }, data: { status: "PAGA", dataPagamento: new Date() } });
    const vinculo = await prisma.unidadeInquilino.findFirst({ where: { unidadeId: fatura.unidadeId } });
    if (vinculo) {
      await prisma.notificacao.create({ data: { inquilinoId: vinculo.inquilinoId, tipo: "PAGAMENTO_CONFIRMADO", canal: "SISTEMA", titulo: "Pagamento confirmado", mensagem: `Fatura ${fatura.referencia} paga via PIX R$ ${valor ?? fatura.valorTotal}` } });
      // TODO: disparar email (Resend) e WhatsApp (Twilio) aqui
    }
  }
  return NextResponse.json({ ok: true });
}
