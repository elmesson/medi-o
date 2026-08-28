import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertUnidadeAcesso } from "@/lib/requireAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  // Permite demo sem auth para facilitar teste do PDF bonito — se não autenticado, usa mock
  let fatura: any = null;
  let unidade: any = null;
  let inquilino: any = null;
  let proprietario: any = null;
  let leitura: any = null;
  if (auth) {
    fatura = await prisma.fatura.findUnique({ where: { id: params.id }, include: { unidade: true } });
    if (!fatura) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    assertUnidadeAcesso(auth.unidades, fatura.unidadeId);
    unidade = fatura.unidade;
    // Inquilino da unidade
    const vinc = await prisma.unidadeInquilino.findFirst({ where: { unidadeId: fatura.unidadeId }, include: { inquilino: true } });
    inquilino = vinc?.inquilino || null;
    // Proprietário/Administrador da unidade
    const admVinc = await prisma.administradorUnidade.findFirst({ where: { unidadeId: fatura.unidadeId }, include: { administrador: true } });
    proprietario = admVinc?.administrador || null;
    leitura = await prisma.leitura.findFirst({ where: { unidadeId: fatura.unidadeId, referencia: fatura.referencia }, orderBy: { referencia: "desc" } });
  } else {
    // mock bonito para demonstração quando não logado
    const now = new Date();
    fatura = {
      id: params.id,
      tipo: "CONDOMINIO",
      referencia: "2026-08",
      valorTotal: 542.5,
      rateioValor: 542.5,
      criterioRateio: "Fração ideal 0.82% • Área 82m²",
      dataEmissao: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      dataVencimento: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      status: "ABERTA",
      pixTxId: `pix-2026-08-COND-${params.id.slice(0,4)}`,
      pixQrCode: "00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540542.505802BR5925ELMESSON CONDOMINIO6009SAO PAULO62070503***6304ABCD",
      codigoBarras: "34191.09008 00000.000000 00000.000000 1 99990000054250",
    };
    unidade = { identificacao: "BL-A-101", bloco: "A", numero: "101" };
    inquilino = { nome: "Maria Silva", email: "maria@ex.com", cpfCnpj: "enc:05512345655", telefone: "(11) 99999-0000", endereco: "Rua A, 101 - Bl A", medidor: "HID-001", codigoMedidor: "MED-ABCD-1234" };
    proprietario = { nome: "João Proprietário", email: "joao.prop@elmesson.com.br", telefone: "(11) 97777-0000", documento: "05512345655" };
    leitura = { leituraAnterior: 1200, leituraAtual: 1450, consumo: 250, dataLeitura: new Date().toISOString() };
  }

  const valorTotal = Number(fatura.valorTotal);
  const venc = new Date(fatura.dataVencimento).toLocaleDateString("pt-BR");
  const emissao = new Date(fatura.dataEmissao).toLocaleDateString("pt-BR");
  const ref = fatura.referencia;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // ===== HEADER =====
  doc.setFillColor(5, 168, 104); // brand #00A868
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ELMESSON MEASUREMENT", 14, 12);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Gestão inteligente de consumo • Energia • Água • Gás • Condomínio", 14, 16);
  doc.setFontSize(8);
  doc.text("CNPJ 00.000.000/0001-00  •  contato@elmesson.com.br  •  (11) 3000-0000", 14, 21);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PORTAL DO INQUILINO", W - 14, 14, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Documento auxiliar • Não é boleto bancário", W - 14, 18, { align: "right" });

  // ===== TÍTULO FATURA =====
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FATURA", 14, 38);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${fatura.tipo}  •  Referência ${ref}`, 14, 43);

  // Badge status
  const statusColor: Record<string, [number, number, number]> = {
    PAGA: [16, 185, 129],
    ABERTA: [5, 168, 104],
    VENCIDA: [244, 63, 94],
    EM_CONTESTACAO: [245, 158, 11],
  };
  const [r, g, b] = statusColor[fatura.status] || [100, 116, 139];
  doc.setFillColor(r, g, b);
  doc.roundedRect(W - 14 - 28, 33, 28, 10, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(fatura.status, W - 14 - 14, 39.5, { align: "center" });

  // ===== CARDS UNIDADE / VENCIMENTO / VALOR =====
  const cardY = 48;
  // Unidade
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, 58, 26, 3, 3, "FD");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("UNIDADE", 16, cardY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(unidade.identificacao, 16, cardY + 13);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(`Bloco ${unidade.bloco || "-"} • Nº ${unidade.numero || "-"}`, 16, cardY + 18);
  doc.text(`ID ${fatura.id.slice(0, 8)}`, 16, cardY + 22);

  // Vencimento
  doc.roundedRect(76, cardY, 58, 26, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text("VENCIMENTO", 78, cardY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(venc, 78, cardY + 13);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(`Emissão ${emissao}`, 78, cardY + 18);
  doc.text(`Ref ${ref}`, 78, cardY + 22);

  // Valor
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(138, cardY, W - 152, 26, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL", 140, cardY + 6);
  doc.setFontSize(14);
  doc.text(valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), 140, cardY + 15);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(fatura.pixTxId ? `PIX TxId ${fatura.pixTxId.slice(0, 18)}...` : "Boleto / PIX", 140, cardY + 20);

  // ===== TABELA ITENS =====
  autoTable(doc, {
    startY: cardY + 32,
    head: [["Descrição", "Referência", "Critério / Rateio", "Valor"]],
    body: [
      [fatura.tipo, ref, fatura.criterioRateio || "Medição individual", valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })],
      ...(fatura.rateioValor ? [["Rateio condomínio", ref, fatura.criterioRateio || "-", Number(fatura.rateioValor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })]] : []),
    ],
    foot: [["", "", "TOTAL", valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })]],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
    footStyles: { fillColor: [220, 252, 231], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 9 },
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 30, halign: "center" }, 2: { cellWidth: 60 }, 3: { cellWidth: 35, halign: "right" } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // ===== DEMONSTRATIVO RATEIO =====
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, finalY, W - 28, 16, 3, 3, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 122, 80);
  doc.text("DEMONSTRATIVO DE RATEIO", 16, finalY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.text(`Critério: ${fatura.criterioRateio || "Medição individual"}   •   Rateio: ${fatura.rateioValor ? Number(fatura.rateioValor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}   •   Status: ${fatura.status}`, 16, finalY + 10);
  finalY += 22;

  // ===== INQUILINO / MEDIDOR QRCODE / PROPRIETÁRIO / LEITURA =====
  let qrMedidorDataUrl: string | null = null;
  if (inquilino?.codigoMedidor) {
    try { qrMedidorDataUrl = await QRCode.toDataURL(inquilino.codigoMedidor, { width: 200, margin: 1 }); } catch {}
  }
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, W - 28, 32, 3, 3, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("INQUILINO  •  MEDIDOR  •  PROPRIETÁRIO  •  LEITURA", 16, finalY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  function maskDoc(docStr: string | null | undefined) {
    if (!docStr || docStr === "-") return "-";
    const clean = String(docStr).replace(/\D/g, "");
    if (clean.length === 11) return `${clean.slice(0,3)}.***.***-${clean.slice(9)}`;
    if (clean.length === 14) return `${clean.slice(0,2)}.${clean.slice(2,5)}.${clean.slice(5,8)}/${clean.slice(8,12)}-${clean.slice(12)}`;
    return docStr;
  }
  function cleanDoc(docStr: string | null | undefined) {
    if (!docStr) return "";
    return String(docStr).replace("enc:","").replace(/\D/g,"");
  }
  const inqNome = inquilino?.nome || "-";
  const inqCpfRaw = inquilino?.cpfCnpj ? String(inquilino.cpfCnpj).replace("enc:","") : "";
  const inqCpf = inqCpfRaw ? (cleanDoc(inqCpfRaw).length===14 ? maskDoc(inqCpfRaw) : maskDoc(inqCpfRaw)) : "-";
  const inqCpfLabel = cleanDoc(inqCpfRaw).length===14 ? "CNPJ" : "CPF";
  const inqEnd = inquilino?.endereco || unidade.identificacao;
  const medidor = inquilino?.medidor || "-";
  const codigo = inquilino?.codigoMedidor || "-";
  const propNome = proprietario?.nome || "-";
  const propTel = proprietario?.telefone || "-";
  const propDocRaw = proprietario?.documento ? String(proprietario.documento) : "";
  const propDoc = propDocRaw ? (cleanDoc(propDocRaw).length===14 ? maskDoc(propDocRaw) : maskDoc(propDocRaw)) : "";
  const propDocLabel = propDocRaw ? (cleanDoc(propDocRaw).length===14 ? "CNPJ" : "CPF") : "";
  const dataLeitura = leitura?.dataLeitura ? new Date(leitura.dataLeitura).toLocaleDateString("pt-BR") : new Date(fatura.dataEmissao).toLocaleDateString("pt-BR");
  const consumo = leitura ? `${leitura.leituraAnterior || 0} → ${leitura.leituraAtual || 0} • Consumo ${leitura.consumo || 0} ${fatura.tipo==="ENERGIA"?"kWh":"m³"}` : `Consumo ref ${ref}`;
  doc.text(`Inquilino: ${inqNome}  •  ${inqCpfLabel}: ${inqCpf}`, 16, finalY + 10);
  doc.text(`Endereço: ${inqEnd}  •  Medidor: ${medidor}  •  Código: ${codigo}`, 16, finalY + 14);
  doc.text(`Proprietário: ${propNome} ${propDoc?`• ${propDocLabel}: ${propDoc}`:""} ${propTel!=="-"?"• "+propTel:""}`, 16, finalY + 18);
  doc.text(`Leitura: ${dataLeitura}  •  ${consumo}  •  Validação por QR exclusivo do medidor`, 16, finalY + 22);
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("QR do medidor: escaneie na leitura para validar e evitar erros.", 16, finalY + 26);
  if (qrMedidorDataUrl) {
    try { doc.addImage(qrMedidorDataUrl, "PNG", W - 14 - 22, finalY + 6, 22, 22); doc.setFontSize(5); doc.setTextColor(100,116,139); doc.text(codigo, W - 14 - 11, finalY + 30, { align: "center" }); } catch {}
  } else {
    doc.setFillColor(248,250,252);
    doc.roundedRect(W - 14 - 22, finalY + 6, 22, 22, 2,2, "FD");
    doc.setFontSize(6); doc.text("QR", W - 14 - 11, finalY + 17, { align: "center" });
  }
  finalY += 38;

  // ===== PIX =====
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, W - 28, 38, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Pagamento via PIX", 16, finalY + 7);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Escaneie o QR Code no app do banco ou use o PIX Copia e Cola abaixo.", 16, finalY + 11);

  let qrPixDataUrl: string | null = null;
  if (fatura.pixQrCode) { try { qrPixDataUrl = await QRCode.toDataURL(fatura.pixQrCode, { width: 200, margin: 1 }); } catch {} }
  if (qrPixDataUrl) {
    try { doc.addImage(qrPixDataUrl, "PNG", 16, finalY + 14, 22, 22); } catch {}
  } else {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(16, finalY + 14, 22, 22, 2, 2, "FD");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("QR CODE", 20, finalY + 23);
    doc.text("PIX", 24, finalY + 26);
  }
  // Copia e cola
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("PIX COPIA E COLA", 42, finalY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  const pix = fatura.pixQrCode || "000201...";
  const pixLines = doc.splitTextToSize(pix, W - 62);
  doc.text(pixLines.slice(0, 3), 42, finalY + 20);
  if (fatura.codigoBarras) {
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`Linha digitável: ${fatura.codigoBarras}`, 16, finalY + 34);
  }

  // ===== RODAPÉ =====
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Elmesson Measurement • Este documento foi gerado automaticamente pelo Portal do Inquilino. Em caso de dúvidas, abra uma contestação em /portal/contestacoes ou atendimento em /portal/atendimento.", 14, 287, { maxWidth: W - 28 });
  doc.setFontSize(6);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} • ID ${fatura.id} • Uso exclusivo da unidade ${unidade.identificacao}`, 14, 292);

  const arrayBuffer = doc.output("arraybuffer");
  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fatura-${fatura.tipo}-${ref}-${unidade.identificacao}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
