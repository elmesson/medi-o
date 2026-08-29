"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { brl } from "@/lib/utils";

export default function ContasPage(){
  const [lista,setLista]=useState<any[]>([]);
  const [form,setForm]=useState({ unidadeId:"", tipo:"ENERGIA", referencia: new Date().toISOString().slice(0,7), valorTotal:"", criterioRateio:"Medição individual", dataVencimento: new Date().toISOString().slice(0,10), status:"ABERTA", valorDemonstrativo:"", descricaoDemonstrativo:"", exibirDemonstrativo: true, bandeira:"VERDE" });
  const [unidades,setUnidades]=useState<any[]>([]);
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});

  async function load(){
    const [f, u] = await Promise.all([
      fetch("/api/admin/contas").then(r=>r.json()).catch(()=>[]),
      fetch("/api/admin/unidades").then(r=>r.json()).catch(()=>[])
    ]);
    if(Array.isArray(f)) setLista(f);
    else {
      const fallback = await fetch("/api/faturas").then(r=>r.json()).catch(()=>[]);
      if(Array.isArray(fallback)) setLista(fallback);
    }
    if(Array.isArray(u) && u.length && !u[0]?.error) setUnidades(u);
    else if(Array.isArray(u) && u[0]?.error) {
      // sem acesso, tenta fallback antigo para não quebrar
      setUnidades([{id:"bl-a-101", identificacao:"BL-A-101"}, {id:"bl-a-102", identificacao:"BL-A-102"}] as any);
    } else {
      setUnidades([{id:"bl-a-101", identificacao:"BL-A-101"}, {id:"bl-a-102", identificacao:"BL-A-102"}] as any);
    }
  }
  useEffect(()=>{ load(); },[]);

  const [avisoLeitura,setAvisoLeitura]=useState<any>(null);
  async function criar(e: React.FormEvent){
    e.preventDefault();
    setAvisoLeitura(null);
    const selUnidade = unidades.find((u:any)=> u.id===form.unidadeId);
    const payload:any = { ...form, valorTotal: Number(form.valorTotal), dataEmissao: new Date().toISOString(), dataVencimento: new Date(form.dataVencimento).toISOString(), valorDemonstrativo: form.valorDemonstrativo? Number(form.valorDemonstrativo): null, bandeira: form.tipo==="ENERGIA" ? form.bandeira : null };
    if(form.tipo==="CONDOMINIO") payload.exibirDemonstrativo = true;
    const res = await fetch("/api/admin/contas", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(payload) });
    if(res.ok) {
      const created = await res.json();
      const arr = Array.isArray(created) ? created : [created];
      const withUnidade = arr.map((c:any)=> c.unidade ? c : { ...c, unidade: selUnidade ? { id: selUnidade.id, identificacao: selUnidade.identificacao } : { id: form.unidadeId, identificacao: form.unidadeId } });
      setLista([...withUnidade, ...lista]);
      if(arr.length>1) alert(`${arr.length} faturas geradas (rateio por Tipo de cobrança):\n` + arr.map((c:any)=> `${c.inquilino?.nome||'Inquilino'}: ${brl(c.valorTotal)} (${c.criterioRateio})`).join("\n"));
      setForm({ unidadeId:"", tipo:"ENERGIA", referencia: new Date().toISOString().slice(0,7), valorTotal:"", criterioRateio:"Medição individual", dataVencimento: new Date().toISOString().slice(0,10), status:"ABERTA", valorDemonstrativo:"", descricaoDemonstrativo:"", exibirDemonstrativo: true, bandeira:"VERDE" });
      load();
    }
    else {
      const err = await res.json().catch(()=>({error:'Erro'}));
      if(err.code==="LEITURA_PENDENTE"){
        setAvisoLeitura(err);
      } else alert(err.error||'Falha ao cadastrar conta');
    }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ valorTotal: item.valorTotal, criterioRateio: item.criterioRateio||"", dataVencimento: new Date(item.dataVencimento).toISOString().slice(0,10), status: item.status, tipo: item.tipo, referencia: item.referencia, valorDemonstrativo: item.valorDemonstrativo||"", descricaoDemonstrativo: item.descricaoDemonstrativo||"", exibirDemonstrativo: item.exibirDemonstrativo!==false, bandeira: item.bandeira||"VERDE" });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const payload:any = { id: edit.id, ...editForm, valorTotal: Number(editForm.valorTotal), valorDemonstrativo: editForm.valorDemonstrativo? Number(editForm.valorDemonstrativo): null };
    const res = await fetch("/api/admin/contas", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(payload) });
    if(res.ok) load(); else setLista(lista.map(x=> x.id===edit.id? {...x, ...editForm, valorTotal: Number(editForm.valorTotal)}:x));
    setEdit(null);
  }
  async function remover(id:string){
    if(!confirm("Remover conta?")) return;
    await fetch(`/api/admin/contas?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestão — Contas</h1>
      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">Cadastrar conta do proprietário</h3>
        <form onSubmit={criar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Unidade / Unidade ID<select value={form.unidadeId} onChange={e=>setForm({...form, unidadeId:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Selecione</option>{unidades.map((u:any)=><option key={u.id} value={u.id}>{u.identificacao}</option>)}</select></label>
          <label className="text-sm">Tipo<select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="ENERGIA">ENERGIA ELÉTRICA</option><option value="AGUA">ÁGUA</option><option value="GAS">GÁS</option><option value="CONDOMINIO">CONDOMÍNIO</option><option value="TAXA_EXTRA">TAXA EXTRA</option></select></label>
          {form.tipo==="ENERGIA" && (
            <label className="text-sm md:col-span-3">Cor da bandeira
              <select value={form.bandeira} onChange={e=>setForm({...form, bandeira:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">
                <option value="VERDE">Verde - Condições favoráveis de geração de energia</option>
                <option value="AMARELA">Amarela - Condições menos favoráveis (a cada 100 kWh consumido)</option>
                <option value="VERMELHA_P1">Vermelha Patamar 1 - Condições mais custosas (a cada 100 kWh)</option>
                <option value="VERMELHA_P2">Vermelha Patamar 2 - Condição ainda mais custosa</option>
              </select>
            </label>
          )}
          <label className="text-sm">Referência<input value={form.referencia} onChange={e=>setForm({...form, referencia:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Valor total<input type="number" step="0.01" value={form.valorTotal} onChange={e=>setForm({...form, valorTotal:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Vencimento<input type="date" value={form.dataVencimento} onChange={e=>setForm({...form, dataVencimento:e.target.value})} required className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Status<select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ABERTA</option><option>PAGA</option><option>VENCIDA</option><option>EM_CONTESTACAO</option></select></label>
          <label className="text-sm md:col-span-3">Critério / Rateio<input value={form.criterioRateio} onChange={e=>setForm({...form, criterioRateio:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm">Valor fatura (demonstrativo)<input type="number" step="0.01" value={form.valorDemonstrativo} onChange={e=>setForm({...form, valorDemonstrativo:e.target.value})} placeholder="ex: 250.00" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          <label className="text-sm md:col-span-2">Descrição demonstrativo<input value={form.descricaoDemonstrativo} onChange={e=>setForm({...form, descricaoDemonstrativo:e.target.value})} placeholder="ex: Consumo medido + taxa mínima" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
          {form.tipo!=="CONDOMINIO" ? <label className="text-sm flex items-center gap-2 bg-zinc-50 rounded-xl px-3 py-2"><input type="checkbox" checked={form.exibirDemonstrativo} onChange={e=>setForm({...form, exibirDemonstrativo:e.target.checked})} /> Exibir no demonstrativo PDF</label> : <div className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">Condomínio: sempre exibe Valor e Descrição</div>}
          <button className="md:col-span-3 bg-emerald-700 text-white rounded-2xl py-2.5 font-semibold">Cadastrar conta</button>
        </form>
        {avisoLeitura && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="font-bold text-amber-800 text-sm">⚠️ Leitura pendente</div>
            <div className="text-sm text-amber-900">{avisoLeitura.error}</div>
            <div className="text-xs text-zinc-700">Unidade <b>{avisoLeitura.unidade?.identificacao}</b> — Tipo <b>{avisoLeitura.tipo}</b> — Referência <b>{avisoLeitura.referencia}</b></div>
            {avisoLeitura.inquilinos?.length>0 && (
              <div className="bg-white rounded-xl p-2">
                <div className="text-xs font-semibold mb-1">Inquilinos nesta unidade ({avisoLeitura.inquilinos.length}):</div>
                <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th className="text-left">Inquilino</th><th>Medidor</th><th>Tipo cobrança</th></tr></thead><tbody>{avisoLeitura.inquilinos.map((inq:any)=><tr key={inq.id} className="border-t"><td>{inq.nome}</td><td className="font-mono">{inq.medidor||'—'}</td><td>{inq.tipoCobranca||'COMPARTILHADA'}</td></tr>)}</tbody></table>
                <div className="text-[11px] text-zinc-500 mt-1">Após realizar todas as leituras com o Tipo de cobrança específico (RATIO/COMPARTILHADA/PORCENTAGEM), o sistema calculará automaticamente o rateio e gerará as faturas.</div>
              </div>
            )}
            {avisoLeitura.inquilinos?.length===0 && <div className="text-xs text-zinc-600">Nenhum inquilino vinculado a esta unidade. Cadastre inquilinos em Gestão → Inquilinos antes de faturar.</div>}
            <div className="flex gap-2">
              <a href="/gestao/leituras" className="bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm text-center flex-1">Ir para Leituras</a>
              <button onClick={()=> setAvisoLeitura(null)} className="border rounded-xl px-4 py-2 text-sm flex-1">Fechar</button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa — Contas</h3><Badge variant="default">{lista.length} registros</Badge></div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th className="text-left">Tipo</th><th>Ref</th><th>Unidade</th><th>Inquilino</th><th>Rateio</th><th>Bandeira</th><th className="text-right">Valor</th><th className="text-right">Demonstrativo</th><th>Exibir</th><th>Vencimento</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.map((f:any)=>(
                <tr key={f.id} className="border-t"><td>{f.tipo}</td><td className="text-center">{f.referencia}</td><td className="text-xs" title={f.unidadeId}>{f.unidade?.identificacao || unidades.find((u:any)=>u.id===f.unidadeId)?.identificacao || f.unidadeId} </td><td className="text-xs">{f.inquilino?.nome ? <span className="font-medium">{f.inquilino.nome}</span> : <span className="text-zinc-400">—</span>}</td><td className="text-[10px] max-w-[160px] truncate" title={f.criterioRateio}>{f.criterioRateio||"-"}</td><td className="text-xs text-center">{f.tipo==="ENERGIA" ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.bandeira==="VERDE"?"bg-emerald-100 text-emerald-700":f.bandeira==="AMARELA"?"bg-amber-100 text-amber-700":f.bandeira?.startsWith("VERMELHA")?"bg-rose-100 text-rose-700":"bg-zinc-100"}`}>{f.bandeira||"VERDE"}</span> : "-"}</td><td className="text-right">{brl(f.valorTotal)}{f.rateioValor && f.rateioValor!==f.valorTotal ? <div className="text-[10px] text-zinc-500">{brl(f.rateioValor)}</div> : null}</td><td className="text-right text-xs">{f.valorDemonstrativo ? brl(f.valorDemonstrativo) : "-"}<div className="text-[10px] text-zinc-500 truncate max-w-[120px]">{f.descricaoDemonstrativo||""}</div></td><td className="text-center text-xs">{f.tipo==="CONDOMINIO" ? <span className="text-emerald-600">Sempre</span> : f.exibirDemonstrativo===false ? <span className="text-zinc-500">Desativado</span> : <span className="text-emerald-600">Ativo</span>}</td><td className="text-xs text-center">{new Date(f.dataVencimento).toLocaleDateString("pt-BR")}</td><td className="text-center"><Badge variant={f.status==="PAGA"?"success":f.status==="VENCIDA"?"danger":"default"}>{f.status}</Badge></td><td className="text-right space-x-1"><button onClick={()=>iniciarEdicao(f)} className="text-xs bg-emerald-700 text-white rounded-full px-3 py-1">Alterar</button><button onClick={()=>remover(f.id)} className="text-xs text-rose-600">Remover</button></td></tr>
              ))}
              {lista.length===0 && <tr><td colSpan={12} className="text-center py-6 text-zinc-500">Nenhuma conta</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-bold">Alterar conta — {edit.tipo} {edit.referencia}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Tipo<select value={editForm.tipo} onChange={e=>setEditForm({...editForm, tipo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ENERGIA</option><option>AGUA</option><option>GAS</option><option>CONDOMINIO</option><option>TAXA_EXTRA</option></select></label>
              <label className="text-sm">Referência<input value={editForm.referencia} onChange={e=>setEditForm({...editForm, referencia:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              {editForm.tipo==="ENERGIA" && (
                <label className="text-sm md:col-span-2">Cor da bandeira
                  <select value={editForm.bandeira} onChange={e=>setEditForm({...editForm, bandeira:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">
                    <option value="VERDE">Verde - Condições favoráveis</option>
                    <option value="AMARELA">Amarela - Menos favoráveis (100 kWh)</option>
                    <option value="VERMELHA_P1">Vermelha Patamar 1 - Mais custosas (100 kWh)</option>
                    <option value="VERMELHA_P2">Vermelha Patamar 2 - Ainda mais custosa</option>
                  </select>
                </label>
              )}
              <label className="text-sm">Valor<input type="number" step="0.01" value={editForm.valorTotal} onChange={e=>setEditForm({...editForm, valorTotal:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Vencimento<input type="date" value={editForm.dataVencimento} onChange={e=>setEditForm({...editForm, dataVencimento:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Status<select value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ABERTA</option><option>PAGA</option><option>VENCIDA</option><option>EM_CONTESTACAO</option></select></label>
              <label className="text-sm md:col-span-2">Critério<input value={editForm.criterioRateio} onChange={e=>setEditForm({...editForm, criterioRateio:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Valor demonstrativo<input type="number" step="0.01" value={editForm.valorDemonstrativo} onChange={e=>setEditForm({...editForm, valorDemonstrativo:e.target.value})} placeholder="a cobrar" className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Descrição demonstrativo<input value={editForm.descricaoDemonstrativo} onChange={e=>setEditForm({...editForm, descricaoDemonstrativo:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              {editForm.tipo!=="CONDOMINIO" ? <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={editForm.exibirDemonstrativo} onChange={e=>setEditForm({...editForm, exibirDemonstrativo:e.target.checked})} /> Exibir no PDF</label> : <div className="text-xs bg-emerald-50 text-emerald-700 rounded-xl px-3 py-2">Condomínio sempre exibe</div>}
            </div>
            <div className="flex gap-2"><button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button><button className="flex-1 bg-emerald-700 text-white rounded-2xl py-2 font-semibold">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
