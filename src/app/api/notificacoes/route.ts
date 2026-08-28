import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const list = await prisma.notificacao.findMany({ where: { inquilinoId: auth.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(list);
}
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await req.json();
  const n = await prisma.notificacao.update({ where: { id }, data: { lida: true } });
  return NextResponse.json(n);
}
