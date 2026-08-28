import Link from "next/link";
export default function GestaoPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Módulo Gestão</h1>
      <p className="text-sm text-zinc-500">Organizado por <b>Contas</b> (proprietário), <b>Leitura</b> (inquilinos) e <b>Inquilinos</b> (cadastro completo).</p>
      <div className="grid md:grid-cols-3 gap-3">
        <Link href="/gestao/contas" className="bg-white border rounded-2xl p-4 hover:shadow-sm">
          <b>Contas</b><div className="text-xs text-zinc-500">Cadastrar contas do proprietário: Energia, Água, Gás, Condomínio</div>
          <span className="text-xs bg-emerald-600 text-white rounded-full px-2 py-0.5 mt-2 inline-block">Gerenciar →</span>
        </Link>
        <Link href="/gestao/leituras" className="bg-white border rounded-2xl p-4 hover:shadow-sm">
          <b>Leitura</b><div className="text-xs text-zinc-500">Realizar leituras dos inquilinos (anterior/atual, tarifa, bandeira)</div>
          <span className="text-xs bg-zinc-900 text-white rounded-full px-2 py-0.5 mt-2 inline-block">Realizar →</span>
        </Link>
        <Link href="/gestao/inquilinos" className="bg-emerald-700 text-white border border-emerald-700 rounded-2xl p-4 hover:bg-emerald-800">
          <b>Inquilinos</b><div className="text-xs opacity-80">Grade completa: nome, CPF, medidor, endereço, telefone, e-mail, código</div>
          <span className="text-xs bg-white text-emerald-700 rounded-full px-2 py-0.5 mt-2 inline-block">Cadastrar →</span>
        </Link>
      </div>
    </div>
  );
}
