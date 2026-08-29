import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import * as jose from "jose";

async function requireGestao() {
  const token = cookies().get("admin_access_token")?.value || cookies().get("access_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    if (!["ADMINISTRADOR","PROPRIETARIO"].includes((payload as any).papel)) return null;
    return payload as any;
  } catch { return null; }
}

export async function GET() {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const lista = await prisma.leiturista.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { nome, email, senha, telefone, regiao, matricula } = await req.json();
  if (!nome || !email || !senha) return NextResponse.json({ error: "nome, email, senha obrigatórios" }, { status: 400 });
  const senhaHash = await hashPassword(senha);
  try {
    const l = await prisma.leiturista.create({ data: { nome, email, senhaHash, telefone: telefone||null, regiao: regiao||null, matricula: matricula||null } });
    return NextResponse.json(l);
  } catch (e:any) {
    if (e.code==="P2002") return NextResponse.json({ error: "E-mail/matrícula já cadastrado" }, { status: 400 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { id, nome, telefone, regiao, ativo, novaSenha } = await req.json();
  const data:any = {};
  if (nome !== undefined) data.nome = nome;
  if (telefone !== undefined) data.telefone = telefone;
  if (regiao !== undefined) data.regiao = regiao;
  if (ativo !== undefined) data.ativo = ativo;
  if (novaSenha) data.senhaHash = await hashPassword(novaSenha);
  const upd = await prisma.leiturista.update({ where: { id }, data });
  return NextResponse.json(upd);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.leiturista.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
