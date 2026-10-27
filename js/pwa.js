// Registro del service worker y actualizaciones. No se registra en localhost
// para no ver versiones viejas durante el desarrollo.

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', ''];

let registration = null;
let reloadOnControllerChange = false;

export const isLocalhost = () => LOCAL_HOSTS.includes(location.hostname);

export const swSupported = () => 'serviceWorker' in navigator;

function whenInstalled(worker) {
  return new Promise((resolve) => {
    if (!worker || worker.state !== 'installing') { resolve(); return; }
    worker.addEventListener('statechange', () => {
      if (worker.state !== 'installing') resolve();
    });
  });
}

/** onUpdateReady se llama cuando hay una versión nueva esperando. */
export async function registerServiceWorker({ onUpdateReady }) {
  if (!swSupported() || isLocalhost()) return null;
  try {
    registration = await navigator.serviceWorker.register('./sw.js');
  } catch (e) {
    console.warn('No se pudo registrar el service worker', e);
    return null;
  }

  // Solo es "actualización" si ya había una versión controlando la página.
  const notifyIfWaiting = () => {
    if (registration.waiting && navigator.serviceWorker.controller) onUpdateReady();
  };
  notifyIfWaiting();
  registration.addEventListener('updatefound', async () => {
    await whenInstalled(registration.installing);
    notifyIfWaiting();
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadOnControllerChange) return;
    reloadOnControllerChange = false;
    location.reload();
  });

  // Al volver a la app, buscar actualizaciones.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration.update().catch(() => {});
  });
  return registration;
}

/** Activa la versión nueva y recarga. */
export function applyUpdate() {
  if (!registration?.waiting) { location.reload(); return; }
  reloadOnControllerChange = true;
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Busca una versión nueva. Devuelve:
 * 'ready' (hay una esperando) · 'none' · 'local' · 'unsupported' · 'error'
 */
export async function checkForUpdate() {
  if (!swSupported()) return 'unsupported';
  if (isLocalhost()) return 'local';
  try {
    registration = registration || await navigator.serviceWorker.getRegistration();
    if (!registration) return 'unsupported';
    await registration.update();
    await whenInstalled(registration.installing);
    return registration.waiting ? 'ready' : 'none';
  } catch {
    return 'error';
  }
}
