import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-zinc-50">
      <div className="max-w-3xl w-full text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-semibold">Elmesson Measurement • Portal do Inquilino</div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4">Seu consumo, <span className="text-brand-600">sem mistério</span>.</h1>
        <p className="text-muted mt-3 text-lg">Dashboard em tempo real • Faturas com PIX • Contestações com acompanhamento • 100% mobile-first.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/login" className="btn-primary text-center">Entrar no portal</Link>
          <Link href="/portal" className="btn-ghost text-center">Ver demo do dashboard</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 text-left">
          {[
            ["⚡","Energia","kWh + bandeira"],
            ["💧","Água","m³ por unidade"],
            ["🔥","Gás","m³ + histórico"],
            ["🏢","Condomínio","rateio transparente"],
          ].map(([icon, title, sub])=>(
            <div key={title} className="card text-center">
              <div className="text-2xl">{icon}</div>
              <div className="font-semibold mt-1">{title}</div>
              <div className="text-xs text-muted">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
