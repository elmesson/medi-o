import { describe, it, expect } from 'vitest';
import { assertUnidadeAcesso } from '../src/lib/requireAuth';

// Fase 3 - testes críticos: isolamento por unidade + crypto + rateio
describe('isolamento por unidade', () => {
  it('nega acesso a unidade não vinculada', () => {
    expect(() => assertUnidadeAcesso(['u1','u2'], 'u3')).toThrow(/Acesso negado/);
  });
  it('permite unidade vinculada', () => {
    expect(() => assertUnidadeAcesso(['u1'], 'u1')).not.toThrow();
  });
});
