"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/") || pathname === href;
  const nav = [
    { href: "/gestao", label: "Dashboard" },
    { href: "/gestao/contas", label: "Contas" },
    { href: "/gestao/condominio", label: "Condomínio" },
    { href: "/gestao/leituras", label: "Leitura" },
    { href: "/gestao/inquilinos", label: "Inquilinos" },
    { href: "/gestao/configuracao", label: "Configuração" },
  ];
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-emerald-700 grid place-items-center rounded-xl font-bold">G</div>
          <b>Gestão</b><span className="text-xs opacity-80">Energia • Água • Gás • Condomínio</span>
        </div>
        <nav className="flex gap-2 text-xs">
          {nav.map(n=>{
            const active = isActive(n.href);
            return <Link key={n.href} href={n.href} className={`rounded-full px-3 py-1 ${active?"bg-white text-emerald-700 font-semibold":"bg-white/15"}`}>{n.label}</Link>;
          })}
          <Link href="/login" className="bg-white/10 rounded-full px-3 py-1">Sair</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
