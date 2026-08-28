"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

export default function LeiturasPage() {
  const [tipo,setTipo]=useState("ENERGIA");
  const [dados,setDados]=useState<any[]>([]);
  useEffect(()=>{
    fetch(`/api/leituras?tipo=${tipo}`).then(r=>r.json()).then(j=>{
      if (Array.isArray(j) && j.length) setDados(j);
      else setDados(mock(tipo));
    }).catch(()=> setDados(mock(tipo)));
  },[tipo]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Consulta de Leituras</h1>
      <div className="flex gap-2">
        {["ENERGIA","AGUA","GAS"].map(t=>(
          <button key={t} onClick={()=>setTipo(t)} className={`px-4 py-2 rounded-2xl text-sm font-semibold border ${tipo===t?"bg-brand-600 text-white border-brand-600":"bg-white border-zinc-200"}`}>{t}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {dados.map((l:any)=>(
          <Card key={l.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Badge variant="brand">{l.tipo}</Badge><span className="text-sm text-muted">{l.referencia}</span>{l.bandeira && <Badge variant={l.bandeira.includes("VERMELHA")?"danger":l.bandeira==="AMARELA"?"warn":"success"}>{l.bandeira}</Badge>}</div>
              <div className="text-sm mt-1">Anterior <b>{l.leituraAnterior}</b> → Atual <b>{l.leituraAtual}</b> • Consumo <b className="text-brand-700">{l.consumo} {l.tipo==="ENERGIA"?"kWh":"m³"}</b></div>
              {l.tarifa && <div className="text-xs text-muted">Tarifa R$ {Number(l.tarifa).toFixed(4)} {l.bandeira?`• Bandeira ${l.bandeira}`:""}</div>}
            </div>
            <div className="text-xs text-muted">{new Date(l.dataLeitura).toLocaleDateString("pt-BR")}</div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="font-semibold text-sm">Histórico completo</h3>
        <p className="text-xs text-muted mt-1">Filtro por mês/ano/tipo disponível na API <code>/api/leituras?ano=2026&tipo=ENERGIA</code>. Exportação em PDF/Excel na página Histórico.</p>
      </Card>
    </div>
  );
}
function mock(tipo:string){
  return Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-i);
    const ref=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const prev= 1000+i*30, curr= prev+ (tipo==="ENERGIA"? 280: 10);
    return { id: `m-${i}`, tipo, referencia: ref, leituraAnterior: prev, leituraAtual: curr, consumo: curr-prev, tarifa: tipo==="ENERGIA"?0.92:6.5, bandeira: tipo==="ENERGIA"?(i%3===0?"VERDE":i%3===1?"AMARELA":"VERMELHA_P1"):null, dataLeitura: d.toISOString() };
  });
}
