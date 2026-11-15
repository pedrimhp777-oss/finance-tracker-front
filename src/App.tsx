import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { ResetPassword } from './pages/PasswordRecovery';

/** Lê o token de redefinição do link enviado por e-mail (`?reset_token=`). */
function readResetToken(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('reset_token');
}

/** Remove o token da URL, para não sobrar credencial no histórico do navegador. */
function clearResetTokenFromUrl(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, '', window.location.pathname);
}

const MainContent: React.FC = () => {
  const { authenticated, loading } = useAuth();
  const [resetToken, setResetToken] = useState<string | null>(readResetToken);

  // O link de redefinição tem precedência: mesmo com sessão ativa, o usuário
  // que abriu o e-mail está ali para trocar a senha.
  if (resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          clearResetTokenFromUrl();
          setResetToken(null);
        }}
      />
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center">Verificando sessão...</div>;
  }

  return authenticated ? <Dashboard /> : <Auth />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
