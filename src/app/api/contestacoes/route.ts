import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertUnidadeAcesso } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const list = await prisma.contestacao.findMany({ where: { inquilinoId: auth.userId }, include: { anexos: true, mensagens: true, fatura: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { faturaId, categoria, motivo, anexos } = await req.json();
  if (faturaId) {
    const fatura = await prisma.fatura.findUnique({ where: { id: faturaId } });
    if (!fatura) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    assertUnidadeAcesso(auth.unidades, fatura.unidadeId);
  }
  const c = await prisma.contestacao.create({
    data: {
      inquilinoId: auth.userId, faturaId: faturaId || null, categoria, motivo, status: "ABERTO",
      anexos: anexos?.length ? { create: anexos.map((a:any)=>({ url: a.url, nome: a.nome, tipo: a.tipo })) } : undefined
    },
    include: { anexos: true }
  });
  // opcional: marcar fatura em contestação
  if (faturaId) await prisma.fatura.update({ where: { id: faturaId }, data: { status: "EM_CONTESTACAO" } });
  await prisma.notificacao.create({ data: { inquilinoId: auth.userId, tipo: "CONTESTACAO_RESPONDIDA", canal: "SISTEMA", titulo: "Contestação aberta", mensagem: `Contestação #${c.id.slice(0,6)} aberta com sucesso. Acompanhe o status.` } });
  return NextResponse.json(c);
}
