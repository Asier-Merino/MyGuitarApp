// Cuerda pulsada Karplus-Strong (BUILD_PLAN 1B): un AudioBuffer por nota (≈2 s, decaimiento
// ≈0,996), guardado en caché por MIDI, y un filtro paso bajo suave a la salida.
// playNote, strum (≈25 ms entre cuerdas) y arpeggio. Respeta los ajustes "Sonido" y "Volumen".

import { getAudio, setMasterVolume } from './context.js';
import { renderPluck } from './pluck.js';
import { midiToFreq } from '../core/theory.js';
import { settings } from '../state.js';

const NOTE_SECONDS = 2;
const DECAY = 0.996;
const LOWPASS_HZ = 5000;
/** Separación entre cuerdas al rasguear. */
export const STRUM_SPACING = 0.025;
/** Volumen de cada cuerda en un acorde, para que seis a la vez no saturen. */
const CHORD_GAIN = 0.45;

const cache = new Map(); // MIDI → AudioBuffer
let output = null; // filtro paso bajo → master

function bufferFor(ctx, midi) {
  if (!cache.has(midi)) {
    const data = renderPluck(midiToFreq(midi), ctx.sampleRate, { seconds: NOTE_SECONDS, decay: DECAY, seed: midi });
    const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buffer.copyToChannel(data, 0);
    cache.set(midi, buffer);
  }
  return cache.get(midi);
}

/** Contexto listo para sonar (o null si el sonido está desactivado o no hay Web Audio). */
function ready() {
  if (!settings.get('sound')) return null;
  const audio = getAudio();
  if (!audio) return null;
  const { ctx, master } = audio;
  if (!output) {
    output = ctx.createBiquadFilter();
    output.type = 'lowpass';
    output.frequency.value = LOWPASS_HZ;
    output.Q.value = 0.5;
    output.connect(master);
  }
  setMasterVolume(settings.get('volume'));
  return ctx;
}

function startNote(ctx, midi, when, gain) {
  const source = ctx.createBufferSource();
  source.buffer = bufferFor(ctx, midi);
  if (gain === 1) {
    source.connect(output);
  } else {
    const g = ctx.createGain();
    g.gain.value = gain;
    source.connect(g).connect(output);
  }
  source.start(Math.max(when, ctx.currentTime));
}

/**
 * Toca una nota MIDI ahora, dentro de `delay` segundos o en el instante `when` del reloj
 * del audio. Devuelve false si no suena.
 */
export function playNote(midi, { delay = 0, when, gain = 1 } = {}) {
  const ctx = ready();
  if (!ctx) return false;
  startNote(ctx, midi, when ?? ctx.currentTime + delay, gain);
  return true;
}

/**
 * Rasgueo: notas MIDI de la más grave a la más aguda. 'down' (↓) empieza por la grave,
 * 'up' (↑) por la aguda, con ~25 ms entre cuerdas.
 */
export function strum(midis, direction = 'down', { when, spacing = STRUM_SPACING } = {}) {
  const ctx = ready();
  if (!ctx || !midis.length) return false;
  const order = direction === 'up' ? [...midis].reverse() : midis;
  const start = when ?? ctx.currentTime + 0.01;
  order.forEach((midi, i) => startNote(ctx, midi, start + i * spacing, CHORD_GAIN));
  return true;
}

/** Arpegio: las notas una a una, de la más grave a la más aguda. */
export function arpeggio(midis, { gap = 0.22, when } = {}) {
  const ctx = ready();
  if (!ctx || !midis.length) return false;
  const start = when ?? ctx.currentTime + 0.01;
  midis.forEach((midi, i) => startNote(ctx, midi, start + i * gap, 0.8));
  return true;
}

/**
 * Toca notas una tras otra, cada `gap` segundos. onStep(index) se llama al sonar cada una
 * y onEnd() al terminar. Devuelve una función para detenerla.
 */
export function playSequence(midis, { gap = 0.6, onStep, onEnd } = {}) {
  if (settings.get('sound')) getAudio(); // desbloquea el audio dentro del toque (iOS)
  const timers = [];
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
  };
  midis.forEach((midi, i) => {
    timers.push(setTimeout(() => {
      if (stopped) return;
      playNote(midi);
      onStep?.(i);
    }, i * gap * 1000));
  });
  timers.push(setTimeout(() => {
    if (stopped) return;
    stopped = true;
    onEnd?.();
  }, midis.length * gap * 1000));
  return stop;
}

/** true si hay sonido disponible y activado (para avisar al usuario si no). */
export const soundEnabled = () => settings.get('sound');
