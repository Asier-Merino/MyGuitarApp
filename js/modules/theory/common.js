// Piezas comunes de Escala y tonalidad (BUILD_PLAN 8, Fase 5), sin DOM: niveles por
// tonalidad, valores de los acordes de una tonalidad y textos con marcado. Todo se calcula con
// js/core/keys.js: aquí no se escribe a mano ninguna nota ni ningún acorde.

import { KEY_LEVELS, keyRootSpelling, keyScale, chordToken } from '../../core/keys.js';
import { noteToken } from '../../core/glossary.js';
import { spellingPc } from '../../core/notation.js';
import { joinAnd } from '../chords/common.js';
import { UI_TEXTS } from '../../data/concepts.js';

/** Niveles con las tonalidades de la tabla de la Fase 5, el tiempo y lo propio de cada ejercicio. */
export function keyLevels(times, extra = {}) {
  return Object.freeze(Object.fromEntries(Object.keys(KEY_LEVELS).map((level) => [level, Object.freeze({
    keys: KEY_LEVELS[level],
    timeLimit: times[level],
    ...(extra[level] ?? {}),
  })])));
}

/** Marcado de la fundamental de una tonalidad con el deletreo de la ronda: '{{F#}}' o '{{Gb}}'. */
export const keyMarkup = (key, accidentals) => noteToken(keyRootSpelling(key, { accidentals }));

/** Marcado de la escala, separada por espacios: '{{F}} {{G}} {{A}} {{Bb}}…'. */
export const scaleMarkup = (key, accidentals) => keyScale(key, { accidentals }).map((n) => noteToken(n.spelling)).join(' ');

/** Lista de acordes en marcado, con "y": '{{ch:C:major}}, {{ch:D:minor}} y …'. */
export const chordsMarkup = (chords) => joinAnd(chords.map(chordToken));

/** Valor de un acorde para los botones y las respuestas: 'F#:minor', 'Bb:major'. */
export function chordValue({ spelling, quality }) {
  return `${spelling.letter}${spelling.accidental === 1 ? '#' : spelling.accidental === -1 ? 'b' : ''}:${quality}`;
}

/** Acorde a partir de su valor: { spelling, quality, root }. */
export function chordFromValue(value) {
  const [note, quality] = String(value).split(':');
  const spelling = { letter: note[0], accidental: note[1] === '#' ? 1 : note[1] === 'b' ? -1 : 0 };
  return { spelling, quality, root: spellingPc(spelling) };
}

/** 'mayor', 'menor' o 'disminuido'. */
export const qualityWord = (quality) => UI_TEXTS.keys.qualities[quality];

/** Repite el sorteo si sale la misma pregunta que la anterior (hasta unos intentos). */
export function fresh(make, previousKey) {
  let item = make();
  for (let i = 0; i < 20 && item.key === previousKey; i++) item = make();
  return item;
}
