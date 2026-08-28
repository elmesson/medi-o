"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

function genCodigo(){ return `MED-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }

export default function InquilinosPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ nome:"", email:"", cpf:"", telefone:"", endereco:"", medidor:"", codigoMedidor: genCodigo(), unidadeId:"", senha:"", leituraInicial:"" });
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});

  async function load(){
    const res = await fetch("/api/gestao/inquilinos");
    if(res.ok) setLista(await res.json());
    else setLista(mock());
  }
  useEffect(()=>{ load(); },[]);

  async function criar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/gestao/inquilinos", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ ...form, leituraInicial: form.leituraInicial? Number(form.leituraInicial): undefined }) });
    if(res.ok){ setForm({ nome:"", email:"", cpf:"", telefone:"", endereco:"", medidor:"", codigoMedidor: genCodigo(), unidadeId:"", senha:"", leituraInicial:"" }); load(); }
    else {
      setLista([{ id: Math.random().toString(36).slice(2), ...form, ativo:true, cpfCnpj: form.cpf, createdAt: new Date().toISOString() }, ...lista]);
      setForm({ nome:"", email:"", cpf:"", telefone:"", endereco:"", medidor:"", codigoMedidor: genCodigo(), unidadeId:"", senha:"", leituraInicial:"" });
    }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ nome: item.nome, email: item.email, cpf: item.cpfCnpj?.replace("enc:","")||"", telefone: item.telefone||"", endereco: item.endereco||"", medidor: item.medidor||"", codigoMedidor: item.codigoMedidor||"", ativo: item.ativo, novaSenha:"", leituraInicial:"", unidadeId: item.unidades?.[0]?.unidadeId || "" });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/gestao/inquilinos", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: edit.id, ...editForm }) });
    if(res.ok) load(); else setLista(lista.map(x=> x.id===edit.id? {...x, ...editForm}:x));
    setEdit(null);
  }
  async function remover(id:string){
    if(!confirm("Remover inquilino?")) return;
    await fetch(`/api/gestao/inquilinos?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestão — Inquilinos</h1>
      <p className="text-xs text-zinc-500">Grade completa: nome, CPF, medidor, endereço, telefone, e-mail, código do medidor (gerador).</p>

      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Novo inquilino</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Nome completo<input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">CPF<input value={form.cpf} onChange={e=>setForm({...form, cpf:e.target.value})} required placeholder="000.000.000-00" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">E-mail<input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Telefone<input value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Endereço<input value={form.endereco} onChange={e=>setForm({...form, endereco:e.target.value})} placeholder="Rua, nº, bloco" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Medidor (físico)<input value={form.medidor} onChange={e=>setForm({...form, medidor:e.target.value})} placeholder="nº hidrômetro" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Código medidor
            <div className="flex gap-1 mt-1">
              <input value={form.codigoMedidor} onChange={e=>setForm({...form, codigoMedidor:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" />
              <button type="button" onClick={()=>setForm({...form, codigoMedidor: genCodigo()})} className="bg-zinc-900 text-white rounded-xl px-3 text-xs">Gerar</button>
            </div>
          </label>
          <label className="text-sm">Unidade ID (opcional)<input value={form.unidadeId} onChange={e=>setForm({...form, unidadeId:e.target.value})} placeholder="bl-a-101" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Senha inicial<input type="password" value={form.senha} onChange={e=>setForm({...form, senha:e.target.value})} placeholder="Inquilino123!" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Medição inicial (para faturar)<input type="number" value={form.leituraInicial} onChange={e=>setForm({...form, leituraInicial:e.target.value})} placeholder="ex: 1250" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-3 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Cadastrar inquilino</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa</h3><Badge variant="default">{lista.length} inquilinos</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left py-2">Nome</th><th>CPF</th><th>Medidor</th><th>Código</th><th>Endereço</th><th>Telefone</th><th>E-mail</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map(item=>(
                <tr key={item.id} className="border-t">
                  <td className="py-2 font-medium">{item.nome}<div className="text-[10px] text-zinc-500">{item.ativo===false?"Inativo":"Ativo"}</div></td>
                  <td className="text-xs">{item.cpfCnpj?.replace("enc:","")|| "-"}</td>
                  <td className="text-xs text-center">{item.medidor||"-"}</td>
                  <td className="text-xs font-mono text-center">{item.codigoMedidor||"-"}</td>
                  <td className="text-xs max-w-[150px] truncate">{item.endereco||"-"}</td>
                  <td className="text-xs">{item.telefone||"-"}</td>
                  <td className="text-xs">{item.email}</td>
                  <td className="text-right space-x-1">
                    <button onClick={()=>iniciarEdicao(item)} className="text-xs bg-emerald-700 text-white rounded-full px-3 py-1">Alterar</button>
                    <button onClick={()=>remover(item.id)} className="text-xs text-rose-600">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-2xl space-y-3 max-h-[90vh] overflow-auto">
            <h3 className="font-bold">Alterar inquilino — {edit.nome}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Nome<input value={editForm.nome} onChange={e=>setEditForm({...editForm, nome:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">CPF<input value={editForm.cpf} onChange={e=>setEditForm({...editForm, cpf:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">E-mail<input value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Telefone<input value={editForm.telefone} onChange={e=>setEditForm({...editForm, telefone:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm md:col-span-2">Endereço<input value={editForm.endereco} onChange={e=>setEditForm({...editForm, endereco:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Medidor<input value={editForm.medidor} onChange={e=>setEditForm({...editForm, medidor:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Código medidor
                <div className="flex gap-1 mt-1">
                  <input value={editForm.codigoMedidor} onChange={e=>setEditForm({...editForm, codigoMedidor:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" />
                  <button type="button" onClick={()=>setEditForm({...editForm, codigoMedidor: genCodigo()})} className="bg-zinc-900 text-white rounded-xl px-3 text-xs">Gerar</button>
                </div>
              </label>
              <label className="text-sm flex items-center gap-2 mt-6"><input type="checkbox" checked={editForm.ativo} onChange={e=>setEditForm({...editForm, ativo:e.target.checked})} /> Ativo</label>
              <label className="text-sm">Unidade ID<input value={editForm.unidadeId} onChange={e=>setEditForm({...editForm, unidadeId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Nova senha<input type="password" value={editForm.novaSenha} onChange={e=>setEditForm({...editForm, novaSenha:e.target.value})} placeholder="deixe em branco para manter" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Medição inicial (ao alterar)<input type="number" value={editForm.leituraInicial} onChange={e=>setEditForm({...editForm, leituraInicial:e.target.value})} placeholder="atualiza faturamento" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button>
              <button className="flex-1 bg-emerald-700 text-white rounded-2xl py-2 font-semibold">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function mock(){
  return [
    { id:"1", nome:"Maria Silva", email:"maria@ex.com", cpfCnpj:"enc:11111111111", telefone:"(11) 99999-0000", endereco:"Rua A, 101 - Bl A", medidor:"HID-001", codigoMedidor:"MED-ABCD-1234", ativo:true, createdAt: new Date().toISOString() },
  ];
}
