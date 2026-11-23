import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types/finance';

interface AuthContextType {
  user: User | null;
  token: string | null;
  authenticated: boolean;
  loading: boolean;
  /** true quando a sessão caiu por 401 (expirou ou foi revogada). */
  sessionExpired: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let active = true;
    const clearSession = () => {
      localStorage.removeItem('@FinanceTracker:token');
      if (active) {
        setToken(null);
        setUser(null);
        // Sem este sinal o usuário era devolvido ao login sem explicação,
        // como se tivesse errado a senha.
        setSessionExpired(true);
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
    setSessionExpired(false);
  };

  const logout = () => {
    // Revogação best-effort no servidor: invalida o token no banco, de modo
    // que uma cópia obtida por terceiros pare de funcionar imediatamente.
    // - Enviamos o header explicitamente porque o interceptor só injeta o
    //   Authorization quando ele já não veio, e o token será removido logo
    //   abaixo (corrida evitada pela captura prévia).
    // - Nunca bloqueia a UI nem impede o logout local em caso de falha.
    const currentToken = localStorage.getItem('@FinanceTracker:token');
    if (currentToken) {
      try {
        void Promise.resolve(
          api.post('/auth/logout', null, {
            headers: { Authorization: `Bearer ${currentToken}` },
          }),
        ).catch(() => undefined);
      } catch {
        // Se a chamada falhar de forma síncrona, o logout local continua.
      }
    }
    localStorage.removeItem('@FinanceTracker:token');
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, authenticated: !!token, loading, sessionExpired, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

