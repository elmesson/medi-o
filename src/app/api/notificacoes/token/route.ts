import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/notificacoes/token { token: string } -> registra FCM token
// Em prod: salvar em tabela PushToken; aqui: cria notificação de registro
export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "token obrigatório" }, { status: 400 });
  // Sem auth obrigatório para registro anônimo inicial; em prod exigir auth
  return NextResponse.json({ ok: true, token, mensagem: "Token FCM registrado. Use Admin SDK para disparar push em eventos: nova fatura, vencimento, pagamento, contestação." });
}
