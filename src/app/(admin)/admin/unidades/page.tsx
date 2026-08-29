"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

export default function UnidadesPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [admins,setAdmins]=useState<any[]>([]);
  const [form,setForm]=useState({ identificacao:"", bloco:"", numero:"", fracaoIdeal:"1.0", administradorId:"" });

  async function load(){
    const r = await fetch("/api/admin/unidades");
    if(r.ok) setLista(await r.json());
    else setLista([]);
    const a = await fetch("/api/admin/administradores").then(res=>res.json()).catch(()=>[]);
    if(Array.isArray(a)) setAdmins(a.filter((x:any)=> ["ADMINISTRADOR","PROPRIETARIO"].includes(x.papel)));
  }
  useEffect(()=>{ load(); },[]);
  async function criar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/unidades", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(form) });
    if(res.ok){ setForm({ identificacao:"", bloco:"", numero:"", fracaoIdeal:"1.0", administradorId:"" }); load(); }
    else { const j=await res.json().catch(()=>({})); alert(j.error||"Erro"); }
  }
  async function remover(id:string){
    if(!confirm("Remover unidade?")) return;
    await fetch(`/api/admin/unidades?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Master — Unidades</h1>
      <p className="text-xs text-zinc-500">Cadastre Unidade ID (código do proprietário/administrador). Vincule a um ADMINISTRADOR ou PROPRIETÁRIO. Este ID será usado em Gestão → Inquilinos/Leituras.</p>

      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Nova unidade</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Identificação (Unidade ID)<input value={form.identificacao} onChange={e=>setForm({...form, identificacao:e.target.value})} required placeholder="ex: BL-A-101" className="mt-1 w-full border rounded-xl px-3 py-2 font-mono" /></label>
          <label className="text-sm">Bloco<input value={form.bloco} onChange={e=>setForm({...form, bloco:e.target.value})} placeholder="ex: A" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Número<input value={form.numero} onChange={e=>setForm({...form, numero:e.target.value})} required placeholder="ex: 101" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Fração ideal<input type="number" step="0.01" value={form.fracaoIdeal} onChange={e=>setForm({...form, fracaoIdeal:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm md:col-span-2">Proprietário/Administrador (vincular)
            <select value={form.administradorId} onChange={e=>setForm({...form, administradorId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">
              <option value="">Selecione (opcional)</option>
              {admins.map((a:any)=><option key={a.id} value={a.id}>{a.nome} • {a.papel} • {a.email}</option>)}
            </select>
          </label>
          <button className="md:col-span-3 bg-zinc-900 text-white rounded-2xl py-2.5 font-semibold">Cadastrar unidade</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Unidades cadastradas</h3><Badge variant="default">{lista.length} unidades</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left py-2">Unidade ID</th><th>Bloco</th><th>Número</th><th>Fração</th><th>Proprietário</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map((u:any)=>(
                <tr key={u.id} className="border-t">
                  <td className="font-mono font-bold">{u.identificacao}</td>
                  <td className="text-center">{u.bloco||"-"}</td>
                  <td className="text-center">{u.numero}</td>
                  <td className="text-center">{u.fracaoIdeal||1}</td>
                  <td className="text-xs">{u.administradores?.[0]?.administrador?.nome || <span className="text-zinc-400">— sem vínculo</span>}</td>
                  <td className="text-right"><button onClick={()=>remover(u.id)} className="text-xs text-rose-600">Remover</button></td>
                </tr>
              ))}
              {lista.length===0 && <tr><td colSpan={6} className="text-center py-6 text-zinc-500">Nenhuma unidade — cadastre acima para usar como Unidade ID.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
