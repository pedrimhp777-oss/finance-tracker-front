import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), authenticated: false, loading: false }),
}));

import { api } from '../services/api';
import { Auth } from '../pages/Auth';
import { ResetPassword } from '../pages/PasswordRecovery';

const mockedPost = vi.mocked(api.post);

describe('Recuperação de senha', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  // ---------------------------------------------------------------- forgot

  it('abre o formulário de recuperação pelo link "Esqueci minha senha"', async () => {
    const user = userEvent.setup();
    render(<Auth />);

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /enviar link de redefinição/i }),
    ).toBeInTheDocument();
  });

  it('envia o e-mail normalizado para /auth/forgot-password', async () => {
    mockedPost.mockResolvedValueOnce({ data: { detail: 'ok' } });
    const user = userEvent.setup();
    render(<Auth />);

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));
    await user.type(screen.getByLabelText(/e-mail/i), '  USER@Email.COM ');
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@email.com',
      });
    });
  });

  it('mostra mensagem neutra após o envio (não confirma se a conta existe)', async () => {
    mockedPost.mockResolvedValueOnce({ data: { detail: 'ok' } });
    const user = userEvent.setup();
    render(<Auth />);

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));
    await user.type(screen.getByLabelText(/e-mail/i), 'user@email.com');
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    const aviso = await screen.findByTestId('forgot-sent');
    expect(aviso).toHaveTextContent(/se existir uma conta/i);
  });

  it('exibe erro quando o envio falha e permite tentar de novo', async () => {
    mockedPost.mockRejectedValueOnce(new Error('falha'));
    const user = userEvent.setup();
    render(<Auth />);

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));
    await user.type(screen.getByLabelText(/e-mail/i), 'user@email.com');
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('forgot-sent')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------- reset

  it('bloqueia o envio quando as senhas não coincidem', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<ResetPassword token="token-abc" onDone={onDone} />);

    await user.type(screen.getByLabelText(/^nova senha$/i), 'senha-nova-123');
    await user.type(screen.getByLabelText(/confirme/i), 'senha-diferente-123');
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não coincidem/i);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('bloqueia senha com menos de 8 caracteres', async () => {
    const user = userEvent.setup();
    render(<ResetPassword token="token-abc" onDone={vi.fn()} />);

    await user.type(screen.getByLabelText(/^nova senha$/i), 'curta');
    await user.type(screen.getByLabelText(/confirme/i), 'curta');
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/pelo menos 8/i);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('envia token e nova senha para /auth/reset-password', async () => {
    mockedPost.mockResolvedValueOnce({ status: 204 });
    const user = userEvent.setup();
    render(<ResetPassword token="token-do-email" onDone={vi.fn()} />);

    await user.type(screen.getByLabelText(/^nova senha$/i), 'senha-nova-123');
    await user.type(screen.getByLabelText(/confirme/i), 'senha-nova-123');
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'token-do-email',
        new_password: 'senha-nova-123',
      });
    });
  });

  it('confirma a troca e avisa que as sessões foram encerradas', async () => {
    mockedPost.mockResolvedValueOnce({ status: 204 });
    const user = userEvent.setup();
    render(<ResetPassword token="token-do-email" onDone={vi.fn()} />);

    await user.type(screen.getByLabelText(/^nova senha$/i), 'senha-nova-123');
    await user.type(screen.getByLabelText(/confirme/i), 'senha-nova-123');
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }));

    const concluido = await screen.findByTestId('reset-done');
    expect(concluido).toHaveTextContent(/sessões abertas foram encerradas/i);
  });

  it('chama onDone ao concluir (para limpar o token da URL)', async () => {
    mockedPost.mockResolvedValueOnce({ status: 204 });
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<ResetPassword token="token-do-email" onDone={onDone} />);

    await user.type(screen.getByLabelText(/^nova senha$/i), 'senha-nova-123');
    await user.type(screen.getByLabelText(/confirme/i), 'senha-nova-123');
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }));

    await user.click(await screen.findByRole('button', { name: /ir para o login/i }));
    expect(onDone).toHaveBeenCalled();
  });
});
