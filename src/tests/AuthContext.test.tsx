import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

import { api } from '../services/api';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const mockedGet = vi.mocked(api.get);

const TOKEN_KEY = '@FinanceTracker:token';

/** Captura o contexto dentro do provider para as asserções. */
function Probe() {
  const { user, authenticated, loading, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(authenticated)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={logout}>sair</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('restaura a sessão a partir do token salvo', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido');
    mockedGet.mockResolvedValueOnce({
      data: { id: 1, name: 'Pedro', email: 'user@email.com' },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('user@email.com');
    expect(mockedGet).toHaveBeenCalledWith(
      '/auth/me',
      expect.objectContaining({ headers: { Authorization: 'Bearer token-valido' } }),
    );
  });

  it('sem token, inicia desautenticado sem chamar a API', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('evento de não-autorizado limpa a sessão', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido');
    mockedGet.mockResolvedValueOnce({
      data: { id: 1, name: 'Pedro', email: 'user@email.com' },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      window.dispatchEvent(new Event('finance-tracker:unauthorized'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('logout remove o token', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido');
    mockedGet.mockResolvedValueOnce({
      data: { id: 1, name: 'Pedro', email: 'user@email.com' },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('sair').click();
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('logout revoga a sessão no servidor enviando o token atual', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido');
    mockedGet.mockResolvedValueOnce({
      data: { id: 1, name: 'Pedro', email: 'user@email.com' },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('sair').click();
    });

    const mockedPost = vi.mocked(api.post);
    expect(mockedPost).toHaveBeenCalledWith('/auth/logout', null, {
      headers: { Authorization: 'Bearer token-valido' },
    });
  });

  it('logout limpa a sessão local mesmo se a revogação falhar', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido');
    mockedGet.mockResolvedValueOnce({
      data: { id: 1, name: 'Pedro', email: 'user@email.com' },
    });
    vi.mocked(api.post).mockRejectedValueOnce(new Error('rede indisponível'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('sair').click();
    });

    // Falha no servidor não pode prender o usuário logado no cliente.
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('não tenta revogar no servidor quando não há token', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('sair').click();
    });

    expect(vi.mocked(api.post)).not.toHaveBeenCalled();
  });
});
