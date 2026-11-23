import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

import { api } from '../services/api';
import App from '../App';

const irPara = (url: string) => window.history.replaceState({}, '', url);

describe('App — link de redefinição (F8)', () => {
  afterEach(() => {
    irPara('/');
    vi.mocked(api.get).mockReset();
  });

  it('abre a tela de nova senha quando o token vem no fragmento', async () => {
    // Nenhuma requisição pode carregar o token: ele vive só no fragmento.
    irPara('/#reset_token=token-do-email');

    render(<App />);

    expect(await screen.findByText(/criar nova senha/i)).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith('https://api.exemplo.com/auth/me', expect.anything());
    const urlsChamadas = vi.mocked(api.get).mock.calls.map(([url]) => String(url));
    expect(urlsChamadas.some((url) => url.includes('token-do-email'))).toBe(false);
  });

  it('sem token no fragmento, mostra a tela normal de login', async () => {
    irPara('/');

    render(<App />);

    expect(await screen.findByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
  });
});
