import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Elmesson • Portal do Inquilino",
  description: "Acompanhe consumos, faturas e pagamentos em tempo real",
  manifest: "/manifest.json",
  themeColor: "#059669"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><link rel="manifest" href="/manifest.json" /></head>
      <body>{children}<script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`}} /></body>
    </html>
  );
}
