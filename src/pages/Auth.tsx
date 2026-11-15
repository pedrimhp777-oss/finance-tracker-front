import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Lock, Mail, User as UserIcon } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', email.trim().toLowerCase());
        params.append('password', password);

        const res = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        await login(res.data.access_token);
      } else {
        await api.post('/auth/register', {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        toast.success('Conta criada com sucesso! Faça login.');
        setIsLogin(true);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erro na autenticação. Verifique seus dados.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
        }}
      />
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          {isLogin ? 'Entrar no Finance Tracker' : 'Criar Conta'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold py-2.5 rounded-lg transition cursor-pointer"
          >
            {submitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-xs text-slate-400 hover:text-white transition"
        >
          {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem conta? Faça login'}
        </button>
      </div>
    </div>
  );
};

