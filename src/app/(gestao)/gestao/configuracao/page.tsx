"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
export default function ConfiguracaoPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ nome:"", email:"", senha:"", telefone:"", regiao:"", matricula:"" });
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});

  async function load(){
    const r = await fetch("/api/gestao/configuracao/leituristas").then(res=>res.json()).catch(()=>[]);
    if(Array.isArray(r)) setLista(r); else setLista([]);
  }
  useEffect(()=>{ load(); },[]);
  async function criar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/gestao/configuracao/leituristas", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(form) });
    if(res.ok){ setForm({ nome:"", email:"", senha:"", telefone:"", regiao:"", matricula:"" }); load(); }
    else { const j=await res.json().catch(()=>({})); alert(j.error||"Erro"); }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ nome: item.nome, telefone: item.telefone||"", regiao: item.regiao||"", ativo: item.ativo, novaSenha:"" });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/gestao/configuracao/leituristas", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: edit.id, ...editForm }) });
    if(res.ok) load();
    setEdit(null);
  }
  async function remover(id:string){
    if(!confirm("Remover leiturista?")) return;
    await fetch(`/api/gestao/configuracao/leituristas?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">Configuração</h1>
        <span className="bg-zinc-900 text-white rounded-full px-3 py-1 text-xs">Leituristas</span>
        <a href="/gestao/configuracao/pix" className="bg-white border rounded-full px-3 py-1 text-xs">Pix BCB</a>
      </div>
      <p className="text-xs text-zinc-500">Crie logins exclusivos para leiturista (acesso somente à tela Leitura, com rastreabilidade e scanner QR via câmera).</p>

      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Novo leiturista</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Nome<input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">E-mail (login)<input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Senha<input type="password" value={form.senha} onChange={e=>setForm({...form, senha:e.target.value})} required placeholder="mín 6" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Telefone<input value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Região<input value={form.regiao} onChange={e=>setForm({...form, regiao:e.target.value})} placeholder="ex: Bloco A" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Matrícula<input value={form.matricula} onChange={e=>setForm({...form, matricula:e.target.value})} placeholder="ex: LEIT-001" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-3 bg-zinc-900 text-white rounded-2xl py-2.5 font-semibold">Cadastrar leiturista</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa — Leituristas</h3><Badge variant="default">{lista.length} cadastrados</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left py-2">Nome</th><th>Login</th><th>Telefone</th><th>Região</th><th>Matrícula</th><th>Ativo</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map(item=>(
                <tr key={item.id} className="border-t">
                  <td className="py-2 font-medium">{item.nome}</td>
                  <td className="text-xs">{item.email}</td>
                  <td className="text-xs">{item.telefone||"-"}</td>
                  <td className="text-xs">{item.regiao||"-"}</td>
                  <td className="text-xs font-mono">{item.matricula||"-"}</td>
                  <td className="text-center"><span className={`text-xs px-2 py-1 rounded-full ${item.ativo?"bg-emerald-100 text-emerald-700":"bg-zinc-100"}`}>{item.ativo?"Ativo":"Inativo"}</span></td>
                  <td className="text-right space-x-1">
                    <button onClick={()=>iniciarEdicao(item)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1">Alterar</button>
                    <button onClick={()=>remover(item.id)} className="text-xs text-rose-600">Remover</button>
                  </td>
                </tr>
              ))}
              {lista.length===0 && <tr><td colSpan={7} className="text-center py-6 text-zinc-500">Nenhum leiturista — cadastre acima. Login único: leiturista → /gestao/leituras</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-bold">Alterar leiturista — {edit.nome}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Nome<input value={editForm.nome} onChange={e=>setEditForm({...editForm, nome:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Telefone<input value={editForm.telefone} onChange={e=>setEditForm({...editForm, telefone:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Região<input value={editForm.regiao} onChange={e=>setEditForm({...editForm, regiao:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm flex items-center gap-2 mt-6"><input type="checkbox" checked={editForm.ativo} onChange={e=>setEditForm({...editForm, ativo:e.target.checked})} /> Ativo</label>
              <label className="text-sm md:col-span-2">Nova senha<input type="password" value={editForm.novaSenha} onChange={e=>setEditForm({...editForm, novaSenha:e.target.value})} placeholder="deixe em branco para manter" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
            </div>
            <div className="flex gap-2"><button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button><button className="flex-1 bg-zinc-900 text-white rounded-2xl py-2 font-semibold">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
