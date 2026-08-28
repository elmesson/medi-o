"use client";
import { cn, brl } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...p} />;
}
export function Badge({ variant="default", className, ...p }: any) {
  const map: any = {
    default: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    brand: "bg-brand-100 text-brand-700"
  };
  return <span className={cn("badge", map[variant], className)} {...p} />;
}
export function Stat({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up"|"down"|"flat" }) {
  return (
    <Card>
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1 flex items-center gap-2">{value}
        {trend==="up" && <TrendingUp className="w-4 h-4 text-rose-500" />}
        {trend==="down" && <TrendingDown className="w-4 h-4 text-emerald-600" />}
        {trend==="flat" && <Minus className="w-4 h-4 text-zinc-400" />}
      </div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </Card>
  );
}
