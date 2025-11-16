import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

clientsClaim();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache the plant identification history
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/identifications/history'),
  new StaleWhileRevalidate({
    cacheName: 'identification-history',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache plant images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'plant-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Handle offline fallback
const offlineFallbackPage = '/offline.html';
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async () => {
    try {
      return await fetch(request);
    } catch (error) {
      return caches.match(offlineFallbackPage);
    }
  }
);