// AudioContext único de la app (BUILD_PLAN 1B y 9). iOS no deja sonar audio sin un gesto,
// así que el contexto se crea (o se reanuda) dentro del primer toque del usuario.
//
// Modo silencio del iPhone: con navigator.audioSession (Safari 17+) basta con pedir
// type = 'playback'. Si no existe, se reproduce en bucle un <audio> silencioso tras el
// gesto, que hace que iOS trate la app como reproductor y no la silencie.

let ctx = null;
let master = null;
let silentAudio = null;
let silentUrl = null;

const isIOS = () => {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

function setPlaybackSession() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch { /* no disponible */ }
}

/** WAV de medio segundo de silencio (8 kHz, 8 bits, mono), creado en memoria. */
function silentWav() {
  if (silentUrl) return silentUrl;
  const samples = 4000;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + samples, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128); // 128 = silencio en 8 bits
  silentUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return silentUrl;
}

/** Alternativa para iPhones sin audioSession: <audio> silencioso en bucle (solo tras un gesto). */
function startSilentAudio() {
  if (navigator.audioSession || !isIOS()) return;
  try {
    if (!silentAudio) {
      silentAudio = new Audio();
      silentAudio.src = silentWav();
      silentAudio.loop = true;
      silentAudio.preload = 'auto';
      silentAudio.setAttribute('playsinline', '');
      silentAudio.setAttribute('aria-hidden', 'true');
    }
    if (silentAudio.paused) silentAudio.play().catch(() => {});
  } catch { /* sin <audio> */ }
}

function createContext() {
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) return false;
  setPlaybackSession();
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.connect(ctx.destination);
  // Tras una llamada o al volver de otra app, el contexto puede quedar suspendido o interrumpido.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
    } else if (silentAudio && !silentAudio.paused) {
      silentAudio.pause(); // que no quede un reproductor en la pantalla de bloqueo
    }
  });
  return true;
}

/**
 * Devuelve { ctx, master } (creándolo si hace falta) o null si el navegador no tiene Web Audio.
 * Se llama justo antes de sonar, normalmente dentro de un toque.
 */
export function getAudio() {
  if (!ctx && !createContext()) return null;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  startSilentAudio();
  return { ctx, master };
}

/**
 * Se llama en cada toque sobre un botón (main.js): crea el contexto en el primer toque y lo
 * reanuda si iOS lo ha suspendido. Así el primer sonido ya sale aunque el toque fuera en otro botón.
 */
export function unlockAudio() {
  if (!ctx) {
    createContext();
    return;
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
}

/** Segundos del reloj del audio (0 si aún no hay contexto). */
export const audioTime = () => (ctx ? ctx.currentTime : 0);

/** Volumen general, de 0 a 1. */
export function setMasterVolume(volume) {
  if (master) master.gain.value = volume;
}
