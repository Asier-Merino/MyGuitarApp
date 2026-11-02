// Registro de ejercicios (BUILD_PLAN 7.1), sin DOM. Cada ejercicio declara howTo, concepts,
// tunings, niveles y sus funciones; check() devuelve también `why`. Al cargar se valida
// cada definición: un ejercicio mal declarado da error al arrancar y en los tests.

import { LEVEL_IDS, getPlannedExercise, getModule } from '../data/modules.js';
import { getConcept } from '../data/concepts.js';
import { TUNING_IDS } from '../data/tunings.js';
import { NOTES_THEORY_EXERCISES } from '../modules/notes/theory-exercises.js';
import { NOTES_PRACTICE_EXERCISES } from '../modules/notes/practice-exercises.js';

const DEFINITIONS = [...NOTES_THEORY_EXERCISES, ...NOTES_PRACTICE_EXERCISES];

/** Tipos de opción propia de la preparación (6.6.6): metrónomo y elección entre varias. */
const OPTION_TYPES = ['metronome', 'choice'];

/** Errores de una definición (lista vacía si está bien). */
export function validateExercise(def) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(`${def?.id ?? '¿?'}: ${msg}`); };
  need(typeof def.id === 'string' && def.id === `${def.module}.${def.section}.${def.slug}`, 'id = módulo.sección.slug');
  need(['teoria', 'practica'].includes(def.section), 'section teoria | practica');
  need(typeof def.title === 'string' && def.title, 'title');
  need(typeof def.description === 'string' && def.description, 'description');
  need(typeof def.howTo === 'string' && def.howTo.length > 20, 'howTo');
  need(Array.isArray(def.concepts) && def.concepts.length > 0, 'al menos un concepto');
  for (const id of def.concepts ?? []) need(getConcept(id), `concepto ${id} no existe`);
  need(def.tunings === 'standard' || def.tunings === 'any'
    || (Array.isArray(def.tunings) && def.tunings.length && def.tunings.every((t) => TUNING_IDS.includes(t))), 'tunings');
  need(def.levels && LEVEL_IDS.every((l) => def.levels[l] && typeof def.levels[l] === 'object'), 'los 3 niveles');
  for (const fn of ['generate', 'statKeys']) need(typeof def[fn] === 'function', fn);
  need(def.runner === undefined || def.runner === 'fill', 'runner');
  need(def.answerBy === undefined || def.answerBy === 'tap', 'answerBy');
  // Opcional: record({ results | items, puzzle, level, tuningId, seconds }) → { key, value, better } o null.
  need(def.record === undefined || typeof def.record === 'function', 'record');
  for (const opt of def.options ?? []) {
    need(OPTION_TYPES.includes(opt.type) && typeof opt.id === 'string' && opt.label, `opción ${opt.id}`);
    if (opt.type === 'choice') need(opt.choices?.some((c) => c.value === opt.default), `opción ${opt.id}: valor por defecto`);
  }
  if (def.section === 'teoria') {
    need(typeof def.check === 'function', 'check');
    need(typeof def.answerMarkup === 'function', 'answerMarkup');
    need((typeof def.prompt === 'string' && def.prompt) || typeof def.prompt === 'function', 'prompt');
    // Ronda de N preguntas, por tiempo (roundSeconds) o un puzle (runner 'fill').
    need(def.runner === 'fill' || (Number.isInteger(def.roundLength) && def.roundLength > 0)
      || (Number.isInteger(def.roundSeconds) && def.roundSeconds > 0), 'roundLength, roundSeconds o runner');
    if (def.runner !== 'fill') need(typeof def.render === 'function', 'render');
  } else {
    need(typeof def.speech === 'function', 'speech');
    need(Array.isArray(def.itemNoun) && def.itemNoun.length === 2, 'itemNoun [singular, plural]');
    need(typeof def.render === 'function', 'render');
    need(def.duration || (Number.isInteger(def.roundLength) && def.roundLength > 0), 'duration o roundLength');
  }
  return errors;
}

for (const def of DEFINITIONS) {
  const errors = validateExercise(def);
  if (errors.length) throw new Error(`Ejercicio mal declarado:\n${errors.join('\n')}`);
}
if (new Set(DEFINITIONS.map((d) => d.id)).size !== DEFINITIONS.length) throw new Error('Ids de ejercicio repetidos');

export const EXERCISES = Object.freeze([...DEFINITIONS]);

export function getExercise(id) {
  return EXERCISES.find((e) => e.id === id) ?? null;
}

/**
 * Ejercicio de una ruta: { module, section, exercise (slug) }. Se anuncian en modules.js y,
 * cuando se construyen, se completan con su definición. Devuelve null si no existe.
 */
export function findExercise({ module, section, exercise }) {
  const planned = getPlannedExercise(section, module, exercise);
  if (!planned) return null;
  const def = getExercise(planned.id);
  return def ? { ...planned, ...def } : planned;
}

/** true si el ejercicio ya está construido (se puede jugar). */
export const isPlayable = (exercise) => typeof exercise?.generate === 'function';

/** Ruta de la preparación de un ejercicio. */
export function exercisePath(exercise) {
  return `/${exercise.section}/${exercise.module}/${exercise.slug}`;
}

/** Ejercicio por id, para "Continuar" (registrado o anunciado), o null. */
export function exerciseById(id) {
  const [module, section, exercise] = String(id).split('.');
  return findExercise({ module, section, exercise });
}

/** Nombre del módulo de un ejercicio ("Notas del mástil"). */
export function exerciseModuleTitle(exercise) {
  return getModule(exercise.module)?.title ?? '';
}
