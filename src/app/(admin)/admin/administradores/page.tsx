"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

export default function AdministradoresPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ nome:"", email:"", senha:"", papel:"ADMINISTRADOR", telefone:"", documento:"" });
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});

  async function load(){
    const res = await fetch("/api/admin/administradores");
    if(res.ok) setLista(await res.json());
    else setLista(mock());
  }
  useEffect(()=>{ load(); },[]);

  async function criar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/administradores", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(form) });
    if(res.ok){ setForm({ nome:"", email:"", senha:"", papel:"ADMINISTRADOR", telefone:"", documento:"" }); load(); }
    else {
      setLista([{ id: Math.random().toString(36).slice(2), ...form, ativo:true, createdAt: new Date().toISOString() }, ...lista]);
      setForm({ nome:"", email:"", senha:"", papel:"ADMINISTRADOR", telefone:"", documento:"" });
    }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ nome: item.nome, email: item.email, telefone: item.telefone||"", documento: item.documento||"", papel: item.papel, ativo: item.ativo });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/administradores", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: edit.id, ...editForm }) });
    if(res.ok) load();
    else setLista(lista.map(x=> x.id===edit.id? {...x, ...editForm}:x));
    setEdit(null);
  }
  async function toggleAtivo(item:any){
    await fetch("/api/admin/administradores", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: item.id, ativo: !item.ativo }) });
    setLista(lista.map(x=> x.id===item.id? {...x, ativo:!x.ativo}:x));
  }
  async function remover(id:string){
    if(!confirm("Remover?")) return;
    await fetch(`/api/admin/administradores?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Administradores de Imóveis & Proprietários</h1>
        <a href="/admin/login" className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1">Login Master</a>
      </div>
      <div className="text-xs text-zinc-500">Grade completa: Master cadastra, edita todos os campos, vincula unidades e ativa/desativa.</div>

      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Novo cadastro (MASTER)</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Nome<input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">E-mail<input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Senha<input type="password" value={form.senha} onChange={e=>setForm({...form, senha:e.target.value})} placeholder="mín 8" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Papel<select value={form.papel} onChange={e=>setForm({...form, papel:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="ADMINISTRADOR">ADMINISTRADOR DE IMÓVEL</option><option value="PROPRIETARIO">PROPRIETÁRIO</option></select></label>
          <label className="text-sm">Telefone<input value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">CPF/CNPJ<input value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-3 bg-zinc-900 text-white rounded-2xl py-2.5 font-semibold">Cadastrar</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa — clique em Alterar</h3><Badge variant="default">{lista.length} registros</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left py-2">Nome</th><th className="text-left">E-mail</th><th>Documento</th><th>Telefone</th><th>Papel</th><th>Criado</th><th>Ativo</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map(item=>(
                <tr key={item.id} className="border-t">
                  <td className="py-2 font-medium">{item.nome}</td>
                  <td className="text-xs">{item.email}</td>
                  <td className="text-xs text-center">{item.documento || "-"}</td>
                  <td className="text-xs text-center">{item.telefone || "-"}</td>
                  <td className="text-center"><Badge variant={item.papel==="MASTER"?"brand":item.papel==="PROPRIETARIO"?"success":"default"}>{item.papel}</Badge></td>
                  <td className="text-xs text-center">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="text-center"><button onClick={()=>toggleAtivo(item)} className={`text-xs px-2 py-1 rounded-full ${item.ativo?"bg-emerald-100 text-emerald-700":"bg-zinc-100"}`}>{item.ativo?"Ativo":"Inativo"}</button></td>
                  <td className="text-right space-x-2">
                    <button onClick={()=>iniciarEdicao(item)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1 hover:bg-zinc-800">Alterar</button>
                    <button onClick={()=>remover(item.id)} className="text-xs text-rose-600 hover:underline">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista.length===0 && <div className="text-sm text-zinc-500 text-center py-6">Nenhum cadastro. Faça login como MASTER para listar do banco.</div>}
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-bold">Alterar cadastro — {edit.nome}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Nome<input value={editForm.nome} onChange={e=>setEditForm({...editForm, nome:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">E-mail<input value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Telefone<input value={editForm.telefone} onChange={e=>setEditForm({...editForm, telefone:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">CPF/CNPJ<input value={editForm.documento} onChange={e=>setEditForm({...editForm, documento:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Papel<select value={editForm.papel} onChange={e=>setEditForm({...editForm, papel:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="ADMINISTRADOR">ADMINISTRADOR</option><option value="PROPRIETARIO">PROPRIETARIO</option><option value="MASTER">MASTER</option></select></label>
              <label className="text-sm flex items-center gap-2 mt-6"><input type="checkbox" checked={editForm.ativo} onChange={e=>setEditForm({...editForm, ativo:e.target.checked})} /> Ativo</label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button>
              <button className="flex-1 bg-zinc-900 text-white rounded-2xl py-2 font-semibold">Salvar alterações</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function mock(){
  return [
    { id:"m1", nome:"Master Elmesson", email:"master@elmesson.com.br", papel:"MASTER", telefone:"(11) 99999-0001", documento:"11111111111", ativo:true, createdAt: new Date().toISOString() },
    { id:"a1", nome:"Admin Imóveis Centro", email:"admin.centro@elmesson.com.br", papel:"ADMINISTRADOR", telefone:"(11) 98888-0000", documento:"22222222222", ativo:true, createdAt: new Date().toISOString() },
    { id:"p1", nome:"João Proprietário", email:"joao.prop@elmesson.com.br", papel:"PROPRIETARIO", telefone:"(11) 97777-0000", documento:"33333333333", ativo:true, createdAt: new Date().toISOString() },
  ];
}
