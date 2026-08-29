import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import { geraPixPayload } from "@/lib/pix/emv";

async function requireGestao() {
  const token = cookies().get("admin_access_token")?.value || cookies().get("access_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    const papel = (payload as any).papel;
    if (!["ADMINISTRADOR","PROPRIETARIO"].includes(papel)) return null;
    return payload as any;
  } catch { return null; }
}

export async function GET() {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const lista = await prisma.fatura.findMany({ orderBy: { referencia: "desc" }, take: 50, include: { unidade: true } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido (MASTER/ADMINISTRADOR/PROPRIETARIO)" }, { status: 403 });
  const { unidadeId, tipo, referencia, valorTotal, criterioRateio, dataEmissao, dataVencimento, status, valorDemonstrativo, descricaoDemonstrativo, exibirDemonstrativo, bandeira } = await req.json();
  if (!unidadeId || !tipo || !referencia || !valorTotal) return NextResponse.json({ error: "unidadeId, tipo, referencia, valorTotal obrigatórios" }, { status: 400 });
  const isCondo = tipo === "CONDOMINIO";
  const bandeiraVal = tipo === "ENERGIA" ? (bandeira || null) : null;
  const pixConfig = await prisma.pixConfig.findFirst({ where: { ativo: true }, orderBy: { createdAt: "desc" } });
  const txid = `pix-${referencia}-${tipo}-${unidadeId.slice(0,4)}-${Date.now()}`.slice(0,25);
  const pixQrCode = pixConfig
    ? geraPixPayload({ chave: pixConfig.chave, valor: Number(valorTotal), txid, nome: pixConfig.titularNome, cidade: pixConfig.titularCidade })
    : `00020126580014BR.GOV.BCB.PIX0136fake-${valorTotal}520400005303986540${Number(valorTotal).toFixed(2)}5802BR5925ELMESSON`;
  const fatura = await prisma.fatura.create({
    data: {
      unidadeId, tipo, referencia, valorTotal, criterioRateio, dataEmissao: dataEmissao ? new Date(dataEmissao) : new Date(), dataVencimento: new Date(dataVencimento), status: status || "ABERTA",
      pixTxId: txid, pixQrCode,
      valorDemonstrativo: valorDemonstrativo !== undefined && valorDemonstrativo !== "" ? valorDemonstrativo : null,
      descricaoDemonstrativo: descricaoDemonstrativo || null,
      exibirDemonstrativo: isCondo ? true : (exibirDemonstrativo !== undefined ? exibirDemonstrativo : true),
      bandeira: bandeiraVal,
    }
  });
  return NextResponse.json(fatura);
}

export async function PUT(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { id, valorTotal, criterioRateio, dataVencimento, status, tipo, referencia, valorDemonstrativo, descricaoDemonstrativo, exibirDemonstrativo, bandeira } = await req.json();
  const data:any = {};
  if (valorTotal !== undefined) data.valorTotal = valorTotal;
  if (criterioRateio !== undefined) data.criterioRateio = criterioRateio;
  if (dataVencimento) data.dataVencimento = new Date(dataVencimento);
  if (status) data.status = status;
  if (tipo) data.tipo = tipo;
  if (referencia) data.referencia = referencia;
  if (valorDemonstrativo !== undefined) data.valorDemonstrativo = valorDemonstrativo === "" ? null : valorDemonstrativo;
  if (descricaoDemonstrativo !== undefined) data.descricaoDemonstrativo = descricaoDemonstrativo;
  if (exibirDemonstrativo !== undefined) {
    // condomínio sempre true
    const current = await prisma.fatura.findUnique({ where: { id } });
    const isCondo = (tipo || current?.tipo) === "CONDOMINIO";
    data.exibirDemonstrativo = isCondo ? true : exibirDemonstrativo;
  }
  if (bandeira !== undefined) {
    const current = await prisma.fatura.findUnique({ where: { id } });
    const tipoFinal = tipo || current?.tipo;
    data.bandeira = tipoFinal === "ENERGIA" ? bandeira : null;
  }
  const fatura = await prisma.fatura.update({ where: { id }, data });
  return NextResponse.json(fatura);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.fatura.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
