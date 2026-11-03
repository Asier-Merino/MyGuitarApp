// Metrónomo (BUILD_PLAN 1B y 6.6.18): 30–240 BPM, de 2 a 7 tiempos por compás con acento
// en el primero (clic más agudo y fuerte) y subdivisión en negras, corcheas o tresillos
// (clics más suaves entre tiempos). Usa el planificador con lookahead para un pulso estable.
// Los clics son sintéticos (no son notas) y respetan los ajustes "Sonido" y "Volumen".
// Subida automática de tempo (Calentamiento, Fase 3): set({ ramp: { everyBeats, step } })
// sube el tempo cada tantos tiempos; stopRamp() la detiene. perBeat: clics por tiempo fuera
// de las subdivisiones del Metrónomo (p. ej. 4 para las semicorcheas del Calentamiento).

import { getAudio, setMasterVolume } from './context.js';
import { createScheduler } from './scheduler.js';
import { nextPulse, pulseKind, secondsPerBeat, subdivisionPerBeat, normalizeMetronome, clampBpm } from '../core/rhythm.js';
import { settings } from '../state.js';

const CLICKS = Object.freeze({
  accent: { freq: 1760, gain: 0.9 },
  beat: { freq: 1175, gain: 0.55 },
  sub: { freq: 880, gain: 0.25 },
});

export function click(ctx, destination, time, kind) {
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
 * onPulse({ beat, sub, kind, bpm }) se llama cuando suena cada clic (para iluminar los puntos).
 * onTempo(bpm) se llama cuando la subida automática cambia el tempo.
 * Los cambios de tempo, compás o subdivisión se aplican al momento, también mientras suena.
 */
export function createMetronome({ onPulse, onStop, onTempo } = {}) {
  let options = normalizeMetronome();
  let perBeatOverride = null;
  let ramp = null; // { everyBeats, step, count }
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

    set({ perBeat, ramp: rampPatch, ...patch }) {
      options = normalizeMetronome({ ...options, ...patch });
      if (perBeat !== undefined) perBeatOverride = perBeat;
      if (rampPatch !== undefined) ramp = rampPatch ? { ...rampPatch, count: 0 } : null;
    },

    /** Detiene la subida automática de tempo (el tempo se queda donde está). */
    stopRamp() { ramp = null; },
    get ramping() { return Boolean(ramp); },

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
          if (ramp && pulse.sub === 0) {
            if (ramp.count > 0 && ramp.count % ramp.everyBeats === 0) {
              options = { ...options, bpm: clampBpm(options.bpm + ramp.step) };
              const bpm = options.bpm;
              const tid = setTimeout(() => { timers.delete(tid); onTempo?.(bpm); }, Math.max(0, (time - ctx.currentTime) * 1000));
              timers.add(tid);
            }
            ramp.count += 1;
          }
          const info = { ...pulse, kind, bpm: options.bpm };
          const id = setTimeout(() => { timers.delete(id); onPulse?.(info); }, Math.max(0, (time - ctx.currentTime) * 1000));
          timers.add(id);
          const perBeat = perBeatOverride ?? subdivisionPerBeat(options.subdivision);
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
