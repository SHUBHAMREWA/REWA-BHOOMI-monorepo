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
  sendLoginOtp: (email: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_session', JSON.stringify(user));
      }
      setState({
        user,
        accessToken: getAccessToken(),
        isLoading: false,
        isAuthenticated: true,
      });
      // Notify query clients (e.g. UserChatWidget) to re-fetch after token is restored
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refreshed'));
      }
    } catch (err: any) {
      // Check if error was an explicit 401/403 (meaning invalid or revoked credentials)
      const status = err?.response?.status;
      const isExplicitAuthFailure = status === 401 || status === 403;

      if (isExplicitAuthFailure) {
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_session');
        }
        setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
      } else {
        // Transient error (e.g. Render backend rebooting on git merge, 502/503 or network blip)
        // Keep cached user from localStorage so user does not get abruptly logged out!
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: !!prev.user,
        }));
      }
    }
  }, []);

  useEffect(() => {
    // Attempt instant hydration from localStorage to prevent profile flickering.
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('user_session');
      if (cached) {
        try {
          const parsedUser = JSON.parse(cached);
          setState(prev => ({
            ...prev,
            user: parsedUser,
            isAuthenticated: true,
            // Keep isLoading:true — refreshAuth() will set it false once token is ready
          }));
        } catch {
          localStorage.removeItem('user_session');
        }
      }
    }
    refreshAuth();

    // Re-validate session when browser comes back online
    const handleOnline = () => {
      refreshAuth();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<{
      userId: string; name: string; email: string;
      roles: UserRole[]; accessToken: string;
    }>('/auth/login', { email, password });

    setAccessToken(data.data.accessToken);
    await refreshAuth();
  }, [refreshAuth]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const data = await apiPost<{
      userId: string; name: string; email: string;
      roles: UserRole[]; accessToken: string;
    }>('/auth/google', { credential });

    setAccessToken(data.data.accessToken);
    await refreshAuth();
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } finally {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_session');
      }
      setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const sendLoginOtp = useCallback(async (email: string) => {
    await apiPost('/auth/otp/send-login', { email });
  }, []);

  const loginWithOtp = useCallback(async (email: string, otp: string) => {
    const data = await apiPost<{
      userId: string; name: string; email: string;
      roles: UserRole[]; accessToken: string;
    }>('/auth/otp/verify-login', { email, otp });

    setAccessToken(data.data.accessToken);
    await refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout, refreshAuth, sendLoginOtp, loginWithOtp }}>
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
