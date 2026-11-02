// Acordes abiertos y de séptima (BUILD_PLAN 5.1), en afinación estándar.
// frets y fingers van de la cuerda 6 a la 1; null = esa cuerda no se toca (x).
// Dedos: 1 índice … 4 meñique, 0 al aire. barre: cejilla { fret, from: cuerda grave, to: cuerda aguda }.
// bassNote: solo si la nota más grave no es la fundamental (ninguno de la tabla lo necesita).
// variant: para distinguir dos formas del mismo acorde (Fa mini y Fa con cejilla).

import { chordPcs } from '../core/theory.js';

/** Sufijo del cifrado según la calidad: Do, Lam, La7. */
export const CHORD_SUFFIX = Object.freeze({ major: '', minor: 'm', dom7: '7' });

/** Cómo se dice la calidad en voz alta: "La menor", "A minor", "Mi siete". */
export const CHORD_SPOKEN = Object.freeze({
  es: Object.freeze({ major: '', minor: ' menor', dom7: ' siete' }),
  en: Object.freeze({ major: '', minor: ' minor', dom7: ' seven' }),
});

const x = null;
const ch = (id, root, quality, frets, fingers, level, extra = {}) =>
  Object.freeze({ id, root, quality, frets: Object.freeze(frets), fingers: Object.freeze(fingers), level, ...extra });

export const CHORDS = Object.freeze([
  ch('C', 0, 'major', [x, 3, 2, 0, 1, 0], [x, 3, 2, 0, 1, 0], 'basico'),
  ch('D', 2, 'major', [x, x, 0, 2, 3, 2], [x, x, 0, 1, 3, 2], 'basico'),
  ch('E', 4, 'major', [0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0], 'basico'),
  ch('G', 7, 'major', [3, 2, 0, 0, 0, 3], [2, 1, 0, 0, 0, 3], 'basico'),
  ch('A', 9, 'major', [x, 0, 2, 2, 2, 0], [x, 0, 1, 2, 3, 0], 'basico'),
  ch('Am', 9, 'minor', [x, 0, 2, 2, 1, 0], [x, 0, 2, 3, 1, 0], 'basico'),
  ch('Em', 4, 'minor', [0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0], 'basico'),
  ch('Dm', 2, 'minor', [x, x, 0, 2, 3, 1], [x, x, 0, 2, 3, 1], 'basico'),
  ch('F-mini', 5, 'major', [x, x, 3, 2, 1, 1], [x, x, 3, 2, 1, 1], 'intermedio',
    { variant: 'mini', barre: Object.freeze({ fret: 1, from: 2, to: 1 }) }),
  ch('A7', 9, 'dom7', [x, 0, 2, 0, 2, 0], [x, 0, 2, 0, 3, 0], 'intermedio'),
  ch('D7', 2, 'dom7', [x, x, 0, 2, 1, 2], [x, x, 0, 2, 1, 3], 'intermedio'),
  ch('E7', 4, 'dom7', [0, 2, 0, 1, 0, 0], [0, 2, 0, 1, 0, 0], 'intermedio'),
  ch('B7', 11, 'dom7', [x, 2, 1, 2, 0, 2], [x, 2, 1, 3, 0, 4], 'intermedio'),
  ch('F-barre', 5, 'major', [1, 3, 3, 2, 1, 1], [1, 3, 4, 2, 1, 1], 'avanzado',
    { variant: 'cejilla', barre: Object.freeze({ fret: 1, from: 6, to: 1 }) }),
]);

export function getChord(id) {
  return CHORDS.find((c) => c.id === id) ?? null;
}

/** Notas (pitch class) que forman el acorde, en orden R, 3, 5, (7). */
export const chordTones = (chord) => chordPcs(chord.root, chord.quality);
