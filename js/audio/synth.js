// Reproducción de notas con la cuerda pulsada (versión mínima de la Fase 1A; la 1B añade
// rasgueos y arpegios). Respeta los ajustes "Sonido" y "Volumen".

import { getAudio, setMasterVolume } from './context.js';
import { renderPluck } from './pluck.js';
import { midiToFreq } from '../core/theory.js';
import { settings } from '../state.js';

const cache = new Map(); // MIDI → AudioBuffer

function bufferFor(ctx, midi) {
  if (!cache.has(midi)) {
    const data = renderPluck(midiToFreq(midi), ctx.sampleRate, { seconds: 2.5, seed: midi });
    const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buffer.copyToChannel(data, 0);
    cache.set(midi, buffer);
  }
  return cache.get(midi);
}

/** Toca una nota MIDI ahora (o dentro de `delay` segundos). Devuelve false si no suena. */
export function playNote(midi, { delay = 0 } = {}) {
  if (!settings.get('sound')) return false;
  const audio = getAudio();
  if (!audio) return false;
  const { ctx, master } = audio;
  setMasterVolume(settings.get('volume'));
  const source = ctx.createBufferSource();
  source.buffer = bufferFor(ctx, midi);
  source.connect(master);
  source.start(ctx.currentTime + delay);
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
