// Piezas comunes de los ejercicios de Notas del mástil (BUILD_PLAN 8, Fase 2), sin DOM:
// niveles, cuerdas de cada nivel, claves de estadística y textos de posiciones.

import { midiAt } from '../../core/fretboard-model.js';
import { mod12 } from '../../core/theory.js';
import { LETTER_PC } from '../../core/notation.js';
import { fillTemplate } from '../../core/glossary.js';
import { NOTES_TEXTS } from '../../data/concepts.js';

export const NATURAL_PCS = Object.freeze(Object.values(LETTER_PC).sort((a, b) => a - b));
export const ALL_PCS = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
export const ALL_STRINGS = Object.freeze([6, 5, 4, 3, 2, 1]);

export const notePool = (naturalsOnly) => (naturalsOnly ? NATURAL_PCS : ALL_PCS);
export const isNatural = (pc) => NATURAL_PCS.includes(mod12(pc));

/**
 * Niveles de los ejercicios de Notas (tabla "Niveles, resto de ejercicios" de la Fase 2):
 * trastes, cuerdas (en Básico, las que se elijan; 6ª y 5ª por defecto), notas y tiempo.
 */
export const NOTE_LEVELS = Object.freeze({
  basico: Object.freeze({ fromFret: 0, toFret: 5, naturalsOnly: true, chooseStrings: true, timeLimit: null, seconds: 20 }),
  intermedio: Object.freeze({ fromFret: 0, toFret: 12, naturalsOnly: false, chooseStrings: false, timeLimit: 10, seconds: 12 }),
  avanzado: Object.freeze({ fromFret: 0, toFret: 12, naturalsOnly: false, chooseStrings: false, timeLimit: 5, seconds: 7 }),
});

/** Opción "Cuerdas" de la preparación, solo en Básico ("6 y 5, configurable"). */
export const STRINGS_OPTION = Object.freeze({
  id: 'strings',
  type: 'choice',
  label: 'Cuerdas',
  levels: Object.freeze(['basico']),
  choices: Object.freeze([
    Object.freeze({ value: '6-5', label: '6ª y 5ª' }),
    Object.freeze({ value: '6', label: '6ª' }),
    Object.freeze({ value: '5', label: '5ª' }),
    Object.freeze({ value: 'all', label: 'Todas' }),
  ]),
  default: '6-5',
});

const STRING_CHOICES = Object.freeze({ '6-5': [6, 5], 6: [6], 5: [5], all: ALL_STRINGS });

/** Cuerdas de un nivel: en Básico, las elegidas en la preparación; en el resto, todas. */
export function levelStrings(params, options = {}) {
  if (!params.chooseStrings) return [...ALL_STRINGS];
  return [...(STRING_CHOICES[options.strings] ?? STRING_CHOICES[STRINGS_OPTION.default])];
}

/** Sufijo de las claves y récords con una afinación que no es la estándar. */
export const tuningSuffix = (tuningId) => (tuningId && tuningId !== 'standard' ? `@${tuningId}` : '');

/** Clave de estadística de una posición (BUILD_PLAN 8, Fase 2): 'note:s5f3' (+ '@afinación'). */
export const positionKey = (string, fret, tuningId) => `note:s${string}f${fret}${tuningSuffix(tuningId)}`;

/** Una posición con su MIDI y su nota. */
export function position(string, fret, tuning) {
  const midi = midiAt(string, fret, tuning);
  return { string, fret, midi, pc: mod12(midi) };
}

/** Posiciones de unas cuerdas en un rango de trastes (de la 6ª a la 1ª), con filtro opcional. */
export function positionsIn({ strings, fromFret, toFret, tuning, filter = () => true }) {
  const list = [];
  for (const string of [...strings].sort((a, b) => b - a)) {
    for (let fret = fromFret; fret <= toFret; fret++) {
      const p = position(string, fret, tuning);
      if (filter(p)) list.push(p);
    }
  }
  return list;
}

/** Trastes del trozo de mástil que se enseña en las preguntas con botones (6.6.7). */
export const WINDOW_FRETS = 5;

/**
 * Trozo de mástil alrededor de un traste: { fromFret, toFret }. Si el rango del nivel ya es
 * corto (hasta 6 trastes, p. ej. 0–5), se enseña entero; si no, 5 trastes con el punto dentro.
 */
export function fretWindow(fret, { fromFret, toFret }) {
  if (toFret - fromFret + 1 <= WINDOW_FRETS + 1) return { fromFret, toFret };
  const start = Math.max(fromFret, Math.min(fret - 2, toFret - WINDOW_FRETS + 1));
  return { fromFret: start, toFret: start + WINDOW_FRETS - 1 };
}

/** Trastes de una nota en una cuerda, dentro del rango. */
export function fretsOf(pc, string, { fromFret, toFret, tuning }) {
  const frets = [];
  for (let fret = fromFret; fret <= toFret; fret++) if (mod12(midiAt(string, fret, tuning)) === mod12(pc)) frets.push(fret);
  return frets;
}

/* ----- Textos de posiciones (plantillas en concepts.js) ----- */

const T = NOTES_TEXTS.positions;

/** '5ª cuerda, traste 3' */
export const positionText = ({ string, fret }) => fillTemplate(T.position, { string, fret });

/** 'traste 3' o 'trastes 0 y 12' */
export function fretsText(frets) {
  if (frets.length === 1) return fillTemplate(T.fretOne, { fret: frets[0] });
  return fillTemplate(T.fretMany, { list: frets.slice(0, -1).join(', '), last: frets.at(-1) });
}

/** Lista de posiciones: '4ª cuerda, traste 5', '… o 1ª cuerda, traste 3'. */
export function positionsText(list) {
  const items = list.map(positionText);
  if (items.length === 1) return items[0];
  return fillTemplate(T.listOr, { list: items.slice(0, -1).join('; '), last: items.at(-1) });
}

/** Lista de posiciones unidas con "y" (todas a la vez). */
export function positionsTextAll(list) {
  const items = list.map(positionText);
  if (items.length === 1) return items[0];
  return fillTemplate(T.listAnd, { list: items.slice(0, -1).join('; '), last: items.at(-1) });
}

/** Nombre hablado del número de cuerda ('sexta' / '6'). */
export function spokenString(string, notation) {
  return notation === 'en' ? String(string) : NOTES_TEXTS.spokenOrdinals[string];
}
