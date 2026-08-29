"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function GestaoPage(){
  const [bi,setBi]=useState<any>(null);
  useEffect(()=>{
    fetch("/api/gestao/bi").then(r=>r.json()).then(j=> j.contas? setBi(j): setBi(mock())).catch(()=> setBi(mock()));
  },[]);
  if(!bi) return <div className="card">Carregando BI Gestão...</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Módulo Gestão — Dashboard BI</h1>
      <p className="text-xs text-zinc-500">Visão por <b>Contas, Condomínio, Leitura e Inquilinos</b> e suas particularidades.</p>

      {/* Atalhos */}
      <div className="grid md:grid-cols-4 gap-2">
        <Link href="/gestao/contas" className="bg-white border rounded-2xl p-3 text-center hover:shadow-sm"><b className="text-sm">Contas</b><div className="text-xs text-zinc-500">{bi.contas.total} faturas</div></Link>
        <Link href="/gestao/condominio" className="bg-emerald-700 text-white rounded-2xl p-3 text-center"><b className="text-sm">Condomínio</b><div className="text-xs opacity-80">{bi.condominio.total} despesas</div></Link>
        <Link href="/gestao/leituras" className="bg-white border rounded-2xl p-3 text-center hover:shadow-sm"><b className="text-sm">Leitura</b><div className="text-xs text-zinc-500">{bi.leituras.total} leituras</div></Link>
        <Link href="/gestao/inquilinos" className="bg-white border rounded-2xl p-3 text-center hover:shadow-sm"><b className="text-sm">Inquilinos</b><div className="text-xs text-zinc-500">{bi.inquilinos.total} inquilinos</div></Link>
      </div>

      {/* BI Contas */}
      <Card>
        <h3 className="font-semibold text-sm">Contas — particularidades</h3>
        <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Por tipo</div>
            {Object.entries(bi.contas.porTipo).map(([k,v]:any)=> <div key={k} className="flex justify-between text-xs"><span>{k}</span><b>{v as number}</b></div>)}
            <div className="mt-2 text-xs">Valor total <b>{brl(bi.contas.valorTotal)}</b> • Demonstrativo <b>{brl(bi.contas.valorDemonstrativo)}</b></div>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Por status</div>
            {Object.entries(bi.contas.porStatus).map(([k,v]:any)=> <div key={k} className="flex justify-between text-xs"><span>{k}</span><Badge variant={k==="PAGA"?"success":k==="VENCIDA"?"danger":"default"}>{v as number}</Badge></div>)}
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Demonstrativo</div>
            <div className="text-xs">Água/Gás/Energia com toggle `exibirDemonstrativo`; Condomínio sempre exibe Valor e Descrição.</div>
          </div>
        </div>
      </Card>

      {/* BI Condomínio */}
      <Card>
        <h3 className="font-semibold text-sm">Condomínio — particularidades</h3>
        <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
          <div className="bg-blue-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Por categoria</div>
            {Object.entries(bi.condominio.porCategoria).map(([k,v]:any)=> <div key={k} className="flex justify-between text-xs"><span>{k}</span><b>{v as number}</b></div>)}
            <div className="text-xs mt-1">Valor total <b>{brl(bi.condominio.valorTotal)}</b> • {bi.condominio.unidades} unidades com rateio</div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Por tipo cobrança</div>
            {Object.entries(bi.condominio.porCobranca).map(([k,v]:any)=> <div key={k} className="flex justify-between text-xs"><span>{k}</span><b>{v as number}</b></div>)}
            <div className="text-xs mt-1">Outros exige especificação (Internet, Manutenção...)</div>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Rateio</div>
            <div className="text-xs">Cada despesa gera `Fatura CONDOMINIO` por unidade com `criterioRateio` visível no PDF.</div>
          </div>
        </div>
      </Card>

      {/* BI Leitura */}
      <Card>
        <h3 className="font-semibold text-sm">Leitura — particularidades</h3>
        <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Por tipo</div>
            {Object.entries(bi.leituras.porTipo).map(([k,v]:any)=> <div key={k} className="flex justify-between text-xs"><span>{k}</span><b>{v as number}</b></div>)}
          </div>
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Consumo médio</div>
            <div className="text-xs">Energia <b>{bi.leituras.consumoMedio.ENERGIA.toFixed(0)} kWh</b></div>
            <div className="text-xs">Água <b>{bi.leituras.consumoMedio.AGUA.toFixed(1)} m³</b> • Gás <b>{bi.leituras.consumoMedio.GAS.toFixed(1)} m³</b></div>
            <div className="text-xs mt-1">Alertas {bi.leituras.alertas} leituras &gt;300</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3">
            <div className="text-xs">Validação por QR único do medidor por tipo evita erro de unidade.</div>
          </div>
        </div>
      </Card>

      {/* BI Inquilinos */}
      <Card>
        <h3 className="font-semibold text-sm">Inquilinos — particularidades</h3>
        <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Totais</div>
            <div className="flex justify-between text-xs"><span>Ativos</span><b className="text-emerald-600">{bi.inquilinos.ativos}</b></div>
            <div className="flex justify-between text-xs"><span>Inativos</span><b>{bi.inquilinos.inativos}</b></div>
            <div className="text-xs mt-1">Medidores: Energia {bi.inquilinos.medidores.energia} • Água {bi.inquilinos.medidores.agua} • Gás {bi.inquilinos.medidores.gas}</div>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Por cobrança — Energia</div>
            {Object.entries(bi.inquilinos.porCobranca.ENERGIA).map(([k,v]:any)=> <div key={k} className="flex justify-between text-xs"><span>{k}</span><b>{v as number}</b></div>)}
          </div>
          <div className="bg-zinc-50 rounded-2xl p-3">
            <div className="text-xs text-zinc-500">Água / Gás</div>
            <div className="text-xs">Água {Object.entries(bi.inquilinos.porCobranca.AGUA).map(([k,v]:any)=> `${k}:${v}`).join(" • ")}</div>
            <div className="text-xs">Gás {Object.entries(bi.inquilinos.porCobranca.GAS).map(([k,v]:any)=> `${k}:${v}`).join(" • ")}</div>
            <div className="text-xs mt-1">Cada medidor: código único + QR + medição inicial + tipo cobrança</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
function mock(){
  return {
    contas: { total: 24, porTipo: { ENERGIA:6, AGUA:6, GAS:6, CONDOMINIO:4, TAXA_EXTRA:2 }, porStatus: { ABERTA:8, PAGA:12, VENCIDA:3, EM_CONTESTACAO:1 }, valorTotal: 5420, valorDemonstrativo: 4800 },
    condominio: { total: 5, porCategoria: { ENERGIA:1, AGUA:1, GAS:1, OUTROS:2 }, porCobranca: { RATIO:1, COMPARTILHADA:2, PORCENTAGEM:2 }, valorTotal: 2400, unidades: 2 },
    leituras: { total: 36, porTipo: { ENERGIA:12, AGUA:12, GAS:12 }, consumoMedio: { ENERGIA: 280, AGUA: 11, GAS: 8.5 }, alertas: 2 },
    inquilinos: { total: 8, ativos: 7, inativos: 1, porCobranca: { ENERGIA: { RATIO:1, COMPARTILHADA:5, PORCENTAGEM:2 }, AGUA: { RATIO:0, COMPARTILHADA:6, PORCENTAGEM:2 }, GAS: { RATIO:0, COMPARTILHADA:7, PORCENTAGEM:1 } }, medidores: { energia:8, agua:6, gas:5 } },
  };
}
