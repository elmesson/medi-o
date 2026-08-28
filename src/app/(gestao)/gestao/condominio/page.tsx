"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function CondominioPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({
    referencia: new Date().toISOString().slice(0,7),
    categoria:"ENERGIA",
    especificacao:"",
    empresa:"",
    valor:"",
    data: new Date().toISOString().slice(0,10),
    vencimento: new Date().toISOString().slice(0,10),
    codFatura:"",
    descricao:"",
    tipoCobranca:"COMPARTILHADA",
    porcentagem:""
  });

  async function load(){
    const r = await fetch("/api/gestao/condominio").then(res=>res.json()).catch(()=>[]);
    if(Array.isArray(r)) setLista(r);
  }
  useEffect(()=>{ load(); },[]);

  async function criar(e: React.FormEvent){
    e.preventDefault();
    const payload:any = { ...form, valor: Number(form.valor), porcentagem: form.porcentagem? Number(form.porcentagem): null };
    const res = await fetch("/api/gestao/condominio", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(payload) });
    if(res.ok){ load(); alert("Despesa cadastrada e rateio gerado na fatura do inquilino!"); }
    else {
      const j = await res.json().catch(()=>({}));
      alert(j.error || "Erro — verifique login Gestão (ADMINISTRADOR/PROPRIETARIO)");
    }
  }
  async function remover(id:string){
    if(!confirm("Remover despesa e rateios?")) return;
    await fetch(`/api/gestao/condominio?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestão — Condomínio</h1>
      <p className="text-xs text-zinc-500">Gerencie custos: Água, Gás, Energia Elétrica, Outros (Internet, Manutenção, Segurança eletrônica...). Cada despesa gera rateio automático na fatura do inquilino conforme regra.</p>

      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Cadastrar despesa do condomínio</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Referência<input value={form.referencia} onChange={e=>setForm({...form, referencia:e.target.value})} placeholder="2026-08" required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Categoria
            <select value={form.categoria} onChange={e=>setForm({...form, categoria:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">
              <option value="ENERGIA">ENERGIA ELÉTRICA</option>
              <option value="AGUA">ÁGUA</option>
              <option value="GAS">GÁS</option>
              <option value="OUTROS">OUTROS</option>
            </select>
          </label>
          {form.categoria==="OUTROS" && <label className="text-sm">Especificar <span className="text-rose-600">*</span><input value={form.especificacao} onChange={e=>setForm({...form, especificacao:e.target.value})} placeholder="Internet, Manutenção, Segurança eletrônica, Prestador..." required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}
          <label className="text-sm">Empresa / Prestador<input value={form.empresa} onChange={e=>setForm({...form, empresa:e.target.value})} placeholder="ex: Vivo, Elevadores Atlas" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Valor total<input type="number" step="0.01" value={form.valor} onChange={e=>setForm({...form, valor:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Data<input type="date" value={form.data} onChange={e=>setForm({...form, data:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Vencimento<input type="date" value={form.vencimento} onChange={e=>setForm({...form, vencimento:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Cod. fatura<input value={form.codFatura} onChange={e=>setForm({...form, codFatura:e.target.value})} placeholder="NF 12345" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm md:col-span-3">Descrição<textarea value={form.descricao} onChange={e=>setForm({...form, descricao:e.target.value})} placeholder="Detalhes adicionais..." rows={2} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>

          <label className="text-sm">Tipo de cobrança
            <select value={form.tipoCobranca} onChange={e=>setForm({...form, tipoCobranca:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">
              <option value="COMPARTILHADA">Compartilhada (valor igual a todos)</option>
              <option value="RATIO">Ratio (proporcional à fração ideal)</option>
              <option value="PORCENTAGEM">Porcentagem (seleção %)</option>
            </select>
          </label>
          {form.tipoCobranca==="PORCENTAGEM" && <label className="text-sm">Porcentagem %<input type="number" step="0.1" value={form.porcentagem} onChange={e=>setForm({...form, porcentagem:e.target.value})} required placeholder="ex: 12.5" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>}

          <button className="md:col-span-3 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Cadastrar despesa e gerar fatura inquilino</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Despesas cadastradas</h3><Badge variant="default">{lista.length} registros</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left">Ref</th><th>Categoria</th><th>Empresa</th><th className="text-right">Valor</th><th>Vencimento</th><th>Tipo cobrança</th><th>Cod</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map((d:any)=>(
                <tr key={d.id} className="border-t">
                  <td className="text-xs text-center">{d.referencia}</td>
                  <td className="text-center"><Badge variant="default">{d.categoria}{d.especificacao?` • ${d.especificacao}`:""}</Badge></td>
                  <td className="text-xs">{d.empresa||"-"}</td>
                  <td className="text-right font-bold">{brl(d.valor)}</td>
                  <td className="text-xs text-center">{new Date(d.vencimento).toLocaleDateString("pt-BR")}</td>
                  <td className="text-xs text-center">{d.tipoCobranca}{d.porcentagem?` ${d.porcentagem}%`:""}</td>
                  <td className="text-xs">{d.codFatura||"-"}</td>
                  <td className="text-right"><button onClick={()=>remover(d.id)} className="text-xs text-rose-600">Remover</button></td>
                </tr>
              ))}
              {lista.length===0 && <tr><td colSpan={8} className="text-center py-6 text-zinc-500">Nenhuma despesa — cadastre acima. Cobrança aparecerá na fatura do inquilino.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
