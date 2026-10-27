// Nombres de nota en español e inglés, sostenidos/bemoles y deletreo por letra.
// Un "spelling" es { letter: 'C'..'B', accidental: -2..2 } (negativo = bemoles).

import { mod12, SCALE_FORMULAS } from './theory.js';

export const LETTERS = Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B']);

export const LETTER_PC = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });

const ES_NAMES = Object.freeze({ C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' });

const SHARP_SPELLINGS = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0],
];
const FLAT_SPELLINGS = [
  ['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0],
  ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0],
];

const SYMBOLS = {
  unicode: { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' },
  ascii: { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' },
};

const SPOKEN_ACCIDENTALS = {
  es: { '-2': ' doble bemol', '-1': ' bemol', 0: '', 1: ' sostenido', 2: ' doble sostenido' },
  en: { '-2': ' double flat', '-1': ' flat', 0: '', 1: ' sharp', 2: ' double sharp' },
};

/** Deletreo de un pitch class sin contexto de tonalidad. accidentals: 'sharp' | 'flat'. */
export function spell(pc, accidentals = 'sharp') {
  const table = accidentals === 'flat' ? FLAT_SPELLINGS : SHARP_SPELLINGS;
  const [letter, accidental] = table[mod12(pc)];
  return { letter, accidental };
}

export function spellingPc({ letter, accidental }) {
  return mod12(LETTER_PC[letter] + accidental);
}

function letterName(letter, notation) {
  return notation === 'en' ? letter : ES_NAMES[letter];
}

/** 'Fa♯' / 'F♯' (o 'Fa#' / 'F#' con ascii: true). */
export function formatSpelling(spelling, notation = 'es', { ascii = false } = {}) {
  const symbols = ascii ? SYMBOLS.ascii : SYMBOLS.unicode;
  return letterName(spelling.letter, notation) + symbols[spelling.accidental];
}

/** Nombre de un pitch class según notación y preferencia de alteraciones. */
export function noteName(pc, { notation = 'es', accidentals = 'sharp', ascii = false } = {}) {
  return formatSpelling(spell(pc, accidentals), notation, { ascii });
}

/** Nombre hablado: 'Fa sostenido', 'Si bemol', 'F sharp'. */
export function spokenName(spelling, notation = 'es') {
  const lang = notation === 'en' ? 'en' : 'es';
  return letterName(spelling.letter, lang) + SPOKEN_ACCIDENTALS[lang][spelling.accidental];
}

/**
 * Deletreo por letra de una escala de 7 notas: cada grado usa la letra siguiente
 * y la alteración se calcula (así Fa mayor lleva Si♭ y Re mayor lleva Fa♯).
 */
export function spellScale(rootSpelling, formula) {
  if (formula.length !== 7) throw new Error('El deletreo por letra necesita una escala de 7 notas');
  const rootPc = spellingPc(rootSpelling);
  const rootIndex = LETTERS.indexOf(rootSpelling.letter);
  return formula.map((semitones, i) => {
    const letter = LETTERS[(rootIndex + i) % 7];
    let accidental = mod12(rootPc + semitones - LETTER_PC[letter]);
    if (accidental > 6) accidental -= 12;
    return { letter, accidental };
  });
}

/** Tonalidades mayores con bemoles (F Bb Eb Ab Db Gb) y con sostenidos (G D A E B F#). */
export const FLAT_MAJOR_KEYS = Object.freeze([5, 10, 3, 8, 1, 6]);
export const SHARP_MAJOR_KEYS = Object.freeze([7, 2, 9, 4, 11, 6]);

/**
 * Deletreo de la fundamental de una tonalidad mayor. Fa♯/Sol♭ (pc 6) admite las dos
 * escrituras: se usa la preferencia del usuario.
 */
export function majorKeyRootSpelling(pc, { accidentals = 'sharp' } = {}) {
  const p = mod12(pc);
  if (p === 6) return spell(6, accidentals);
  if (FLAT_MAJOR_KEYS.includes(p)) return spell(p, 'flat');
  return spell(p, 'sharp');
}

export function majorScaleSpelling(rootPc, options) {
  return spellScale(majorKeyRootSpelling(rootPc, options), SCALE_FORMULAS.major);
}
