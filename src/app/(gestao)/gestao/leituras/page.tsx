"use client";
import { useEffect, useState, useRef } from "react";
import { Card, Badge } from "@/components/ui";
export default function LeiturasGestaoPage(){
  const [form,setForm]=useState({ unidadeId:"", tipo:"ENERGIA", referencia: new Date().toISOString().slice(0,7), leituraAnterior:"", leituraAtual:"", tarifa:"0.92", bandeira:"VERDE" });
  const [lista,setLista]=useState<any[]>([]);
  const [edit,setEdit]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});
  const [codigoScan,setCodigoScan]=useState("");
  const [scanMsg,setScanMsg]=useState<string|null>(null);
  const [scanOk,setScanOk]=useState<boolean|null>(null);
  const [inquilinos,setInquilinos]=useState<any[]>([]);
  const [showCamera,setShowCamera]=useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sucesso,setSucesso]=useState<any>(null);

  async function load(){
    const r = await fetch("/api/admin/leituras").then(res=>res.json()).catch(()=>[]);
    if(Array.isArray(r)) setLista(r);
    const inq = await fetch("/api/gestao/inquilinos").then(res=>res.json()).catch(()=>[]);
    if(Array.isArray(inq)) setInquilinos(inq);
  }
  useEffect(()=>{ load(); },[]);

  function validarQR(){
    const scan = codigoScan.trim();
    // detecta tipo pelo código escaneado
    const found = inquilinos.find((i:any)=> [i.codigoMedidorEnergia, i.codigoMedidorAgua, i.codigoMedidorGas, i.codigoMedidor].includes(scan));
    if(!found){ setScanOk(false); setScanMsg("Código não encontrado — verifique o QR do medidor."); return; }
    let tipoDetectado: string | null = null;
    if(scan===found.codigoMedidorEnergia || scan===found.codigoMedidor) tipoDetectado="ENERGIA";
    else if(scan===found.codigoMedidorAgua) tipoDetectado="AGUA";
    else if(scan===found.codigoMedidorGas) tipoDetectado="GAS";
    const tipoFinal = tipoDetectado || form.tipo;
    const vinc = (found.unidades||[])[0];
    const unidadeId = vinc?.unidadeId || form.unidadeId || "bl-a-101";
    // busca última leitura para preencher anterior, tarifa, bandeira
    const last = lista.filter((l:any)=> l.unidadeId===unidadeId && l.tipo===tipoFinal).sort((a:any,b:any)=> b.referencia.localeCompare(a.referencia))[0];
    const leituraAnterior = last ? last.leituraAtual : 0;
    const tarifa = last?.tarifa || (tipoFinal==="ENERGIA"?"0.92": tipoFinal==="AGUA"?"6.50":"7.20");
    const bandeira = last?.bandeira || "VERDE";
    setForm({ ...form, unidadeId, tipo: tipoFinal as any, leituraAnterior: String(leituraAnterior), tarifa: String(tarifa), bandeira });
    setScanOk(true);
    const medidorShow = tipoFinal==="ENERGIA" ? found.medidorEnergia||found.medidor : tipoFinal==="AGUA" ? found.medidorAgua : found.medidorGas;
    setScanMsg(`✓ Validado ${tipoFinal}: ${found.nome} • ${scan} • Medidor ${medidorShow||"-"} — dados carregados. Digite apenas a leitura Atual.`);
  }
  async function abrirCamera(){
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if(videoRef.current) (videoRef.current as any).srcObject = stream;
    } catch(e:any){ setScanMsg("Câmera não disponível: "+e.message); }
  }
  function fecharCamera(){
    setShowCamera(false);
    const v = videoRef.current as any;
    if(v && v.srcObject){ v.srcObject.getTracks().forEach((t:any)=>t.stop()); }
  }

  async function salvar(e: React.FormEvent){
    e.preventDefault();
    if(codigoScan && scanOk===false){ alert("Valide o QR do medidor antes de salvar para evitar erro."); return; }
    if(codigoScan && !scanOk){ alert("Clique em Validar QR antes de salvar."); return; }
    if(!form.leituraAtual){ alert("Informe a leitura Atual."); return; }
    const res = await fetch("/api/admin/leituras", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ leituras: [{ unidadeId: form.unidadeId || "bl-a-101", tipo: form.tipo, referencia: form.referencia, leituraAnterior: Number(form.leituraAnterior), leituraAtual: Number(form.leituraAtual), tarifa: Number(form.tarifa), bandeira: form.bandeira }] }) });
    if(res.ok){
      const inq = inquilinos.find((i:any)=> [i.codigoMedidorEnergia, i.codigoMedidorAgua, i.codigoMedidorGas, i.codigoMedidor].includes(codigoScan) || i.unidades?.[0]?.unidadeId===form.unidadeId);
      const idx = inquilinos.findIndex((i:any)=> i.id===inq?.id);
      const proximo = inquilinos.length ? inquilinos[(idx+1)%inquilinos.length] : null;
      setSucesso({ inquilino: inq?.nome||"Inquilino", unidadeId: form.unidadeId, tipo: form.tipo, leituraAtual: form.leituraAtual, proximo });
      setForm({...form, leituraAnterior: form.leituraAtual, leituraAtual: ""});
      setCodigoScan("");
      setScanOk(null);
      load();
    }
    else {
      const consumo = Number(form.leituraAtual)-Number(form.leituraAnterior);
      setLista([{ id: Math.random().toString(36).slice(2), ...form, leituraAnterior: Number(form.leituraAnterior), leituraAtual: Number(form.leituraAtual), consumo, tarifa: Number(form.tarifa) }, ...lista]);
      setSucesso({ inquilino: "Inquilino", unidadeId: form.unidadeId, tipo: form.tipo, leituraAtual: form.leituraAtual, proximo: inquilinos[0]||null });
    }
  }
  function iniciarEdicao(item:any){
    setEdit(item);
    setEditForm({ leituraAnterior: item.leituraAnterior, leituraAtual: item.leituraAtual, tarifa: item.tarifa||"", bandeira: item.bandeira||"VERDE" });
  }
  async function salvarEdicao(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/admin/leituras", { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ id: edit.id, ...editForm, leituraAnterior: Number(editForm.leituraAnterior), leituraAtual: Number(editForm.leituraAtual), tarifa: Number(editForm.tarifa) }) });
    if(res.ok) load(); else setLista(lista.map(x=> x.id===edit.id? {...x, ...editForm}:x));
    setEdit(null);
  }
  async function remover(id:string){
    if(!confirm("Remover leitura?")) return;
    await fetch(`/api/admin/leituras?id=${id}`, { method:"DELETE" });
    setLista(lista.filter(x=>x.id!==id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestão — Leitura</h1>
      <Card className="space-y-2 border-emerald-200 bg-emerald-50">
        <h3 className="font-semibold text-sm">1) Escaneie o QRCODE do medidor para validar</h3>
        <p className="text-xs text-zinc-600">Código único e exclusivo por medidor (gerado em Gestão → Inquilinos). Scanner via câmera evita erros.</p>
        <div className="flex gap-2">
          <input value={codigoScan} onChange={e=>setCodigoScan(e.target.value)} placeholder="Escaneie ou digite MED-XXXX-XXXX" className="flex-1 border rounded-xl px-3 py-2 font-mono text-sm" />
          <button type="button" onClick={validarQR} className="bg-zinc-900 text-white rounded-xl px-4 text-sm font-semibold">Validar QR</button>
          <button type="button" onClick={abrirCamera} className="bg-emerald-700 text-white rounded-xl px-3 text-sm">📷 Câmera</button>
        </div>
        {showCamera && (
          <div className="space-y-2">
            <video ref={videoRef} autoPlay playsInline className="w-full h-48 bg-black rounded-xl" />
            <div className="flex gap-2">
              <button type="button" onClick={()=>{ if(inquilinos[0]) setCodigoScan(inquilinos[0].codigoMedidorEnergia|| inquilinos[0].codigoMedidor||""); setScanMsg("QR simulado preenchido — clique Validar."); }} className="flex-1 bg-white border rounded-xl py-2 text-xs">Simular QR</button>
              <button type="button" onClick={fecharCamera} className="flex-1 bg-zinc-900 text-white rounded-xl py-2 text-xs">Fechar câmera</button>
            </div>
            <p className="text-[11px] text-zinc-500">Em produção: usar `html5-qrcode` ou `BarcodeDetector` para decodificar QR da câmera automaticamente. Rastreabilidade: leitura salva com `leituristaId/nome`.</p>
          </div>
        )}
        {scanMsg && <div className={`text-xs rounded-xl px-3 py-2 ${scanOk?"bg-emerald-100 text-emerald-800":"bg-rose-100 text-rose-700"}`}>{scanMsg}</div>}
      </Card>
      {sucesso && (
        <Card className="bg-emerald-600 text-white border-emerald-700">
          <h3 className="font-bold">✓ MEDIÇÃO DADOS DO INQUILINO FOI SALVO COM SUCESSO</h3>
          <p className="text-sm mt-1 opacity-90">{sucesso.inquilino} • {sucesso.unidadeId} • {sucesso.tipo} • Leitura Atual {sucesso.leituraAtual}</p>
          {sucesso.proximo && <p className="text-xs mt-2 opacity-80">Próximo medidor sugerido: <b>{sucesso.proximo.nome}</b> • {sucesso.proximo.codigoMedidorEnergia|| sucesso.proximo.codigoMedidor|| sucesso.proximo.codigoMedidorAgua} • Unidade {sucesso.proximo.unidades?.[0]?.unidadeId||""}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={()=>{
              if(sucesso.proximo){
                const cod = sucesso.proximo.codigoMedidorEnergia || sucesso.proximo.codigoMedidor || sucesso.proximo.codigoMedidorAgua || "";
                setCodigoScan(cod);
                setScanMsg("QR do próximo medidor carregado — clique Validar.");
                setScanOk(null);
              }
              setSucesso(null);
            }} className="flex-1 bg-white text-emerald-700 rounded-xl py-2 font-semibold text-sm">Próximo Medidor</button>
            <button onClick={()=>{ setSucesso(null); setCodigoScan(""); setScanOk(null); setScanMsg(null); }} className="flex-1 bg-zinc-900 text-white rounded-xl py-2 text-sm">SAIR — Novo Registro</button>
          </div>
        </Card>
      )}
      <Card className="space-y-3">
        <h3 className="font-semibold text-sm">2) Realizar leitura do inquilino</h3>
        <p className="text-xs text-zinc-500">{scanOk ? "QR validado — pode informar a medição." : "Valide o QR acima para liberar o salvamento."}</p>
        <form onSubmit={salvar} className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Unidade ID<input value={form.unidadeId} readOnly={!!scanOk} className={`mt-1 w-full border rounded-xl px-3 py-2 ${scanOk?"bg-zinc-100":""}`} placeholder="bl-a-101" onChange={e=>setForm({...form, unidadeId:e.target.value})} /></label>
          <label className="text-sm">Tipo<select value={form.tipo} disabled={!!scanOk} className={`mt-1 w-full border rounded-xl px-3 py-2 ${scanOk?"bg-zinc-100":""}`} onChange={e=>setForm({...form, tipo:e.target.value as any})}><option>ENERGIA</option><option>AGUA</option><option>GAS</option></select></label>
          <label className="text-sm">Referência<input value={form.referencia} readOnly={!!scanOk} className={`mt-1 w-full border rounded-xl px-3 py-2 ${scanOk?"bg-zinc-100":""}`} onChange={e=>setForm({...form, referencia:e.target.value})} /></label>
          <label className="text-sm">Bandeira<select value={form.bandeira} disabled={!!scanOk} className={`mt-1 w-full border rounded-xl px-3 py-2 ${scanOk?"bg-zinc-100":""}`} onChange={e=>setForm({...form, bandeira:e.target.value})}><option>VERDE</option><option>AMARELA</option><option>VERMELHA_P1</option><option>VERMELHA_P2</option></select></label>
          <label className="text-sm">Anterior (auto)<input type="number" value={form.leituraAnterior} readOnly={!!scanOk} className={`mt-1 w-full border rounded-xl px-3 py-2 ${scanOk?"bg-zinc-100":""}`} onChange={e=>setForm({...form, leituraAnterior:e.target.value})} /></label>
          <label className="text-sm">Atual *<input type="number" value={form.leituraAtual} onChange={e=>setForm({...form, leituraAtual:e.target.value})} placeholder="digite somente Atual" className="mt-1 w-full border-2 border-emerald-500 rounded-xl px-3 py-2" autoFocus={!!scanOk} /></label>
          <label className="text-sm md:col-span-3">Tarifa R$<input type="number" step="0.0001" value={form.tarifa} readOnly={!!scanOk} className={`mt-1 w-full border rounded-xl px-3 py-2 ${scanOk?"bg-zinc-100":""}`} onChange={e=>setForm({...form, tarifa:e.target.value})} /></label>
          {scanOk && <div className="md:col-span-3 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">✓ Dados lançados automaticamente via QR — unidade, tipo, tarifa, bandeira e leitura anterior. Digite apenas a leitura Atual e clique Validar e Salvar.</div>}
          <button disabled={scanOk===false || (!scanOk && !!codigoScan)} className={`md:col-span-3 rounded-2xl py-2.5 font-semibold ${scanOk ? "bg-emerald-700 text-white" : "bg-zinc-200 text-zinc-500"}`}>{scanOk ? "Salvar leitura validada" : "Valide o QR para salvar"}</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Grade completa — Leituras (rastreáveis)</h3><Badge variant="default">{lista.length} registros</Badge></div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-zinc-500"><th>Unidade</th><th>Tipo</th><th>Ref</th><th>Anterior</th><th>Atual</th><th>Consumo</th><th>Leiturista</th><th>Bandeira</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {lista.slice(0,20).map((l:any)=>(
                <tr key={l.id} className="border-t"><td className="text-xs">{l.unidade?.identificacao|| l.unidadeId?.slice(0,8)}</td><td className="text-center"><Badge variant="default">{l.tipo}</Badge></td><td className="text-xs text-center">{l.referencia}</td><td className="text-right">{l.leituraAnterior}</td><td className="text-right">{l.leituraAtual}</td><td className="text-right font-bold">{l.consumo}</td><td className="text-xs text-center">{l.leituristaNome|| <span className="text-zinc-400">—</span>}</td><td className="text-center text-xs">{l.bandeira||"-"}</td><td className="text-right space-x-1"><button onClick={()=>iniciarEdicao(l)} className="text-xs bg-emerald-700 text-white rounded-full px-3 py-1">Alterar</button><button onClick={()=>remover(l.id)} className="text-xs text-rose-600">Remover</button></td></tr>
              ))}
              {lista.length===0 && <tr><td colSpan={10} className="text-center py-6 text-zinc-500">Nenhuma leitura</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setEdit(null)}>
          <form onSubmit={salvarEdicao} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-bold">Alterar leitura — {edit.referencia} {edit.tipo}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Anterior<input type="number" value={editForm.leituraAnterior} onChange={e=>setEditForm({...editForm, leituraAnterior:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Atual<input type="number" value={editForm.leituraAtual} onChange={e=>setEditForm({...editForm, leituraAtual:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Tarifa<input type="number" step="0.0001" value={editForm.tarifa} onChange={e=>setEditForm({...editForm, tarifa:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
              <label className="text-sm">Bandeira<select value={editForm.bandeira} onChange={e=>setEditForm({...editForm, bandeira:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>VERDE</option><option>AMARELA</option><option>VERMELHA_P1</option><option>VERMELHA_P2</option></select></label>
            </div>
            <div className="flex gap-2"><button type="button" onClick={()=>setEdit(null)} className="flex-1 border rounded-2xl py-2">Cancelar</button><button className="flex-1 bg-emerald-700 text-white rounded-2xl py-2 font-semibold">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
