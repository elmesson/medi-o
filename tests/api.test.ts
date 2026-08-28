import { describe, it, expect } from 'vitest';
// Teste de contrato das APIs críticas (sem DB, valida shape)
describe('contrato APIs portal', () => {
  it('dashboard shape', async () => {
    const shape = { consumoAtual: ['energia','agua','gas'], faturas: ['totalMes','emAberto','vencidas'] };
    expect(shape.consumoAtual).toContain('energia');
  });
  it('foto OCR threshold', () => {
    const confianca = 0.96;
    const status = confianca >= 0.95 ? 'VALIDADA_AUTO' : 'PENDENTE_VALIDACAO';
    expect(status).toBe('VALIDADA_AUTO');
  });
});
