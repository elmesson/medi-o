"use client";
import { useRouter } from "next/navigation";
export function LogoutButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const r = useRouter();
  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    r.push("/login");
    r.refresh();
  }
  return (
    <button onClick={sair} className={className || "text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1"}>
      {children || "Sair"}
    </button>
  );
}
