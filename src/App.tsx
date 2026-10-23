import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';

const MainContent: React.FC = () => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center">Verificando sess�o...</div>;
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
