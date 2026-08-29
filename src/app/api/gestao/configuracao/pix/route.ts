import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import { validaChavePix, normalizaChavePix } from "@/lib/pix/emv";

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
  const lista = await prisma.pixConfig.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { tipoChave, chave, banco, agencia, conta, titularNome, titularCidade } = await req.json();
  if (!tipoChave || !chave || !titularNome) return NextResponse.json({ error: "tipoChave, chave, titularNome obrigatórios" }, { status: 400 });
  const err = validaChavePix(tipoChave, chave);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  // BCB: não usar dados fictícios — exige chave real validada
  const chaveNormalizada = normalizaChavePix(tipoChave, chave);
  try {
    const pix = await prisma.pixConfig.create({
      data: {
        tipoChave, chave: chaveNormalizada, banco: banco||null, agencia: agencia||null, conta: conta||null,
        titularNome: titularNome.trim().substring(0,25), titularCidade: (titularCidade||"SAO PAULO").trim().substring(0,15),
        administradorId: auth.sub
      }
    });
    return NextResponse.json(pix);
  } catch (e:any) {
    if (e.code==="P2002") return NextResponse.json({ error: "Chave PIX já cadastrada" }, { status: 400 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { id, tipoChave, chave, banco, agencia, conta, titularNome, titularCidade, ativo } = await req.json();
  const data:any = {};
  if (tipoChave) data.tipoChave = tipoChave;
  if (chave) {
    const tipo = tipoChave || (await prisma.pixConfig.findUnique({ where:{ id }}))?.tipoChave || "ALEATORIA";
    const err = validaChavePix(tipo, chave);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    data.chave = normalizaChavePix(tipo, chave);
  }
  if (banco !== undefined) data.banco = banco;
  if (agencia !== undefined) data.agencia = agencia;
  if (conta !== undefined) data.conta = conta;
  if (titularNome !== undefined) data.titularNome = titularNome.trim().substring(0,25);
  if (titularCidade !== undefined) data.titularCidade = titularCidade.trim().substring(0,15);
  if (ativo !== undefined) data.ativo = ativo;
  const upd = await prisma.pixConfig.update({ where: { id }, data });
  return NextResponse.json(upd);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.pixConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
