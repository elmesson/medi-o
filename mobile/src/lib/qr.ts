import jsQR from 'jsqr';

// Valida código de medidor: MED-XXXX-XXXX ou código do QR da concessionária
export function validarCodigoMedidor(codigo: string): { valido: boolean; tipo?: string; erro?: string } {
  const c = codigo.trim().toUpperCase();
  // Formato Elmesson: MED-XXXX-XXXX
  if (/^MED-[A-Z0-9]{4,8}-[A-Z0-9]{4,8}$/.test(c)) return { valido: true, tipo: 'ELMESSON' };
  // Formato legado ou concessionária: 8-20 dígitos
  if (/^\d{6,20}$/.test(c)) return { valido: true, tipo: 'CONCESSIONARIA' };
  // QR com JSON ou URL contendo código
  try {
    const j = JSON.parse(c);
    if (j.codigo || j.medidor || j.code) {
      return validarCodigoMedidor(String(j.codigo || j.medidor || j.code));
    }
  } catch {}
  // URL com ?codigo=MED-...
  try {
    const u = new URL(c);
    const q = u.searchParams.get('codigo') || u.searchParams.get('medidor') || u.searchParams.get('code');
    if (q) return validarCodigoMedidor(q);
  } catch {}
  if (c.length >= 6) return { valido: true, tipo: 'GENERIC' }; // aceita qualquer QR com dados
  return { valido: false, erro: `Código inválido: "${codigo}". Esperado MED-XXXX-XXXX ou código da concessionária.` };
}

export function decodeQRFromImageData(data: Uint8ClampedArray, w: number, h: number): string | null {
  const code = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' });
  return code?.data || null;
}
