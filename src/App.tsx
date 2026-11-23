import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { ResetPassword } from './pages/PasswordRecovery';
import { clearResetTokenFromUrl, readResetToken } from './utils/resetLink';

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
