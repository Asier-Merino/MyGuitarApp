// Lo que comparten los dos motores: preparación de cada ejercicio, arranque de la ronda,
// registro de sesiones, estadísticas y récords (BUILD_PLAN 6.6.6, 6.6.10, 6.6.13 y 7.2).

import { store, settings } from '../state.js';
import { LEVEL_IDS } from '../data/modules.js';
import { allowedTunings, DEFAULT_TUNING_ID } from '../data/tunings.js';
import { historyEntry, updateRecord, normalizeDuration } from '../core/session.js';
import { recordResult } from '../core/stats.js';
import { normalizeMetronome } from '../core/rhythm.js';
import { exerciseById, isPlayable } from './exercise-registry.js';

/** Opciones propias de un ejercicio (p. ej. metrónomo), con sus valores guardados. */
function exerciseOptions(exercise, saved = {}) {
  const result = {};
  for (const opt of exercise.options ?? []) {
    if (opt.type === 'metronome') {
      const s = saved[opt.id] ?? {};
      result[opt.id] = {
        on: typeof s.on === 'boolean' ? s.on : opt.default.on,
        bpm: normalizeMetronome({ bpm: Number.isFinite(s.bpm) ? s.bpm : opt.default.bpm }).bpm,
      };
    }
  }
  return result;
}

/**
 * Preparación de un ejercicio: el último nivel, afinación, duración y opciones usados, o los
 * valores iniciales (7.6: la afinación por defecto de Ajustes si el ejercicio la admite).
 */
export function exerciseSetup(exercise) {
  const saved = store.data.setups[exercise.id] ?? {};
  const allowed = allowedTunings(exercise.tunings);
  const isAllowed = (id) => allowed.some((t) => t.id === id);
  const level = LEVEL_IDS.includes(saved.level) ? saved.level : LEVEL_IDS[0];
  let tuning = DEFAULT_TUNING_ID;
  if (isAllowed(saved.tuning)) tuning = saved.tuning;
  else if (isAllowed(settings.get('defaultTuning'))) tuning = settings.get('defaultTuning');
  const duration = exercise.duration
    ? normalizeDuration(saved.duration, { unlimited: exercise.duration.unlimited, fallback: exercise.duration.default })
    : null;
  return { level, tuning, allowed, duration, options: exerciseOptions(exercise, saved.options) };
}

export function saveSetup(exercise, patch) {
  store.update((d) => { d.setups[exercise.id] = { ...d.setups[exercise.id], ...patch }; });
}

/* ----- Arranque: "Empezar" deja preparada la ronda y la pantalla del ejercicio la recoge ----- */

let pending = null;

export function setPendingRound(round) {
  pending = round;
}

/** Recoge la ronda preparada para este ejercicio (solo una vez), o null. */
export function takePendingRound(exerciseId) {
  const round = pending;
  pending = null;
  return round?.exerciseId === exerciseId ? round : null;
}

/* ----- Registro ----- */

/** Guarda una ronda en el registro de sesiones (6.6.13). Devuelve la entrada. */
export function saveRound(data) {
  const entry = historyEntry(data);
  store.update((d) => { d.history.push(entry); });
  return entry;
}

/** Guarda el resultado de una pregunta en sus claves de estadística (7.2). */
export function recordStats(keys, { correct, ms }) {
  if (!keys?.length) return;
  const now = Date.now();
  store.update((d) => {
    for (const key of keys) d.stats[key] = recordResult(d.stats[key], { correct, ms, now });
  });
}

/** Actualiza un récord. Devuelve true si es un récord nuevo (mejora uno anterior). */
export function saveRecord(key, value, better = 'higher') {
  const { record, isNew } = updateRecord(store.data.records[key], value, { better });
  if (record && record !== store.data.records[key]) store.update((d) => { d.records[key] = record; });
  return isNew;
}

/** Último ejercicio hecho que todavía existe y se puede jugar (para "Continuar"), con su entrada. */
export function lastPlayedExercise() {
  const history = store.data.history;
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    const exercise = entry && exerciseById(entry.ex);
    if (exercise && isPlayable(exercise)) return { exercise, entry };
  }
  return null;
}
