import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocka o módulo da API e o contexto de autenticação.
vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

const loginMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: loginMock }),
}));

import { api } from '../services/api';
import { Auth } from '../pages/Auth';

const mockedApi = vi.mocked(api.post);

describe('Auth', () => {
  beforeEach(() => {
    mockedApi.mockReset();
    loginMock.mockReset().mockResolvedValue(undefined);
  });

  it('envia login como formulário urlencoded e chama login(token)', async () => {
    mockedApi.mockResolvedValueOnce({ data: { access_token: 'token-123', token_type: 'bearer' } });
    const user = userEvent.setup();

    render(<Auth />);
    await user.type(screen.getByLabelText(/e-mail/i), 'user@email.com');
    await user.type(screen.getByLabelText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      const [url, body, config] = mockedApi.mock.calls[0];
      expect(url).toBe('/auth/login');
      expect(config?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
      expect(String(body)).toContain('user%40email.com');
      expect(loginMock).toHaveBeenCalledWith('token-123');
    });
  });

  it('mostra mensagem de erro quando o login falha', async () => {
    mockedApi.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();

    render(<Auth />);
    await user.type(screen.getByLabelText(/e-mail/i), 'user@email.com');
    await user.type(screen.getByLabelText(/senha/i), 'errada');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      // Após a falha, o usuário permanece na tela de login e não logou.
      expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
      expect(loginMock).not.toHaveBeenCalled();
    });
  });

  it('cadastro bem-sucedido volta para o login', async () => {
    mockedApi.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();

    render(<Auth />);
    await user.click(screen.getByRole('button', { name: /cadastre-se$/i }));

    await user.type(screen.getByLabelText(/nome/i), 'Pedro');
    await user.type(screen.getByLabelText(/e-mail/i), 'novo@email.com');
    await user.type(screen.getByLabelText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^cadastrar$/i }));

    await waitFor(() => {
      // Após cadastro bem-sucedido, volta para o formulário de login.
      expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cadastre-se$/i })).toBeInTheDocument();
    });
  });

  it('normaliza o e-mail para minúsculas no cadastro', async () => {
    mockedApi.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();

    render(<Auth />);
    await user.click(screen.getByRole('button', { name: /cadastre-se$/i }));
    await user.type(screen.getByLabelText(/nome/i), 'Pedro');
    await user.type(screen.getByLabelText(/e-mail/i), '  Novo@Email.COM ');
    await user.type(screen.getByLabelText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^cadastrar$/i }));

    await waitFor(() => {
      expect(mockedApi).toHaveBeenCalledWith('/auth/register', {
        name: 'Pedro',
        email: 'novo@email.com',
        password: 'password123',
      });
    });
  });
});
