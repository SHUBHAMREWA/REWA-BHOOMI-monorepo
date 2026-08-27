'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { apiGet, apiPost } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { isAuthenticated, user } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || subscribedRef.current) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registerPush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (!registration) return;

        // Fetch VAPID public key
        const response: any = await apiGet('/notifications/vapid-key');
        const vapidPublicKey = response?.data?.publicKey;
        if (!vapidPublicKey) return;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // If permission is default, ask for permission when appropriate
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
        }

        if (subscription) {
          // Send subscription to backend
          await apiPost('/notifications/subscribe', subscription.toJSON());
          subscribedRef.current = true;
        }
      } catch (error) {
        console.warn('Push notification subscription skipped or failed:', error);
      }
    };

    registerPush();
  }, [isAuthenticated, user]);
}
