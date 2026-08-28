import Link from "next/link";
export default function AdminPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Painel Master</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <Link href="/admin/administradores" className="bg-emerald-600 text-white border border-emerald-600 rounded-2xl p-4 hover:bg-emerald-700"><b>Administradores & Proprietários</b><div className="text-xs opacity-80">Grade Master: cadastrar ADMINISTRADOR ou PROPRIETÁRIO + vincular unidades</div><span className="text-xs bg-white text-emerald-700 rounded-full px-2 py-0.5 mt-2 inline-block">Abrir grade →</span></Link>
        <Link href="/api/admin/leituras" className="bg-white border rounded-2xl p-4"><b>Leituras</b><div className="text-xs text-zinc-500">Importar CSV, validar fotos OCR, aprovar</div></Link>
        <div className="bg-white border rounded-2xl p-4"><b>Faturas / Cron</b><div className="text-xs text-zinc-500">Gerar lote via <code>/api/cron/gerar-faturas</code>, PIX PSP</div></div>
      </div>
      <div className="bg-zinc-900 text-white rounded-2xl p-4 text-sm">
        <b>Login Master:</b> <code>master@elmesson.com.br / master123</code> em <Link href="/admin/login" className="underline">/admin/login</Link> → depois acesse <Link href="/admin/administradores" className="underline">/admin/administradores</Link> para ver o <b>form com papel ADMINISTRADOR ou PROPRIETÁRIO</b>.
      </div>
    </div>
  );
}
