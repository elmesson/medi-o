import Link from "next/link";
export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-emerald-700 grid place-items-center rounded-xl font-bold">G</div>
          <b>Gestão</b><span className="text-xs opacity-80">Energia • Água • Gás • Condomínio</span>
        </div>
        <nav className="flex gap-2 text-xs">
          <Link href="/gestao" className="bg-white/15 rounded-full px-3 py-1">Dashboard</Link>
          <Link href="/gestao/contas" className="bg-white text-emerald-700 rounded-full px-3 py-1 font-semibold">Contas</Link>
          <Link href="/gestao/leituras" className="bg-white/15 rounded-full px-3 py-1">Leituras</Link>
          <Link href="/login" className="bg-white/10 rounded-full px-3 py-1">Sair</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
