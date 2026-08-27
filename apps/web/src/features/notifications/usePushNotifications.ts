'use client';

import { useEffect, useRef, useCallback } from 'react';
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

/**
 * Manages Web Push subscription lifecycle.
 * - If the user has already granted permission, subscribes automatically after login.
 * - Exposes `requestPermission()` to be called from a user gesture (button click)
 *   to prompt for permission without browser blocking it.
 */
export function usePushNotifications() {
  const { isAuthenticated, user } = useAuth();
  const subscribedRef = useRef(false);

  const subscribeWithPermission = useCallback(async (permission: NotificationPermission) => {
    if (permission !== 'granted') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) return;

      const response: any = await apiGet('/notifications/vapid-key');
      const vapidPublicKey = response?.publicKey ?? response?.data?.publicKey;
      if (!vapidPublicKey) return;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      if (subscription) {
        await apiPost('/notifications/subscribe', subscription.toJSON());
        subscribedRef.current = true;
      }
    } catch (error) {
      console.warn('Push notification subscription failed:', error);
    }
  }, []);

  // Auto-subscribe if user has ALREADY granted permission (no prompt needed)
  useEffect(() => {
    if (!isAuthenticated || !user || subscribedRef.current) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      subscribeWithPermission('granted');
    }
  }, [isAuthenticated, user, subscribeWithPermission]);

  /**
   * Call this from a button click handler.
   * Browsers require a user gesture to show the permission prompt.
   */
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      await subscribeWithPermission(permission);
    } catch (error) {
      console.warn('Permission request failed:', error);
    }
  }, [subscribeWithPermission]);

  return { requestPermission };
}
