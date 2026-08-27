/// <reference lib="webworker" />

import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

const bgSyncPlugin = new BackgroundSyncPlugin('chatMessagesQueue', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
});

registerRoute(
  ({ url }) => url.pathname.match(/\/chat\/.*\/messages/),
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// ─── Push Event Listener ─────────────────────────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Rewa Bhoomi';
    const options: NotificationOptions = {
      body: payload.body || 'You received a new message.',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      data: payload.data || {},
      tag: payload.data?.conversationId || 'chat-notification'
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Rewa Bhoomi', {
        body: text,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      })
    );
  }
});

// ─── Notification Click Listener ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with our app
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

