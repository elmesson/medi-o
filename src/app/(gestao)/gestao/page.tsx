import Link from "next/link";
export default function GestaoPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Módulo Gestão</h1>
      <p className="text-sm text-zinc-500">Organizado por <b>Contas</b>, <b>Condomínio</b>, <b>Leitura</b> e <b>Inquilinos</b>.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/gestao/contas" className="bg-white border rounded-2xl p-4 hover:shadow-sm">
          <b>Contas</b><div className="text-xs text-zinc-500">Energia, Água, Gás, Taxas</div>
        </Link>
        <Link href="/gestao/condominio" className="bg-emerald-700 text-white border border-emerald-700 rounded-2xl p-4 hover:bg-emerald-800">
          <b>Condomínio</b><div className="text-xs opacity-80">Água, Gás, Energia, Outros (Internet, Manutenção, Segurança)</div>
          <span className="text-xs bg-white text-emerald-700 rounded-full px-2 py-0.5 mt-2 inline-block">Gerenciar →</span>
        </Link>
        <Link href="/gestao/leituras" className="bg-white border rounded-2xl p-4 hover:shadow-sm">
          <b>Leitura</b><div className="text-xs text-zinc-500">Realizar leituras</div>
        </Link>
        <Link href="/gestao/inquilinos" className="bg-white border rounded-2xl p-4 hover:shadow-sm">
          <b>Inquilinos</b><div className="text-xs text-zinc-500">Grade completa + medidores</div>
        </Link>
      </div>
    </div>
  );
}
