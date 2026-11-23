import { describe, expect, it } from 'vitest';
import {
  BCRYPT_MAX_PASSWORD_BYTES,
  isPasswordTooLong,
  passwordByteLength,
} from '../utils/password';

describe('passwordByteLength', () => {
  it('conta caracteres ASCII como um byte', () => {
    expect(passwordByteLength('senha123')).toBe(8);
  });

  it('conta acento como dois bytes', () => {
    expect(passwordByteLength('á')).toBe(2);
  });

  it('conta emoji como quatro bytes', () => {
    expect(passwordByteLength('🔒')).toBe(4);
  });
});

describe('isPasswordTooLong', () => {
  it('aceita exatamente 72 bytes', () => {
    expect(isPasswordTooLong('a'.repeat(BCRYPT_MAX_PASSWORD_BYTES))).toBe(false);
  });

  it('recusa 73 bytes', () => {
    expect(isPasswordTooLong('a'.repeat(BCRYPT_MAX_PASSWORD_BYTES + 1))).toBe(true);
  });

  it('recusa 37 acentos, que são 74 bytes com 37 caracteres', () => {
    // O caso que `maxLength={72}` do HTML deixaria passar: 37 caracteres,
    // 74 bytes.
    const senha = 'á'.repeat(37);
    expect(senha.length).toBeLessThan(BCRYPT_MAX_PASSWORD_BYTES);
    expect(isPasswordTooLong(senha)).toBe(true);
  });
});
