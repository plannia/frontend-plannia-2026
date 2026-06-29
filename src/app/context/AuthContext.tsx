import { createContext, useContext, useState, ReactNode } from 'react';
import { getUserById } from '../services/userService';

interface User {
  id: number;
  name: string;
  email: string;
  position: string;
  role: 'LEADER' | 'MEMBER';
  teamId?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => Promise<void>;
  logout: () => void;
  updateSessionUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const login = async (userData: User, userToken: string) => {
    // Guardar token primero para que getHeaders() lo tenga disponible
    localStorage.setItem('token', userToken);
    setToken(userToken);

    try {
      // Obtener el usuario completo con teamId
      const fullUser = await getUserById(userData.id);
      const completeUser = { ...userData, teamId: fullUser.teamId };
      setUser(completeUser);
      localStorage.setItem('user', JSON.stringify(completeUser));
    } catch {
      // Si falla, guardar igual sin teamId
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateSessionUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};