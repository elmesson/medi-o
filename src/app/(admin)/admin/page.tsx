import Link from "next/link";
export default function AdminPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Painel Síndico</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <Link href="/api/admin/leituras" className="bg-white border rounded-2xl p-4"><b>Leituras</b><div className="text-xs text-zinc-500">Importar CSV, validar fotos OCR, aprovar</div></Link>
        <Link href="/api/admin/conta" className="bg-white border rounded-2xl p-4"><b>Faturas</b><div className="text-xs text-zinc-500">Gerar lote, PIX PSP, disparar notificações</div></Link>
        <div className="bg-white border rounded-2xl p-4"><b>Contestações</b><div className="text-xs text-zinc-500">Fluxo completo em /api/contestacoes (admin atualiza status)</div></div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm">RBAC: proteja `/admin` e `/api/admin/*` com `requireAdmin` (role SINDICO). Isolamento já garante que inquilino não acessa outras unidades.</div>
    </div>
  );
}
