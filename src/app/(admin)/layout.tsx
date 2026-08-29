"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserBadge } from "@/components/UserBadge";
import { LogoutButton } from "@/components/LogoutButton";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/administradores", label: "Administradores" },
    { href: "/admin/unidades", label: "Unidades" },
  ];
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-zinc-900 grid place-items-center rounded-xl font-bold">A</div>
          <b>Elmesson Admin</b><span className="text-xs opacity-60">Master / Gestão</span>
          <UserBadge />
        </div>
        <nav className="flex gap-2 text-xs">
          {nav.map(n=>{
            const active = isActive(n.href);
            return <Link key={n.href} href={n.href} className={`rounded-full px-3 py-1 ${active?"bg-emerald-500 text-white font-semibold":"bg-white/10 hover:bg-white/20"}`}>{n.label}</Link>;
          })}
          <LogoutButton className="bg-white text-zinc-900 rounded-full px-3 py-1 text-xs" />
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
