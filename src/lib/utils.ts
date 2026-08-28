import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function brl(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function referenciaToDate(ref: string) { // YYYY-MM -> Date
  const [y,m] = ref.split("-").map(Number);
  return new Date(y, m-1, 1);
}
export function formatRef(ref: string) {
  const d = referenciaToDate(ref);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}
