'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { theme } from '@/lib/theme';
import { AuthProvider } from '@/features/auth/AuthContext';
import { SocketProvider } from '@/lib/SocketProvider';
import { PushNotificationProvider } from '@/features/notifications/usePushNotifications';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ScrollRestoration from './ScrollRestoration';

// Dynamically import non-critical interactive widgets to keep initial page load ultra-fast
const UserChatWidget = dynamic(() => import('@/features/chat/components/UserChatWidget'), {
  ssr: false,
});
const NotificationPrompt = dynamic(
  () => import('@/features/notifications/NotificationPrompt'),
  { ssr: false },
);
const PwaInstallPrompt = dynamic(() => import('@/components/pwa/PwaInstallPrompt'), {
  ssr: false,
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Use a fallback empty string for the client ID if not provided in env, 
  // but it's required for Google login to actually work.
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Globally prevent up/down arrows from changing number input values
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT' &&
        (document.activeElement as HTMLInputElement).type === 'number'
      ) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <PushNotificationProvider>
              <SocketProvider>
                <ScrollRestoration />
                {children}
                <UserChatWidget />
                <NotificationPrompt />
                <PwaInstallPrompt />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1e293b',
                      color: '#f1f5f9',
                      borderRadius: '8px',
                      fontSize: '14px',
                    },
                  }}
                />
              </SocketProvider>
            </PushNotificationProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
