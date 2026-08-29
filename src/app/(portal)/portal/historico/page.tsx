"use client";
import { useState } from "react";
import { Card } from "@/components/ui";

export default function HistoricoPage(){
  const [ano,setAno]=useState("2026");
  const [tipo,setTipo]=useState("TODOS");
  const [rows,setRows]=useState<any[]>(mockRows());

  async function exportar(fmt:"pdf"|"excel"|"csv"){
    try {
      const res = await fetch(`/api/relatorios/export?formato=${fmt}&ano=${ano}&tipo=${tipo}`);
      if(!res.ok) throw new Error("Falha ao exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      const ext = fmt==="pdf"?"pdf": fmt==="excel"?"xlsx":"csv";
      const cd = res.headers.get("Content-Disposition");
      // tenta extrair filename do header, senão usa padrão
      let filename = `historico-${ano}-${tipo}.${ext}`;
      if(cd){
        const m = cd.match(/filename="?([^"]+)"?/);
        if(m) filename = m[1];
      }
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e:any){
      // fallback CSV client-side
      if(fmt==="csv"){
        const csv = ["referencia,tipo,consumo,leituraAnterior,leituraAtual"].concat(rows.map(r=>`${r.referencia},${r.tipo},${r.consumo},${r.leituraAnterior},${r.leituraAtual}`)).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`historico-${ano}.csv`; a.click();
      } else alert(e.message||"Erro ao exportar");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Histórico de Consumo</h1>
      <Card className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">Ano <select value={ano} onChange={e=>setAno(e.target.value)} className="ml-1 border rounded-xl px-2 py-1"><option>2026</option><option>2025</option></select></label>
        <label className="text-sm">Tipo <select value={tipo} onChange={e=>setTipo(e.target.value)} className="ml-1 border rounded-xl px-2 py-1"><option>TODOS</option><option>ENERGIA</option><option>AGUA</option><option>GAS</option></select></label>
        <div className="flex gap-2 ml-auto">
          <button onClick={()=>exportar("pdf")} className="btn-ghost text-sm py-2">PDF</button>
          <button onClick={()=>exportar("excel")} className="btn-ghost text-sm py-2">Excel</button>
          <button onClick={()=>exportar("csv")} className="btn-primary text-sm py-2">CSV</button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-muted"><th className="text-left py-2">Ref</th><th>Tipo</th><th className="text-right">Anterior</th><th className="text-right">Atual</th><th className="text-right">Consumo</th></tr></thead>
            <tbody>
              {rows.filter(r=> tipo==="TODOS" || r.tipo===tipo).map(r=>(
                <tr key={r.referencia+r.tipo} className="border-t border-zinc-100"><td className="py-2">{r.referencia}</td><td className="text-center">{r.tipo}</td><td className="text-right">{r.leituraAnterior}</td><td className="text-right">{r.leituraAtual}</td><td className="text-right font-semibold">{r.consumo} {r.tipo==="ENERGIA"?"kWh":"m³"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
function mockRows(){
  const refs=["2026-08","2026-07","2026-06","2026-05","2026-04","2026-03"];
  return refs.flatMap(ref=>[
    { referencia: ref, tipo:"ENERGIA", leituraAnterior: 1200, leituraAtual: 1480, consumo: 280 },
    { referencia: ref, tipo:"AGUA", leituraAnterior: 80, leituraAtual: 91, consumo: 11 },
    { referencia: ref, tipo:"GAS", leituraAnterior: 40, leituraAtual: 49, consumo: 9 },
  ]);
}
