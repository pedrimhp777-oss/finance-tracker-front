import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';

const MainContent: React.FC = () => {
  const { authenticated } = useAuth();

  return authenticated ? <Dashboard /> : <Auth />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}