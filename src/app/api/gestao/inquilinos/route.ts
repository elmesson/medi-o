import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import * as jose from "jose";
import crypto from "crypto";
import { hashCpfCnpj } from "@/lib/crypto";

async function requireGestao() {
  const token = cookies().get("admin_access_token")?.value || cookies().get("access_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    const papel = (payload as any).papel;
    if (!["MASTER","ADMINISTRADOR","PROPRIETARIO"].includes(papel)) return null;
    return payload as any;
  } catch { return null; }
}

function genCodigoMedidor() {
  return `MED-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

export async function GET() {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const lista = await prisma.inquilino.findMany({ orderBy: { createdAt: "desc" }, include: { unidades: { include: { unidade: true } } } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { nome, email, cpf, telefone, endereco, medidor, codigoMedidor, unidadeId, senha, leituraInicial } = await req.json();
  if (!nome || !email || !cpf) return NextResponse.json({ error: "nome, email, cpf obrigatórios" }, { status: 400 });
  const cleanCpf = cpf.replace(/\D/g,"");
  const hash = hashCpfCnpj(cleanCpf);
  const codigo = codigoMedidor || genCodigoMedidor();
  const senhaHash = await hashPassword(senha || "Inquilino123!");
  try {
    const inquilino = await prisma.inquilino.create({
      data: {
        nome, email, telefone, endereco: endereco || null, medidor: medidor || null, codigoMedidor: codigo,
        cpfCnpj: `enc:${cleanCpf}`, cpfCnpjHash: hash, senhaHash,
        unidades: unidadeId ? { create: { unidadeId } } : undefined
      }
    });
    // Medição inicial para faturar
    if (leituraInicial !== undefined && leituraInicial !== "" && unidadeId) {
      const inicial = Number(leituraInicial);
      if (!isNaN(inicial)) {
        const ref = new Date().toISOString().slice(0,7);
        await prisma.leitura.upsert({
          where: { unidadeId_tipo_referencia: { unidadeId, tipo: "ENERGIA", referencia: ref } },
          update: { leituraAnterior: 0, leituraAtual: inicial, consumo: inicial },
          create: { unidadeId, tipo: "ENERGIA", referencia: ref, leituraAnterior: 0, leituraAtual: inicial, consumo: inicial, dataLeitura: new Date() }
        });
      }
    }
    return NextResponse.json(inquilino);
  } catch (e:any) {
    if (e.code === "P2002") return NextResponse.json({ error: "CPF/e-mail/código já cadastrado" }, { status: 400 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { id, nome, email, cpf, telefone, endereco, medidor, codigoMedidor, ativo, novaSenha, unidadeId, leituraInicial } = await req.json();
  const data:any = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (telefone !== undefined) data.telefone = telefone;
  if (endereco !== undefined) data.endereco = endereco;
  if (medidor !== undefined) data.medidor = medidor;
  if (codigoMedidor !== undefined) data.codigoMedidor = codigoMedidor;
  if (ativo !== undefined) data.ativo = ativo;
  if (cpf) { data.cpfCnpj = `enc:${cpf.replace(/\D/g,"")}`; data.cpfCnpjHash = hashCpfCnpj(cpf); }
  if (novaSenha) data.senhaHash = await hashPassword(novaSenha);
  const updated = await prisma.inquilino.update({ where: { id }, data });
  if (unidadeId) {
    await prisma.unidadeInquilino.upsert({ where: { inquilinoId_unidadeId: { inquilinoId: id, unidadeId } }, update: {}, create: { inquilinoId: id, unidadeId } });
  }
  if (leituraInicial !== undefined && leituraInicial !== "" && unidadeId) {
    const inicial = Number(leituraInicial);
    if (!isNaN(inicial)) {
      const ref = new Date().toISOString().slice(0,7);
      await prisma.leitura.upsert({
        where: { unidadeId_tipo_referencia: { unidadeId, tipo: "ENERGIA", referencia: ref } },
        update: { leituraAnterior: 0, leituraAtual: inicial, consumo: inicial },
        create: { unidadeId, tipo: "ENERGIA", referencia: ref, leituraAnterior: 0, leituraAtual: inicial, consumo: inicial, dataLeitura: new Date() }
      });
    }
  }
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.inquilino.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
