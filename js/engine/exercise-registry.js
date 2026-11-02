// Registro de ejercicios (BUILD_PLAN 7.1), sin DOM. Cada ejercicio declara howTo, concepts,
// tunings, niveles y sus funciones; check() devuelve también `why`. Al cargar se valida
// cada definición: un ejercicio mal declarado da error al arrancar y en los tests.

import { LEVEL_IDS, getPlannedExercise, getModule } from '../data/modules.js';
import { getConcept } from '../data/concepts.js';
import { TUNING_IDS } from '../data/tunings.js';
import { devWhichNote, devAllStrings } from '../modules/dev/dev-exercises.js';

const DEFINITIONS = [devWhichNote, devAllStrings];

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
  for (const fn of ['generate', 'render', 'statKeys']) need(typeof def[fn] === 'function', fn);
  // Opcional: record({ results | items, level, tuningId, seconds }) → { key, value, better: 'higher' | 'lower' }.
  need(def.record === undefined || typeof def.record === 'function', 'record');
  if (def.section === 'teoria') {
    need(typeof def.check === 'function', 'check');
    need(typeof def.answerMarkup === 'function', 'answerMarkup');
    need(Number.isInteger(def.roundLength) && def.roundLength > 0, 'roundLength');
    need(typeof def.prompt === 'string' && def.prompt, 'prompt');
  } else {
    need(typeof def.speech === 'function', 'speech');
    need(Array.isArray(def.itemNoun) && def.itemNoun.length === 2, 'itemNoun [singular, plural]');
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
 * Ejercicio de una ruta: { module, section, exercise (slug) }. Los de prueba (módulo 'dev')
 * solo existen en el registro; el resto se anuncian en modules.js y, cuando se construyen,
 * se completan con su definición. Devuelve null si no existe.
 */
export function findExercise({ module, section, exercise }) {
  if (module === 'dev') return EXERCISES.find((e) => e.module === 'dev' && e.slug === exercise) ?? null;
  const planned = getPlannedExercise(section, module, exercise);
  if (!planned) return null;
  const def = getExercise(planned.id);
  return def ? { ...planned, ...def } : planned;
}

/** true si el ejercicio ya está construido (se puede jugar). */
export const isPlayable = (exercise) => typeof exercise?.generate === 'function';

/** Ruta de la preparación de un ejercicio. */
export function exercisePath(exercise) {
  return exercise.module === 'dev'
    ? `/dev/${exercise.slug}`
    : `/${exercise.section}/${exercise.module}/${exercise.slug}`;
}

/** Ejercicio por id, para "Continuar" (registrado o anunciado), o null. */
export function exerciseById(id) {
  const def = getExercise(id);
  if (def) return def.module === 'dev' ? def : findExercise({ module: def.module, section: def.section, exercise: def.slug });
  const [module, section, exercise] = String(id).split('.');
  return findExercise({ module, section, exercise });
}

/** Nombre del módulo de un ejercicio ("Notas del mástil", o "Prueba" en los de #/dev). */
export function exerciseModuleTitle(exercise) {
  if (exercise.module === 'dev') return 'Prueba';
  return getModule(exercise.module)?.title ?? '';
}
