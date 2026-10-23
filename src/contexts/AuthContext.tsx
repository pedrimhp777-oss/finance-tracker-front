import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types/finance';

interface AuthContextType {
  user: User | null;
  token: string | null;
  authenticated: boolean;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const clearSession = () => {
      localStorage.removeItem('@FinanceTracker:token');
      if (active) {
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener('finance-tracker:unauthorized', clearSession);

    const restoreSession = async () => {
      const storedToken = localStorage.getItem('@FinanceTracker:token');
      if (!storedToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const { data } = await api.get<User>('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (active) {
          setToken(storedToken);
          setUser(data);
        }
      } catch {
        clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
      window.removeEventListener('finance-tracker:unauthorized', clearSession);
    };
  }, []);

  const login = async (newToken: string) => {
    const { data } = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    localStorage.setItem('@FinanceTracker:token', newToken);
    setToken(newToken);
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('@FinanceTracker:token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, authenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
