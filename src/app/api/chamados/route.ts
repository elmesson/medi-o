import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const list = await prisma.chamado.findMany({ where: { inquilinoId: auth.userId }, include: { mensagens: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(list);
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { categoria, assunto, mensagem } = await req.json();
  const chamado = await prisma.chamado.create({
    data: {
      inquilinoId: auth.userId, categoria, assunto, status: "ABERTO",
      mensagens: mensagem ? { create: { autorTipo: "INQUILINO", autorId: auth.userId, texto: mensagem } } : undefined
    },
    include: { mensagens: true }
  });
  return NextResponse.json(chamado);
}
