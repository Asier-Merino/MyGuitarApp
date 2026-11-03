// Cuerda pulsada Karplus-Strong (BUILD_PLAN 1B): un AudioBuffer por nota (≈2 s, decaimiento
// ≈0,996), guardado en caché por MIDI, y un filtro paso bajo suave a la salida.
// playNote, strum (≈25 ms entre cuerdas) y arpeggio. Respeta los ajustes "Sonido" y "Volumen".

import { getAudio, setMasterVolume, onAudioReset } from './context.js';
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

// Con un contexto de audio nuevo, el filtro y las muestras se vuelven a crear en él.
onAudioReset(() => {
  output = null;
  cache.clear();
});

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

/* ----- Rasgueo continuo (ejercicio "Rasgueo") ----- */

/** Cuerdas que suenan en un golpe hacia arriba: las 4 más agudas (el golpe arriba suele ser más corto). */
const UP_STRINGS = 4;
const DAMP_S = 0.03;

/**
 * Rasgueador para tocar un patrón: cada golpe apaga el anterior un instante antes, como la
 * mano que vuelve a la cuerda. hit(midis, 'down' | 'up', { when, accent }).
 */
export function createStrummer() {
  let ringing = [];
  return {
    hit(midis, direction, { when, accent = false } = {}) {
      const ctx = ready();
      if (!ctx || !midis.length) return false;
      const start = when ?? ctx.currentTime + 0.01;
      for (const v of ringing) {
        v.gain.gain.setTargetAtTime(0, Math.max(ctx.currentTime, start - 0.005), DAMP_S / 3);
        v.source.stop(Math.max(ctx.currentTime, start) + DAMP_S * 4);
      }
      const notes = direction === 'up' ? midis.slice(-UP_STRINGS).reverse() : midis;
      const level = CHORD_GAIN * (accent ? 1.5 : 1) * (direction === 'up' ? 0.75 : 1);
      ringing = notes.map((midi, i) => {
        const source = ctx.createBufferSource();
        source.buffer = bufferFor(ctx, midi);
        const gain = ctx.createGain();
        gain.gain.value = level;
        source.connect(gain).connect(output);
        source.start(start + i * (STRUM_SPACING * 0.6));
        return { source, gain };
      });
      return true;
    },
    stop() {
      const ctx = ready();
      for (const v of ringing) {
        try {
          if (ctx) v.gain.gain.setTargetAtTime(0, ctx.currentTime, DAMP_S / 3);
          v.source.stop((ctx?.currentTime ?? 0) + DAMP_S * 4);
        } catch { /* ya parada */ }
      }
      ringing = [];
    },
  };
}

/* ----- Notas con técnica (tablatura, BUILD_PLAN 6.7) ----- */

const RELEASE_S = 0.06;
const PALM_MUTE_HZ = 900;
const PALM_MUTE_S = 0.22;

/**
 * Una nota pulsada con su curva de altura (semitonos respecto a `midi`, repartidos de `when`
 * a `when + dur`). La altura cambia sin volver a pulsar (ligados, deslizamientos,
 * estiramientos, vibrato). Opciones: gain, palmMute (decaimiento corto y apagado), letRing
 * (sigue sonando después de su duración), fadeOut (se apaga al final, al salir deslizando).
 * Devuelve una función que la para, o null si no suena.
 */
export function playPluck({ midi, when, dur, curve, gain = 1, palmMute = false, letRing = false, fadeOut = false }) {
  const ctx = ready();
  if (!ctx) return null;
  const start = Math.max(when, ctx.currentTime);
  const source = ctx.createBufferSource();
  source.buffer = bufferFor(ctx, midi);
  if (curve?.some((v) => v !== 0)) {
    const ratios = Float32Array.from(curve, (semis) => 2 ** (semis / 12));
    source.playbackRate.setValueCurveAtTime(ratios, start, Math.max(0.01, dur));
  }
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, start);
  let node = source;
  if (palmMute) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = PALM_MUTE_HZ;
    node = node.connect(lp);
    env.gain.setTargetAtTime(0.0001, start + 0.02, PALM_MUTE_S / 3);
  }
  node.connect(env).connect(output);
  source.start(start);
  const end = start + dur;
  if (fadeOut) env.gain.setTargetAtTime(0.0001, start + dur * 0.5, dur / 6);
  if (!letRing) {
    env.gain.setTargetAtTime(0.0001, end, RELEASE_S / 3);
    source.stop(end + RELEASE_S * 2);
  }
  return () => { try { env.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.01); source.stop(ctx.currentTime + 0.05); } catch { /* ya parada */ } };
}

/**
 * Armónico: un timbre más puro que la cuerda pulsada (seno con un poco de su octava) y un
 * decaimiento largo. Es una aproximación: suena parecido a una campana, más limpio que en una guitarra.
 */
export function playHarmonic({ midi, when, dur, letRing = true }) {
  const ctx = ready();
  if (!ctx) return null;
  const start = Math.max(when, ctx.currentTime);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(0.5, start + 0.005);
  env.gain.setTargetAtTime(0.0001, start + 0.01, letRing ? 0.6 : Math.min(0.6, dur / 2));
  env.connect(output);
  const oscs = [[1, 1], [2, 0.12]].map(([mult, level]) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = midiToFreq(midi) * mult;
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(g).connect(env);
    osc.start(start);
    osc.stop(start + 3);
    return osc;
  });
  return () => oscs.forEach((o) => { try { o.stop(); } catch { /* ya parada */ } });
}

/** Nota muerta (x): un golpe corto sin altura, ruido filtrado de 40 ms. */
export function playDeadNote({ when }) {
  const ctx = ready();
  if (!ctx) return null;
  const start = Math.max(when, ctx.currentTime);
  const length = Math.round(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1500;
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = 0.6;
  source.connect(bp).connect(g).connect(output);
  source.start(start);
  return () => { try { source.stop(); } catch { /* ya parada */ } };
}

/** Reloj del audio (para programar) o null si no hay sonido. */
export function audioNow() {
  const ctx = ready();
  return ctx ? ctx.currentTime : null;
}
