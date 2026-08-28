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

function calculaExpiracao(plano: string, diasContrato?: number, inicio: Date = new Date()) {
  const dias = plano === "TRIAL" ? (diasContrato || 7) : plano === "SEMESTRAL" ? 180 : plano === "ANUAL" ? 365 : plano === "DIAS" ? (diasContrato || 30) : 30;
  const exp = new Date(inicio);
  exp.setDate(exp.getDate() + dias);
  return { dias, exp, inicio };
}

export async function POST(req: NextRequest) {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso master requerido" }, { status: 403 });
  const { nome, email, senha, papel, telefone, documento, unidadeIds, plano, diasContrato } = await req.json();
  if (!["ADMINISTRADOR","PROPRIETARIO"].includes(papel)) return NextResponse.json({ error: "papel deve ser ADMINISTRADOR ou PROPRIETARIO" }, { status: 400 });
  const senhaHash = await hashPassword(senha || "ChangeMe123!");
  const { exp, inicio } = calculaExpiracao(plano || "TRIAL", diasContrato);
  const admin = await prisma.administrador.create({
    data: {
      nome, email, senhaHash, papel, telefone, documento,
      plano: plano || "TRIAL", diasContrato: plano === "DIAS" || plano === "TRIAL" ? (diasContrato || (plano==="TRIAL"?7:30)) : null,
      contratoInicio: inicio, dataExpiracao: exp,
      unidades: unidadeIds?.length ? { create: unidadeIds.map((uid:string)=>({ unidadeId: uid })) } : undefined
    },
    include: { unidades: true }
  });
  return NextResponse.json(admin);
}

export async function PUT(req: NextRequest) {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso master requerido" }, { status: 403 });
  const { id, nome, email, telefone, documento, papel, ativo, unidadeIds, novaSenha, plano, diasContrato } = await req.json();
  const data:any = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (telefone !== undefined) data.telefone = telefone;
  if (documento !== undefined) data.documento = documento;
  if (papel !== undefined) {
    if (!["ADMINISTRADOR","PROPRIETARIO","MASTER"].includes(papel)) return NextResponse.json({ error: "papel inválido" }, { status: 400 });
    data.papel = papel;
  }
  if (ativo !== undefined) data.ativo = ativo;
  if (novaSenha) {
    if (novaSenha.length < 6) return NextResponse.json({ error: "senha mínima 6 caracteres" }, { status: 400 });
    data.senhaHash = await hashPassword(novaSenha);
  }
  if (plano !== undefined) {
    if (!["TRIAL","SEMESTRAL","ANUAL","DIAS"].includes(plano)) return NextResponse.json({ error: "plano inválido" }, { status: 400 });
    data.plano = plano;
    data.diasContrato = plano === "DIAS" || plano === "TRIAL" ? (diasContrato || (plano==="TRIAL"?7:30)) : null;
    const { exp, inicio } = calculaExpiracao(plano, diasContrato);
    data.contratoInicio = inicio;
    data.dataExpiracao = exp;
  } else if (diasContrato !== undefined) {
    // só dias custom sem trocar plano
    data.diasContrato = diasContrato;
    const current = await prisma.administrador.findUnique({ where: { id } });
    const planoAtual = current?.plano || "DIAS";
    const { exp, inicio } = calculaExpiracao(planoAtual, diasContrato);
    data.contratoInicio = inicio;
    data.dataExpiracao = exp;
  }
  const updated = await prisma.administrador.update({ where: { id }, data });
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
