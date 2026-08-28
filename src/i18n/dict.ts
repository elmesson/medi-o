export const dict = {
  pt: { dashboard: "Dashboard", leituras: "Leituras", faturas: "Faturas", pix: "PIX", atendimento: "Atendimento", perfil: "Perfil" },
  en: { dashboard: "Dashboard", leituras: "Readings", faturas: "Invoices", pix: "PIX", atendimento: "Support", perfil: "Profile" },
} as const;
export type Lang = keyof typeof dict;
