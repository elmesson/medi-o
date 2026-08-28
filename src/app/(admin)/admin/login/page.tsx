"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AdminLoginPage(){
  const r = useRouter();
  const [email,setEmail]=useState("master@elmesson.com.br");
  const [senha,setSenha]=useState("master123");
  const [err,setErr]=useState<string|null>(null);
  async function login(e: React.FormEvent){
    e.preventDefault(); setErr(null);
    const res = await fetch("/api/admin/auth/login", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ email, senha }) });
    const j = await res.json();
    if(!res.ok) setErr(j.error);
    else r.push("/admin");
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-900">
      <form onSubmit={login} className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white grid place-items-center font-bold">M</div>
        <h1 className="text-xl font-bold">Login Master</h1>
        <p className="text-xs text-zinc-500">Acesso restrito ao administrador master. Gerencie administradores de imóveis e proprietários.</p>
        <label className="block text-sm">E-mail<input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded-2xl px-3 py-2.5" /></label>
        <label className="block text-sm">Senha<input type="password" value={senha} onChange={e=>setSenha(e.target.value)} className="mt-1 w-full border rounded-2xl px-3 py-2.5" /></label>
        {err && <div className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{err}</div>}
        <button className="w-full bg-zinc-900 text-white rounded-2xl py-3 font-semibold">Entrar como Master</button>
        <div className="text-xs text-center text-zinc-500">Demo: master@elmesson.com.br / master123</div>
      </form>
    </main>
  );
}
