// AudioContext único de la app (BUILD_PLAN 1B y 9). iOS no deja sonar audio sin un gesto,
// así que el contexto se crea (o se reanuda) dentro del primer toque del usuario.
//
// Modo silencio del iPhone: con navigator.audioSession (Safari 17+) basta con pedir
// type = 'playback'. Si no existe, se reproduce en bucle un <audio> silencioso tras el
// gesto, que hace que iOS trate la app como reproductor y no la silencie.
//
// Voz y audio (arreglo de la v0.3.2): en el iPhone, cada locución de la voz del sistema se
// queda un momento con el sonido y, al acabar, el contexto puede quedar "interrumpido" o en
// pausa. Por eso, tras cada locución y en cada toque se vuelve a pedir el modo "playback" y
// se reanuda el contexto; si aun así no vuelve a sonar, en el siguiente toque se crea un
// contexto nuevo (quien guarde nodos del contexto viejo se entera con onAudioReset).

let ctx = null;
let master = null;
let silentAudio = null;
let silentUrl = null;
let stuck = false; // el contexto no ha vuelto a "running" al pedírselo
const resetListeners = new Set();

/** fn() se llama cuando se crea un contexto nuevo (para olvidar los nodos del viejo). */
export function onAudioReset(fn) {
  resetListeners.add(fn);
  return () => resetListeners.delete(fn);
}

const isRunning = () => ctx?.state === 'running';

/** Pide reanudar el contexto; si no lo consigue, queda marcado para recrearlo en el siguiente toque. */
function tryResume() {
  if (!ctx || isRunning()) { stuck = false; return; }
  ctx.resume().then(() => { stuck = !isRunning(); }).catch(() => { stuck = true; });
  // Safari a veces no resuelve la promesa con el contexto interrumpido: se comprueba al poco.
  setTimeout(() => { if (!isRunning()) stuck = true; }, 400);
}

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
  const volume = master?.gain.value ?? 1;
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  stuck = false;
  // Si iOS lo interrumpe (la voz, una llamada, otra app), se intenta reanudar en cuanto se pueda.
  ctx.onstatechange = () => { if (globalThis.document?.visibilityState === 'visible' && !isRunning()) tryResume(); };
  return true;
}

// Tras una llamada o al volver de otra app, el contexto puede quedar suspendido o interrumpido.
globalThis.document?.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.visibilityState === 'visible') {
    setPlaybackSession();
    tryResume();
  } else if (silentAudio && !silentAudio.paused) {
    silentAudio.pause(); // que no quede un reproductor en la pantalla de bloqueo
  }
});

/** Cierra el contexto atascado y crea otro (solo dentro de un toque, por iOS). */
function recreateContext() {
  const old = ctx;
  ctx = null;
  try { old?.close?.().catch(() => {}); } catch { /* ya cerrado */ }
  if (!createContext()) return;
  resetListeners.forEach((fn) => fn());
}

/**
 * Devuelve { ctx, master } (creándolo si hace falta) o null si el navegador no tiene Web Audio.
 * Se llama justo antes de sonar, normalmente dentro de un toque.
 */
export function getAudio() {
  if (!ctx && !createContext()) return null;
  if (!isRunning()) { setPlaybackSession(); tryResume(); }
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
  setPlaybackSession();
  if (stuck || ctx.state === 'closed') recreateContext();
  else tryResume();
  startSilentAudio();
}

/**
 * Después de cada locución (al terminar o al cortarla): la voz del sistema puede haberse
 * quedado con el sonido, así que se vuelve a pedir el modo "playback" y se reanuda el audio.
 */
export function afterSpeech() {
  if (!ctx) return;
  setPlaybackSession();
  tryResume();
}

/** Segundos del reloj del audio (0 si aún no hay contexto). */
export const audioTime = () => (ctx ? ctx.currentTime : 0);

/** Volumen general, de 0 a 1. */
export function setMasterVolume(volume) {
  if (master) master.gain.value = volume;
}
