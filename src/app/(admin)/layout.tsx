export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-zinc-900 text-white px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 bg-white text-zinc-900 grid place-items-center rounded-xl font-bold">A</div>
        <b>Elmesson Admin</b><span className="text-xs opacity-60">Síndico / Gestão</span>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
