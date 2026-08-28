"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";

export default function AdminPage(){
  const [stats,setStats]=useState<any>(null);
  useEffect(()=>{
    fetch("/api/admin/dashboard").then(r=>r.json()).then(j=> j.totais? setStats(j): setStats(mock())).catch(()=> setStats(mock()));
  },[]);
  if(!stats) return <div className="card">Carregando dashboard Master...</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Painel Master</h1>
      <p className="text-xs text-zinc-500">Visão exclusiva Master: quantidades por papel e contratos. Gestão de contas fica em <b>/gestao</b> (ADMINISTRADOR/PROPRIETÁRIO).</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><div className="text-xs text-zinc-500">Inquilinos</div><div className="text-2xl font-bold">{stats.totais.inquilinos}</div><div className="text-xs text-zinc-500">cadastrados</div></Card>
        <Card><div className="text-xs text-zinc-500">Administradores</div><div className="text-2xl font-bold">{stats.totais.administradores}</div><div className="text-xs text-zinc-500">papel ADMINISTRADOR</div></Card>
        <Card><div className="text-xs text-zinc-500">Proprietários</div><div className="text-2xl font-bold">{stats.totais.proprietarios}</div><div className="text-xs text-zinc-500">papel PROPRIETÁRIO</div></Card>
        <Card><div className="text-xs text-zinc-500">Ativos / Inativos</div><div className="text-lg font-bold"><span className="text-emerald-600">{stats.totais.ativos}</span> / <span className="text-zinc-500">{stats.totais.inativos}</span></div><div className="text-xs text-zinc-500">ADMIN+PROP</div></Card>
      </div>

      <Card>
        <h3 className="font-semibold text-sm">Inquilinos por Administrador/Proprietário</h3>
        <div className="mt-2 space-y-1 text-sm">
          {Object.entries(stats.inquilinosPorAdmin||{}).map(([id,q]:any)=> <div key={id} className="flex justify-between border-b py-1"><span className="text-xs text-zinc-500">{id.slice(0,8)}</span><span>{q} inquilinos</span></div>)}
          {(!stats.inquilinosPorAdmin || Object.keys(stats.inquilinosPorAdmin).length===0) && <div className="text-xs text-zinc-500">Vincule administradores a unidades em /admin/administradores para ver distribuição.</div>}
        </div>
      </Card>

      {stats.expirando?.length>0 && (
        <Card>
          <h3 className="font-semibold text-sm">Contratos a expirar em 15 dias</h3>
          <div className="mt-2 space-y-1">
            {stats.expirando.map((e:any)=> <div key={e.id} className="flex justify-between text-sm border-b py-1"><span>{e.nome} <Badge variant="warn">{e.papel}</Badge> <span className="text-xs">{e.plano}</span></span><span className="text-xs text-rose-600">{new Date(e.dataExpiracao).toLocaleDateString("pt-BR")}</span></div>)}
          </div>
        </Card>
      )}

      <Link href="/admin/administradores" className="block bg-zinc-900 text-white rounded-2xl p-4 text-center font-semibold">Gerenciar Administradores & Proprietários →</Link>
      <div className="text-xs text-zinc-500 text-center">Master só vê este dashboard + grade de cadastros. Nada mais.</div>
    </div>
  );
}
function mock(){
  return { totais: { inquilinos: 12, administradores: 2, proprietarios: 3, ativos: 4, inativos: 1 }, inquilinosPorAdmin: { "a1": 5, "p1": 3 }, expirando: [{ id:"a1", nome:"Admin Centro", papel:"ADMINISTRADOR", plano:"TRIAL", dataExpiracao: new Date(Date.now()+5*86400000).toISOString() }] };
}
