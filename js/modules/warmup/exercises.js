// Calentamiento (BUILD_PLAN 8, Fase 3), sin DOM: "Un dedo por traste", con la tablatura en
// pantalla, metrónomo con subida automática de tempo (+4 BPM cada vuelta en Básico y cada 2
// en el resto; "Bajar" resta 8 y la detiene), duración elegible y récord de tempo máximo por
// variante y nivel. Lo juega engine/warmup-runner.js. Admite cualquier afinación: los trastes
// no cambian, y la tablatura nombra las cuerdas según la afinación.

import { WARMUP_LEVELS, WARMUP_VARIANTS, WARMUP_POSITIONS, warmupLap, warmupOutward, warmupRecordKey, RAMP_STEP } from '../../core/warmup.js';
import { tabFromNotes } from '../../core/tab.js';
import { EXERCISE_TEXTS } from '../../data/concepts.js';

/** Opción "Variante": las del nivel. */
export const VARIANT_OPTION = Object.freeze({
  id: 'variant',
  type: 'level-choice',
  label: 'Variante',
  byLevel: Object.freeze(Object.fromEntries(Object.entries(WARMUP_LEVELS).map(([level, p]) => [level, p.variants]))),
  choiceLabel: (id) => WARMUP_VARIANTS.find((v) => v.id === id).title,
});

export const POSITION_OPTION = Object.freeze({
  id: 'position',
  type: 'choice',
  label: 'Posición',
  choices: Object.freeze(WARMUP_POSITIONS.map((p) => Object.freeze({ value: String(p), label: `Traste ${p}` }))),
  default: '1',
});

/** Duración de cada nota en corcheas: negras (2), corcheas (1) o semicorcheas (0,5). */
export const noteDur = (notesPerBeat) => 2 / notesPerBeat;

/** Tablatura de una vuelta (o solo de la ida, para escucharla en la preparación). */
export function warmupTab({ variant, position, notesPerBeat, outwardOnly = false }) {
  const notes = outwardOnly ? warmupOutward(variant, position) : warmupLap(variant, position);
  return tabFromNotes(notes.map(({ string, fret }) => ({ string, fret, dur: noteDur(notesPerBeat) })));
}

export const chromaticWarmup = Object.freeze({
  id: 'calentamiento.practica.cromatico',
  module: 'calentamiento',
  section: 'practica',
  slug: 'cromatico',
  runner: 'warmup',
  title: 'Un dedo por traste',
  description: 'Recorres las 6 cuerdas con un dedo por traste, con tablatura y metrónomo, y el tempo sube solo.',
  howTo: EXERCISE_TEXTS['calentamiento.practica.cromatico'].howTo,
  concepts: Object.freeze(['chromatic-warmup', 'tablature', 'metronome']),
  tunings: 'any',
  itemNoun: Object.freeze(['vuelta', 'vueltas']),
  duration: Object.freeze({ default: 60 }),
  options: Object.freeze([VARIANT_OPTION, POSITION_OPTION]),
  levels: WARMUP_LEVELS,
  statKeys: () => [],
  /** Plan de la ronda: variante, posición, tablatura de una vuelta y tempo inicial. */
  generate(params, rng, { options = {}, level = 'basico' }) {
    const variant = params.variants.includes(options.variant) ? options.variant : params.variants[0];
    const position = Number(options.position) || WARMUP_POSITIONS[0];
    return {
      level,
      variant,
      position,
      notesPerBeat: params.notesPerBeat,
      startBpm: params.startBpm,
      rampEveryLaps: params.rampEveryLaps,
      rampStep: RAMP_STEP,
      tab: warmupTab({ variant, position, notesPerBeat: params.notesPerBeat }),
    };
  },
  speech: () => '',
  /** Récord: el tempo más alto al que se termina una vuelta entera, por variante y nivel. */
  record: ({ plan, value }) => (value ? { key: warmupRecordKey(plan.variant, plan.level), value, better: 'higher' } : null),
});

export const WARMUP_EXERCISES = Object.freeze([chromaticWarmup]);
