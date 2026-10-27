// Lógica musical pura (sin DOM). Notas como pitch class 0–11, 0 = Do (C).

export const mod12 = (n) => ((n % 12) + 12) % 12;

export const transpose = (pc, semitones) => mod12(pc + semitones);

/** Distancia ascendente en semitonos (0–11) de `fromPc` a `toPc`. */
export const interval = (fromPc, toPc) => mod12(toPc - fromPc);

export const midiToPc = (midi) => mod12(midi);

export const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** Intervalos de 0 a 12 semitonos (BUILD_PLAN 4.3). */
export const INTERVALS = Object.freeze([
  { semitones: 0, name: 'Unísono', abbr: '1' },
  { semitones: 1, name: '2ª menor', abbr: 'b2' },
  { semitones: 2, name: '2ª mayor', abbr: '2' },
  { semitones: 3, name: '3ª menor', abbr: 'b3' },
  { semitones: 4, name: '3ª mayor', abbr: '3' },
  { semitones: 5, name: '4ª justa', abbr: '4' },
  { semitones: 6, name: 'Tritono (4ª aum. / 5ª dism.)', abbr: 'b5' },
  { semitones: 7, name: '5ª justa', abbr: '5' },
  { semitones: 8, name: '6ª menor', abbr: 'b6' },
  { semitones: 9, name: '6ª mayor', abbr: '6' },
  { semitones: 10, name: '7ª menor', abbr: 'b7' },
  { semitones: 11, name: '7ª mayor', abbr: '7' },
  { semitones: 12, name: 'Octava', abbr: '8' },
].map(Object.freeze));

export function intervalInfo(semitones) {
  const info = INTERVALS[semitones];
  if (!info) throw new RangeError(`Intervalo fuera de rango: ${semitones}`);
  return info;
}

/** Fórmulas de escala en semitonos desde la fundamental (BUILD_PLAN 4.4). */
export const SCALE_FORMULAS = Object.freeze({
  major: Object.freeze([0, 2, 4, 5, 7, 9, 11]),
  naturalMinor: Object.freeze([0, 2, 3, 5, 7, 8, 10]),
  minorPentatonic: Object.freeze([0, 3, 5, 7, 10]),
  majorPentatonic: Object.freeze([0, 2, 4, 7, 9]),
  blues: Object.freeze([0, 3, 5, 6, 7, 10]),
});

export const CHORD_FORMULAS = Object.freeze({
  major: Object.freeze([0, 4, 7]),
  minor: Object.freeze([0, 3, 7]),
  diminished: Object.freeze([0, 3, 6]),
  dom7: Object.freeze([0, 4, 7, 10]),
});

/** Acordes de la tonalidad mayor: I ii iii IV V vi vii°. */
export const MAJOR_KEY_DEGREES = Object.freeze([
  { degree: 1, roman: 'I', quality: 'major' },
  { degree: 2, roman: 'ii', quality: 'minor' },
  { degree: 3, roman: 'iii', quality: 'minor' },
  { degree: 4, roman: 'IV', quality: 'major' },
  { degree: 5, roman: 'V', quality: 'major' },
  { degree: 6, roman: 'vi', quality: 'minor' },
  { degree: 7, roman: 'vii°', quality: 'diminished' },
].map(Object.freeze));

function formulaFrom(table, nameOrFormula, kind) {
  if (Array.isArray(nameOrFormula)) return nameOrFormula;
  const formula = table[nameOrFormula];
  if (!formula) throw new Error(`${kind} desconocido: ${nameOrFormula}`);
  return formula;
}

/** Pitch classes de una escala, en orden de grados. */
export function scalePcs(rootPc, scale) {
  return formulaFrom(SCALE_FORMULAS, scale, 'Tipo de escala').map((s) => transpose(rootPc, s));
}

/** Pitch classes de un acorde, en orden R, 3, 5, (7). */
export function chordPcs(rootPc, quality) {
  return formulaFrom(CHORD_FORMULAS, quality, 'Tipo de acorde').map((s) => transpose(rootPc, s));
}

/** Los 7 acordes de la tonalidad mayor con su fundamental y calidad. */
export function diatonicChords(keyRootPc) {
  const roots = scalePcs(keyRootPc, 'major');
  return MAJOR_KEY_DEGREES.map((d, i) => ({ ...d, root: roots[i] }));
}

/**
 * Función de una nota respecto a una fundamental, para el código de colores (4.5):
 * 'root' | 'third' | 'fifth' | 'seventh' | 'blue' | 'other'.
 */
export function noteFunction(rootPc, pc) {
  switch (interval(rootPc, pc)) {
    case 0: return 'root';
    case 3: case 4: return 'third';
    case 7: return 'fifth';
    case 10: case 11: return 'seventh';
    case 6: return 'blue';
    default: return 'other';
  }
}
