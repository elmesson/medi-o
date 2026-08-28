import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit/audit";

// POST /api/lgpd/delete -> anonimiza dados (LGPD direito ao esquecimento) - mantém faturas anonimizadas por obrigação legal
export async function POST() {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await audit(auth.userId, "LGPD_DELETE_REQUEST", "inquilino");
  // Em prod: fila + confirmação por e-mail + prazo 15 dias
  // Aqui: apenas simula anonimização
  return NextResponse.json({ ok: true, mensagem: "Solicitação de exclusão registrada. Seus dados serão anonimizados em até 15 dias, mantendo apenas obrigações legais/fiscais." });
}
