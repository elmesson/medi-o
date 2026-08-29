"use client";
import { useEffect, useState } from "react";

export function UserBadge({ fallback }: { fallback?: string }) {
  const [me, setMe] = useState<{ nome: string | null; papel: string | null; email: string | null } | null>(null);
  useEffect(() => {
    fetch("/api/me").then(r=>r.json()).then(setMe).catch(()=>{});
  }, []);
  if (!me?.nome) return fallback ? <span className="text-xs opacity-80">{fallback}</span> : null;
  const papelLabel: Record<string,string> = { MASTER:"Master", ADMINISTRADOR:"Administrador", PROPRIETARIO:"Proprietário", LEITURISTA:"Leiturista", INQUILINO:"Inquilino" };
  return (
    <span className="text-xs bg-white/20 rounded-full px-3 py-1">
      Olá, <b>{me.nome}</b> <span className="opacity-80">• {papelLabel[me.papel||""]|| me.papel}</span>
    </span>
  );
}
