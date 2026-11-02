// Metrónomo (BUILD_PLAN 1B y 6.6.18): 30–240 BPM, de 2 a 7 tiempos por compás con acento
// en el primero (clic más agudo y fuerte) y subdivisión en negras, corcheas o tresillos
// (clics más suaves entre tiempos). Usa el planificador con lookahead para un pulso estable.
// Los clics son sintéticos (no son notas) y respetan los ajustes "Sonido" y "Volumen".

import { getAudio, setMasterVolume } from './context.js';
import { createScheduler } from './scheduler.js';
import { nextPulse, pulseKind, secondsPerBeat, subdivisionPerBeat, normalizeMetronome } from '../core/rhythm.js';
import { settings } from '../state.js';

const CLICKS = Object.freeze({
  accent: { freq: 1760, gain: 0.9 },
  beat: { freq: 1175, gain: 0.55 },
  sub: { freq: 880, gain: 0.25 },
});

function click(ctx, destination, time, kind) {
  const { freq, gain } = CLICKS[kind];
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(env).connect(destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

/**
 * onPulse({ beat, sub, kind }) se llama cuando suena cada clic (para iluminar los puntos).
 * Los cambios de tempo, compás o subdivisión se aplican al momento, también mientras suena.
 */
export function createMetronome({ onPulse, onStop } = {}) {
  let options = normalizeMetronome();
  let scheduler = null;
  let pulse = { beat: 0, sub: 0 };
  const timers = new Set();

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers.clear();
  }

  function stop() {
    const was = Boolean(scheduler?.running);
    scheduler?.stop();
    scheduler = null;
    clearTimers();
    if (was) onStop?.();
  }

  return {
    get options() { return { ...options }; },
    get running() { return Boolean(scheduler?.running); },

    set(patch) {
      options = normalizeMetronome({ ...options, ...patch });
    },

    /** Empieza a sonar (dentro de un toque, por iOS). Devuelve false si no hay Web Audio. */
    start() {
      stop();
      const audio = getAudio();
      if (!audio) return false;
      const { ctx, master } = audio;
      setMasterVolume(settings.get('volume'));
      pulse = { beat: 0, sub: 0 };
      scheduler = createScheduler({
        now: () => ctx.currentTime,
        onEvent: (time) => {
          const kind = pulseKind(pulse);
          if (settings.get('sound')) click(ctx, master, time, kind);
          const info = { ...pulse, kind };
          const id = setTimeout(() => { timers.delete(id); onPulse?.(info); }, Math.max(0, (time - ctx.currentTime) * 1000));
          timers.add(id);
          const perBeat = subdivisionPerBeat(options.subdivision);
          pulse = nextPulse(pulse, { beatsPerBar: options.beatsPerBar, perBeat });
          return time + secondsPerBeat(options.bpm) / perBeat;
        },
      });
      scheduler.start(ctx.currentTime + 0.06);
      return true;
    },

    stop,
  };
}
