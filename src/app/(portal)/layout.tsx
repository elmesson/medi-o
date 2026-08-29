"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gauge, Receipt, History, QrCode, MessageCircle, AlertTriangle, Bell, User, TrendingUp } from "lucide-react";

const nav = [
  { href: "/portal", icon: Home, label: "Dashboard" },
  { href: "/portal/leituras", icon: Gauge, label: "Leituras" },
  { href: "/portal/historico", icon: History, label: "Histórico" },
  { href: "/portal/faturas", icon: Receipt, label: "Faturas" },
  { href: "/portal/pix", icon: QrCode, label: "PIX" },
  { href: "/portal/contestacoes", icon: AlertTriangle, label: "Contestações" },
  { href: "/portal/atendimento", icon: MessageCircle, label: "Atendimento" },
  { href: "/portal/bi", icon: TrendingUp, label: "BI" },
  { href: "/portal/notificacoes", icon: Bell, label: "Notificações" },
  { href: "/portal/perfil", icon: User, label: "Perfil" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/portal" && pathname.startsWith(href));
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white grid place-items-center font-bold text-sm">E</div>
            <span className="font-bold">Elmesson</span><span className="text-muted text-sm hidden sm:inline">• Portal do Inquilino</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/login" className="text-muted hover:text-ink">Sair</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Mobile nav as horizontal scroll */}
        <nav className="lg:hidden overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {nav.map(n=>{
              const active = isActive(n.href);
              return (
                <Link key={n.href} href={n.href} className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm whitespace-nowrap border ${active?"bg-emerald-600 text-white border-emerald-600":"bg-white border-zinc-200"}`}>
                  <n.icon className="w-4 h-4" />{n.label}
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="bg-white rounded-3xl border border-zinc-100 p-3 sticky top-[68px] space-y-1">
            {nav.map(n=>{
              const active = isActive(n.href);
              return (
                <Link key={n.href} href={n.href} className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-medium ${active?"bg-emerald-600 text-white":"hover:bg-zinc-50"}`}>
                  <n.icon className="w-4 h-4" />{n.label}
                </Link>
              );
            })}
            <div className="pt-3 mt-3 border-t border-zinc-100 text-xs text-muted px-3">
              Acesso restrito às unidades vinculadas. Sessão com JWT + Refresh + MFA.
            </div>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
