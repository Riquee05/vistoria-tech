const CACHE = 'vistoria-offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(OFFLINE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('vistoria-offline-') && key !== CACHE)
      .map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

// Only cache the generic offline screen. Inspections, sessions and photos
// continue using the network and are never stored in this shared cache.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' ||
      new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.match(OFFLINE)) || new Response('Sem conexão', { status: 503 }),
  ));
});
