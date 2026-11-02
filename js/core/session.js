// Rondas de ejercicio (sin DOM): duración elegible, registro de sesiones, récords y
// resultado de Teoría (BUILD_PLAN 6.6.6, 6.6.10 y 6.6.13).

/** Duraciones de la preparación (6.6.6). `null` = "Sin límite" (solo si el ejercicio lo activa). */
export const DURATION_OPTIONS = Object.freeze([
  { value: 30, label: '30 s' },
  { value: 60, label: '1 min' },
  { value: 150, label: '2 min 30' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
].map(Object.freeze));
export const UNLIMITED = 'unlimited';
export const UNLIMITED_OPTION = Object.freeze({ value: UNLIMITED, label: 'Sin límite' });
export const DEFAULT_DURATION = 60;

/** Opciones de duración de un ejercicio: las cinco, más "Sin límite" si lo admite. */
export function durationOptions({ unlimited = false } = {}) {
  return unlimited ? [...DURATION_OPTIONS, UNLIMITED_OPTION] : [...DURATION_OPTIONS];
}

/** Duración válida para un ejercicio (la guardada, o la de por defecto). */
export function normalizeDuration(value, { unlimited = false, fallback = DEFAULT_DURATION } = {}) {
  return durationOptions({ unlimited }).some((o) => o.value === value) ? value : fallback;
}

/**
 * Entrada del registro de sesiones (6.6.13): una por ronda, compacta.
 * date (ISO) · ex (id del ejercicio) · section · level · tuning · seconds (duración)
 * Teoría: ok (aciertos) y total (preguntas respondidas) · Práctica: items (consignas)
 * done: false si se salió a mitad.
 */
export function historyEntry({ exercise, level, tuning, seconds, date = new Date(), correct, answered, items, done = true }) {
  const entry = {
    date: new Date(date).toISOString(),
    ex: exercise.id,
    section: exercise.section,
    level,
    tuning,
    seconds: Math.max(0, Math.round(seconds)),
    done,
  };
  if (exercise.section === 'teoria') {
    entry.ok = correct;
    entry.total = answered;
  } else {
    entry.items = items;
  }
  return entry;
}

/**
 * Actualiza un récord. better: 'higher' (más es mejor) o 'lower' (menos es mejor, p. ej. tiempo).
 * Devuelve { record, isNew }: isNew solo si mejora un récord anterior (la primera marca
 * queda guardada, pero no se celebra como "nuevo récord").
 */
export function updateRecord(previous, value, { better = 'higher', date = new Date() } = {}) {
  if (!Number.isFinite(value)) return { record: previous ?? null, isNew: false };
  const has = previous && Number.isFinite(previous.value);
  const improves = !has || (better === 'lower' ? value < previous.value : value > previous.value);
  if (!improves) return { record: previous, isNew: false };
  return { record: { value, date: new Date(date).toISOString() }, isNew: Boolean(has) };
}

/** Frase del resumen de Teoría según el porcentaje de aciertos (las frases están en concepts.js). */
export function scoreBand(correct, total) {
  if (!total) return 'none';
  const ratio = correct / total;
  if (ratio === 1) return 'perfect';
  if (ratio >= 0.8) return 'great';
  if (ratio >= 0.5) return 'good';
  return 'keepGoing';
}

/** Tiempo medio de respuesta en segundos (o null si no hay respuestas). */
export function averageSeconds(msList) {
  const valid = msList.filter((ms) => Number.isFinite(ms) && ms >= 0);
  if (!valid.length) return null;
  return valid.reduce((s, ms) => s + ms, 0) / valid.length / 1000;
}

/** '3,4 s' (coma decimal, como se escribe en español). */
export function formatSecondsDecimal(seconds) {
  return `${seconds.toFixed(1).replace('.', ',')} s`;
}

/** '1:05', '0:30' o '12:00' (reloj de la cabecera). */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
