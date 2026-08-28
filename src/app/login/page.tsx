"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [email,setEmail]=useState("demo@elmesson.com.br");
  const [senha,setSenha]=useState("demo123");
  const [mfa,setMfa]=useState("");
  const [step,setStep]=useState<"login"|"mfa">("login");
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      // Login único: tenta inquilino e administrador/proprietário/master
      const res = await fetch("/api/auth/login-unificado", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, senha }) });
      const j = await res.json();
      if (!res.ok) {
        // fallback para fluxo antigo inquilino puro (mantém MFA)
        const r2 = await fetch("/api/auth/login", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, senha }) });
        const j2 = await r2.json();
        if (!r2.ok) throw new Error(j.error || j2.error || "Falha no login");
        if (j2.mfaRequired) { setStep("mfa"); return; }
        r.push(j2.redirect || "/portal");
        return;
      }
      if (j.mfaRequired) { setStep("mfa"); return; }
      // redireciona de acordo com perfil: INQUILINO->/portal, MASTER->/admin, ADMINISTRADOR/PROPRIETARIO->/gestao
      r.push(j.redirect || "/portal");
    } catch(e:any){ setErr(e.message); } finally{ setLoading(false); }
  }
  async function doMfa(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, token: mfa }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Código inválido");
      r.push("/portal");
    } catch(e:any){ setErr(e.message); } finally{ setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
      <form onSubmit={step==="login"?doLogin:doMfa} className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white grid place-items-center font-bold">E</div>
        <h1 className="text-xl font-bold">Entrar</h1>
        <p className="text-sm text-muted">Tela única — direciona para <b>Painel Inquilino</b> ou <b>Gestão</b> conforme seu perfil.</p>
        {step==="login" ? <>
          <label className="block text-sm font-medium">E-mail<input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2.5" /></label>
          <label className="block text-sm font-medium">Senha<input type="password" value={senha} onChange={e=>setSenha(e.target.value)} className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2.5" /></label>
        </> : <>
          <label className="block text-sm font-medium">Código MFA (6 dígitos)<input value={mfa} onChange={e=>setMfa(e.target.value)} placeholder="123456" className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2.5 tracking-widest" /></label>
        </>}
        {err && <div className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{err}</div>}
        <button disabled={loading} className="btn-primary w-full">{loading?"Entrando...":step==="login"?"Entrar":"Verificar MFA"}</button>
        <div className="text-xs text-muted text-center space-y-1">
          <div><b>Inquilino:</b> demo@elmesson.com.br / demo123 → /portal</div>
          <div><b>Master:</b> master@elmesson.com.br / master123 → /admin</div>
          <div><b>Gestão:</b> admin.centro@elmesson.com.br / admin123 → /gestao</div>
        </div>
      </form>
    </main>
  );
}
