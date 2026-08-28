import { useEffect, useState } from 'react';
import { api } from '../lib/api';
export default function Dashboard(){
  const [d,setD]=useState<any>(null);
  useEffect(()=>{ api('/api/dashboard').then(setD).catch(()=> setD({ consumoAtual:{ energia:312,agua:11.4,gas:9.2}, faturas:{ totalMes:842.5, emAberto:2, vencidas:1 }})); },[]);
  if(!d) return <div className="p-4">Carregando...</div>;
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Olá, Inquilino 👋</h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl p-3 border"><div className="text-xs text-zinc-500">Energia</div><div className="font-bold">{d.consumoAtual.energia} kWh</div></div>
        <div className="bg-white rounded-2xl p-3 border"><div className="text-xs text-zinc-500">Água</div><div className="font-bold">{d.consumoAtual.agua} m³</div></div>
        <div className="bg-white rounded-2xl p-3 border"><div className="text-xs text-zinc-500">Gás</div><div className="font-bold">{d.consumoAtual.gas} m³</div></div>
        <div className="bg-emerald-600 text-white rounded-2xl p-3"><div className="text-xs opacity-80">Faturado mês</div><div className="font-bold">R$ {d.faturas.totalMes}</div></div>
      </div>
      <a href="#pix" className="block bg-zinc-900 text-white rounded-2xl py-3 text-center font-semibold">Pagar com PIX</a>
    </div>
  );
}
