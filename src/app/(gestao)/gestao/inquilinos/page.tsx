"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

function genCodigo(){ return `MED-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }

export default function InquilinosPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ nome:"", email:"", cpf:"", telefone:"", endereco:"", medidorEnergia:"", codigoMedidorEnergia: genCodigo(), leituraInicialEnergia:"", tipoCobrancaEnergia:"COMPARTILHADA", porcentagemEnergia:"", medidorAgua:"", codigoMedidorAgua: genCodigo(), leituraInicialAgua:"", tipoCobrancaAgua:"COMPARTILHADA", porcentagemAgua:"", medidorGas:"", codigoMedidorGas: genCodigo(), leituraInicialGas:"", tipoCobrancaGas:"COMPARTILHADA", porcentagemGas:"", unidadeId:"", senha:"" });
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
    const payload:any = { ...form };
    if(form.leituraInicialEnergia) payload.leituraInicialEnergia = Number(form.leituraInicialEnergia);
    if(form.leituraInicialAgua) payload.leituraInicialAgua = Number(form.leituraInicialAgua);
    if(form.leituraInicialGas) payload.leituraInicialGas = Number(form.leituraInicialGas);
    if(form.porcentagemEnergia) payload.porcentagemEnergia = Number(form.porcentagemEnergia);
    if(form.porcentagemAgua) payload.porcentagemAgua = Number(form.porcentagemAgua);
    if(form.porcentagemGas) payload.porcentagemGas = Number(form.porcentagemGas);
    const res = await fetch("/api/gestao/inquilinos", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(payload) });
    if(res.ok){ setForm({ nome:"", email:"", cpf:"", telefone:"", endereco:"", medidorEnergia:"", codigoMedidorEnergia: genCodigo(), leituraInicialEnergia:"", tipoCobrancaEnergia:"COMPARTILHADA", porcentagemEnergia:"", medidorAgua:"", codigoMedidorAgua: genCodigo(), leituraInicialAgua:"", tipoCobrancaAgua:"COMPARTILHADA", porcentagemAgua:"", medidorGas:"", codigoMedidorGas: genCodigo(), leituraInicialGas:"", tipoCobrancaGas:"COMPARTILHADA", porcentagemGas:"", unidadeId:"", senha:"" }); load(); }
    else {
      setLista([{ id: Math.random().toString(36).slice(2), ...form, ativo:true, cpfCnpj: form.cpf, createdAt: new Date().toISOString() }, ...lista]);
      setForm({ nome:"", email:"", cpf:"", telefone:"", endereco:"", medidorEnergia:"", codigoMedidorEnergia: genCodigo(), leituraInicialEnergia:"", tipoCobrancaEnergia:"COMPARTILHADA", porcentagemEnergia:"", medidorAgua:"", codigoMedidorAgua: genCodigo(), leituraInicialAgua:"", tipoCobrancaAgua:"COMPARTILHADA", porcentagemAgua:"", medidorGas:"", codigoMedidorGas: genCodigo(), leituraInicialGas:"", tipoCobrancaGas:"COMPARTILHADA", porcentagemGas:"", unidadeId:"", senha:"" });
    }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({
      nome: item.nome, email: item.email, cpf: item.cpfCnpj?.replace("enc:","")||"", telefone: item.telefone||"", endereco: item.endereco||"",
      medidorEnergia: item.medidorEnergia|| item.medidor||"", codigoMedidorEnergia: item.codigoMedidorEnergia|| item.codigoMedidor||"", leituraInicialEnergia:"", tipoCobrancaEnergia: item.tipoCobrancaEnergia||"COMPARTILHADA", porcentagemEnergia: item.porcentagemEnergia||"",
      medidorAgua: item.medidorAgua||"", codigoMedidorAgua: item.codigoMedidorAgua||"", leituraInicialAgua:"", tipoCobrancaAgua: item.tipoCobrancaAgua||"COMPARTILHADA", porcentagemAgua: item.porcentagemAgua||"",
      medidorGas: item.medidorGas||"", codigoMedidorGas: item.codigoMedidorGas||"", leituraInicialGas:"", tipoCobrancaGas: item.tipoCobrancaGas||"COMPARTILHADA", porcentagemGas: item.porcentagemGas||"",
      ativo: item.ativo, novaSenha:"", unidadeId: item.unidades?.[0]?.unidadeId || ""
    });
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
      <p className="text-xs text-zinc-500">Grade completa: nome, CPF, medidores (Energia Elétrica, Água, Gás) com código único + QR exclusivo por medidor.</p>

      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Novo inquilino</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Nome completo<input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">CPF<input value={form.cpf} onChange={e=>setForm({...form, cpf:e.target.value})} required placeholder="000.000.000-00" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">E-mail<input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Telefone<input value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm md:col-span-2">Endereço<input value={form.endereco} onChange={e=>setForm({...form, endereco:e.target.value})} placeholder="Rua, nº, bloco" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Unidade ID<input value={form.unidadeId} onChange={e=>setForm({...form, unidadeId:e.target.value})} placeholder="bl-a-101" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>

          <div className="md:col-span-3 border rounded-2xl p-3 space-y-2 bg-zinc-50">
            <div className="text-xs font-bold">Medidor Energia Elétrica</div>
            <div className="grid md:grid-cols-3 gap-2">
              <label className="text-sm">Nº medidor<input value={form.medidorEnergia} onChange={e=>setForm({...form, medidorEnergia:e.target.value})} placeholder="ex: HID-ENERGIA-001" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Código único
                <div className="flex gap-1 mt-1">
                  <input value={form.codigoMedidorEnergia} onChange={e=>setForm({...form, codigoMedidorEnergia:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" />
                  <button type="button" onClick={()=>setForm({...form, codigoMedidorEnergia: genCodigo()})} className="bg-zinc-900 text-white rounded-xl px-3 text-xs">Gerar</button>
                </div>
              </label>
              <label className="text-sm">Medição inicial<input type="number" value={form.leituraInicialEnergia} onChange={e=>setForm({...form, leituraInicialEnergia:e.target.value})} placeholder="ex: 1250" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <label className="text-sm">Tipo de cobrança<select value={form.tipoCobrancaEnergia} onChange={e=>setForm({...form, tipoCobrancaEnergia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="COMPARTILHADA">Compartilhada (igual)</option><option value="RATIO">Ratio (fração ideal)</option><option value="PORCENTAGEM">Porcentagem (%)</option></select></label>
              {form.tipoCobrancaEnergia==="PORCENTAGEM" && <label className="text-sm">%<input type="number" step="0.1" value={form.porcentagemEnergia} onChange={e=>setForm({...form, porcentagemEnergia:e.target.value})} placeholder="ex: 12.5" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}
            </div>
          </div>

          <div className="md:col-span-3 border rounded-2xl p-3 space-y-2 bg-blue-50">
            <div className="text-xs font-bold">Medidor Água</div>
            <div className="grid md:grid-cols-3 gap-2">
              <label className="text-sm">Nº medidor<input value={form.medidorAgua} onChange={e=>setForm({...form, medidorAgua:e.target.value})} placeholder="ex: HID-AGUA-001" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Código único
                <div className="flex gap-1 mt-1">
                  <input value={form.codigoMedidorAgua} onChange={e=>setForm({...form, codigoMedidorAgua:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" />
                  <button type="button" onClick={()=>setForm({...form, codigoMedidorAgua: genCodigo()})} className="bg-blue-600 text-white rounded-xl px-3 text-xs">Gerar</button>
                </div>
              </label>
              <label className="text-sm">Medição inicial<input type="number" value={form.leituraInicialAgua} onChange={e=>setForm({...form, leituraInicialAgua:e.target.value})} placeholder="ex: 80" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <label className="text-sm">Tipo de cobrança<select value={form.tipoCobrancaAgua} onChange={e=>setForm({...form, tipoCobrancaAgua:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="COMPARTILHADA">Compartilhada</option><option value="RATIO">Ratio</option><option value="PORCENTAGEM">Porcentagem</option></select></label>
              {form.tipoCobrancaAgua==="PORCENTAGEM" && <label className="text-sm">%<input type="number" step="0.1" value={form.porcentagemAgua} onChange={e=>setForm({...form, porcentagemAgua:e.target.value})} placeholder="ex: 12.5" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}
            </div>
          </div>

          <div className="md:col-span-3 border rounded-2xl p-3 space-y-2 bg-orange-50">
            <div className="text-xs font-bold">Medidor Gás</div>
            <div className="grid md:grid-cols-3 gap-2">
              <label className="text-sm">Nº medidor<input value={form.medidorGas} onChange={e=>setForm({...form, medidorGas:e.target.value})} placeholder="ex: HID-GAS-001" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Código único
                <div className="flex gap-1 mt-1">
                  <input value={form.codigoMedidorGas} onChange={e=>setForm({...form, codigoMedidorGas:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" />
                  <button type="button" onClick={()=>setForm({...form, codigoMedidorGas: genCodigo()})} className="bg-orange-600 text-white rounded-xl px-3 text-xs">Gerar</button>
                </div>
              </label>
              <label className="text-sm">Medição inicial<input type="number" value={form.leituraInicialGas} onChange={e=>setForm({...form, leituraInicialGas:e.target.value})} placeholder="ex: 40" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <label className="text-sm">Tipo de cobrança<select value={form.tipoCobrancaGas} onChange={e=>setForm({...form, tipoCobrancaGas:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="COMPARTILHADA">Compartilhada</option><option value="RATIO">Ratio</option><option value="PORCENTAGEM">Porcentagem</option></select></label>
              {form.tipoCobrancaGas==="PORCENTAGEM" && <label className="text-sm">%<input type="number" step="0.1" value={form.porcentagemGas} onChange={e=>setForm({...form, porcentagemGas:e.target.value})} placeholder="ex: 12.5" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}
            </div>
          </div>

          <label className="text-sm md:col-span-2">Senha inicial<input type="password" value={form.senha} onChange={e=>setForm({...form, senha:e.target.value})} placeholder="Inquilino123!" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <div className="md:col-span-1 flex items-end"><button className="w-full bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Cadastrar inquilino</button></div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa</h3><Badge variant="default">{lista.length} inquilinos</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left py-2">Nome</th><th className="text-left">Endereço</th><th>Energia Elétrica</th><th>Água</th><th>Gás</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map(item=>(
                <tr key={item.id} className="border-t">
                  <td className="py-2 font-medium">{item.nome}<div className="text-[10px] text-zinc-500">{item.email} • {item.cpfCnpj?.replace("enc:","")|| ""}</div><div className="text-[10px] text-zinc-500">{item.telefone||""}</div></td>
                  <td className="text-xs max-w-[120px] truncate">{item.endereco||"-"}</td>
                  <td className="text-xs text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-[11px]">{item.codigoMedidorEnergia|| item.codigoMedidor || "-"}</span>
                      <span className="text-[10px]">{item.medidorEnergia|| item.medidor||"-"}</span>
                      <span className="text-[9px] bg-zinc-100 rounded px-1">{item.tipoCobrancaEnergia||"COMPARTILHADA"}{item.porcentagemEnergia?` ${item.porcentagemEnergia}%`:""}</span>
                      {(item.codigoMedidorEnergia|| item.codigoMedidor) && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(item.codigoMedidorEnergia|| item.codigoMedidor)}`} alt="QR energia" className="w-12 h-12 border rounded" />}
                    </div>
                  </td>
                  <td className="text-xs text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-[11px]">{item.codigoMedidorAgua||"-"}</span>
                      <span className="text-[10px]">{item.medidorAgua||"-"}</span>
                      <span className="text-[9px] bg-blue-100 rounded px-1">{item.tipoCobrancaAgua||"COMPARTILHADA"}{item.porcentagemAgua?` ${item.porcentagemAgua}%`:""}</span>
                      {item.codigoMedidorAgua && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(item.codigoMedidorAgua)}`} alt="QR agua" className="w-12 h-12 border rounded" />}
                    </div>
                  </td>
                  <td className="text-xs text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-[11px]">{item.codigoMedidorGas||"-"}</span>
                      <span className="text-[10px]">{item.medidorGas||"-"}</span>
                      <span className="text-[9px] bg-orange-100 rounded px-1">{item.tipoCobrancaGas||"COMPARTILHADA"}{item.porcentagemGas?` ${item.porcentagemGas}%`:""}</span>
                      {item.codigoMedidorGas && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(item.codigoMedidorGas)}`} alt="QR gas" className="w-12 h-12 border rounded" />}
                    </div>
                  </td>
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
              <label className="text-sm">Medidor Energia<input value={editForm.medidorEnergia} onChange={e=>setEditForm({...editForm, medidorEnergia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Código Energia<div className="flex gap-1 mt-1"><input value={editForm.codigoMedidorEnergia} onChange={e=>setEditForm({...editForm, codigoMedidorEnergia:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" /><button type="button" onClick={()=>setEditForm({...editForm, codigoMedidorEnergia: genCodigo()})} className="bg-zinc-900 text-white rounded-xl px-3 text-xs">Gerar</button></div></label>
              <label className="text-sm">Tipo Energia<select value={editForm.tipoCobrancaEnergia} onChange={e=>setEditForm({...editForm, tipoCobrancaEnergia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="COMPARTILHADA">Compartilhada</option><option value="RATIO">Ratio</option><option value="PORCENTAGEM">Porcentagem</option></select></label>
              {editForm.tipoCobrancaEnergia==="PORCENTAGEM" && <label className="text-sm">% Energia<input type="number" step="0.1" value={editForm.porcentagemEnergia} onChange={e=>setEditForm({...editForm, porcentagemEnergia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}
              <label className="text-sm">Medidor Água<input value={editForm.medidorAgua} onChange={e=>setEditForm({...editForm, medidorAgua:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Código Água<div className="flex gap-1 mt-1"><input value={editForm.codigoMedidorAgua} onChange={e=>setEditForm({...editForm, codigoMedidorAgua:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" /><button type="button" onClick={()=>setEditForm({...editForm, codigoMedidorAgua: genCodigo()})} className="bg-blue-600 text-white rounded-xl px-3 text-xs">Gerar</button></div></label>
              <label className="text-sm">Tipo Água<select value={editForm.tipoCobrancaAgua} onChange={e=>setEditForm({...editForm, tipoCobrancaAgua:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="COMPARTILHADA">Compartilhada</option><option value="RATIO">Ratio</option><option value="PORCENTAGEM">Porcentagem</option></select></label>
              {editForm.tipoCobrancaAgua==="PORCENTAGEM" && <label className="text-sm">% Água<input type="number" step="0.1" value={editForm.porcentagemAgua} onChange={e=>setEditForm({...editForm, porcentagemAgua:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}
              <label className="text-sm">Medidor Gás<input value={editForm.medidorGas} onChange={e=>setEditForm({...editForm, medidorGas:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Código Gás<div className="flex gap-1 mt-1"><input value={editForm.codigoMedidorGas} onChange={e=>setEditForm({...editForm, codigoMedidorGas:e.target.value})} className="flex-1 border rounded-xl px-3 py-2 font-mono text-xs" /><button type="button" onClick={()=>setEditForm({...editForm, codigoMedidorGas: genCodigo()})} className="bg-orange-600 text-white rounded-xl px-3 text-xs">Gerar</button></div></label>
              <label className="text-sm">Tipo Gás<select value={editForm.tipoCobrancaGas} onChange={e=>setEditForm({...editForm, tipoCobrancaGas:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="COMPARTILHADA">Compartilhada</option><option value="RATIO">Ratio</option><option value="PORCENTAGEM">Porcentagem</option></select></label>
              {editForm.tipoCobrancaGas==="PORCENTAGEM" && <label className="text-sm">% Gás<input type="number" step="0.1" value={editForm.porcentagemGas} onChange={e=>setEditForm({...editForm, porcentagemGas:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}
              <label className="text-sm flex items-center gap-2 mt-6"><input type="checkbox" checked={editForm.ativo} onChange={e=>setEditForm({...editForm, ativo:e.target.checked})} /> Ativo</label>
              <label className="text-sm">Unidade ID<input value={editForm.unidadeId} onChange={e=>setEditForm({...editForm, unidadeId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Nova senha<input type="password" value={editForm.novaSenha} onChange={e=>setEditForm({...editForm, novaSenha:e.target.value})} placeholder="deixe em branco" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Medição inicial Energia<input type="number" value={editForm.leituraInicialEnergia} onChange={e=>setEditForm({...editForm, leituraInicialEnergia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Medição inicial Água<input type="number" value={editForm.leituraInicialAgua} onChange={e=>setEditForm({...editForm, leituraInicialAgua:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Medição inicial Gás<input type="number" value={editForm.leituraInicialGas} onChange={e=>setEditForm({...editForm, leituraInicialGas:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
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
    { id:"1", nome:"Maria Silva", email:"maria@ex.com", cpfCnpj:"enc:11111111111", telefone:"(11) 99999-0000", endereco:"Rua A, 101 - Bl A", medidorEnergia:"HID-E-001", codigoMedidorEnergia:"MED-ABCD-1234", medidorAgua:"HID-A-001", codigoMedidorAgua:"MED-EFGH-5678", medidorGas:"HID-G-001", codigoMedidorGas:"MED-IJKL-9012", ativo:true, createdAt: new Date().toISOString() },
  ];
}
