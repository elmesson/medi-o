"use client";
import { useState } from "react";
import { Card } from "@/components/ui";
export default function LeiturasGestaoPage(){
  const [form,setForm]=useState({ unidadeId:"", tipo:"ENERGIA", referencia: new Date().toISOString().slice(0,7), leituraAnterior:"", leituraAtual:"", tarifa:"0.92", bandeira:"VERDE" });
  async function salvar(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/leituras", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ leituras: [{ unidadeId: form.unidadeId || "bl-a-101", tipo: form.tipo, referencia: form.referencia, leituraAnterior: Number(form.leituraAnterior), leituraAtual: Number(form.leituraAtual), tarifa: Number(form.tarifa) }] }) });
    if(res.ok) alert("Leitura cadastrada!");
    else alert("Leitura cadastrada (demo) — faça login como Master/Admin para persistir.");
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">Gestão — Leituras</h1>
      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Cadastrar leitura (anterior/atual, consumo, tarifa, bandeira)</h3>
        <form onSubmit={salvar} className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">Unidade ID<input value={form.unidadeId} onChange={e=>setForm({...form, unidadeId:e.target.value})} placeholder="bl-a-101 (ou selecione em Contas)" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Tipo<select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ENERGIA</option><option>AGUA</option><option>GAS</option></select></label>
          <label className="text-sm">Referência<input value={form.referencia} onChange={e=>setForm({...form, referencia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Bandeira (energia)<select value={form.bandeira} onChange={e=>setForm({...form, bandeira:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>VERDE</option><option>AMARELA</option><option>VERMELHA_P1</option><option>VERMELHA_P2</option></select></label>
          <label className="text-sm">Leitura anterior<input type="number" value={form.leituraAnterior} onChange={e=>setForm({...form, leituraAnterior:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Leitura atual<input type="number" value={form.leituraAtual} onChange={e=>setForm({...form, leituraAtual:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm md:col-span-2">Tarifa R$<input type="number" step="0.0001" value={form.tarifa} onChange={e=>setForm({...form, tarifa:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <button className="md:col-span-2 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Salvar leitura</button>
        </form>
      </Card>
    </div>
  );
}
