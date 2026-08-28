"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function ContasPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ unidadeId:"", tipo:"ENERGIA", referencia: new Date().toISOString().slice(0,7), valorTotal:"", criterioRateio:"Medição individual", dataVencimento: new Date().toISOString().slice(0,10), status:"ABERTA" });
  const [unidades,setUnidades]=useState<any[]>([]);
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});

  async function load(){
    const f = await fetch("/api/admin/contas").then(r=>r.json()).catch(()=>[]);
    if(Array.isArray(f) && f.length) setLista(f);
    else {
      const fallback = await fetch("/api/faturas").then(r=>r.json()).catch(()=>[]);
      if(Array.isArray(fallback)) setLista(fallback);
    }
    setUnidades([{id:"bl-a-101", identificacao:"BL-A-101"}, {id:"bl-a-102", identificacao:"BL-A-102"}] as any);
  }
  useEffect(()=>{ load(); },[]);

  async function criar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/contas", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ ...form, valorTotal: Number(form.valorTotal), dataEmissao: new Date().toISOString(), dataVencimento: new Date(form.dataVencimento).toISOString() }) });
    if(res.ok) { setForm({ ...form, valorTotal:""}); load(); }
    else {
      setLista([{ id: Math.random().toString(36).slice(2), ...form, valorTotal: Number(form.valorTotal), dataVencimento: form.dataVencimento, unidade: { identificacao: form.unidadeId||"BL-A-101"} }, ...lista]);
    }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ valorTotal: item.valorTotal, criterioRateio: item.criterioRateio||"", dataVencimento: new Date(item.dataVencimento).toISOString().slice(0,10), status: item.status, tipo: item.tipo, referencia: item.referencia });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/contas", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: edit.id, ...editForm, valorTotal: Number(editForm.valorTotal) }) });
    if(res.ok) load(); else setLista(lista.map(x=> x.id===edit.id? {...x, ...editForm, valorTotal: Number(editForm.valorTotal)}:x));
    setEdit(null);
  }
  async function remover(id:string){
    if(!confirm("Remover conta?")) return;
    await fetch(`/api/admin/contas?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestão — Contas</h1>
      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Cadastrar conta do proprietário</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Unidade<select value={form.unidadeId} onChange={e=>setForm({...form, unidadeId:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Selecione</option>{unidades.map((u:any)=><option key={u.id} value={u.id}>{u.identificacao}</option>)}</select></label>
          <label className="text-sm">Tipo<select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="ENERGIA">ENERGIA ELÉTRICA</option><option value="AGUA">ÁGUA</option><option value="GAS">GÁS</option><option value="CONDOMINIO">CONDOMÍNIO</option><option value="TAXA_EXTRA">TAXA EXTRA</option></select></label>
          <label className="text-sm">Referência<input value={form.referencia} onChange={e=>setForm({...form, referencia:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Valor total<input type="number" step="0.01" value={form.valorTotal} onChange={e=>setForm({...form, valorTotal:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Vencimento<input type="date" value={form.dataVencimento} onChange={e=>setForm({...form, dataVencimento:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Status<select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ABERTA</option><option>PAGA</option><option>VENCIDA</option><option>EM_CONTESTACAO</option></select></label>
          <label className="text-sm md:col-span-3">Critério / Rateio<input value={form.criterioRateio} onChange={e=>setForm({...form, criterioRateio:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-3 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Cadastrar conta</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa — Contas</h3><Badge variant="default">{lista.length} registros</Badge></div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left">Tipo</th><th>Ref</th><th>Unidade</th><th className="text-right">Valor</th><th>Critério</th><th>Vencimento</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map((f:any)=>(
                <tr key={f.id} className="border-t"><td>{f.tipo}</td><td className="text-center">{f.referencia}</td><td className="text-xs">{f.unidade?.identificacao|| f.unidadeId?.slice(0,8)}</td><td className="text-right">{brl(f.valorTotal)}</td><td className="text-xs">{f.criterioRateio||"-"}</td><td className="text-xs text-center">{new Date(f.dataVencimento).toLocaleDateString("pt-BR")}</td><td className="text-center"><Badge variant={f.status==="PAGA"?"success":f.status==="VENCIDA"?"danger":"default"}>{f.status}</Badge></td><td className="text-right space-x-1"><button onClick={()=>iniciarEdicao(f)} className="text-xs bg-emerald-700 text-white rounded-full px-3 py-1">Alterar</button><button onClick={()=>remover(f.id)} className="text-xs text-rose-600">Remover</button></td></tr>
              ))}
              {lista.length===0 && <tr><td colSpan={8} className="text-center py-6 text-zinc-500">Nenhuma conta</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-bold">Alterar conta — {edit.tipo} {edit.referencia}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Tipo<select value={editForm.tipo} onChange={e=>setEditForm({...editForm, tipo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ENERGIA</option><option>AGUA</option><option>GAS</option><option>CONDOMINIO</option><option>TAXA_EXTRA</option></select></label>
              <label className="text-sm">Referência<input value={editForm.referencia} onChange={e=>setEditForm({...editForm, referencia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Valor<input type="number" step="0.01" value={editForm.valorTotal} onChange={e=>setEditForm({...editForm, valorTotal:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Vencimento<input type="date" value={editForm.dataVencimento} onChange={e=>setEditForm({...editForm, dataVencimento:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Status<select value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ABERTA</option><option>PAGA</option><option>VENCIDA</option><option>EM_CONTESTACAO</option></select></label>
              <label className="text-sm md:col-span-2">Critério<input value={editForm.criterioRateio} onChange={e=>setEditForm({...editForm, criterioRateio:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
            </div>
            <div className="flex gap-2"><button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button><button className="flex-1 bg-emerald-700 text-white rounded-2xl py-2 font-semibold">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
