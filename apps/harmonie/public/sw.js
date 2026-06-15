const CACHE_NAME = 'harmonie-shell-v1';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        const deletions = [];
        for (const key of keys) {
          if (key !== CACHE_NAME) deletions.push(caches.delete(key));
        }
        return Promise.all(deletions);
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return response;
      });
    })
  );
});

const buildNotificationTargetUrl = (payload) => {
  const data = payload?.data;
  if (!data || payload.type !== 'message.created') return '/';

  if (data.scope === 'channel' && data.guildId && data.channelId) {
    return `/guilds/${data.guildId}/channels/${data.channelId}`;
  }

  if (data.scope === 'conversation' && data.conversationId) {
    return `/conversations/${data.conversationId}`;
  }

  return '/';
};

const buildNotificationTitle = (payload) => {
  const data = payload?.data ?? {};
  const author = data.authorDisplayName || 'Harmonie';

  if (data.scope === 'channel') {
    const guild = data.guildName || 'Harmonie';
    const channel = data.channelName || '';
    return channel ? `${author} - ${guild} | ${channel}` : `${author} - ${guild}`;
  }

  if (data.scope === 'conversation') {
    return data.conversationName ? `${author} - ${data.conversationName}` : author;
  }

  return 'Harmonie';
};

const parsePushPayload = (event) => {
  if (!event.data) return null;

  try {
    return event.data.json();
  } catch {
    return null;
  }
};

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event);
  if (!payload) return;

  const messageId = payload?.data?.messageId;
  const targetUrl = buildNotificationTargetUrl(payload);

  event.waitUntil(
    self.registration.showNotification(buildNotificationTitle(payload), {
      tag: messageId ? `message-${messageId}` : 'harmonie-message',
      icon: '/harmonie.png',
      badge: '/pwa-icon-192.png',
      data: { targetUrl },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.targetUrl || '/';
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== self.location.origin) continue;

        return client.focus().then(() => client.navigate(absoluteTargetUrl));
      }

      return self.clients.openWindow(absoluteTargetUrl);
    })
  );
});
