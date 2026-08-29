'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

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
 * - Tracks whether notifications are supported and currently active.
 * - Exposes `enableNotifications()` and `disableNotifications()` triggers.
 */
export function usePushNotifications() {
  const { isAuthenticated, user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const subscribedRef = useRef(false);

  // Check support and active subscription on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported && isAuthenticated && user) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        if (subscription) {
          subscribedRef.current = true;
        }
      }).catch((err) => {
        console.warn('Error checking push subscription:', err);
      });
    }
  }, [isAuthenticated, user]);

  const subscribeWithPermission = useCallback(async (permission: NotificationPermission) => {
    if (permission !== 'granted') return null;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) return null;

      const response: any = await apiGet('/notifications/vapid-key');
      const vapidPublicKey = response?.publicKey ?? response?.data?.publicKey;
      if (!vapidPublicKey) return null;

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
        setIsSubscribed(true);
        return subscription;
      }
    } catch (error) {
      console.warn('Push notification subscription failed:', error);
    }
    return null;
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
   * Request permission and subscribe.
   */
  const enableNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifications are not supported on this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        toast.error('Notifications blocked by browser. Click the lock icon 🔒 near URL to allow them, then try again.', { duration: 6000 });
        return;
      }
      if (permission !== 'granted') {
        toast.error('Permission not granted for notifications.');
        return;
      }
      const sub = await subscribeWithPermission(permission);
      if (sub) {
        toast.success('Notifications enabled successfully!');
      } else {
        toast.error('Failed to enable notifications');
      }
    } catch (error) {
      console.warn('Permission request failed:', error);
      toast.error('Failed to request notification permission');
    }
  }, [subscribeWithPermission]);

  /**
   * Unsubscribe from push service and backend.
   */
  const disableNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiPost('/notifications/unsubscribe', { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      subscribedRef.current = false;
      setIsSubscribed(false);
      toast.success('Notifications disabled');
    } catch (error) {
      console.warn('Failed to unsubscribe:', error);
      toast.error('Failed to disable notifications');
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    enableNotifications,
    disableNotifications,
    requestPermission: enableNotifications // keep alias for backward compatibility in widget
  };
}
