"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
export default function IaPage(){
  const [d,setD]=useState<any>(null);
  const [q,setQ]=useState("");
  const [msgs,setMsgs]=useState<{from:string,text:string}[]>([{from:"bot", text:"Olá! Sou seu assistente de consumo. Pergunte: 'Por que minha conta subiu?' ou 'Como economizar?'"}]);
  useEffect(()=>{ fetch("/api/ai/insights").then(r=>r.json()).then(setD).catch(()=>setD({ previsao: 324, media: 278, dicas: ["Dica mock"] })); },[]);
  function send(){
    if(!q) return;
    const a = q.toLowerCase().includes("subiu") ? "Sua conta subiu 12% vs mês anterior, puxada por bandeira vermelha e +18% kWh. Veja BI para ranking." : "Para economizar: ajuste chuveiro para morno, limpe filtros do ar e desligue standby. Previsão próximo mês: "+(d?.previsao??"--")+" kWh.";
    setMsgs([...msgs, {from:"user", text:q}, {from:"bot", text:a}]); setQ("");
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">IA • Previsão e Assistente</h1>
      <Card>
        <div className="text-sm">Previsão próximo mês <b>{d?.previsao ?? "--"} kWh</b> <span className="text-zinc-500">• Média {d?.media?.toFixed(0) ?? "--"} kWh • z={d?.z ?? "--"}</span></div>
        <ul className="list-disc ml-5 text-sm mt-2">{d?.dicas?.map((x:string)=><li key={x}>{x}</li>)}</ul>
      </Card>
      <Card className="space-y-2">
        <div className="font-semibold text-sm">Chatbot de consumo</div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {msgs.map((m,i)=><div key={i} className={`rounded-2xl px-3 py-2 text-sm ${m.from==="user"?"bg-zinc-900 text-white ml-8":"bg-zinc-100"}`}>{m.text}</div>)}
        </div>
        <div className="flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Pergunte..." className="flex-1 border rounded-2xl px-3 py-2 text-sm" /><button onClick={send} className="bg-emerald-600 text-white rounded-2xl px-4 text-sm">Enviar</button></div>
      </Card>
    </div>
  );
}
