"use client";
import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";

const fluxo = ["ABERTO","RECEBIDO","EM_ANALISE","RESPONDIDO","RESOLVIDO","ENCERRADO"];

export default function ContestacoesPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [categoria,setCategoria]=useState("VALOR_INCORRETO");
  const [motivo,setMotivo]=useState("");
  useEffect(()=>{
    fetch("/api/contestacoes").then(r=>r.json()).then(j=> Array.isArray(j)&&j.length?setLista(j):setLista(mock())).catch(()=>setLista(mock()));
  },[]);

  async function abrir(){
    const res = await fetch("/api/contestacoes",{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ categoria, motivo, anexos: [] }) });
    if (res.ok){ const j=await res.json(); setLista([j,...lista]); setMotivo(""); alert("Contestação aberta! Acompanhe o fluxo."); }
    else { // fallback demo
      setLista([{ id: Math.random().toString(36).slice(2), categoria, motivo, status:"ABERTO", createdAt: new Date().toISOString() }, ...lista]);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Contestação de Faturas</h1>
      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Abrir contestação</h3>
        <label className="block text-sm">Categoria
          <select value={categoria} onChange={e=>setCategoria(e.target.value)} className="mt-1 w-full border rounded-2xl px-3 py-2">
            <option value="LEITURA_INCORRETA">Leitura incorreta</option>
            <option value="VALOR_INCORRETO">Valor incorreto</option>
            <option value="RATEIO_INCORRETO">Rateio incorreto</option>
            <option value="COBRANCA_INDEVIDA">Cobrança indevida</option>
            <option value="OUTRO">Outro motivo</option>
          </select>
        </label>
        <label className="block text-sm">Motivo<textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3} className="mt-1 w-full border rounded-2xl px-3 py-2" placeholder="Descreva o motivo..." /></label>
        <label className="block text-sm">Anexos (imagens/documentos)<input type="file" multiple className="mt-1 w-full text-sm" /></label>
        <button onClick={abrir} className="btn-primary w-full">Abrir contestação</button>
        <p className="text-xs text-muted">Fluxo: Aberto → Recebido → Em análise → Respondido → Resolvido → Encerrado</p>
      </Card>

      <div className="space-y-2">
        {lista.map(c=>(
          <Card key={c.id}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">#{c.id.slice(0,6)} • {c.categoria}</span>
              <Badge variant={c.status==="RESOLVIDO"||c.status==="ENCERRADO"?"success":c.status==="EM_ANALISE"?"warn":"brand"}>{c.status}</Badge>
            </div>
            <p className="text-sm mt-1">{c.motivo}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {fluxo.map(s=> <span key={s} className={`text-[10px] px-2 py-1 rounded-full border ${s===c.status?"bg-ink text-white border-ink": s==="ABERTO"?"bg-zinc-100":"bg-white border-zinc-200"}`}>{s}</span>)}
            </div>
            <div className="text-xs text-muted mt-1">{new Date(c.createdAt).toLocaleString("pt-BR")}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
function mock(){
  return [{ id:"abc123", categoria:"VALOR_INCORRETO", motivo:"Valor da energia acima do histórico sem justificativa de bandeira", status:"EM_ANALISE", createdAt: new Date().toISOString() }];
}
