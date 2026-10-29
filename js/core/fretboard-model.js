// Modelo del mástil (sin DOM). Cuerdas 1 (Mi aguda) a 6 (Mi grave).

import { mod12 } from './theory.js';

/** MIDI de cada cuerda al aire en afinación estándar (BUILD_PLAN 4.2). */
export const STANDARD_TUNING = Object.freeze({ 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 });

export const STRINGS = Object.freeze([1, 2, 3, 4, 5, 6]);

export const FRET_RANGE = Object.freeze({ from: 0, to: 12 });
/** Rango ampliado para CAGED y pentatónicas. */
export const EXTENDED_FRET_RANGE = Object.freeze({ from: 0, to: 15 });

/** Marcas del mástil: 3, 5, 7, 9, 15 y doble en 12. */
export const FRET_INLAYS = Object.freeze([
  { fret: 3, double: false },
  { fret: 5, double: false },
  { fret: 7, double: false },
  { fret: 9, double: false },
  { fret: 12, double: true },
  { fret: 15, double: false },
].map(Object.freeze));

function checkString(string) {
  if (!STRINGS.includes(string)) throw new RangeError(`Cuerda no válida: ${string}`);
}

export function midiAt(string, fret, tuning = STANDARD_TUNING) {
  checkString(string);
  if (!Number.isInteger(fret) || fret < 0) throw new RangeError(`Traste no válido: ${fret}`);
  return tuning[string] + fret;
}

export function pcAt(string, fret, tuning = STANDARD_TUNING) {
  return mod12(midiAt(string, fret, tuning));
}

/** Todas las posiciones de un pitch class en el rango dado, de la cuerda 6 a la 1. */
export function positionsOf(pc, {
  fromFret = FRET_RANGE.from,
  toFret = FRET_RANGE.to,
  strings = STRINGS,
  tuning = STANDARD_TUNING,
} = {}) {
  const target = mod12(pc);
  const result = [];
  for (const string of [...strings].sort((a, b) => b - a)) {
    const first = fromFret + mod12(target - (tuning[string] + fromFret));
    for (let fret = first; fret <= toFret; fret += 12) result.push({ string, fret });
  }
  return result;
}

/** Una afinación es un objeto { 1..6: MIDI al aire }. Comprueba que tiene las 6 cuerdas. */
export function isValidTuning(tuning) {
  return Boolean(tuning) && STRINGS.every((s) => Number.isInteger(tuning[s]) && tuning[s] >= 0 && tuning[s] <= 127);
}

/** Cuerdas que cambian respecto a la afinación de referencia: [{ string, semitones }], de la 6 a la 1. */
export function tuningChanges(tuning, reference = STANDARD_TUNING) {
  return [...STRINGS].reverse()
    .map((string) => ({ string, semitones: tuning[string] - reference[string] }))
    .filter((c) => c.semitones !== 0);
}

const AMOUNT_TEXT = { 1: '½ tono', 2: '1 tono', 3: '1½ tonos', 4: '2 tonos' };

function joinSpanish(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/**
 * Texto de los cambios respecto a la estándar, calculado (BUILD_PLAN 4.2):
 * '6ª ↓ 1 tono', '6ª, 2ª y 1ª ↓ 1 tono; 3ª ↓ ½ tono', 'todas ↓ ½ tono' o '—'.
 * Agrupa las cuerdas que cambian lo mismo, en el orden en que aparecen de la 6ª a la 1ª.
 */
export function formatTuningChanges(tuning, reference = STANDARD_TUNING) {
  const changes = tuningChanges(tuning, reference);
  if (!changes.length) return '—';
  const groups = new Map();
  for (const c of changes) {
    if (!groups.has(c.semitones)) groups.set(c.semitones, []);
    groups.get(c.semitones).push(c.string);
  }
  return [...groups].map(([semitones, strings]) => {
    const who = strings.length === STRINGS.length ? 'todas' : joinSpanish(strings.map((s) => `${s}ª`));
    const amount = AMOUNT_TEXT[Math.abs(semitones)] ?? `${Math.abs(semitones)} semitonos`;
    return `${who} ${semitones < 0 ? '↓' : '↑'} ${amount}`;
  }).join('; ');
}

/**
 * Formas de octava (BUILD_PLAN 4.3), hacia agudos:
 *  6→4 y 5→3: +2 trastes · 4→2 y 3→1: +3 trastes (por la cuerda Si) · 6→1: mismo traste (2 octavas).
 */
export const OCTAVE_SHAPES = Object.freeze([
  { from: 6, to: 4, fretShift: 2, semitones: 12 },
  { from: 5, to: 3, fretShift: 2, semitones: 12 },
  { from: 4, to: 2, fretShift: 3, semitones: 12 },
  { from: 3, to: 1, fretShift: 3, semitones: 12 },
  { from: 6, to: 1, fretShift: 0, semitones: 24 },
].map(Object.freeze));

/**
 * Octavas de (cuerda, traste) usando las formas anteriores, en ambas direcciones.
 * Devuelve [{ string, fret, direction: 'up'|'down', semitones }] dentro del rango.
 */
export function octavesOf(string, fret, { minFret = 0, maxFret = EXTENDED_FRET_RANGE.to } = {}) {
  checkString(string);
  const result = [];
  for (const shape of OCTAVE_SHAPES) {
    if (shape.from === string) {
      result.push({ string: shape.to, fret: fret + shape.fretShift, direction: 'up', semitones: shape.semitones });
    }
    if (shape.to === string) {
      result.push({ string: shape.from, fret: fret - shape.fretShift, direction: 'down', semitones: -shape.semitones });
    }
  }
  return result.filter((p) => p.fret >= minFret && p.fret <= maxFret);
}
