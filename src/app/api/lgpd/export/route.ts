import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit/audit";

// GET /api/lgpd/export -> exporta todos dados do inquilino (LGPD art. 18)
export async function GET() {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const inquilino = await prisma.inquilino.findUnique({ where: { id: auth.userId }, include: { unidades: { include: { unidade: true } }, notificacoes: true, contestacoes: true, chamados: true } });
  const leituras = await prisma.leitura.findMany({ where: { unidadeId: { in: auth.unidades } } });
  const faturas = await prisma.fatura.findMany({ where: { unidadeId: { in: auth.unidades } } });
  await audit(auth.userId, "LGPD_EXPORT", "inquilino");
  return NextResponse.json({ inquilino: { id: inquilino?.id, nome: inquilino?.nome, email: inquilino?.email }, unidades: inquilino?.unidades, leituras, faturas, notificacoes: inquilino?.notificacoes, contestacoes: inquilino?.contestacoes, geradoEm: new Date().toISOString() }, { headers: { "Content-Disposition": `attachment; filename="lgpd-${auth.userId}.json"` } });
}
