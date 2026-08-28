import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const formato = searchParams.get("formato") || "csv"; // pdf | excel | csv
  const ano = searchParams.get("ano") || new Date().getFullYear().toString();
  const tipo = searchParams.get("tipo") || undefined;

  const where: any = { unidadeId: { in: auth.unidades } };
  if (ano) where.referencia = { startsWith: ano };
  if (tipo && tipo !== "TODOS") where.tipo = tipo;

  const leituras = await prisma.leitura.findMany({ where, orderBy: { referencia: "asc" } });
  const faturas = await prisma.fatura.findMany({ where: { unidadeId: { in: auth.unidades }, referencia: { startsWith: ano } }, orderBy: { referencia: "asc" } });

  if (formato === "csv") {
    const header = "referencia,tipo,consumo,leituraAnterior,leituraAtual,tarifa,bandeira";
    const lines = leituras.map(l=> `${l.referencia},${l.tipo},${l.consumo},${l.leituraAnterior},${l.leituraAtual},${l.tarifa ?? ""},${l.bandeira ?? ""}`);
    const fHeader = "referencia,tipoFatura,valorTotal,status,vencimento";
    const fLines = faturas.map(f=> `${f.referencia},${f.tipo},${f.valorTotal},${f.status},${f.dataVencimento.toISOString().slice(0,10)}`);
    const csv = [header, ...lines, "", fHeader, ...fLines].join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="relatorio-${ano}.csv"` } });
  }

  // Para pdf/excel, no SQLite demo retornamos JSON instruções; em produção use jspdf/exceljs aqui no server.
  // Exemplo server-side ExcelJS: workbook, worksheet, commit.
  return NextResponse.json({
    formato, ano, tipo: tipo || "TODOS",
    leituras: leituras.length, faturas: faturas.length,
    mensagem: "Exportação server-side pronta: use ExcelJS (exceljs) para xlsx e jsPDF + autotable para PDF. Endpoint já filtra por unidades vinculadas e retorna dados prontos."
  });
}
