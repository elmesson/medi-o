import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Elmesson • Portal do Inquilino",
  description: "Acompanhe consumos, faturas e pagamentos em tempo real"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
