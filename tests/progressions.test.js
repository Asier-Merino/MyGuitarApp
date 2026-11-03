// Progresiones de BUILD_PLAN 5.7: calculadas por grados con la teoría y con acordes de la biblioteca.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESETS, libraryChord, degreeChord, resolvePreset, customProgressions, isValidCustom, newCustomId,
  resolveProgressionChoice, cleanName,
} from '../js/core/progressions.js';
import { PRESET_PROGRESSIONS } from '../js/data/progressions.js';
import { CHORDS, getChord } from '../js/data/chords.js';
import { scalePcs, CHORD_FORMULAS, interval } from '../js/core/theory.js';
import { LETTER_PC } from '../js/core/notation.js';

const ids = (prog) => prog.chords.map((c) => c.id);
const L = LETTER_PC;

test('las progresiones de la tabla 5.7, con sus acordes', () => {
  const table = PRESETS.map((p) => `${p.degrees.join('–')} ${ids(p).join(' ')} ${p.level}`);
  assert.deepEqual(table, [
    'I–IV–V G C D basico',
    'I–IV–V D G A basico',
    'I–IV–V A D E basico',
    'I–IV–V C F-mini G intermedio',
    'I–V–vi–IV G D Em C basico',
    'I–V–vi–IV C G Am F-mini intermedio',
    'I–vi–IV–V G Em C D basico',
    'vi–IV–I–V Em C G D basico',
  ]);
});

test('cada acorde es el grado de su tonalidad según la teoría (fundamental en la escala y calidad del grado)', () => {
  const DEGREE_INDEX = { I: 0, ii: 1, iii: 2, IV: 3, V: 4, vi: 5 };
  for (const p of PRESETS) {
    const scale = scalePcs(p.key, 'major');
    p.chords.forEach((chord, i) => {
      const roman = p.degrees[i];
      assert.equal(chord.root, scale[DEGREE_INDEX[roman]], `${p.id}: ${roman}`);
      // Mayúsculas = mayor, minúsculas = menor; y la 3ª del acorde lo confirma con las notas de la escala.
      const isMajor = roman === roman.toUpperCase();
      assert.equal(chord.quality, isMajor ? 'major' : 'minor', `${p.id}: ${roman}`);
      const third = scale[(DEGREE_INDEX[roman] + 2) % 7];
      assert.equal(interval(chord.root, third), CHORD_FORMULAS[chord.quality][1], `${p.id}: 3ª de ${roman}`);
      assert.ok(getChord(chord.id), chord.id);
    });
  }
});

test('ejemplos de la tabla: en Sol, I = Sol, IV = Do, V = Re, vi = Mim; en Do, IV = Fa', () => {
  assert.deepEqual(degreeChord(L.G, 'I'), { root: L.G, quality: 'major' });
  assert.deepEqual(degreeChord(L.G, 'IV'), { root: L.C, quality: 'major' });
  assert.deepEqual(degreeChord(L.G, 'V'), { root: L.D, quality: 'major' });
  assert.deepEqual(degreeChord(L.G, 'vi'), { root: L.E, quality: 'minor' });
  assert.deepEqual(degreeChord(L.C, 'IV'), { root: L.F, quality: 'major' });
  assert.throws(() => degreeChord(L.C, 'VIII'));
  // Con dos formas de Fa, se usa la más fácil (Fa mini).
  assert.equal(libraryChord(L.F, 'major').id, 'F-mini');
  assert.equal(libraryChord(L.B, 'major'), null);
  // Una progresión con un acorde que no está en la biblioteca da error.
  assert.throws(() => resolvePreset({ degrees: ['I', 'IV', 'V'], key: L.E })); // Mi–La–Si: no hay Si mayor abierto
  assert.equal(PRESET_PROGRESSIONS.length, PRESETS.length);
});

test('Mis progresiones: de 3 a 5 acordes de la biblioteca y con nombre', () => {
  const saved = [
    { id: 'a', name: '  Blues  ', chords: ['A7', 'D7', 'E7'] },
    { id: 'b', name: 'Corta', chords: ['C', 'G'] },              // 2 acordes: no vale
    { id: 'c', name: 'Larga', chords: ['C', 'G', 'Am', 'F-mini', 'C', 'G'] }, // 6: no vale
    { id: 'd', name: '', chords: ['C', 'G', 'Am'] },             // sin nombre
    { id: 'e', name: 'Rara', chords: ['C', 'X', 'Am'] },         // acorde que no existe
    { id: 'f', name: 'Pop', chords: ['C', 'G', 'Am', 'F-barre', 'C'] },
  ];
  assert.deepEqual(saved.filter(isValidCustom).map((p) => p.id), ['a', 'f']);
  const list = customProgressions(saved);
  assert.equal(list[0].name, 'Blues');
  assert.equal(list[0].id, 'custom:a');
  assert.deepEqual(ids(list[1]), ['C', 'G', 'Am', 'F-barre', 'C']);
  assert.equal(cleanName('a'.repeat(50)).length, 30);
});

test('la progresión elegida se resuelve, y si se borró se usa la primera predefinida', () => {
  const saved = [{ id: 'a', name: 'Blues', chords: ['A7', 'D7', 'E7'] }];
  assert.equal(resolveProgressionChoice('custom:a', saved).name, 'Blues');
  assert.equal(resolveProgressionChoice(PRESETS[4].id, saved), PRESETS[4]);
  assert.equal(resolveProgressionChoice('custom:borrada', saved), PRESETS[0]);
  assert.equal(resolveProgressionChoice(undefined, saved), PRESETS[0]);
});

test('ids nuevos distintos de los guardados', () => {
  const id = newCustomId([], 1000);
  assert.notEqual(newCustomId([{ id }], 1000), id);
});

test('todos los acordes de la biblioteca se pueden usar en Mis progresiones', () => {
  for (const c of CHORDS) assert.ok(isValidCustom({ id: 'x', name: 'x', chords: [c.id, c.id, c.id] }), c.id);
});
