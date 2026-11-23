import React, { useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { Mail, Lock, Wallet, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PASSWORD_TOO_LONG_MESSAGE, isPasswordTooLong } from '../utils/password';

const inputClass =
  'w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-emerald-500';

/**
 * Formulário de solicitação de link (exibido dentro do card de login).
 *
 * A API responde 202 com a mesma mensagem exista ou não a conta — a tela
 * repete essa neutralidade: nunca confirmamos se o e-mail está cadastrado.
 */
export const ForgotPasswordForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setSent(true);
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Não foi possível enviar o link. Tente novamente.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4" data-testid="forgot-sent">
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-200">
            Se existir uma conta com este e-mail, enviamos um link para redefinir
            a senha. O link expira em 30 minutos e só pode ser usado uma vez.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-slate-400">
        Informe o e-mail da sua conta. Enviaremos um link para você criar uma
        nova senha.
      </p>
      <div>
        <label
          htmlFor="forgot-email"
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          E-mail
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            className={inputClass}
            placeholder="seu@email.com"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold py-2.5 rounded-lg transition cursor-pointer"
      >
        {submitting ? 'Enviando...' : 'Enviar link de redefinição'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-xs text-slate-400 hover:text-white transition cursor-pointer"
      >
        Voltar ao login
      </button>
    </form>
  );
};

/**
 * Tela de criação de nova senha, aberta pelo link do e-mail
 * (`/#reset_token=...`).
 *
 * O token é enviado no corpo do POST e nunca fica em estado global. Ao
 * concluir, o parâmetro é removido da URL para não sobrar credencial no
 * histórico do navegador.
 */
export const ResetPassword: React.FC<{
  token: string;
  onDone: () => void;
}> = ({ token, onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (isPasswordTooLong(password)) {
      setError(PASSWORD_TOO_LONG_MESSAGE);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: password,
      });
      setDone(true);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Link inválido ou expirado. Solicite um novo.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          {done ? 'Senha alterada' : 'Criar nova senha'}
        </h2>

        {done ? (
          <div className="space-y-4" data-testid="reset-done">
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-200">
                Sua senha foi alterada. Por segurança, todas as sessões abertas
                foram encerradas.
              </p>
            </div>
            <button
              type="button"
              onClick={onDone}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2.5 rounded-lg transition cursor-pointer"
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="reset-password"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Nova senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="reset-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Confirme a nova senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="reset-confirm"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (error) setError('');
                  }}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold py-2.5 rounded-lg transition cursor-pointer"
            >
              {submitting ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            <button
              type="button"
              onClick={onDone}
              className="w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
