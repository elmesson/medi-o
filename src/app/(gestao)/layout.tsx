"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserBadge } from "@/components/UserBadge";
import { LogoutButton } from "@/components/LogoutButton";
export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [papel,setPapel]=useState<string | null>(null);
  useEffect(()=>{
    fetch("/api/me").then(r=>r.json()).then(j=>{
      if(j?.papel) setPapel(j.papel);
      if(j?.papel==="LEITURISTA" && pathname!=="/gestao/leituras" && !pathname.startsWith("/gestao/leituras/")){
        router.replace("/gestao/leituras");
      }
    }).catch(()=>{});
  },[pathname]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/") || pathname === href;
  const isLeiturista = papel==="LEITURISTA";
  const nav = isLeiturista
    ? [{ href: "/gestao/leituras", label: "Leitura" }]
    : [
    { href: "/gestao", label: "Dashboard" },
    { href: "/gestao/contas", label: "Contas" },
    { href: "/gestao/condominio", label: "Condomínio" },
    { href: "/gestao/leituras", label: "Leitura" },
    { href: "/gestao/inquilinos", label: "Inquilinos" },
    { href: "/gestao/configuracao", label: "Configuração" },
  ];
  if (isLeiturista && pathname!=="/gestao/leituras" && !pathname.startsWith("/gestao/leituras/")) {
    return (
      <div className="min-h-screen bg-zinc-50 grid place-items-center p-8">
        <div className="bg-white rounded-2xl p-6 text-center border">
          <div className="font-semibold">Acesso restrito</div>
          <div className="text-sm text-zinc-500 mt-1">Leiturista tem acesso somente à tela Leitura.</div>
          <div className="text-xs text-zinc-500 mt-2">Redirecionando para /gestao/leituras...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-emerald-700 grid place-items-center rounded-xl font-bold">G</div>
          <b>Gestão</b><span className="text-xs opacity-80">Energia • Água • Gás • Condomínio</span>
          <UserBadge />
        </div>
        <nav className="flex gap-2 text-xs">
          {nav.map(n=>{
            const active = isActive(n.href);
            return <Link key={n.href} href={n.href} className={`rounded-full px-3 py-1 ${active?"bg-white text-emerald-700 font-semibold":"bg-white/15"}`}>{n.label}</Link>;
          })}
          <LogoutButton />
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
