// Service worker: guarda la app para usarla sin conexión.
// Incrementa CACHE_VERSION en cada despliegue que cambie archivos de la app.
const CACHE_VERSION = 1;
const CACHE_PREFIX = 'myguitarapp-';
const CACHE_NAME = `${CACHE_PREFIX}v${CACHE_VERSION}`;

// Todos los archivos de la app (tests/sw-assets.test.js comprueba que la lista está completa).
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png',
  './js/main.js',
  './js/router.js',
  './js/state.js',
  './js/storage.js',
  './js/settings.js',
  './js/settings-view.js',
  './js/pwa.js',
  './js/version.js',
  './js/core/theory.js',
  './js/core/notation.js',
  './js/core/fretboard-model.js',
  './js/core/random.js',
  './js/ui/components.js',
  './js/ui/note-label.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // cache: 'reload' evita copiar versiones viejas de la caché HTTP de GitHub Pages.
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// La página pide activar la versión nueva cuando el usuario pulsa "Actualizar".
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
