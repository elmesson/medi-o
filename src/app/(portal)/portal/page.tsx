"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Stat } from "@/components/ui";
import { brl, formatRef } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    // tenta API, fallback mock para demo sem DB
    fetch("/api/dashboard").then(r=>r.json()).then(j=>{
      if (j.error) throw new Error(j.error);
      setData(j);
    }).catch(()=>{
      setData(mock());
    }).finally(()=>setLoading(false));
  },[]);
  if (loading) return <div className="card">Carregando dashboard...</div>;
  const d = data;
  const energiaSeries = d.historico12m.energia.map((x:any)=> ({ name: x.ref.slice(5), kWh: x.consumo }));
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Olá, Inquilino 👋</h1>
          <p className="text-sm text-muted">Visão em tempo real das suas unidades vinculadas</p>
        </div>
        {d.alertas?.length>0 && <Badge variant="warn">{d.alertas[0]}</Badge>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Energia (mês)" value={`${d.consumoAtual.energia.toFixed(0)} kWh`} sub={`Média ${d.medias.energia.toFixed(0)} kWh`} trend={d.tendencias.energia} />
        <Stat label="Água (mês)" value={`${d.consumoAtual.agua.toFixed(1)} m³`} sub={`Média ${d.medias.agua.toFixed(1)} m³`} trend={d.tendencias.agua} />
        <Stat label="Gás (mês)" value={`${d.consumoAtual.gas.toFixed(1)} m³`} sub={`Média ${d.medias.gas.toFixed(1)} m³`} trend={d.tendencias.gas} />
        <Card className="flex flex-col justify-center">
          <div className="text-sm text-muted">Total faturado no mês</div>
          <div className="text-2xl font-bold mt-1">{brl(d.faturas.totalMes)}</div>
          <div className="text-xs text-muted mt-1">{d.faturas.emAberto} em aberto • {d.faturas.vencidas} vencidas</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Consumo mensal • Energia</h3>
            <Badge variant="brand">Últimos 12 meses</Badge>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energiaSeries}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="kWh" stroke="#059669" fill="#dcfce7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mt-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Consumo</span>
            <span>• Comparativo anual automático</span>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Próximos vencimentos</h3>
          {d.faturas.proximoVencimento ? (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm"><span>{d.faturas.proximoVencimento.tipo}</span><span className="font-semibold">{brl(d.faturas.proximoVencimento.valorTotal)}</span></div>
              <div className="text-xs text-muted">Vence em {new Date(d.faturas.proximoVencimento.dataVencimento).toLocaleDateString("pt-BR")}</div>
              <div className="flex gap-2 mt-3">
                <a href="/portal/pix" className="btn-primary flex-1 text-center text-sm py-2">Pagar com PIX</a>
                <a href="/portal/faturas" className="btn-ghost flex-1 text-center text-sm py-2">Ver faturas</a>
              </div>
            </div>
          ) : <div className="text-sm text-muted mt-3">Nenhuma fatura em aberto 🎉</div>}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-50 rounded-2xl p-2"><div className="text-lg font-bold">{d.faturas.emAberto}</div><div className="text-[11px] text-muted">Em aberto</div></div>
            <div className="bg-rose-50 rounded-2xl p-2"><div className="text-lg font-bold text-rose-600">{d.faturas.vencidas}</div><div className="text-[11px] text-muted">Vencidas</div></div>
            <div className="bg-emerald-50 rounded-2xl p-2"><div className="text-lg font-bold text-emerald-700">PIX</div><div className="text-[11px] text-muted">Copia e cola</div></div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold">Comparativo 12 meses</h3>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-muted text-xs"><th className="text-left py-2">Mês</th><th className="text-right">Energia kWh</th><th className="text-right">Água m³</th><th className="text-right">Gás m³</th></tr></thead>
            <tbody>
              {d.historico12m.energia.map((e:any,i:number)=>(
                <tr key={e.ref} className="border-t border-zinc-100">
                  <td className="py-2">{formatRef(e.ref)}</td>
                  <td className="text-right">{e.consumo.toFixed(0)}</td>
                  <td className="text-right">{d.historico12m.agua[i]?.consumo.toFixed(1) ?? "-"}</td>
                  <td className="text-right">{d.historico12m.gas[i]?.consumo.toFixed(1) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function mock() {
  const refs = Array.from({length:12},(_,i)=> {
    const d = new Date(); d.setMonth(d.getMonth()-(11-i));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
  const r = (min:number,max:number)=> Math.round((Math.random()*(max-min)+min)*10)/10;
  return {
    consumoAtual: { energia: 312, agua: 11.4, gas: 9.2 },
    medias: { energia: 278, agua: 10.1, gas: 8.7 },
    tendencias: { energia: "up", agua: "down", gas: "flat" },
    historico12m: {
      energia: refs.map(ref=>({ ref, consumo: r(210,340) })),
      agua: refs.map(ref=>({ ref, consumo: r(8,13) })),
      gas: refs.map(ref=>({ ref, consumo: r(6,11) })),
    },
    faturas: { totalMes: 842.5, emAberto: 2, vencidas: 1, proximoVencimento: { tipo: "CONDOMINIO", valorTotal: 542.5, dataVencimento: new Date(Date.now()+3*86400000).toISOString() } },
    alertas: ["Consumo de energia 20% acima da média"]
  };
}
