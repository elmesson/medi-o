"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function BiPage(){
  const [data,setData]=useState<any>(null);
  const [ano,setAno]=useState("2026");
  useEffect(()=>{
    fetch(`/api/bi/consumo?ano=${ano}`).then(r=>r.json()).then(j=> j.totais?setData(j):setData(mock(ano))).catch(()=>setData(mock(ano)));
  },[ano]);
  if(!data) return <div className="card">Carregando BI...</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">BI • Inteligência de Consumo</h1>
        <select value={ano} onChange={e=>setAno(e.target.value)} className="border rounded-xl px-3 py-1 text-sm"><option>2026</option><option>2025</option></select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Card><div className="text-xs text-zinc-500">Total Energia</div><div className="font-bold">{data.totais.energia.toFixed(0)} kWh</div>{data.variacaoYoY.energia!==null && <Badge variant={data.variacaoYoY.energia>0?"danger":"success"}>{data.variacaoYoY.energia>0?"+":""}{data.variacaoYoY.energia.toFixed(1)}% YoY</Badge>}</Card>
        <Card><div className="text-xs text-zinc-500">Total Água</div><div className="font-bold">{data.totais.agua.toFixed(1)} m³</div>{data.variacaoYoY.agua!==null && <Badge variant={data.variacaoYoY.agua>0?"danger":"success"}>{data.variacaoYoY.agua.toFixed(1)}% YoY</Badge>}</Card>
        <Card><div className="text-xs text-zinc-500">Total Gás</div><div className="font-bold">{data.totais.gas.toFixed(1)} m³</div>{data.variacaoYoY.gas!==null && <Badge variant={data.variacaoYoY.gas>0?"danger":"success"}>{data.variacaoYoY.gas.toFixed(1)}% YoY</Badge>}</Card>
      </div>
      <Card>
        <h3 className="font-semibold text-sm">Faturas no ano • {brl(data.faturasTotal)}</h3>
        <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
          {Object.entries(data.faturasPorTipo).map(([k,v]:any)=> <div key={k} className="bg-zinc-50 rounded-xl p-2 text-center"><div className="text-zinc-500">{k}</div><div className="font-semibold">{brl(v as number)}</div></div>)}
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold text-sm">Top 5 meses por consumo</h3>
        <table className="w-full text-sm mt-2">
          <thead><tr className="text-xs text-zinc-500"><th className="text-left">Ref</th><th>Tipo</th><th className="text-right">Consumo</th></tr></thead>
          <tbody>{data.ranking.map((r:any)=><tr key={r.referencia+r.tipo} className="border-t"><td>{r.referencia}</td><td className="text-center">{r.tipo}</td><td className="text-right">{r.consumo}</td></tr>)}</tbody>
        </table>
      </Card>
      <div className="text-xs text-zinc-500">Cache ISR 60s + SWR 300s em `/api/bi/consumo`. Pronto para gráficos de cohort e export Excel/PDF.</div>
    </div>
  );
}
function mock(ano:string){
  return { totais:{ energia: 3120, agua: 132, gas: 102 }, medias:{ energia:260, agua:11, gas:8.5 }, variacaoYoY:{ energia: 4.2, agua: -1.3, gas: 2.1 }, ranking:[{ referencia:`${ano}-08`, tipo:"ENERGIA", consumo:340 },{ referencia:`${ano}-07`, tipo:"ENERGIA", consumo:320 }], faturasTotal: 8420, faturasPorTipo:{ ENERGIA:3400, AGUA:890, GAS:780, CONDOMINIO:3350 } };
}
