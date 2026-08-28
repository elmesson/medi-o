"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
export default function LeiturasGestaoPage(){
  const [form,setForm]=useState({ unidadeId:"", tipo:"ENERGIA", referencia: new Date().toISOString().slice(0,7), leituraAnterior:"", leituraAtual:"", tarifa:"0.92", bandeira:"VERDE" });
  const [lista,setLista]=useState<any[]>([]);
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});

  async function load(){
    const r = await fetch("/api/admin/leituras").then(res=>res.json()).catch(()=>[]);
    if(Array.isArray(r)) setLista(r);
  }
  useEffect(()=>{ load(); },[]);

  async function salvar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/leituras", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ leituras: [{ unidadeId: form.unidadeId || "bl-a-101", tipo: form.tipo, referencia: form.referencia, leituraAnterior: Number(form.leituraAnterior), leituraAtual: Number(form.leituraAtual), tarifa: Number(form.tarifa), bandeira: form.bandeira }] }) });
    if(res.ok) load();
    else {
      const consumo = Number(form.leituraAtual)-Number(form.leituraAnterior);
      setLista([{ id: Math.random().toString(36).slice(2), ...form, leituraAnterior: Number(form.leituraAnterior), leituraAtual: Number(form.leituraAtual), consumo, tarifa: Number(form.tarifa) }, ...lista]);
    }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ leituraAnterior: item.leituraAnterior, leituraAtual: item.leituraAtual, tarifa: item.tarifa||"", bandeira: item.bandeira||"VERDE" });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/leituras", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: edit.id, ...editForm, leituraAnterior: Number(editForm.leituraAnterior), leituraAtual: Number(editForm.leituraAtual), tarifa: Number(editForm.tarifa) }) });
    if(res.ok) load(); else setLista(lista.map(x=> x.id===edit.id? {...x, ...editForm}:x));
    setEdit(null);
  }
  async function remover(id:string){
    if(!confirm("Remover leitura?")) return;
    await fetch(`/api/admin/leituras?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestão — Leitura</h1>
      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Realizar leitura do inquilino</h3>
        <form onSubmit={salvar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Unidade ID<input value={form.unidadeId} onChange={e=>setForm({...form, unidadeId:e.target.value})} placeholder="bl-a-101" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Tipo<select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ENERGIA</option><option>AGUA</option><option>GAS</option></select></label>
          <label className="text-sm">Referência<input value={form.referencia} onChange={e=>setForm({...form, referencia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Bandeira<select value={form.bandeira} onChange={e=>setForm({...form, bandeira:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>VERDE</option><option>AMARELA</option><option>VERMELHA_P1</option><option>VERMELHA_P2</option></select></label>
          <label className="text-sm">Anterior<input type="number" value={form.leituraAnterior} onChange={e=>setForm({...form, leituraAnterior:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Atual<input type="number" value={form.leituraAtual} onChange={e=>setForm({...form, leituraAtual:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm md:col-span-3">Tarifa R$<input type="number" step="0.0001" value={form.tarifa} onChange={e=>setForm({...form, tarifa:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-3 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Salvar leitura</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa — Leituras</h3><Badge variant="default">{lista.length} registros</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th>Unidade</th><th>Tipo</th><th>Ref</th><th>Anterior</th><th>Atual</th><th>Consumo</th><th>Tarifa</th><th>Bandeira</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.slice(0,20).map((l:any)=>(
                <tr key={l.id} className="border-t"><td className="text-xs">{l.unidade?.identificacao|| l.unidadeId?.slice(0,8)}</td><td className="text-center"><Badge variant="default">{l.tipo}</Badge></td><td className="text-xs text-center">{l.referencia}</td><td className="text-right">{l.leituraAnterior}</td><td className="text-right">{l.leituraAtual}</td><td className="text-right font-bold">{l.consumo}</td><td className="text-right">{l.tarifa||"-"}</td><td className="text-center text-xs">{l.bandeira||"-"}</td><td className="text-right space-x-1"><button onClick={()=>iniciarEdicao(l)} className="text-xs bg-emerald-700 text-white rounded-full px-3 py-1">Alterar</button><button onClick={()=>remover(l.id)} className="text-xs text-rose-600">Remover</button></td></tr>
              ))}
              {lista.length===0 && <tr><td colSpan={9} className="text-center py-6 text-zinc-500">Nenhuma leitura</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-bold">Alterar leitura — {edit.referencia} {edit.tipo}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Anterior<input type="number" value={editForm.leituraAnterior} onChange={e=>setEditForm({...editForm, leituraAnterior:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Atual<input type="number" value={editForm.leituraAtual} onChange={e=>setEditForm({...editForm, leituraAtual:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Tarifa<input type="number" step="0.0001" value={editForm.tarifa} onChange={e=>setEditForm({...editForm, tarifa:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Bandeira<select value={editForm.bandeira} onChange={e=>setEditForm({...editForm, bandeira:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>VERDE</option><option>AMARELA</option><option>VERMELHA_P1</option><option>VERMELHA_P2</option></select></label>
            </div>
            <div className="flex gap-2"><button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button><button className="flex-1 bg-emerald-700 text-white rounded-2xl py-2 font-semibold">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
