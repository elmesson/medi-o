import { useEffect, useState } from 'react';
import { api } from '../lib/api';
export default function Chamados(){
  const [lista,setLista]=useState<any[]>([]);
  const [assunto,setAssunto]=useState('');
  useEffect(()=>{ api('/api/chamados').then(setLista).catch(()=> setLista([])); },[]);
  async function abrir(){ await api('/api/chamados',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ categoria:'DUVIDA', assunto, mensagem: assunto }) }); setAssunto(''); const l=await api('/api/chamados'); setLista(l); }
  return (
    <div className="p-4 space-y-3">
      <h1 className="font-bold">Chamados</h1>
      <div className="flex gap-2"><input value={assunto} onChange={e=>setAssunto(e.target.value)} placeholder="Assunto" className="flex-1 border rounded-xl px-3 py-2" /><button onClick={abrir} className="bg-emerald-600 text-white rounded-xl px-4">Abrir</button></div>
      {lista.map(c=> <div key={c.id} className="bg-white border rounded-2xl p-3"><div className="font-semibold text-sm">{c.assunto}</div><div className="text-xs text-zinc-500">{c.status}</div></div>)}
    </div>
  );
}
