import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types/finance';

interface AuthContextType {
  user: User | null;
  token: string | null;
  authenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('@FinanceTracker:token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('@FinanceTracker:token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('@FinanceTracker:token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, authenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);