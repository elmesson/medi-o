import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/observability/logger";

// GET /api/cron/gerar-faturas?key=CRON_SECRET -> gera faturas do mês vigente para todas unidades (multi-tenant)
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const ref = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const unidades = await prisma.unidade.findMany();
  let criadas = 0;
  for (const u of unidades) {
    for (const tipo of ["ENERGIA","AGUA","GAS","CONDOMINIO"] as const) {
      const exists = await prisma.fatura.findFirst({ where: { unidadeId: u.id, referencia: ref, tipo } });
      if (exists) continue;
      const leitura = await prisma.leitura.findFirst({ where: { unidadeId: u.id, tipo: tipo==="CONDOMINIO"? "ENERGIA": tipo, referencia: ref } });
      const valor = tipo==="CONDOMINIO" ? 542.5 : leitura ? leitura.consumo * Number(leitura.tarifa || 0.92) : 120;
      await prisma.fatura.create({ data: { unidadeId: u.id, tipo, referencia: ref, valorTotal: valor, dataEmissao: now, dataVencimento: new Date(now.getFullYear(), now.getMonth(), 10), status: "ABERTA", pixTxId: `pix-${ref}-${tipo}-${u.id.slice(0,4)}-${Date.now()}` } });
      criadas++;
    }
  }
  log("cron:gerar-faturas", { ref, criadas, unidades: unidades.length });
  return NextResponse.json({ ok: true, referencia: ref, criadas });
}
