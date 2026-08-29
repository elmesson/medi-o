import { useEffect } from 'react';
import Dashboard from './screens/Dashboard';
import LeituraFoto from './screens/LeituraFoto';
import Chamados from './screens/Chamados';
import Pix from './screens/Pix';
import { initPush } from './lib/push';

export default function App(){
  useEffect(()=>{ initPush().catch(e=> console.warn('[initPush]',e)); },[]);
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-2"><div className="w-8 h-8 bg-emerald-600 text-white grid place-items-center rounded-xl font-bold">E</div><b>Elmesson</b> <span className="text-xs text-zinc-500">App Inquilino</span></header>
      <nav className="flex gap-2 p-2 overflow-x-auto">
        <a href="#dashboard" className="bg-white border rounded-full px-3 py-1 text-sm">Dashboard</a>
        <a href="#foto" className="bg-white border rounded-full px-3 py-1 text-sm">Foto Medidor</a>
        <a href="#chamados" className="bg-white border rounded-full px-3 py-1 text-sm">Chamados</a>
        <a href="#pix" className="bg-white border rounded-full px-3 py-1 text-sm">PIX</a>
      </nav>
      <main>
        <section id="dashboard"><Dashboard/></section>
        <section id="foto"><LeituraFoto/></section>
        <section id="chamados"><Chamados/></section>
        <section id="pix"><Pix/></section>
      </main>
    </div>
  );
}
