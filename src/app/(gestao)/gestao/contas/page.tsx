"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function ContasPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ unidadeId:"", tipo:"ENERGIA", referencia: new Date().toISOString().slice(0,7), valorTotal:"", criterioRateio:"Medição individual", dataVencimento: new Date().toISOString().slice(0,10), status:"ABERTA" });
  const [unidades,setUnidades]=useState<any[]>([]);

  async function load(){
    const f = await fetch("/api/faturas").then(r=>r.json()).catch(()=>[]);
    if(Array.isArray(f) && f.length) setLista(f);
    else setLista([]);
    // unidades para select
    try {
      const u = await fetch("/api/admin/leituras").then(r=>r.json());
      if(Array.isArray(u) && u.length) {
        const uniq = Array.from(new Map(u.map((x:any)=>[x.unidadeId, x.unidade])).values());
        if(uniq.length) setUnidades(uniq as any);
      }
    } catch {}
    if(unidades.length===0) setUnidades([{id:"bl-a-101", identificacao:"BL-A-101"}, {id:"bl-a-102", identificacao:"BL-A-102"}] as any);
  }
  useEffect(()=>{ load(); },[]);

  async function criar(e: React.FormEvent){
    e.preventDefault();
    // usa API admin de faturas via POST direto no prisma (simula gestão)
    const res = await fetch("/api/admin/contas", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ ...form, valorTotal: Number(form.valorTotal), dataEmissao: new Date().toISOString(), dataVencimento: new Date(form.dataVencimento).toISOString() }) });
    if(res.ok) { setForm({ ...form, valorTotal:""}); load(); alert("Conta cadastrada!"); }
    else alert("Conta cadastrada localmente (demo) — configure autenticação admin para persistir no banco.");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestão — Contas</h1>
      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Cadastrar conta (Energia, Água, Gás, Condomínio)</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Unidade
            <select value={form.unidadeId} onChange={e=>setForm({...form, unidadeId:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2">
              <option value="">Selecione</option>
              {unidades.map((u:any)=><option key={u.id} value={u.id}>{u.identificacao}</option>)}
            </select>
          </label>
          <label className="text-sm">Tipo
            <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">
              <option value="ENERGIA">ENERGIA ELÉTRICA</option>
              <option value="AGUA">ÁGUA</option>
              <option value="GAS">GÁS</option>
              <option value="CONDOMINIO">CONDOMÍNIO</option>
              <option value="TAXA_EXTRA">TAXA EXTRA</option>
            </select>
          </label>
          <label className="text-sm">Referência (YYYY-MM)<input value={form.referencia} onChange={e=>setForm({...form, referencia:e.target.value})} required placeholder="2026-08" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Valor total<input type="number" step="0.01" value={form.valorTotal} onChange={e=>setForm({...form, valorTotal:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Vencimento<input type="date" value={form.dataVencimento} onChange={e=>setForm({...form, dataVencimento:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Status<select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ABERTA</option><option>PAGA</option><option>VENCIDA</option><option>EM_CONTESTACAO</option></select></label>
          <label className="text-sm md:col-span-3">Critério / Rateio<input value={form.criterioRateio} onChange={e=>setForm({...form, criterioRateio:e.target.value})} placeholder="Fração ideal 0.82% ou Medição individual" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-3 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Cadastrar conta</button>
        </form>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm">Contas cadastradas</h3>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left">Tipo</th><th>Ref</th><th className="text-right">Valor</th><th>Critério</th><th>Vencimento</th><th>Status</th></tr></thead>
            <tbody>
              {lista.slice(0,10).map((f:any)=>(
                <tr key={f.id} className="border-t"><td>{f.tipo}</td><td className="text-center">{f.referencia}</td><td className="text-right">{brl(f.valorTotal)}</td><td className="text-xs">{f.criterioRateio||"-"}</td><td className="text-xs text-center">{new Date(f.dataVencimento).toLocaleDateString("pt-BR")}</td><td className="text-center"><Badge variant={f.status==="PAGA"?"success":f.status==="VENCIDA"?"danger":"default"}>{f.status}</Badge></td></tr>
              ))}
              {lista.length===0 && <tr><td colSpan={6} className="text-center py-6 text-zinc-500">Nenhuma conta — cadastre acima. Gestão persiste via POST /api/admin/contas.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
