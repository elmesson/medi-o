import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  // Permite demo sem auth com mock, mas tenta real se autenticado
  let unidades: string[] | null = auth?.unidades || null;
  const { searchParams } = new URL(req.url);
  const formato = searchParams.get("formato") || "csv";
  const ano = searchParams.get("ano") || new Date().getFullYear().toString();
  const tipo = searchParams.get("tipo") || undefined;

  let leituras: any[] = [];
  let faturas: any[] = [];
  if (unidades && unidades.length) {
    const where: any = { unidadeId: { in: unidades } };
    if (ano) where.referencia = { startsWith: ano };
    if (tipo && tipo !== "TODOS") where.tipo = tipo;
    leituras = await prisma.leitura.findMany({ where, orderBy: { referencia: "asc" }, include: { unidade: true } });
    faturas = await prisma.fatura.findMany({ where: { unidadeId: { in: unidades }, referencia: { startsWith: ano } }, orderBy: { referencia: "asc" }, include: { unidade: true } });
    // filtra faturas por tipo se necessário (tipo de consumo vs tipo fatura)
    if (tipo && tipo !== "TODOS") faturas = faturas.filter(f=> f.tipo===tipo);
  } else {
    // mock para demo sem login
    const refs = ["2026-08","2026-07","2026-06","2026-05","2026-04","2026-03"];
    const tipos = tipo && tipo!=="TODOS" ? [tipo] : ["ENERGIA","AGUA","GAS"];
    leituras = refs.flatMap(ref=> tipos.map(t=> ({ referencia: ref, tipo: t, leituraAnterior: 1200, leituraAtual: t==="ENERGIA"?1480:91, consumo: t==="ENERGIA"?280:10, tarifa: t==="ENERGIA"?0.92:6.5, bandeira: t==="ENERGIA"?"VERDE":null, unidade: { identificacao: "BL-A-101"} })) as any);
    faturas = refs.slice(0,3).map(ref=> ({ referencia: ref, tipo: tipos[0], valorTotal: 280, status: "PAGA", dataVencimento: new Date(), unidade: { identificacao: "BL-A-101"} } as any));
    if (tipo && tipo!=="TODOS") {
      leituras = leituras.filter(l=>l.tipo===tipo);
      faturas = faturas.filter(f=>f.tipo===tipo);
    }
  }

  if (formato === "csv") {
    const header = "referencia,tipo,consumo,leituraAnterior,leituraAtual,tarifa,bandeira,unidade";
    const lines = leituras.map(l=> `${l.referencia},${l.tipo},${l.consumo},${l.leituraAnterior},${l.leituraAtual},${l.tarifa ?? ""},${l.bandeira ?? ""},${l.unidade?.identificacao||""}`);
    const fHeader = "referencia,tipoFatura,valorTotal,status,vencimento,unidade";
    const fLines = faturas.map(f=> `${f.referencia},${f.tipo},${f.valorTotal},${f.status},${f.dataVencimento.toISOString().slice(0,10)},${f.unidade?.identificacao||""}`);
    const csv = [header, ...lines, "", fHeader, ...fLines].join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="historico-${ano}-${tipo||"TODOS"}.csv"` } });
  }

  if (formato === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    // Header
    doc.setFillColor(5,168,104);
    doc.rect(0,0,W,22,"F");
    doc.setTextColor(255,255,255);
    doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.text("ELMESSON - HISTÓRICO DE CONSUMO", 14, 12);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text(`Ano ${ano} • Tipo ${tipo||"TODOS"} • Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 16);
    doc.setFontSize(7); doc.text("Portal do Inquilino • Demonstrativo exclusivo por unidade vinculada", W-14, 16, { align:"right" });

    // Leituras
    doc.setTextColor(15,23,42);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.text("Leituras", 14, 28);
    autoTable(doc, {
      startY: 30,
      head: [["Referência","Unidade","Tipo","Anterior","Atual","Consumo","Tarifa","Bandeira"]],
      body: leituras.map(l=> [l.referencia, l.unidade?.identificacao||"-", l.tipo, String(l.leituraAnterior), String(l.leituraAtual), `${l.consumo} ${l.tipo==="ENERGIA"?"kWh":"m³"}`, l.tarifa? String(l.tarifa):"-", l.bandeira||"-"]),
      theme: "grid",
      headStyles: { fillColor:[15,23,42], fontSize:7 },
      bodyStyles: { fontSize:7 },
      styles: { cellPadding: 2 },
      margin: { left:14, right:14 },
    });
    let y = (doc as any).lastAutoTable.finalY + 6;
    // Faturas
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.text("Faturas", 14, y);
    autoTable(doc, {
      startY: y+2,
      head: [["Referência","Unidade","Tipo","Valor","Status","Vencimento"]],
      body: faturas.map(f=> [f.referencia, f.unidade?.identificacao||"-", f.tipo, Number(f.valorTotal).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}), f.status, new Date(f.dataVencimento).toLocaleDateString("pt-BR")]),
      theme: "grid",
      headStyles: { fillColor:[5,168,104], fontSize:7 },
      bodyStyles: { fontSize:7 },
      margin: { left:14, right:14 },
    });
    // Footer
    doc.setFontSize(6); doc.setTextColor(100,116,139);
    doc.text(`Histórico filtrado por unidades vinculadas • ${leituras.length} leituras • ${faturas.length} faturas`, 14, doc.internal.pageSize.getHeight()-8);

    const buf = doc.output("arraybuffer");
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="historico-${ano}-${tipo||"TODOS"}.pdf"`,
      }
    });
  }

  if (formato === "excel") {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Elmesson";
    const wsL = wb.addWorksheet("Leituras");
    wsL.columns = [
      { header: "Referência", key: "referencia", width: 12 },
      { header: "Unidade", key: "unidade", width: 14 },
      { header: "Tipo", key: "tipo", width: 10 },
      { header: "Anterior", key: "anterior", width: 12 },
      { header: "Atual", key: "atual", width: 12 },
      { header: "Consumo", key: "consumo", width: 12 },
      { header: "Tarifa", key: "tarifa", width: 10 },
      { header: "Bandeira", key: "bandeira", width: 12 },
    ];
    wsL.getRow(1).font = { bold: true };
    leituras.forEach(l=> wsL.addRow({ referencia: l.referencia, unidade: l.unidade?.identificacao||"-", tipo: l.tipo, anterior: l.leituraAnterior, atual: l.leituraAtual, consumo: l.consumo, tarifa: l.tarifa||"", bandeira: l.bandeira||"" }));
    const wsF = wb.addWorksheet("Faturas");
    wsF.columns = [
      { header: "Referência", key: "referencia", width: 12 },
      { header: "Unidade", key: "unidade", width: 14 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Valor", key: "valor", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Vencimento", key: "vencimento", width: 14 },
    ];
    wsF.getRow(1).font = { bold: true };
    faturas.forEach(f=> wsF.addRow({ referencia: f.referencia, unidade: f.unidade?.identificacao||"-", tipo: f.tipo, valor: Number(f.valorTotal), status: f.status, vencimento: new Date(f.dataVencimento).toLocaleDateString("pt-BR") }));
    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="historico-${ano}-${tipo||"TODOS"}.xlsx"`,
      }
    });
  }

  return NextResponse.json({ error: "formato inválido" }, { status: 400 });
}
