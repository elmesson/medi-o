import Link from "next/link";
export default function GestaoPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Módulo Gestão</h1>
      <p className="text-sm text-zinc-500">Cadastre contas de Energia, Água, Gás e Condomínio e gerencie leituras. Acesso via login único conforme perfil (ADMINISTRADOR/PROPRIETARIO → /gestao).</p>
      <div className="grid md:grid-cols-2 gap-3">
        <Link href="/gestao/contas" className="bg-white border rounded-2xl p-4 hover:shadow-sm">
          <b>Contas</b><div className="text-xs text-zinc-500">Energia • Água • Gás • Condomínio — valor, rateio, critério, vencimento, status</div>
          <span className="text-xs bg-emerald-600 text-white rounded-full px-2 py-0.5 mt-2 inline-block">Gerenciar →</span>
        </Link>
        <Link href="/gestao/leituras" className="bg-white border rounded-2xl p-4 hover:shadow-sm">
          <b>Leituras</b><div className="text-xs text-zinc-500">Leitura anterior/atual, consumo kWh/m³, tarifa, bandeira</div>
          <span className="text-xs bg-zinc-900 text-white rounded-full px-2 py-0.5 mt-2 inline-block">Gerenciar →</span>
        </Link>
      </div>
    </div>
  );
}
