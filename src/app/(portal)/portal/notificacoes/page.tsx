"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

export default function NotificacoesPage(){
  const [lista,setLista]=useState<any[]>([]);
  useEffect(()=>{
    fetch("/api/notificacoes").then(r=>r.json()).then(j=> Array.isArray(j)&&j.length?setLista(j):setLista(mock())).catch(()=>setLista(mock()));
  },[]);
  return (
    <div className="space-y-3 max-w-2xl">
      <h1 className="text-xl font-bold">Notificações</h1>
      <div className="text-xs text-muted">Canais: Sistema • E-mail • WhatsApp (webhook configurável no backend)</div>
      {lista.map(n=>(
        <Card key={n.id} className={`${n.lida?"opacity-60":""}`}>
          <div className="flex items-center justify-between"><Badge variant={n.lida?"default":"brand"}>{n.tipo}</Badge><span className="text-xs text-muted">{new Date(n.createdAt).toLocaleString("pt-BR")}</span></div>
          <div className="font-semibold text-sm mt-1">{n.titulo}</div>
          <div className="text-sm text-muted">{n.mensagem}</div>
          {!n.lida && <button onClick={async()=>{ await fetch("/api/notificacoes",{ method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: n.id })}); setLista(lista.map(x=>x.id===n.id?{...x,lida:true}:x)); }} className="text-xs text-brand-700 mt-2">Marcar como lida</button>}
        </Card>
      ))}
    </div>
  );
}
function mock(){
  return [
    { id:"1", tipo:"NOVA_FATURA", titulo:"Nova fatura disponível", mensagem:"Fatura de energia 08/2026 no valor de R$ 287,40", lida:false, createdAt: new Date().toISOString() },
    { id:"2", tipo:"VENCIMENTO_PROXIMO", titulo:"Vencimento em 3 dias", mensagem:"Condomínio vence em 10/08/2026", lida:false, createdAt: new Date().toISOString() },
    { id:"3", tipo:"PAGAMENTO_CONFIRMADO", titulo:"Pagamento confirmado", mensagem:"Fatura 07/2026 paga via PIX", lida:true, createdAt: new Date().toISOString() },
  ];
}
