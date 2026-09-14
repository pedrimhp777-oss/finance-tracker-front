import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Lock, Mail, User as UserIcon } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Envia para a rota /auth/login confirmada na documentacao
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const res = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        login(res.data.access_token);
      } else {
        await api.post('/auth/register', { name, email, password });
        alert('Conta criada com sucesso! Faça login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('Erro na resposta do backend:', err.response?.data || err.message);
      alert(err.response?.data?.detail || 'Erro na autenticação. Verifique seus dados.');
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
          {isLogin ? 'Entrar no Finance Tracker' : 'Criar Conta'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2.5 rounded-lg transition cursor-pointer"
          >
            {isLogin ? 'Entrar' : 'Cadastrar'}
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