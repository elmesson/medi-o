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
    if (!["ADMINISTRADOR","PROPRIETARIO"].includes((payload as any).papel)) return null;
    return payload as any;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("referencia");
  const where:any = {};
  if (ref) where.referencia = ref;
  const lista = await prisma.condominioDespesa.findMany({ where, orderBy: { referencia: "desc" }, include: { rateios: { include: { unidade: true } } } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { referencia, categoria, especificacao, empresa, valor, data, vencimento, codFatura, descricao, tipoCobranca, porcentagem } = await req.json();
  if (!referencia || !categoria || !valor || !vencimento) return NextResponse.json({ error: "referencia, categoria, valor, vencimento obrigatórios" }, { status: 400 });
  if (!["RATIO","COMPARTILHADA","PORCENTAGEM"].includes(tipoCobranca)) return NextResponse.json({ error: "tipoCobranca inválido" }, { status: 400 });
  if (categoria==="OUTROS" && !especificacao) return NextResponse.json({ error: "especificação obrigatória quando OUTROS" }, { status: 400 });

  const despesa = await prisma.condominioDespesa.create({
    data: {
      referencia, categoria, especificacao: especificacao||null, empresa: empresa||null, valor, data: data? new Date(data): new Date(), vencimento: new Date(vencimento), codFatura: codFatura||null, descricao: descricao||null, tipoCobranca, porcentagem: tipoCobranca==="PORCENTAGEM"? porcentagem : null
    }
  });

  // Gera rateio por unidade
  const unidades = await prisma.unidade.findMany();
  const totalUnidades = unidades.length || 1;
  const totalFracao = unidades.reduce((s,u)=> s + Number(u.fracaoIdeal||1), 0) || totalUnidades;
  const pixConfig = await prisma.pixConfig.findFirst({ where: { ativo: true }, orderBy: { createdAt: "desc" } });

  for (const u of unidades) {
    let share = 0;
    let criterio = "";
    if (tipoCobranca==="COMPARTILHADA") {
      share = Number(valor)/totalUnidades;
      criterio = `Compartilhada • ${totalUnidades} unidades • R$ ${share.toFixed(2)} cada`;
    } else if (tipoCobranca==="RATIO") {
      const fracao = Number(u.fracaoIdeal||1);
      share = Number(valor) * (fracao/totalFracao);
      criterio = `Ratio • fração ${fracao.toFixed(2)}/${totalFracao.toFixed(2)}`;
    } else if (tipoCobranca==="PORCENTAGEM") {
      share = Number(valor) * (Number(porcentagem||0)/100);
      criterio = `Porcentagem ${porcentagem}% sobre R$ ${Number(valor).toFixed(2)}`;
    }
    await prisma.condominioRateio.create({ data: { despesaId: despesa.id, unidadeId: u.id, valorRateio: share, criterio } });

    // Cria/ atualiza Fatura CONDOMINIO para cada unidade (agrupa despesas da mesma referência)
    const fRef = referencia;
    const existente = await prisma.fatura.findFirst({ where: { unidadeId: u.id, referencia: fRef, tipo: "CONDOMINIO" } });
    const catLabel = categoria==="OUTROS" ? especificacao : categoria;
    const descRateio = `${catLabel} • ${tipoCobranca}${porcentagem?` ${porcentagem}%`:""} • ${empresa||""}`.trim();
    if (existente) {
      await prisma.fatura.update({
        where: { id: existente.id },
        data: {
          valorTotal: Number(existente.valorTotal) + share,
          rateioValor: Number(existente.rateioValor||0) + share,
          criterioRateio: [existente.criterioRateio, descRateio].filter(Boolean).join(" | ")
        }
      });
    } else {
      const txid = `pix-cond-${fRef}-${u.id.slice(0,4)}-${Date.now()}`.slice(0,25);
      const pixQrCode = pixConfig
        ? geraPixPayload({ chave: pixConfig.chave, valor: Number(share), txid, nome: pixConfig.titularNome, cidade: pixConfig.titularCidade })
        : `00020126580014BR.GOV.BCB.PIX0136cond-${share}520400005303986540${share.toFixed(2)}5802BR`;
      await prisma.fatura.create({
        data: {
          unidadeId: u.id, tipo: "CONDOMINIO", referencia: fRef,
          valorTotal: share, rateioValor: share, criterioRateio: descRateio,
          dataEmissao: new Date(), dataVencimento: new Date(vencimento), status: "ABERTA",
          pixTxId: txid, pixQrCode
        }
      });
    }
  }

  return NextResponse.json({ ok: true, despesa, rateio: `Rateio ${tipoCobranca} gerado para ${totalUnidades} unidades` });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireGestao();
  if (!auth) return NextResponse.json({ error: "Acesso Gestão requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.condominioRateio.deleteMany({ where: { despesaId: id } });
  await prisma.condominioDespesa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
