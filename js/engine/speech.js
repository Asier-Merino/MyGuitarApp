// Voz (BUILD_PLAN 7.3 y 9): dice la consigna en es-ES o en-US según la notación principal.
// En iOS la primera locución debe ir dentro de un toque (primeSpeech) y las voces pueden
// cargarse tarde (voiceschanged). Cola sencilla: cada consigna nueva corta la anterior,
// salvo que se pida ponerla a la cola.
// En el iPhone la voz se queda un momento con el sonido: la voz solo se desbloquea una vez
// por sesión, y al acabar cada locución se devuelve el sonido a la app (afterSpeech).

import { afterSpeech } from '../audio/context.js';

/** Idioma de la voz según la notación principal. */
export const speechLang = (notation) => (notation === 'en' ? 'en-US' : 'es-ES');

/**
 * Elige la voz más adecuada: primero la del idioma exacto (es-ES), mejor si es local;
 * si no hay, otra del mismo idioma (es-MX…). null si no hay ninguna.
 */
export function pickVoice(voices, lang) {
  const norm = (v) => String(v.lang ?? '').replace('_', '-').toLowerCase();
  const exact = voices.filter((v) => norm(v) === lang.toLowerCase());
  return exact.find((v) => v.localService) ?? exact[0]
    ?? voices.find((v) => norm(v).startsWith(lang.slice(0, 2).toLowerCase())) ?? null;
}

const engine = () => globalThis.speechSynthesis ?? null;
let voices = [];
let listening = false;
let primed = false;

/** Al acabar o cortar una locución, el sonido vuelve a la app. */
function watch(u) {
  u.onend = () => afterSpeech();
  u.onerror = () => afterSpeech();
}

function loadVoices() {
  try { voices = engine()?.getVoices() ?? []; } catch { voices = []; }
}

function init() {
  if (listening || !engine()) return;
  listening = true;
  loadVoices();
  engine().addEventListener?.('voiceschanged', loadVoices);
}

export const speechSupported = () => Boolean(engine() && globalThis.SpeechSynthesisUtterance);

/**
 * Llamar dentro de un toque (p. ej. "Empezar"): en iOS desbloquea la voz para después.
 * Basta con una vez por sesión; repetirlo en cada ronda le quitaba el sonido a la app.
 */
export function primeSpeech() {
  if (!speechSupported() || primed) return;
  init();
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    watch(u);
    engine().speak(u);
    primed = true;
  } catch { /* sin voz */ }
}

/**
 * Dice un texto. notation: 'es' | 'en'. queue: true para ponerlo a la cola en vez de
 * cortar lo que se esté diciendo. Devuelve false si no hay voz en este navegador.
 */
export function speak(text, { notation = 'es', queue = false } = {}) {
  if (!speechSupported() || !text) return false;
  init();
  try {
    if (!queue) engine().cancel();
    const lang = speechLang(notation);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = pickVoice(voices, lang);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    watch(u);
    engine().speak(u);
    return true;
  } catch {
    return false;
  }
}

/** Calla la voz (al pausar, silenciar o salir del ejercicio). */
export function stopSpeech() {
  try { engine()?.cancel(); } catch { /* sin voz */ }
  afterSpeech();
}
