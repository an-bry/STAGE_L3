import { createContext, useContext, useState, useEffect } from 'react';
import { type ReactNode } from 'react';
import { getProfil } from '../api/authService';
import type { Utilisateur } from '../types/user';

interface AuthContextType {
  user: Utilisateur | null;
  setUser: (user: Utilisateur | null) => void;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);

  // Wrapper pour synchroniser le rôle dans localStorage
  const setUser = (u: Utilisateur | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('user_role', u.role);
    } else {
      localStorage.removeItem('user_role');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getProfil()
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
}