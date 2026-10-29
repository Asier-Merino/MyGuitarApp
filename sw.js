// Service worker: guarda la app para usarla sin conexión.
// Incrementa CACHE_VERSION en cada despliegue que cambie archivos de la app.
const CACHE_VERSION = 2;
const CACHE_PREFIX = 'myguitarapp-';
const CACHE_NAME = `${CACHE_PREFIX}v${CACHE_VERSION}`;

// Todos los archivos de la app (tests/sw-assets.test.js comprueba que la lista está completa).
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './icons/apple-touch-icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './js/main.js',
  './js/pwa.js',
  './js/router.js',
  './js/routes.js',
  './js/settings-view.js',
  './js/settings.js',
  './js/state.js',
  './js/storage.js',
  './js/version.js',
  './js/audio/context.js',
  './js/audio/pluck.js',
  './js/audio/synth.js',
  './js/core/fretboard-model.js',
  './js/core/glossary.js',
  './js/core/history.js',
  './js/core/notation.js',
  './js/core/random.js',
  './js/core/theory.js',
  './js/data/concepts.js',
  './js/data/modules.js',
  './js/data/tunings.js',
  './js/screens/home.js',
  './js/screens/module.js',
  './js/screens/screen.js',
  './js/screens/section.js',
  './js/screens/setup.js',
  './js/screens/soon.js',
  './js/ui/components.js',
  './js/ui/help-sheet.js',
  './js/ui/icons.js',
  './js/ui/note-label.js',
  './js/ui/term.js',
  './js/ui/tuning-picker.js',
  './js/modules/glossary/glossary-view.js',
  './js/modules/profile/profile-view.js',
  './js/modules/tunings/tunings-view.js',
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
