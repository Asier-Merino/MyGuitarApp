import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  spell, spellingPc, formatSpelling, noteName, spokenName, spellScale,
  majorKeyRootSpelling, majorScaleSpelling, FLAT_MAJOR_KEYS, SHARP_MAJOR_KEYS,
} from '../js/core/notation.js';
import { SCALE_FORMULAS } from '../js/core/theory.js';

// Tabla de BUILD_PLAN 4.1: [pc, ES#, ESb, EN#, ENb]
const TABLE = [
  [0, 'Do', 'Do', 'C', 'C'],
  [1, 'Do#', 'Reb', 'C#', 'Db'],
  [2, 'Re', 'Re', 'D', 'D'],
  [3, 'Re#', 'Mib', 'D#', 'Eb'],
  [4, 'Mi', 'Mi', 'E', 'E'],
  [5, 'Fa', 'Fa', 'F', 'F'],
  [6, 'Fa#', 'Solb', 'F#', 'Gb'],
  [7, 'Sol', 'Sol', 'G', 'G'],
  [8, 'Sol#', 'Lab', 'G#', 'Ab'],
  [9, 'La', 'La', 'A', 'A'],
  [10, 'La#', 'Sib', 'A#', 'Bb'],
  [11, 'Si', 'Si', 'B', 'B'],
];

test('nombres de las 12 notas (tabla 4.1)', () => {
  for (const [pc, esS, esF, enS, enF] of TABLE) {
    assert.equal(noteName(pc, { notation: 'es', accidentals: 'sharp', ascii: true }), esS);
    assert.equal(noteName(pc, { notation: 'es', accidentals: 'flat', ascii: true }), esF);
    assert.equal(noteName(pc, { notation: 'en', accidentals: 'sharp', ascii: true }), enS);
    assert.equal(noteName(pc, { notation: 'en', accidentals: 'flat', ascii: true }), enF);
  }
});

test('por defecto: español, sostenidos y símbolos ♯ ♭', () => {
  assert.equal(noteName(6), 'Fa♯');
  assert.equal(noteName(10, { accidentals: 'flat' }), 'Si♭');
  assert.equal(noteName(10, { notation: 'en', accidentals: 'flat' }), 'B♭');
  assert.equal(noteName(-2), 'La♯'); // normaliza
});

test('spell y spellingPc son coherentes', () => {
  for (let pc = 0; pc < 12; pc++) {
    assert.equal(spellingPc(spell(pc, 'sharp')), pc);
    assert.equal(spellingPc(spell(pc, 'flat')), pc);
  }
  assert.equal(spellingPc({ letter: 'B', accidental: 1 }), 0); // Si# = Do
  assert.equal(spellingPc({ letter: 'C', accidental: -1 }), 11); // Dob = Si
});

test('nombres hablados', () => {
  assert.equal(spokenName(spell(6), 'es'), 'Fa sostenido');
  assert.equal(spokenName(spell(10, 'flat'), 'es'), 'Si bemol');
  assert.equal(spokenName(spell(6), 'en'), 'F sharp');
  assert.equal(spokenName(spell(7), 'en'), 'G');
  assert.equal(spokenName({ letter: 'F', accidental: 2 }, 'es'), 'Fa doble sostenido');
});

const names = (spellings, notation = 'es') =>
  spellings.map((s) => formatSpelling(s, notation, { ascii: true }));

test('deletreo por letra: Fa mayor lleva Sib', () => {
  assert.deepEqual(names(majorScaleSpelling(5)), ['Fa', 'Sol', 'La', 'Sib', 'Do', 'Re', 'Mi']);
});

test('deletreo por letra: Re mayor lleva Fa# y Do#', () => {
  assert.deepEqual(names(majorScaleSpelling(2)), ['Re', 'Mi', 'Fa#', 'Sol', 'La', 'Si', 'Do#']);
});

test('deletreo por letra: tonalidades con bemoles y sostenidos', () => {
  assert.deepEqual(names(majorScaleSpelling(3), 'en'), ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D']);
  assert.deepEqual(names(majorScaleSpelling(11), 'en'), ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']);
  assert.deepEqual(names(majorScaleSpelling(6), 'en'), ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
  assert.deepEqual(names(majorScaleSpelling(6, { accidentals: 'flat' }), 'en'),
    ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F']);
});

test('cada escala mayor usa las 7 letras una vez y suena bien', () => {
  for (let pc = 0; pc < 12; pc++) {
    const scale = majorScaleSpelling(pc);
    assert.equal(new Set(scale.map((s) => s.letter)).size, 7);
    assert.deepEqual(scale.map(spellingPc), SCALE_FORMULAS.major.map((s) => (pc + s) % 12));
    // Una tonalidad mayor nunca mezcla sostenidos y bemoles.
    const acc = scale.map((s) => s.accidental).filter((a) => a !== 0);
    assert.ok(acc.every((a) => a > 0) || acc.every((a) => a < 0), `tonalidad ${pc}`);
  }
});

test('fundamentales de tonalidad mayor', () => {
  assert.deepEqual([...FLAT_MAJOR_KEYS], [5, 10, 3, 8, 1, 6]);
  assert.deepEqual([...SHARP_MAJOR_KEYS], [7, 2, 9, 4, 11, 6]);
  assert.deepEqual(majorKeyRootSpelling(10), { letter: 'B', accidental: -1 });
  assert.deepEqual(majorKeyRootSpelling(1), { letter: 'D', accidental: -1 });
  assert.deepEqual(majorKeyRootSpelling(8, { accidentals: 'sharp' }), { letter: 'A', accidental: -1 });
  assert.deepEqual(majorKeyRootSpelling(6), { letter: 'F', accidental: 1 });
});

test('spellScale exige 7 notas', () => {
  assert.throws(() => spellScale({ letter: 'A', accidental: 0 }, [0, 3, 5, 7, 10]));
});
