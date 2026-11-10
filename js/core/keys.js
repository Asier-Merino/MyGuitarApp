// Tonalidades mayores (BUILD_PLAN 4.1, 4.3, 4.4 y Fase 5), sin DOM. Todo se calcula con
// core/theory.js (fórmulas, grados) y core/notation.js (deletreo por letra): la escala, los
// acordes de cada grado con su nombre bien escrito, los intervalos con su nombre y la segunda
// nota deletreada, y la posición de la escala en el mástil. Nada se escribe a mano.
// Una tonalidad se identifica por el pitch class de su fundamental (0 = Do mayor).

import { mod12, SCALE_FORMULAS, CHORD_FORMULAS, MAJOR_KEY_DEGREES, intervalInfo } from './theory.js';
import { LETTERS, LETTER_PC, spellingPc, majorKeyRootSpelling, spellScale, spellChordTones } from './notation.js';
import { STANDARD_TUNING, midiAt } from './fretboard-model.js';

/** Las 12 tonalidades mayores, en el orden del círculo de quintas (Do, Sol, Re… Fa). */
export const ALL_KEYS = Object.freeze([0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]);

/** Tonalidades de cada nivel (tabla de la Fase 5). */
export const KEY_LEVELS = Object.freeze({
  basico: Object.freeze([0, 7, 2]),
  intermedio: Object.freeze([0, 7, 2, 9, 4, 5]),
  avanzado: ALL_KEYS,
});

/** Nivel en el que aparece una tonalidad por primera vez ('basico' | 'intermedio' | 'avanzado'). */
export function keyLevel(key) {
  return Object.keys(KEY_LEVELS).find((level) => KEY_LEVELS[level].includes(mod12(key)));
}

/** Pasos de la escala mayor entre grado y grado: 'T' (tono, 2 semitonos) o 'S' (semitono). */
export const MAJOR_STEPS = Object.freeze(SCALE_FORMULAS.major.map((s, i, f) => {
  const next = i + 1 < f.length ? f[i + 1] : 12;
  const gap = next - s;
  if (gap !== 1 && gap !== 2) throw new Error('La escala mayor solo tiene tonos y semitonos');
  return gap === 2 ? 'T' : 'S';
}));

/** Deletreo de la fundamental (Fa♯ o Sol♭ según la preferencia del usuario). */
export const keyRootSpelling = (key, { accidentals = 'sharp' } = {}) => majorKeyRootSpelling(key, { accidentals });

/** Las 7 notas de la escala mayor: [{ degree (1–7), pc, spelling }]. */
export function keyScale(key, opts) {
  const spellings = spellScale(keyRootSpelling(key, opts), SCALE_FORMULAS.major);
  return spellings.map((spelling, i) => Object.freeze({ degree: i + 1, pc: spellingPc(spelling), spelling }));
}

/**
 * Los 7 acordes de la tonalidad: [{ degree, roman, quality, root, spelling (de la fundamental),
 * tones (notas del acorde deletreadas: fundamental, 3ª y 5ª), key }]. La fundamental de cada
 * acorde lleva el deletreo de la escala (Si♭ en Fa mayor, Fa♯ en Re mayor).
 */
export function keyChords(key, opts) {
  const scale = keyScale(key, opts);
  return MAJOR_KEY_DEGREES.map((d, i) => {
    const { spelling, pc } = scale[i];
    return Object.freeze({
      key: mod12(key),
      degree: d.degree,
      roman: d.roman,
      quality: d.quality,
      root: pc,
      spelling,
      tones: Object.freeze(spellChordTones(spelling, CHORD_FORMULAS[d.quality])),
    });
  });
}

/** El acorde de un grado ('I', 'ii'… 'vii°') en una tonalidad. */
export function keyChord(key, roman, opts) {
  const chord = keyChords(key, opts).find((c) => c.roman === roman);
  if (!chord) throw new Error(`Grado desconocido: ${roman}`);
  return chord;
}

/** Los números romanos de los 7 grados, en orden. */
export const ROMANS = Object.freeze(MAJOR_KEY_DEGREES.map((d) => d.roman));

/** true si dos deletreos son la misma nota escrita igual (misma letra y alteración). */
export const sameSpelling = (a, b) => a.letter === b.letter && a.accidental === b.accidental;

/* ----- Construye la escala: opciones de cada grado ----- */

/**
 * Opciones para el grado siguiente de la escala: la letra que toca con ♭, sin alteración y
 * con ♯, y una nota con otra letra: la misma nota correcta escrita con otra letra (La♯ en
 * lugar de Si♭) si se puede con una sola alteración; si no (Re, Sol y La), la letra anterior
 * con ♯ (Do♯ para Re). Devuelve [{ spelling, pc, correct, wrongLetter }].
 */
export function nextDegreeOptions(answer) {
  const options = [-1, 0, 1].map((accidental) => ({ letter: answer.letter, accidental }));
  const pc = spellingPc(answer);
  const index = LETTERS.indexOf(answer.letter);
  for (const step of [1, -1]) {
    const letter = LETTERS[(index + step + 7) % 7];
    let accidental = mod12(pc - LETTER_PC[letter]);
    if (accidental > 6) accidental -= 12;
    if (Math.abs(accidental) <= 1) { options.push({ letter, accidental }); break; }
  }
  if (options.length < 4) options.push({ letter: LETTERS[(index + 6) % 7], accidental: 1 });
  return options.map((spelling) => ({
    spelling,
    pc: spellingPc(spelling),
    correct: sameSpelling(spelling, answer),
    wrongLetter: spelling.letter !== answer.letter,
  }));
}

/* ----- Intervalos con su nombre y la segunda nota deletreada ----- */

/**
 * Cuántas letras se avanza en cada intervalo (el número del intervalo menos uno): una 3ª son
 * dos letras más allá (Do → Mi). El tritono tiene dos escrituras: 4ª aumentada (3 letras) o
 * 5ª disminuida (4 letras).
 */
const LETTER_STEPS = Object.freeze({ 0: [0], 1: [1], 2: [1], 3: [2], 4: [2], 5: [3], 6: [3, 4], 7: [4], 8: [5], 9: [5], 10: [6], 11: [6], 12: [0] });

/** Nombres completos del tritono según cómo se escriba. */
export const TRITONE_NAMES = Object.freeze({ 3: '4ª aumentada', 4: '5ª disminuida' });

/** Nota que está `semitones` por encima, avanzando `letterSteps` letras. */
export function spellAbove(from, semitones, letterSteps) {
  const letter = LETTERS[(LETTERS.indexOf(from.letter) + letterSteps) % 7];
  let accidental = mod12(spellingPc(from) + semitones - LETTER_PC[letter]);
  if (accidental > 6) accidental -= 12;
  return { letter, accidental };
}

/**
 * Escrituras de la nota que está a `semitones` (0–12) por encima de `from`, con el nombre del
 * intervalo: [{ spelling, name }]. Una sola salvo en el tritono (4ª aumentada y 5ª disminuida).
 */
export function intervalSpellings(from, semitones) {
  const steps = LETTER_STEPS[semitones];
  if (!steps) throw new RangeError(`Intervalo fuera de rango: ${semitones}`);
  return steps.map((n) => ({
    spelling: spellAbove(from, semitones, n),
    name: semitones === 6 ? TRITONE_NAMES[n] : intervalInfo(semitones).name,
  }));
}

/**
 * Deletreo de la nota de partida de un intervalo: el de la preferencia del usuario, salvo que
 * la nota de llegada necesite doble alteración (de Re♯ una 3ª mayor sería Fa𝄪); entonces, la
 * otra escritura (Mi♭ → Sol). Así el «¿Por qué?» siempre se escribe con alteraciones simples.
 */
export function intervalStart(pc, semitones, { accidentals = 'sharp' } = {}) {
  const p = mod12(pc);
  const natural = LETTERS.find((l) => LETTER_PC[l] === p);
  if (natural) return { letter: natural, accidental: 0 };
  // Una nota con alteración: primero con la de la preferencia, después con la otra.
  const order = accidentals === 'flat' ? [-1, 1] : [1, -1];
  const candidates = order.map((acc) => ({ letter: LETTERS.find((l) => mod12(LETTER_PC[l] + acc) === p), accidental: acc }));
  const simple = (from) => intervalSpellings(from, semitones).every((x) => isSimple(x.spelling));
  const some = (from) => intervalSpellings(from, semitones).some((x) => isSimple(x.spelling));
  return candidates.find(simple) ?? candidates.find(some);
}

const isSimple = (spelling) => Math.abs(spelling.accidental) <= 1;

/**
 * Ejemplo escrito de un intervalo desde una nota: { from, to: [{ spelling, name }] }, solo con
 * alteraciones simples. En el tritono pueden salir sus dos escrituras o solo una (desde Re♯,
 * la 5ª disminuida es La; la 4ª aumentada sería Sol𝄪 y no se enseña).
 */
export function intervalExample(pc, semitones, opts) {
  const from = intervalStart(pc, semitones, opts);
  return { from, to: intervalSpellings(from, semitones).filter((x) => isSimple(x.spelling)) };
}

/* ----- Posición de la escala en el mástil ----- */

/**
 * Posición de la escala mayor de dos octavas con la fundamental en la 6ª cuerda (decidida en
 * la Fase 5; lo más habitual es llamarla «forma de Mi» en CAGED): 4 trastes, del r−1 al r+2,
 * un dedo por traste, de la fundamental grave a la fundamental dos octavas más aguda en la 1ª
 * cuerda. r va del traste 2 al 13. Devuelve { key, rootFret, fromFret, toFret, notes } con
 * notes: [{ string, fret, finger, midi, pc, degree, spelling }] de grave a agudo.
 */
export const POSITION_ROOT_FRETS = Object.freeze({ min: 2, max: 13 });

export function scalePositionRootFret(key) {
  let fret = mod12(mod12(key) - STANDARD_TUNING[6]);
  while (fret < POSITION_ROOT_FRETS.min) fret += 12;
  return fret;
}

export function majorScalePosition(key, opts) {
  const scale = keyScale(key, opts);
  const rootFret = scalePositionRootFret(key);
  const fromFret = rootFret - 1;
  const toFret = rootFret + 2;
  const low = midiAt(6, rootFret);
  const high = low + 24;
  const notes = [];
  for (const string of [6, 5, 4, 3, 2, 1]) {
    for (let fret = fromFret; fret <= toFret; fret++) {
      const midi = midiAt(string, fret);
      if (midi < low || midi > high) continue;
      const degree = scale.findIndex((n) => n.pc === mod12(midi));
      if (degree < 0) continue;
      if (notes.some((n) => n.midi === midi)) continue;
      notes.push({ string, fret, finger: fret - fromFret + 1, midi, pc: mod12(midi), degree: degree + 1, spelling: scale[degree].spelling });
    }
  }
  notes.sort((a, b) => a.midi - b.midi);
  return Object.freeze({ key: mod12(key), rootFret, fromFret, toFret, notes: Object.freeze(notes.map(Object.freeze)) });
}

/** Una vuelta de la escala: subiendo (15 notas) y bajando hasta la fundamental (14 más). */
export function scaleLap(key, opts) {
  const up = majorScalePosition(key, opts).notes;
  return [...up, ...[...up].reverse().slice(1)];
}

/* ----- Nombre de un acorde de la tonalidad, en marcado ----- */

/** Marcado de un acorde con su deletreo: '{{ch:F#:minor}}' (lo lee js/core/glossary.js). */
export function chordToken({ spelling, quality }) {
  const { letter, accidental } = spelling;
  if (Math.abs(accidental) > 1) throw new RangeError('El marcado solo admite ♯ o ♭ sencillos');
  return `{{ch:${letter}${accidental === 1 ? '#' : accidental === -1 ? 'b' : ''}:${quality}}}`;
}

/** Marcado de la tonalidad: '{{key:7}}' (la fundamental con su deletreo de tonalidad). */
export const keyToken = (key) => `{{key:${mod12(key)}}}`;
