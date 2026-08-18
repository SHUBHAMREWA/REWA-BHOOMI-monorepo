'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiPost, apiGet, setAccessToken, getAccessToken } from '@/lib/api';
import type { User, UserRole } from '@rewa-bhoomi/types';

interface AuthState {
  user: (User & { roles: UserRole[] }) | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshAuth = useCallback(async () => {
    try {
      const user = await apiGet<User & { roles: UserRole[] }>('/auth/me');
      setState({
        user,
        accessToken: getAccessToken(),
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      setAccessToken(null);
      setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<{
      userId: string; name: string; email: string;
      roles: UserRole[]; accessToken: string;
    }>('/auth/login', { email, password });

    setAccessToken(data.data.accessToken);
    setState({
      user: {
        id: data.data.userId,
        name: data.data.name,
        email: data.data.email,
        status: 'ACTIVE',
        roles: data.data.roles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: data.data.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const data = await apiPost<{
      userId: string; name: string; email: string;
      roles: UserRole[]; accessToken: string;
    }>('/auth/google', { credential });

    setAccessToken(data.data.accessToken);
    setState({
      user: {
        id: data.data.userId,
        name: data.data.name,
        email: data.data.email,
        status: 'ACTIVE',
        roles: data.data.roles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: data.data.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } finally {
      setAccessToken(null);
      setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth() {
  const auth = useAuth();
  if (!auth.isAuthenticated && !auth.isLoading) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }
  return auth;
}
