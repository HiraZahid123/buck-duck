'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'merchant' | 'driver' | 'admin';
  phone?: string;
  vehicle?: string;
  driverOnline?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  store: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  demoAs: (role: 'customer' | 'merchant' | 'driver' | 'admin') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

const DEMO_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  customer: { email: 'customer@buckduck.com', pass: 'demo1234' },
  merchant: { email: 'merchant@buckduck.com', pass: 'demo1234' },
  driver: { email: 'driver@buckduck.com', pass: 'demo1234' },
  admin: { email: 'admin@buckduck.com', pass: 'demo1234' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('bd_token');
    if (savedToken) {
      setToken(savedToken);
      loadUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser(tok: string) {
    try {
      const res = await apiRequest('GET', '/api/auth/me', null, tok);
      setUser(res.user);
      setStore(res.store || null);
    } catch {
      localStorage.removeItem('bd_token');
      setToken(null);
      setUser(null);
      setStore(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, pass: string) {
    const res = await apiRequest('POST', '/api/auth/login', { email, password: pass });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('bd_token', res.token);
    await loadUser(res.token);
    return res;
  }

  async function register(data: any) {
    const res = await apiRequest('POST', '/api/auth/register', data);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('bd_token', res.token);
    await loadUser(res.token);
    return res;
  }

  function logout() {
    localStorage.removeItem('bd_token');
    setToken(null);
    setUser(null);
    setStore(null);
    window.location.href = '/';
  }

  async function demoAs(role: 'customer' | 'merchant' | 'driver' | 'admin') {
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) return;
    const res = await login(creds.email, creds.pass);
    const destinations: Record<string, string> = {
      customer: '/account',
      merchant: '/merchant',
      driver: '/driver',
      admin: '/admin',
    };
    window.location.href = destinations[res.user.role] || '/';
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        store,
        loading,
        login,
        register,
        logout,
        demoAs,
        refreshUser: () => (token ? loadUser(token) : Promise.resolve()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
