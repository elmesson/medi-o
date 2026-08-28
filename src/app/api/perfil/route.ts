import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const user = await prisma.inquilino.findUnique({ where: { id: auth.userId }, select: { id:true, nome:true, email:true, telefone:true, mfaEnabled:true, unidades: { include: { unidade: true, contrato: true } } } });
  return NextResponse.json(user);
}
export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { telefone, email, senhaAtual, novaSenha } = await req.json();
  const data: any = {};
  if (telefone !== undefined) data.telefone = telefone;
  if (email !== undefined) data.email = email;
  if (novaSenha) {
    const user = await prisma.inquilino.findUnique({ where: { id: auth.userId } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    const { verifyPassword } = await import("@/lib/auth");
    const ok = await verifyPassword(senhaAtual, user.senhaHash);
    if (!ok) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    data.senhaHash = await hashPassword(novaSenha);
    // revogar sessões antigas opcional
  }
  const updated = await prisma.inquilino.update({ where: { id: auth.userId }, data });
  return NextResponse.json({ ok: true, telefone: updated.telefone, email: updated.email });
}
