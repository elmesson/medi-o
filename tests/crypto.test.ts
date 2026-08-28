import { encrypt, decrypt, hashCpfCnpj } from '../src/lib/crypto';
import { describe, it, expect } from 'vitest';

describe('crypto AES-256-GCM', () => {
  it('encrypt/decrypt roundtrip', () => {
    const plain = '12345678909';
    const enc = encrypt(plain);
    expect(decrypt(enc)).toBe(plain);
  });
  it('hash determinístico', () => {
    expect(hashCpfCnpj('123.456.789-09')).toBe(hashCpfCnpj('12345678909'));
  });
});
