"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";

export default function PerfilPage(){
  const [perfil,setPerfil]=useState<any>(null);
  const [telefone,setTelefone]=useState("");
  const [email,setEmail]=useState("");
  const [mfaUri,setMfaUri]=useState<string|null>(null);
  const [mfaToken,setMfaToken]=useState("");
  useEffect(()=>{
    fetch("/api/perfil").then(r=>r.json()).then(j=>{
      if (j?.email){ setPerfil(j); setTelefone(j.telefone||""); setEmail(j.email); }
      else setPerfil({ nome:"Inquilino Demo", email:"demo@elmesson.com.br", telefone:"(11) 99999-0000", mfaEnabled:false, unidades:[{ unidade:{ identificacao:"BL-A-101"}}]});
    }).catch(()=> setPerfil({ nome:"Inquilino Demo", email:"demo@elmesson.com.br", telefone:"(11) 99999-0000", mfaEnabled:false, unidades:[{ unidade:{ identificacao:"BL-A-101"}}]}) );
  },[]);

  async function salvar(){
    const res= await fetch("/api/perfil",{ method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ telefone, email })});
    alert(res.ok?"Perfil atualizado!":"Atualizado localmente (demo)");
  }
  async function setupMfa(){
    const res= await fetch("/api/auth/mfa/setup",{ method:"POST"});
    const j=await res.json();
    if (j.uri) setMfaUri(j.uri);
    else alert("MFA setup requer autenticação real. Demo URI: otpauth://totp/Elmesson:demo?secret=JBSWY3DPEHPK3PXP&issuer=Elmesson");
  }
  async function confirmarMfa(){
    const res= await fetch("/api/auth/mfa/setup",{ method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ token: mfaToken })});
    alert(res.ok?"MFA ativado!":"Verifique o código (6 dígitos)");
  }

  if (!perfil) return <div className="card">Carregando...</div>;
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">Perfil do Inquilino</h1>
      <Card className="space-y-3">
        <div className="text-sm"><b>Nome:</b> {perfil.nome}</div>
        <div className="text-xs text-muted">CPF/CNPJ, unidade vinculada e contrato não são editáveis (exibição somente leitura por segurança).</div>
        <div className="flex flex-wrap gap-2">{perfil.unidades?.map((u:any)=><span key={u.unidade.identificacao} className="bg-zinc-100 rounded-full px-3 py-1 text-xs font-semibold">{u.unidade.identificacao}</span>)}</div>
        <label className="block text-sm">Telefone<input value={telefone} onChange={e=>setTelefone(e.target.value)} className="mt-1 w-full border rounded-2xl px-3 py-2" /></label>
        <label className="block text-sm">E-mail<input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded-2xl px-3 py-2" /></label>
        <button onClick={salvar} className="btn-primary w-full">Salvar alterações</button>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">Segurança</h3>
        <div className="text-sm">MFA (2FA): <b>{perfil.mfaEnabled?"Ativado":"Desativado"}</b></div>
        {!perfil.mfaEnabled ? (
          <button onClick={setupMfa} className="btn-ghost w-full">Ativar autenticação em dois fatores</button>
        ): <div className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">MFA ativo. Use seu app autenticador (Google Authenticator / Authy).</div>}
        {mfaUri && <div className="space-y-2"><div className="text-xs break-all bg-zinc-50 rounded-xl p-2 font-mono">{mfaUri}</div><input value={mfaToken} onChange={e=>setMfaToken(e.target.value)} placeholder="Código 6 dígitos" className="w-full border rounded-2xl px-3 py-2" /><button onClick={confirmarMfa} className="btn-primary w-full">Confirmar e ativar</button></div>}
        <label className="block text-sm">Alterar senha<input type="password" placeholder="Senha atual" className="mt-1 w-full border rounded-2xl px-3 py-2" /><input type="password" placeholder="Nova senha" className="mt-1 w-full border rounded-2xl px-3 py-2" /></label>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm">Notificações</h3>
        <div className="space-y-2 mt-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Sistema</label>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> E-mail</label>
          <label className="flex items-center gap-2"><input type="checkbox" /> WhatsApp</label>
        </div>
      </Card>
    </div>
  );
}
