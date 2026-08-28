"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";

export default function AtendimentoPage(){
  const [chamados,setChamados]=useState<any[]>([]);
  const [assunto,setAssunto]=useState("");
  const [cat,setCat]=useState("DUVIDA");
  const [msg,setMsg]=useState("");
  const [sel,setSel]=useState<string|null>(null);

  useEffect(()=>{
    fetch("/api/chamados").then(r=>r.json()).then(j=> Array.isArray(j)&&j.length?setChamados(j):setChamados(mock())).catch(()=>setChamados(mock()));
  },[]);

  async function abrir(){
    const res= await fetch("/api/chamados",{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ categoria:cat, assunto, mensagem: msg })});
    if (res.ok){ const j=await res.json(); setChamados([j,...chamados]); setAssunto(""); setMsg(""); }
    else setChamados([{ id: Math.random().toString(36).slice(2), categoria:cat, assunto, status:"ABERTO", mensagens:[{ texto:msg, autorTipo:"INQUILINO", createdAt: new Date().toISOString() }]},...chamados]);
  }

  const ativo = chamados.find(c=>c.id===sel);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-4">
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Central de Atendimento</h1>
        <Card className="space-y-2">
          <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full border rounded-2xl px-3 py-2 text-sm">
            <option value="CONTESTACAO">Contestação</option><option value="DUVIDA">Dúvidas</option><option value="SUPORTE_TECNICO">Suporte técnico</option><option value="SOLICITACAO_ADMINISTRATIVA">Solicitação administrativa</option>
          </select>
          <input value={assunto} onChange={e=>setAssunto(e.target.value)} placeholder="Assunto" className="w-full border rounded-2xl px-3 py-2 text-sm" />
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Descreva..." rows={3} className="w-full border rounded-2xl px-3 py-2 text-sm" />
          <button onClick={abrir} className="btn-primary w-full text-sm py-2">Abrir solicitação</button>
        </Card>
        <div className="space-y-2">
          {chamados.map(c=>(
            <button key={c.id} onClick={()=>setSel(c.id)} className={`w-full text-left card ${sel===c.id?"ring-2 ring-brand-500":""}`}>
              <div className="text-sm font-semibold truncate">{c.assunto}</div>
              <div className="text-xs text-muted">{c.categoria} • {c.status}</div>
            </button>
          ))}
        </div>
      </div>

      <Card className="min-h-[500px] flex flex-col">
        {!ativo ? <div className="m-auto text-sm text-muted">Selecione uma solicitação para ver o chat</div> : (
          <>
            <div className="font-semibold border-b border-zinc-100 pb-2">{ativo.assunto} <span className="text-xs text-muted">• {ativo.status}</span></div>
            <div className="flex-1 space-y-2 py-3 overflow-y-auto">
              {(ativo.mensagens||[]).map((m:any,i:number)=>(
                <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.autorTipo==="INQUILINO"?"bg-brand-600 text-white ml-auto":"bg-zinc-100"}`}>{m.texto}</div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-zinc-100">
              <input placeholder="Digite sua mensagem..." className="flex-1 border rounded-2xl px-3 py-2 text-sm" id="chat-input" onKeyDown={e=>{
                if (e.key==="Enter"){
                  const input=e.target as HTMLInputElement;
                  if (!input.value) return;
                  ativo.mensagens.push({ texto:input.value, autorTipo:"INQUILINO", createdAt: new Date().toISOString() });
                  setChamados([...chamados]); input.value="";
                }
              }} />
              <button onClick={()=>{
                const inp=document.getElementById("chat-input") as HTMLInputElement;
                if (!inp.value) return;
                ativo.mensagens.push({ texto:inp.value, autorTipo:"INQUILINO", createdAt: new Date().toISOString() });
                setChamados([...chamados]); inp.value="";
              }} className="btn-primary text-sm px-4">Enviar</button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
function mock(){
  return [{ id:"ch1", categoria:"DUVIDA", assunto:"Bandeira tarifária de agosto", status:"RESPONDIDO", mensagens:[
    { texto:"Olá, por que a bandeira está vermelha?", autorTipo:"INQUILINO", createdAt: new Date().toISOString() },
    { texto:"Olá! A bandeira vermelha P1 foi aplicada pela ANEEL devido ao custo de geração. Sua tarifa foi ajustada conforme resolução.", autorTipo:"ATENDENTE", createdAt: new Date().toISOString() },
  ]}];
}
