"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
export default function PixConfigPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ tipoChave:"CPF", chave:"", banco:"", agencia:"", conta:"", titularNome:"", titularCidade:"SAO PAULO" });
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});

  async function load(){
    const r = await fetch("/api/gestao/configuracao/pix").then(res=>res.json()).catch(()=>[]);
    if(Array.isArray(r)) setLista(r);
  }
  useEffect(()=>{ load(); },[]);
  async function criar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/gestao/configuracao/pix", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(form) });
    if(res.ok){ setForm({ tipoChave:"CPF", chave:"", banco:"", agencia:"", conta:"", titularNome:"", titularCidade:"SAO PAULO" }); load(); }
    else { const j=await res.json().catch(()=>({})); alert(j.error||"Erro — use chave real BCB (CPF/CNPJ/Email/Telefone/UUID)"); }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ titularNome: item.titularNome, titularCidade: item.titularCidade, banco: item.banco||"", agencia: item.agencia||"", conta: item.conta||"", ativo: item.ativo });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/gestao/configuracao/pix", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: edit.id, ...editForm }) });
    if(res.ok) load();
    setEdit(null);
  }
  async function remover(id:string){
    if(!confirm("Remover chave PIX? Faturas futuras não terão PIX até nova configuração.")) return;
    await fetch(`/api/gestao/configuracao/pix?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">Configuração</h1>
        <a href="/gestao/configuracao" className="bg-white border rounded-full px-3 py-1 text-xs">Leituristas</a>
        <span className="bg-emerald-700 text-white rounded-full px-3 py-1 text-xs">Pix BCB</span>
      </div>
      <p className="text-xs text-zinc-500">Proprietário/Administrador informa <b>dados reais BCB</b> para cobrança via Pix (sem dados fictícios). Chave validada por tipo. QR EMV gerado com valor/txid da fatura.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs">
        <b>BCB:</b> Tipos: <b>CPF</b> (11 dígitos), <b>CNPJ</b> (14), <b>EMAIL</b>, <b>TELEFONE</b> (+55DDD), <b>ALEATORIA</b> (UUID). Em produção, use chave cadastrada no seu banco. O QR será gerado no padrão EMV com valor/txid da fatura.
      </div>

      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Nova chave Pix (real)</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Tipo chave<select value={form.tipoChave} onChange={e=>setForm({...form, tipoChave:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="CPF">CPF</option><option value="CNPJ">CNPJ</option><option value="EMAIL">EMAIL</option><option value="TELEFONE">TELEFONE</option><option value="ALEATORIA">ALEATÓRIA (UUID)</option></select></label>
          <label className="text-sm md:col-span-2">Chave Pix<input value={form.chave} onChange={e=>setForm({...form, chave:e.target.value})} required placeholder={form.tipoChave==="CPF"?"00000000000":form.tipoChave==="TELEFONE"?"+5511999999999":form.tipoChave==="EMAIL"?"seu@email.com":"UUID"} className="mt-1 w-full border rounded-xl px-3 py-2 font-mono text-sm" /></label>
          <label className="text-sm">Banco<input value={form.banco} onChange={e=>setForm({...form, banco:e.target.value})} placeholder="ex: 001" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Agência<input value={form.agencia} onChange={e=>setForm({...form, agencia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Conta<input value={form.conta} onChange={e=>setForm({...form, conta:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Titular (25 chars)<input value={form.titularNome} onChange={e=>setForm({...form, titularNome:e.target.value})} required placeholder="ELMESSON CONDOMINIO" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Cidade (15 chars)<input value={form.titularCidade} onChange={e=>setForm({...form, titularCidade:e.target.value})} placeholder="SAO PAULO" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-3 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Salvar chave Pix</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Chaves cadastradas</h3><Badge variant="default">{lista.length} ativas</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th>Tipo</th><th>Chave</th><th>Titular</th><th>Cidade</th><th>Banco</th><th>Ativo</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map(item=>(
                <tr key={item.id} className="border-t">
                  <td className="text-center"><Badge variant="default">{item.tipoChave}</Badge></td>
                  <td className="font-mono text-xs">{item.chave}</td>
                  <td className="text-xs">{item.titularNome}</td>
                  <td className="text-xs">{item.titularCidade}</td>
                  <td className="text-xs">{item.banco||"-"}</td>
                  <td className="text-center"><span className={`text-xs px-2 py-1 rounded-full ${item.ativo?"bg-emerald-100 text-emerald-700":"bg-zinc-100"}`}>{item.ativo?"Ativo":"Inativo"}</span></td>
                  <td className="text-right space-x-1">
                    <button onClick={()=>iniciarEdicao(item)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1">Alterar</button>
                    <button onClick={()=>remover(item.id)} className="text-xs text-rose-600">Remover</button>
                  </td>
                </tr>
              ))}
              {lista.length===0 && <tr><td colSpan={7} className="text-center py-6 text-zinc-500">Nenhuma chave — cadastre dados reais BCB para gerar QR EMV nas faturas.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-bold">Alterar Pix — {edit.chave}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Titular<input value={editForm.titularNome} onChange={e=>setEditForm({...editForm, titularNome:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Cidade<input value={editForm.titularCidade} onChange={e=>setEditForm({...editForm, titularCidade:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Banco<input value={editForm.banco} onChange={e=>setEditForm({...editForm, banco:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm flex items-center gap-2 mt-6"><input type="checkbox" checked={editForm.ativo} onChange={e=>setEditForm({...editForm, ativo:e.target.checked})} /> Ativo</label>
            </div>
            <div className="flex gap-2"><button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button><button className="flex-1 bg-emerald-700 text-white rounded-2xl py-2 font-semibold">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
