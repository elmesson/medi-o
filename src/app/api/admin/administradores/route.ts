import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import * as jose from "jose";

async function requireMaster() {
  const token = cookies().get("admin_access_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    if ((payload as any).papel !== "MASTER") return null;
    return payload as any;
  } catch { return null; }
}

export async function GET() {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso master requerido" }, { status: 403 });
  const lista = await prisma.administrador.findMany({ orderBy: { createdAt: "desc" }, include: { unidades: { include: { unidade: true } } } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso master requerido" }, { status: 403 });
  const { nome, email, senha, papel, telefone, documento, unidadeIds } = await req.json();
  // papel: ADMINISTRADOR | PROPRIETARIO
  if (!["ADMINISTRADOR","PROPRIETARIO"].includes(papel)) return NextResponse.json({ error: "papel deve ser ADMINISTRADOR ou PROPRIETARIO" }, { status: 400 });
  const senhaHash = await hashPassword(senha || "ChangeMe123!");
  const admin = await prisma.administrador.create({
    data: {
      nome, email, senhaHash, papel, telefone, documento,
      unidades: unidadeIds?.length ? { create: unidadeIds.map((uid:string)=>({ unidadeId: uid })) } : undefined
    },
    include: { unidades: true }
  });
  return NextResponse.json(admin);
}

export async function PUT(req: NextRequest) {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso master requerido" }, { status: 403 });
  const { id, nome, telefone, ativo, unidadeIds } = await req.json();
  const updated = await prisma.administrador.update({ where: { id }, data: { nome, telefone, ativo } });
  if (unidadeIds) {
    await prisma.administradorUnidade.deleteMany({ where: { administradorId: id } });
    for (const uid of unidadeIds) await prisma.administradorUnidade.create({ data: { administradorId: id, unidadeId: uid } });
  }
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso master requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.administrador.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
