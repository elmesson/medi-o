"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function FaturasPage(){
  const [faturas,setFaturas]=useState<any[]>([]);
  const [filtro,setFiltro]=useState("TODOS");
  useEffect(()=>{
    fetch("/api/faturas").then(r=>r.json()).then(j=>{
      if (Array.isArray(j) && j.length) setFaturas(j);
      else setFaturas(mock());
    }).catch(()=> setFaturas(mock()));
  },[]);
  const filtradas = faturas.filter(f=> filtro==="TODOS" || f.status===filtro || f.tipo===filtro);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Consulta de Faturas</h1>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["TODOS","ABERTA","PAGA","VENCIDA","EM_CONTESTACAO","ENERGIA","AGUA","GAS","CONDOMINIO"].map(s=>(
          <button key={s} onClick={()=>setFiltro(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${filtro===s?"bg-ink text-white border-ink":"bg-white border-zinc-200"}`}>{s}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtradas.map(f=>(
          <Card key={f.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Badge variant={f.status==="PAGA"?"success":f.status==="VENCIDA"?"danger":f.status==="EM_CONTESTACAO"?"warn":"brand"}>{f.status}</Badge><span className="text-sm font-semibold">{f.tipo}</span><span className="text-xs text-muted">{f.referencia}</span></div>
              <span className="font-bold">{brl(f.valorTotal)}</span>
            </div>
            <div className="text-xs text-muted">Emissão {new Date(f.dataEmissao).toLocaleDateString("pt-BR")} • Vencimento {new Date(f.dataVencimento).toLocaleDateString("pt-BR")} {f.criterioRateio?`• ${f.criterioRateio}`:""} {f.rateioValor?`• Rateio ${brl(f.rateioValor)}`:""}</div>
            <div className="flex gap-2">
              <a href={`/portal/pix?fatura=${f.id}`} className="btn-primary text-xs py-2 flex-1 text-center">PIX QrCode</a>
              <button onClick={()=>window.open(`/api/faturas/${f.id}/pdf`,"_blank")} className="btn-ghost text-xs py-2 flex-1">Baixar PDF</button>
              <a href="/portal/contestacoes" className="btn-ghost text-xs py-2 flex-1 text-center">Contestar</a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
function mock(){
  const now=new Date();
  return [
    { id:"f1", tipo:"ENERGIA", referencia:"2026-08", valorTotal: 287.40, rateioValor: null, criterioRateio: "Medição individual", dataEmissao: now.toISOString(), dataVencimento: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(), status:"ABERTA" },
    { id:"f2", tipo:"AGUA", referencia:"2026-08", valorTotal: 74.10, dataEmissao: now.toISOString(), dataVencimento: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(), status:"ABERTA" },
    { id:"f3", tipo:"CONDOMINIO", referencia:"2026-08", valorTotal: 542.50, rateioValor: 542.50, criterioRateio: "Fração ideal 0.82%", dataEmissao: now.toISOString(), dataVencimento: new Date(Date.now()-5*86400000).toISOString(), status:"VENCIDA" },
    { id:"f4", tipo:"ENERGIA", referencia:"2026-07", valorTotal: 264.00, dataEmissao: now.toISOString(), dataVencimento: new Date(now.getFullYear(), now.getMonth()-1, 10).toISOString(), status:"PAGA" },
  ];
}
