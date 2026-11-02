// Pantalla encendida (BUILD_PLAN 7.3 y 9): Screen Wake Lock mientras dura una ronda de
// Práctica o suena el Metrónomo. El sistema lo suelta al cambiar de app, así que se vuelve
// a pedir al volver. Si el navegador no lo admite, no pasa nada.

let sentinel = null;
let wanted = false;
let listening = false;

async function acquire() {
  if (!wanted || sentinel || document.visibilityState !== 'visible') return;
  try {
    if (!('wakeLock' in navigator)) return;
    const s = await navigator.wakeLock.request('screen');
    if (!wanted) { s.release().catch(() => {}); return; }
    sentinel = s;
    s.addEventListener('release', () => { if (sentinel === s) sentinel = null; });
  } catch { /* no permitido (p. ej. batería baja) */ }
}

/** Mantiene la pantalla encendida hasta llamar a releaseScreen(). */
export function keepScreenOn() {
  wanted = true;
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') acquire(); });
  }
  acquire();
}

export function releaseScreen() {
  wanted = false;
  const s = sentinel;
  sentinel = null;
  s?.release().catch(() => {});
}
