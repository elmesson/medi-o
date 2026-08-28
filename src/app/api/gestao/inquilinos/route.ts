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
  const { nome, email, cpf, telefone, endereco, medidor, codigoMedidor, medidorEnergia, codigoMedidorEnergia, medidorAgua, codigoMedidorAgua, medidorGas, codigoMedidorGas, unidadeId, senha, leituraInicial, leituraInicialEnergia, leituraInicialAgua, leituraInicialGas } = await req.json();
  if (!nome || !email || !cpf) return NextResponse.json({ error: "nome, email, cpf obrigatórios" }, { status: 400 });
  const cleanCpf = cpf.replace(/\D/g,"");
  const hash = hashCpfCnpj(cleanCpf);
  // códigos únicos por tipo (usa legado como fallback para energia)
  const codigoEnergia = codigoMedidorEnergia || codigoMedidor || (medidorEnergia || medidor ? genCodigoMedidor() : null);
  const codigoAgua = codigoMedidorAgua || (medidorAgua ? genCodigoMedidor() : null);
  const codigoGas = codigoMedidorGas || (medidorGas ? genCodigoMedidor() : null);
  const medEnergia = medidorEnergia || medidor || null;
  const senhaHash = await hashPassword(senha || "Inquilino123!");
  try {
    const inquilino = await prisma.inquilino.create({
      data: {
        nome, email, telefone, endereco: endereco || null,
        medidor: medEnergia, codigoMedidor: codigoEnergia,
        medidorEnergia: medEnergia, codigoMedidorEnergia: codigoEnergia,
        medidorAgua: medidorAgua || null, codigoMedidorAgua: codigoAgua,
        medidorGas: medidorGas || null, codigoMedidorGas: codigoGas,
        cpfCnpj: `enc:${cleanCpf}`, cpfCnpjHash: hash, senhaHash,
        unidades: unidadeId ? { create: { unidadeId } } : undefined
      }
    });
    // Medições iniciais por medidor para faturar
    const ref = new Date().toISOString().slice(0,7);
    const iniciais = [
      { tipo: "ENERGIA", valor: leituraInicial },
      { tipo: "ENERGIA", valor: leituraInicialEnergia },
      { tipo: "AGUA", valor: leituraInicialAgua },
      { tipo: "GAS", valor: leituraInicialGas },
    ];
    for (const it of iniciais) {
      if (it.valor === undefined || it.valor === "" || !unidadeId) continue;
      const inicial = Number(it.valor);
      if (isNaN(inicial)) continue;
      await prisma.leitura.upsert({
        where: { unidadeId_tipo_referencia: { unidadeId, tipo: it.tipo, referencia: ref } },
        update: { leituraAnterior: 0, leituraAtual: inicial, consumo: inicial },
        create: { unidadeId, tipo: it.tipo, referencia: ref, leituraAnterior: 0, leituraAtual: inicial, consumo: inicial, dataLeitura: new Date() }
      });
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
  const { id, nome, email, cpf, telefone, endereco, medidor, codigoMedidor, medidorEnergia, codigoMedidorEnergia, medidorAgua, codigoMedidorAgua, medidorGas, codigoMedidorGas, ativo, novaSenha, unidadeId, leituraInicial, leituraInicialEnergia, leituraInicialAgua, leituraInicialGas } = await req.json();
  const data:any = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (telefone !== undefined) data.telefone = telefone;
  if (endereco !== undefined) data.endereco = endereco;
  if (medidor !== undefined) { data.medidor = medidor; data.medidorEnergia = medidor; }
  if (codigoMedidor !== undefined) { data.codigoMedidor = codigoMedidor; data.codigoMedidorEnergia = codigoMedidor; }
  if (medidorEnergia !== undefined) { data.medidorEnergia = medidorEnergia; data.medidor = medidorEnergia; }
  if (codigoMedidorEnergia !== undefined) { data.codigoMedidorEnergia = codigoMedidorEnergia; data.codigoMedidor = codigoMedidorEnergia; }
  if (medidorAgua !== undefined) data.medidorAgua = medidorAgua;
  if (codigoMedidorAgua !== undefined) data.codigoMedidorAgua = codigoMedidorAgua;
  if (medidorGas !== undefined) data.medidorGas = medidorGas;
  if (codigoMedidorGas !== undefined) data.codigoMedidorGas = codigoMedidorGas;
  if (ativo !== undefined) data.ativo = ativo;
  if (cpf) { data.cpfCnpj = `enc:${cpf.replace(/\D/g,"")}`; data.cpfCnpjHash = hashCpfCnpj(cpf); }
  if (novaSenha) data.senhaHash = await hashPassword(novaSenha);
  const updated = await prisma.inquilino.update({ where: { id }, data });
  if (unidadeId) {
    await prisma.unidadeInquilino.upsert({ where: { inquilinoId_unidadeId: { inquilinoId: id, unidadeId } }, update: {}, create: { inquilinoId: id, unidadeId } });
  }
  const ref2 = new Date().toISOString().slice(0,7);
  const iniciais2 = [
    { tipo: "ENERGIA", valor: leituraInicial },
    { tipo: "ENERGIA", valor: leituraInicialEnergia },
    { tipo: "AGUA", valor: leituraInicialAgua },
    { tipo: "GAS", valor: leituraInicialGas },
  ];
  for (const it of iniciais2) {
    if (it.valor === undefined || it.valor === "" || !unidadeId) continue;
    const inicial = Number(it.valor);
    if (isNaN(inicial)) continue;
    await prisma.leitura.upsert({
      where: { unidadeId_tipo_referencia: { unidadeId, tipo: it.tipo, referencia: ref2 } },
      update: { leituraAnterior: 0, leituraAtual: inicial, consumo: inicial },
      create: { unidadeId, tipo: it.tipo, referencia: ref2, leituraAnterior: 0, leituraAtual: inicial, consumo: inicial, dataLeitura: new Date() }
    });
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
