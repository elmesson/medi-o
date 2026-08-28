import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";

const servicos = [
  { id: "limpeza", nome: "Limpeza pós-obra", preco: 180, prazo: "48h" },
  { id: "manutencao", nome: "Manutenção hidráulica", preco: 120, prazo: "24h" },
  { id: "vistoria", nome: "Vistoria de medidores", preco: 80, prazo: "72h" },
];
export async function GET() {
  return NextResponse.json(servicos);
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { servicoId, unidadeId } = await req.json();
  const svc = servicos.find(s=>s.id===servicoId);
  if (!svc) return NextResponse.json({ error: "serviço não encontrado" }, { status: 404 });
  // Em prod: criar OrdemServico + notificação + pagamento PIX
  return NextResponse.json({ ok: true, ordem: { servico: svc, unidadeId, status: "ABERTO", protocolo: `OS-${Date.now()}` } });
}
