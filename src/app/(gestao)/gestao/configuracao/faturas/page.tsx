"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function FaturasPdfPage(){
  const [unidades,setUnidades]=useState<any[]>([]);
  const [inquilinos,setInquilinos]=useState<any[]>([]);
  const [lista,setLista]=useState<any[]>([]);
  const [filtroUnidade,setFiltroUnidade]=useState("");
  const [filtroInquilino,setFiltroInquilino]=useState("");
  const [referencia,setReferencia]=useState("2026-08");
  const [tipo,setTipo]=useState("TODOS");

  async function load(){
    const [u,f,inq] = await Promise.all([
      fetch("/api/admin/unidades").then(r=>r.json()).catch(()=>[]),
      fetch("/api/admin/contas").then(r=>r.json()).catch(()=>[]),
      fetch("/api/gestao/inquilinos").then(r=>r.json()).catch(()=>[]),
    ]);
    if(Array.isArray(u) && !u[0]?.error) setUnidades(u);
    if(Array.isArray(inq) && !inq[0]?.error) setInquilinos(inq);
    let faturas:any[] = [];
    if(Array.isArray(f) && f.length) faturas = f;
    else {
      const fb = await fetch("/api/faturas").then(r=>r.json()).catch(()=>[]);
      if(Array.isArray(fb)) faturas = fb;
    }
    setLista(faturas);
  }
  useEffect(()=>{ load(); },[]);

  function inquilinosDaUnidade(unidadeId:string){
    return inquilinos.filter((inq:any)=> (inq.unidades||[]).some((v:any)=> v.unidadeId===unidadeId || v.unidade?.id===unidadeId));
  }
  const filtrados = lista.filter((f:any)=>{
    if(filtroUnidade && f.unidadeId!==filtroUnidade && f.unidade?.id!==filtroUnidade) return false;
    if(filtroInquilino){
      // fatura já é per-inquilino se tem inquilinoId
      if(f.inquilinoId || f.inquilino){
        if((f.inquilinoId||f.inquilino?.id) !== filtroInquilino) return false;
      } else {
        const inqs = inquilinosDaUnidade(f.unidadeId || f.unidade?.id);
        if(!inqs.some((i:any)=> i.id===filtroInquilino)) return false;
      }
    }
    if(referencia && f.referencia!==referencia) return false;
    if(tipo!=="TODOS" && f.tipo!==tipo) return false;
    return true;
  });

  function unidadeNome(f:any){
    return f.unidade?.identificacao || unidades.find((u:any)=>u.id===f.unidadeId)?.identificacao || f.unidadeId;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">Configuração — Faturas em PDF</h1>
        <a href="/gestao/configuracao" className="bg-white border rounded-full px-3 py-1 text-xs">Leituristas</a>
        <a href="/gestao/configuracao/pix" className="bg-white border rounded-full px-3 py-1 text-xs">Pix BCB</a>
        <span className="bg-zinc-900 text-white rounded-full px-3 py-1 text-xs">Faturas PDF</span>
      </div>
      <p className="text-xs text-zinc-500">Visualize todas as faturas em PDF de determinada Unidade e Inquilino, filtrando por Referência (ex: 2026-08), Unidade e Inquilino.</p>

      <Card className="space-y-3">
        <div className="grid md:grid-cols-5 gap-3">
          <label className="text-sm">Unidade<select value={filtroUnidade} onChange={e=>{setFiltroUnidade(e.target.value); setFiltroInquilino("");}} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Todas as unidades</option>{unidades.map((u:any)=><option key={u.id} value={u.id}>{u.identificacao}</option>)}</select></label>
          <label className="text-sm">Inquilino<select value={filtroInquilino} onChange={e=>setFiltroInquilino(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Todos inquilinos</option>{(filtroUnidade ? inquilinosDaUnidade(filtroUnidade) : inquilinos).map((i:any)=><option key={i.id} value={i.id}>{i.nome}</option>)}</select></label>
          <label className="text-sm">Referência<input value={referencia} onChange={e=>setReferencia(e.target.value)} placeholder="2026-08" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Tipo<select value={tipo} onChange={e=>setTipo(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2"><option>TODOS</option><option>ENERGIA</option><option>AGUA</option><option>GAS</option><option>CONDOMINIO</option><option>TAXA_EXTRA</option></select></label>
          <div className="flex items-end gap-2">
            <button onClick={load} className="flex-1 bg-zinc-900 text-white rounded-xl py-2 text-sm">Atualizar</button>
            <button onClick={()=>{setFiltroUnidade(""); setFiltroInquilino(""); setReferencia("2026-08"); setTipo("TODOS");}} className="flex-1 border rounded-xl py-2 text-sm">Limpar</button>
          </div>
        </div>
        <div className="text-xs text-zinc-500">{filtrados.length} fatura(s) encontrada(s) • Referência <b>{referencia}</b> {filtroUnidade ? `• Unidade ${unidades.find((u:any)=>u.id===filtroUnidade)?.identificacao||filtroUnidade}` : "• Todas unidades"}</div>
      </Card>

      {(() => {
        // Se fatura já tem inquilino (novo modelo per-inquilino com rateio), usa direto; senão expande (legado)
        const linhas: {f:any; inquilino:any|null}[] = [];
        filtrados.forEach((f:any)=>{
          if(f.inquilinoId || f.inquilino){
            const inq = f.inquilino || inquilinos.find((i:any)=> i.id===f.inquilinoId) || null;
            linhas.push({f, inquilino: inq});
          } else {
            const inqs = inquilinosDaUnidade(f.unidadeId || f.unidade?.id);
            if(inqs.length===0) linhas.push({f, inquilino:null});
            else inqs.forEach((inq:any)=> linhas.push({f, inquilino:inq}));
          }
        });
        async function abrirPdf(faturaId:string, inqId:string|null, nomeArq:string){
          const url = inqId ? `/api/faturas/${faturaId}/pdf?inquilinoId=${inqId}` : `/api/faturas/${faturaId}/pdf`;
          const res = await fetch(url);
          const ct = res.headers.get("Content-Type")||"";
          if(!res.ok || ct.includes("application/json")){
            const txt = await res.text();
            // se veio txt/json, mostra e não tenta abrir como PDF
            alert(txt.slice(0,500) || "Erro ao gerar PDF");
            return null;
          }
          const blob = await res.blob();
          if(blob.type.includes("text") || blob.size<200){
            const txt = await blob.text();
            alert(txt.slice(0,500) || "Resposta não é PDF");
            return null;
          }
          return { blob, url: URL.createObjectURL(blob), filename: nomeArq };
        }
        async function verPdf(faturaId:string, inqId:string|null, nome:string){
          const r = await abrirPdf(faturaId, inqId, nome);
          if(!r) return;
          window.open(r.url, "_blank");
        }
        async function baixarPdf(faturaId:string, inqId:string|null, nome:string){
          const r = await abrirPdf(faturaId, inqId, nome);
          if(!r) return;
          const a = document.createElement("a");
          a.href = r.url; a.download = r.filename; a.click();
          setTimeout(()=> URL.revokeObjectURL(r.url), 2000);
        }
        return (
      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Faturas — {referencia}</h3><Badge variant="default">{linhas.length} registros ({filtrados.length} faturas)</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left">Unidade</th><th>Inquilino</th><th>Tipo</th><th>Ref</th><th className="text-right">Valor</th><th>Status</th><th>Vencimento</th><th className="text-right">PDF</th></tr></thead>
            <tbody>
              {linhas.map(({f, inquilino}:any)=>{
                const nomeArq = `fatura-${f.tipo}-${f.referencia}-${unidadeNome(f)}-${inquilino?.nome?.replace(/\s+/g,'_')||'unidade'}.pdf`;
                return (
                <tr key={`${f.id}-${inquilino?.id||'unidade'}`} className="border-t">
                  <td className="text-xs font-medium">{unidadeNome(f)}</td>
                  <td className="text-xs">{inquilino ? <span className="font-medium">{inquilino.nome}</span> : <span className="text-zinc-400">— sem inquilino</span>}</td>
                  <td className="text-center"><Badge variant="default">{f.tipo}</Badge></td>
                  <td className="text-xs text-center">{f.referencia}</td>
                  <td className="text-right">{brl(f.valorTotal)}</td>
                  <td className="text-center"><Badge variant={f.status==="PAGA"?"success":f.status==="VENCIDA"?"danger":"default"}>{f.status}</Badge></td>
                  <td className="text-xs text-center">{new Date(f.dataVencimento).toLocaleDateString("pt-BR")}</td>
                  <td className="text-right space-x-1">
                    <button onClick={()=>verPdf(f.id, inquilino?.id||null, nomeArq)} className="bg-emerald-700 text-white rounded-full px-3 py-1 text-xs">Ver PDF</button>
                    <button onClick={()=>baixarPdf(f.id, inquilino?.id||null, nomeArq)} className="border rounded-full px-3 py-1 text-xs">Baixar</button>
                  </td>
                </tr>
              )})}
              {linhas.length===0 && <tr><td colSpan={8} className="text-center py-6 text-zinc-500">Nenhuma fatura para {referencia}{filtroUnidade ? ` na unidade ${unidades.find((u:any)=>u.id===filtroUnidade)?.identificacao||filtroUnidade}` : ""}{filtroInquilino ? ` • inquilino ${inquilinos.find((i:any)=>i.id===filtroInquilino)?.nome||filtroInquilino}` : ""}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">Cada linha = 1 fatura do inquilino. PDF personalizado com dados do inquilino (medidores, QR). Se txt, faça login em /login antes.</p>
      </Card>
        )})()}
    </div>
  );
}
