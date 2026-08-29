import Link from "next/link";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-zinc-900 grid place-items-center rounded-xl font-bold">A</div>
          <b>Elmesson Admin</b><span className="text-xs opacity-60">Master / Gestão</span>
        </div>
        <nav className="flex gap-2 text-xs">
          <Link href="/admin" className="bg-white/10 hover:bg-white/20 rounded-full px-3 py-1">Dashboard</Link>
          <Link href="/admin/administradores" className="bg-white/10 hover:bg-white/20 rounded-full px-3 py-1">Administradores</Link>
          <Link href="/admin/unidades" className="bg-emerald-500 hover:bg-emerald-600 rounded-full px-3 py-1 font-semibold">Unidades</Link>
          <Link href="/admin/login" className="bg-white text-zinc-900 rounded-full px-3 py-1">Login Master</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
