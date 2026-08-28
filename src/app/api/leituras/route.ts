import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertUnidadeAcesso } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const unidadeId = searchParams.get("unidadeId");
  const tipo = searchParams.get("tipo") as any;
  const ano = searchParams.get("ano");
  // se unidadeId informado, validar isolamento; senão lista todas do usuário
  const alvoIds = unidadeId ? [unidadeId] : auth.unidades;
  if (unidadeId) assertUnidadeAcesso(auth.unidades, unidadeId);

  const where: any = { unidadeId: { in: alvoIds } };
  if (tipo) where.tipo = tipo;
  if (ano) where.referencia = { startsWith: ano };

  const leituras = await prisma.leitura.findMany({ where, orderBy: { referencia: "desc" }, include: { unidade: true } });
  return NextResponse.json(leituras);
}
