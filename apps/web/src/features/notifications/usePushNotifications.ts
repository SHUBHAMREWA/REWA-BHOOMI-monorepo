'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
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

interface PushNotificationContextType {
  isSupported: boolean;
  isSubscribed: boolean;
  permissionState: NotificationPermission | 'unsupported';
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

const PushNotificationContext = createContext<PushNotificationContextType>({
  isSupported: false,
  isSubscribed: false,
  permissionState: 'unsupported',
  enableNotifications: async () => false,
  disableNotifications: async () => false,
  requestPermission: async () => false,
});

/**
 * Ensures Service Worker is registered with a safe timeout fallback.
 */
async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }

    // Wait for SW to be ready with a 4-second timeout to prevent infinite hang
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

    const activeReg = await Promise.race([readyPromise, timeoutPromise]);
    return activeReg || reg;
  } catch (error) {
    console.warn('Failed to register/get Service Worker:', error);
    return null;
  }
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const isSyncingRef = useRef(false);

  // Initialize and check status on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    setPermissionState(supported ? Notification.permission : 'unsupported');

    if (!supported) return;

    // Proactively register SW in background
    getOrRegisterServiceWorker().then(async (registration) => {
      if (!registration) return;

      try {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.warn('Error checking existing push subscription:', err);
      }
    });
  }, []);

  /**
   * Subscribes browser push manager using backend VAPID key and sends endpoint to API.
   */
  const subscribeWithPermission = useCallback(async (permission: NotificationPermission): Promise<PushSubscription | null> => {
    if (permission !== 'granted') return null;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;

    try {
      const registration = await getOrRegisterServiceWorker();
      if (!registration) {
        console.warn('Service Worker registration not available for push subscription');
        return null;
      }

      // Fetch VAPID public key from backend
      const response: any = await apiGet('/notifications/vapid-key');
      const vapidPublicKey = response?.publicKey ?? response?.data?.publicKey ?? response;
      if (!vapidPublicKey) {
        console.error('VAPID public key not found from backend');
        return null;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      let subscription = await registration.pushManager.getSubscription();

      // If existing subscription exists, verify or refresh
      if (subscription) {
        try {
          await apiPost('/notifications/subscribe', subscription.toJSON());
          setIsSubscribed(true);
          return subscription;
        } catch (postErr) {
          console.warn('Existing subscription failed to sync with backend, recreating...', postErr);
          await subscription.unsubscribe().catch(() => {});
          subscription = null;
        }
      }

      // Create new subscription
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      if (subscription) {
        await apiPost('/notifications/subscribe', subscription.toJSON());
        setIsSubscribed(true);
        return subscription;
      }
    } catch (error) {
      console.error('Push notification subscription error:', error);
    }
    return null;
  }, []);

  // Auto-subscribe if user is logged in and browser permission is ALREADY granted
  useEffect(() => {
    if (!isAuthenticated || !user || !isSupported || isSyncingRef.current) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      isSyncingRef.current = true;
      subscribeWithPermission('granted')
        .then((sub) => {
          if (sub) setIsSubscribed(true);
        })
        .finally(() => {
          isSyncingRef.current = false;
        });
    }
  }, [isAuthenticated, user, isSupported, subscribeWithPermission]);

  /**
   * Request permission and subscribe.
   */
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window) || !isSupported) {
      toast.error('Notifications are not supported on this browser');
      return false;
    }

    try {
      let permission: NotificationPermission = Notification.permission;

      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
        setPermissionState(permission);
      }

      if (permission === 'denied') {
        toast.error('Notifications blocked by browser. Click the lock icon 🔒 near URL to allow them, then try again.', { duration: 6000 });
        return false;
      }

      if (permission !== 'granted') {
        toast.error('Notification permission was not granted.');
        return false;
      }

      const sub = await subscribeWithPermission('granted');
      if (sub) {
        setIsSubscribed(true);
        toast.success('Notifications enabled successfully!');
        return true;
      } else {
        toast.error('Failed to register notifications with server.');
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported, subscribeWithPermission]);

  /**
   * Unsubscribe from push service and backend.
   */
  const disableNotifications = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const registration = await getOrRegisterServiceWorker();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await apiPost('/notifications/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});
          await subscription.unsubscribe().catch(() => {});
        }
      }
      setIsSubscribed(false);
      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      console.warn('Failed to unsubscribe:', error);
      toast.error('Failed to disable notifications');
      return false;
    }
  }, []);

  const value: PushNotificationContextType = {
    isSupported,
    isSubscribed,
    permissionState,
    enableNotifications,
    disableNotifications,
    requestPermission: enableNotifications,
  };

  return React.createElement(
    PushNotificationContext.Provider,
    { value },
    children
  );
}

export function usePushNotifications() {
  return useContext(PushNotificationContext);
}
