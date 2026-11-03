// Calentamiento cromático (BUILD_PLAN 8, Fase 3), sin DOM: un dedo por traste, de la 6ª
// cuerda a la 1ª y vuelta, en una posición (traste 1 o 5). Decisiones del usuario al empezar
// la Fase 3: la vuelta va en espejo (la ida al revés: 1-2-3-4 vuelve en 4-3-2-1) y la
// "araña" alterna dos cuerdas vecinas (dedos 1 y 3 en una, 2 y 4 en la otra).
// Cada nota: { string, fret, finger } con fret = posición + dedo − 1.

import { rampedBpm } from './rhythm.js';

/** Orden de los dedos en cada cuerda (ida). La araña se calcula aparte. */
export const WARMUP_VARIANTS = Object.freeze([
  Object.freeze({ id: '1234', fingers: Object.freeze([1, 2, 3, 4]), title: '1-2-3-4' }),
  Object.freeze({ id: '4321', fingers: Object.freeze([4, 3, 2, 1]), title: '4-3-2-1' }),
  Object.freeze({ id: '1324', fingers: Object.freeze([1, 3, 2, 4]), title: '1-3-2-4' }),
  Object.freeze({ id: 'spider', fingers: null, title: 'Araña' }),
]);

export const WARMUP_POSITIONS = Object.freeze([1, 5]);

/** Niveles (tabla de la Fase 3) y subida de tempo (+4 BPM cada vuelta en Básico, cada 2 en el resto). */
export const WARMUP_LEVELS = Object.freeze({
  basico: Object.freeze({ notesPerBeat: 1, startBpm: 60, variants: Object.freeze(['1234']), rampEveryLaps: 1 }),
  intermedio: Object.freeze({ notesPerBeat: 2, startBpm: 70, variants: Object.freeze(['1234', '4321', '1324']), rampEveryLaps: 2 }),
  avanzado: Object.freeze({ notesPerBeat: 4, startBpm: 80, variants: Object.freeze(['1234', '4321', '1324', 'spider']), rampEveryLaps: 2 }),
});
export const RAMP_STEP = 4;
export const SLOW_DOWN_STEP = 8;

const STRINGS_DOWN = [6, 5, 4, 3, 2, 1];

export const getWarmupVariant = (id) => WARMUP_VARIANTS.find((v) => v.id === id) ?? null;

/** La ida: de la 6ª cuerda a la 1ª. */
export function warmupOutward(variantId, position) {
  if (!WARMUP_POSITIONS.includes(position)) throw new RangeError(`Posición no válida: ${position}`);
  const note = (string, finger) => ({ string, fret: position + finger - 1, finger });
  if (variantId === 'spider') {
    // Parejas de cuerdas vecinas (6ª-5ª, 5ª-4ª … 2ª-1ª): 1 y 3 en la grave, 2 y 4 en la aguda.
    return STRINGS_DOWN.slice(0, -1).flatMap((low) => [note(low, 1), note(low - 1, 2), note(low, 3), note(low - 1, 4)]);
  }
  const variant = getWarmupVariant(variantId);
  if (!variant) throw new Error(`Variante desconocida: ${variantId}`);
  return STRINGS_DOWN.flatMap((string) => variant.fingers.map((finger) => note(string, finger)));
}

/** Una vuelta completa: la ida y la vuelta en espejo (la ida al revés). */
export function warmupLap(variantId, position) {
  const out = warmupOutward(variantId, position);
  return [...out, ...[...out].reverse()];
}

/** Tiempos que dura una vuelta con las notas por tiempo del nivel. */
export const lapBeats = (variantId, notesPerBeat) => warmupLap(variantId, 1).length / notesPerBeat;

/** Tempo tras unos tiempos tocados, con la subida automática del nivel. */
export function warmupBpm(level, variantId, beatsDone, startBpm = WARMUP_LEVELS[level].startBpm) {
  const p = WARMUP_LEVELS[level];
  return rampedBpm(startBpm, beatsDone, { everyBeats: p.rampEveryLaps * lapBeats(variantId, p.notesPerBeat), step: RAMP_STEP });
}

/** Clave del récord de tempo máximo: por variante y por nivel (decisión de la Fase 3). */
export const warmupRecordKey = (variantId, level) => `calentamiento.practica.cromatico:${variantId}:${level}`;
