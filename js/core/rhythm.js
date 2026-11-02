// Ritmo (sin DOM ni audio): tempo, compás, subdivisión y "marcar el tempo tocando"
// (BUILD_PLAN 6.6.18). Lo usan el Metrónomo y los ejercicios con metrónomo.

export const BPM_MIN = 30;
export const BPM_MAX = 240;
export const DEFAULT_BPM = 80;

/** Tiempos por compás que se pueden elegir (2 a 7). */
export const BEATS_PER_BAR_OPTIONS = Object.freeze([2, 3, 4, 5, 6, 7]);
export const DEFAULT_BEATS_PER_BAR = 4;

/** Subdivisión: cuántos clics hay en cada tiempo. */
export const SUBDIVISIONS = Object.freeze([
  { id: 'quarter', title: 'Negras', perBeat: 1 },
  { id: 'eighth', title: 'Corcheas', perBeat: 2 },
  { id: 'triplet', title: 'Tresillos', perBeat: 3 },
].map(Object.freeze));
export const DEFAULT_SUBDIVISION = 'quarter';

export function subdivisionPerBeat(id) {
  return SUBDIVISIONS.find((s) => s.id === id)?.perBeat ?? 1;
}

/** Tempo entero dentro del rango 30–240. */
export function clampBpm(bpm) {
  const n = Math.round(Number(bpm));
  if (!Number.isFinite(n)) return DEFAULT_BPM;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, n));
}

/** Segundos que dura un tiempo (a 60 BPM, 1 s; a 120 BPM, 0,5 s). */
export const secondsPerBeat = (bpm) => 60 / bpm;

/** Ajustes del metrónomo válidos, completando con los valores por defecto. */
export function normalizeMetronome(raw = {}) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    bpm: Number.isFinite(r.bpm) ? clampBpm(r.bpm) : DEFAULT_BPM,
    beatsPerBar: BEATS_PER_BAR_OPTIONS.includes(r.beatsPerBar) ? r.beatsPerBar : DEFAULT_BEATS_PER_BAR,
    subdivision: SUBDIVISIONS.some((s) => s.id === r.subdivision) ? r.subdivision : DEFAULT_SUBDIVISION,
  };
}

/**
 * Pulso siguiente: { beat, sub } con beat 0..beatsPerBar-1 y sub 0..perBeat-1.
 * Si cambian el compás o la subdivisión mientras suena, el pulso se ajusta sin saltos raros.
 */
export function nextPulse({ beat, sub }, { beatsPerBar, perBeat }) {
  let b = beat;
  let s = sub + 1;
  if (s >= perBeat) {
    s = 0;
    b += 1;
  }
  if (b >= beatsPerBar) b = 0;
  return { beat: b, sub: s };
}

/** Tipo de clic: 'accent' (1er tiempo), 'beat' (resto de tiempos) o 'sub' (entre tiempos). */
export function pulseKind({ beat, sub }) {
  if (sub > 0) return 'sub';
  return beat === 0 ? 'accent' : 'beat';
}

/** Marcar el tempo tocando: si pasan más de 2 s entre dos toques, se empieza de cero. */
export const TAP_RESET_MS = 2000;
/** Se hace la media de los últimos 4 intervalos (5 toques). */
export const TAP_INTERVALS = 4;

/**
 * Añade un toque (en ms) a la lista y devuelve { taps, bpm }. bpm es null hasta que hay
 * dos toques seguidos; después, la media de los últimos intervalos, dentro del rango.
 */
export function addTap(taps, timeMs) {
  const last = taps[taps.length - 1];
  const kept = last !== undefined && timeMs - last <= TAP_RESET_MS && timeMs > last ? taps : [];
  const next = [...kept, timeMs].slice(-(TAP_INTERVALS + 1));
  if (next.length < 2) return { taps: next, bpm: null };
  const avg = (next[next.length - 1] - next[0]) / (next.length - 1);
  return { taps: next, bpm: clampBpm(60000 / avg) };
}
