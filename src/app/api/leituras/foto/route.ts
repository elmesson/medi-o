import { NextRequest, NextResponse } from "next/server";
import { requireAuth, assertUnidadeAcesso } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

// POST /api/leituras/foto -> multipart/form-data { foto: File, unidadeId, tipo }
// Em prod: enviar para Cloud Vision / Tesseract OCR. Aqui: simulação + validação de isolamento + criação de notificação.
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("foto") as File | null;
  const unidadeId = form.get("unidadeId") as string | null;
  const tipo = (form.get("tipo") as string | null) || "ENERGIA";

  if (!file || !unidadeId) return NextResponse.json({ error: "foto e unidadeId obrigatórios" }, { status: 400 });
  assertUnidadeAcesso(auth.unidades, unidadeId);

  // TODO: OCR real. Ex: const { createWorker } = await import("tesseract.js"); worker.recognize(await file.arrayBuffer())
  // Simulação: valor aleatório com confiança
  const leituraDetectada = 1200 + Math.floor(Math.random() * 500);
  const confianca = 0.82 + Math.random() * 0.15;

  // Salva como notificação para equipe validar (não cria Leitura automaticamente se confiança < 0.95)
  const status = confianca >= 0.95 ? "VALIDADA_AUTO" : "PENDENTE_VALIDACAO";
  await prisma.notificacao.create({
    data: {
      inquilinoId: auth.userId,
      tipo: "ALTERACAO_CADASTRO",
      canal: "SISTEMA",
      titulo: `Leitura por foto recebida (${tipo})`,
      mensagem: `Leitura ${leituraDetectada} detectada via foto (confiança ${(confianca*100).toFixed(0)}%). Unidade ${unidadeId}. Status: ${status}.`
    }
  });

  // Opcional: se VALIDADA_AUTO, cria/atualiza leitura do mês atual
  // if (status === "VALIDADA_AUTO") { ... prisma.leitura.upsert ... }

  return NextResponse.json({
    leituraDetectada,
    confianca,
    tipo,
    unidadeId,
    status,
    mensagem: status === "PENDENTE_VALIDACAO" ? "Foto recebida, aguardando validação da equipe." : "Leitura validada automaticamente.",
    fotoNome: file.name,
    fotoSize: file.size
  });
}
