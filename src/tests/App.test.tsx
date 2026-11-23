import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

/** Sessão controlável: os testes dizem se o usuário está autenticado. */
let autenticado = false;

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    authenticated: autenticado,
    loading: false,
    logout: vi.fn(),
    sessionExpired: false,
  }),
}));

// A tela principal explode de propósito (teste do error boundary).
vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => {
    throw new Error('falha proposital no Dashboard');
  },
}));

import { api } from '../services/api';
import App from '../App';

const irPara = (url: string) => window.history.replaceState({}, '', url);

describe('App — link de redefinição (F8)', () => {
  beforeEach(() => {
    autenticado = false;
  });

  afterEach(() => {
    irPara('/');
    vi.mocked(api.get).mockReset();
  });

  it('abre a tela de nova senha quando o token vem no fragmento', async () => {
    irPara('/#reset_token=token-do-email');

    render(<App />);

    expect(await screen.findByText(/criar nova senha/i)).toBeInTheDocument();
    const urlsChamadas = vi.mocked(api.get).mock.calls.map(([url]) => String(url));
    expect(urlsChamadas.some((url) => url.includes('token-do-email'))).toBe(false);
  });

  it('sem token no fragmento, mostra a tela normal de login', async () => {
    irPara('/');

    render(<App />);

    expect(await screen.findByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
  });
});

describe('App — error boundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    autenticado = true;
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    irPara('/');
  });

  it('um erro na interface mostra a mensagem, não tela branca', () => {
    irPara('/');

    render(<App />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
