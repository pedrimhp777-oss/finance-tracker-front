import { describe, expect, it } from 'vitest';
import { isSessionExpiry } from '../services/api';

/** Simula o erro que o axios entrega ao interceptor. */
function axiosError(status: number, url: string) {
  return { isAxiosError: true, response: { status }, config: { url } };
}

describe('isSessionExpiry', () => {
  it('trata 401 de rota protegida como sessão expirada', () => {
    expect(isSessionExpiry(axiosError(401, '/transactions/'))).toBe(true);
    expect(isSessionExpiry(axiosError(401, '/auth/me'))).toBe(true);
  });

  it('NÃO trata 401 do login como sessão expirada (F5)', () => {
    // Antes, errar a senha apagava o token de uma sessão válida.
    expect(isSessionExpiry(axiosError(401, '/auth/login'))).toBe(false);
  });

  it('ignora as demais rotas de autenticação', () => {
    expect(isSessionExpiry(axiosError(401, '/auth/register'))).toBe(false);
    expect(isSessionExpiry(axiosError(401, '/auth/forgot-password'))).toBe(false);
    expect(isSessionExpiry(axiosError(401, '/auth/reset-password'))).toBe(false);
  });

  it('ignora status que não são 401', () => {
    expect(isSessionExpiry(axiosError(400, '/transactions/'))).toBe(false);
    expect(isSessionExpiry(axiosError(403, '/transactions/'))).toBe(false);
    expect(isSessionExpiry(axiosError(500, '/transactions/'))).toBe(false);
  });

  it('ignora erros que não vêm do axios (rede, timeout)', () => {
    expect(isSessionExpiry(new Error('Network Error'))).toBe(false);
    expect(isSessionExpiry(null)).toBe(false);
    expect(isSessionExpiry(undefined)).toBe(false);
  });
});
