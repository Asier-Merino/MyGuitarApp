// AudioContext único de la app (BUILD_PLAN 9). Se crea dentro del primer toque del usuario,
// porque iOS no deja sonar audio sin un gesto. Versión mínima de la Fase 1A: la 1B añade
// la alternativa del <audio> silencioso para el modo silencio en iPhones sin audioSession.

let ctx = null;
let master = null;

/** Devuelve el contexto (creándolo si hace falta) o null si el navegador no tiene Web Audio. */
export function getAudio() {
  if (ctx) {
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return { ctx, master };
  }
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    // Que suene aunque el iPhone esté en silencio (Safari 17+).
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch { /* no disponible */ }
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.connect(ctx.destination);
  // Tras una llamada o al volver de otra app, el contexto puede quedar suspendido.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx.state !== 'running') ctx.resume().catch(() => {});
  });
  return { ctx, master };
}

/** Volumen general, de 0 a 1. */
export function setMasterVolume(volume) {
  if (master) master.gain.value = volume;
}
