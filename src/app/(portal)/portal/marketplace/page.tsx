"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
export default function MarketplacePage(){
  const [lista,setLista]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/marketplace").then(r=>r.json()).then(setLista); },[]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Marketplace • Serviços</h1>
      <div className="grid md:grid-cols-3 gap-3">
        {lista.map(s=>(
          <Card key={s.id} className="space-y-2">
            <div className="font-semibold">{s.nome}</div>
            <div className="text-sm text-zinc-500">R$ {s.preco} • Prazo {s.prazo}</div>
            <button onClick={async()=>{ const r=await fetch("/api/marketplace",{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ servicoId: s.id, unidadeId: "BL-A-101" })}); const j=await r.json(); alert(j.ok?`Ordem ${j.ordem.protocolo} aberta!`:"Erro"); }} className="w-full bg-emerald-600 text-white rounded-xl py-2 text-sm">Solicitar</button>
          </Card>
        ))}
      </div>
    </div>
  );
}
