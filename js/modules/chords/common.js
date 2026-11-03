// Piezas comunes de los ejercicios de Acordes abiertos (BUILD_PLAN 8, Fase 3), sin DOM:
// niveles, opciones de la preparación, claves de estadística y textos con el marcado de notas.

import { chordsForLevel, chordSpelling, chordTones, chordMidis, sameChordName } from '../../data/chords.js';
import { shapeNotes } from '../../core/fretboard-model.js';
import { mod12, interval, noteFunction } from '../../core/theory.js';
import { noteToken } from '../../core/glossary.js';
import { UI_TEXTS } from '../../data/concepts.js';

/**
 * Tiempo por pregunta (criterio general de 7.5, decidido en la Fase 3): sin límite en Básico;
 * 15 y 8 segundos para reconocer un acorde; 30 y 20 para construirlo o nombrar sus notas.
 */
const QUICK = Object.freeze({ basico: null, intermedio: 15, avanzado: 8 });
const SLOW = Object.freeze({ basico: null, intermedio: 30, avanzado: 20 });

/** Niveles de los ejercicios de Teoría: acordes de la tabla de la Fase 3 y tiempo. */
export function chordLevels(kind = 'quick') {
  const times = kind === 'slow' ? SLOW : QUICK;
  return Object.freeze(Object.fromEntries(Object.keys(times).map((level) => [level, Object.freeze({
    chords: Object.freeze(chordsForLevel(level).map((c) => c.id)),
    timeLimit: times[level],
  })])));
}

/** Clave de estadística de un acorde: 'chord:Am' (con la cuerda en "¿Qué nota falta?": 'chord:Am:s2'). */
export const chordKey = (chord, string) => `chord:${chord.id}${string ? `:s${string}` : ''}`;

/** Forma del acorde en texto, de la 6ª a la 1ª: 'x 3 2 0 1 0'. */
export const shapeText = (frets) => frets.map((f) => (f === null ? 'x' : String(f))).join(' ');

/** Marcado de una nota con su deletreo ('{{G#}}'). */
export const spelledToken = (spelling) => noteToken(spelling);

/** Lista con "y": 'a, b y c'. */
export function joinAnd(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

/** Notas del acorde deletreadas, en marcado: '{{E}}, {{G#}} y {{B}}'. */
export const tonesMarkup = (chord) => joinAnd(chordSpelling(chord).map(noteToken));

/** Deletreo de una nota del acorde por su pitch class (o null si no es del acorde). */
export function toneSpelling(chord, pc) {
  const i = chordTones(chord).indexOf(mod12(pc));
  return i < 0 ? null : chordSpelling(chord)[i];
}

/** Notas que suenan en cada cuerda: [{ string, fret, midi, pc, fn }] de grave a aguda. */
export function chordNotes(chord) {
  return shapeNotes(chord.frets).map((n) => ({ ...n, pc: mod12(n.midi), fn: noteFunction(chord.root, mod12(n.midi)) }));
}

/** Semitonos de la fundamental a la 3ª (3 o 4). */
export const thirdSemitones = (chord) => interval(chord.root, chordTones(chord)[1]);

/** "la fundamental", "la 3ª"… de una nota del acorde. */
export const functionText = (chord, pc) => UI_TEXTS.chordFunctions[noteFunction(chord.root, pc)];

/** Opción "Mostrar diagramas" (6.6.12): activada por defecto y recordada. */
export const SHOW_DIAGRAMS_OPTION = Object.freeze({
  id: 'diagrams',
  type: 'toggle',
  label: UI_TEXTS.chordPractice.showDiagrams,
  hint: UI_TEXTS.chordPractice.showDiagramsHint,
  default: true,
});

/** Opciones de respuesta: el correcto y otros del nivel con nombre distinto. */
export function chordOptions(answer, pool, rng, count = 4) {
  const others = [];
  for (const c of rng.shuffle(pool)) {
    if (others.length >= count - 1) break;
    if (!sameChordName(c, answer) && !others.some((o) => sameChordName(o, c))) others.push(c);
  }
  return rng.shuffle([answer, ...others]);
}

export { chordMidis };
