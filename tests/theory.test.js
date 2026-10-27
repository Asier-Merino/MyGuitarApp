import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mod12, transpose, interval, midiToFreq, midiToPc, INTERVALS, intervalInfo,
  SCALE_FORMULAS, scalePcs, chordPcs, diatonicChords, noteFunction,
} from '../js/core/theory.js';

test('mod12 y transpose manejan negativos y vueltas', () => {
  assert.equal(mod12(-1), 11);
  assert.equal(mod12(24), 0);
  assert.equal(transpose(11, 2), 1);
  assert.equal(transpose(0, -3), 9);
});

test('interval es ascendente de 0 a 11', () => {
  assert.equal(interval(0, 7), 7); // Do → Sol
  assert.equal(interval(7, 0), 5); // Sol → Do
  assert.equal(interval(4, 4), 0);
});

test('midiToFreq: La4 = 440 Hz, cuerdas al aire', () => {
  assert.equal(midiToFreq(69), 440);
  assert.ok(Math.abs(midiToFreq(40) - 82.4069) < 1e-3); // Mi grave
  assert.ok(Math.abs(midiToFreq(64) - 329.6276) < 1e-3); // Mi aguda
  assert.equal(midiToPc(60), 0);
  assert.equal(midiToPc(45), 9);
});

test('tabla de intervalos (4.3)', () => {
  assert.equal(INTERVALS.length, 13);
  INTERVALS.forEach((iv, i) => assert.equal(iv.semitones, i));
  assert.equal(intervalInfo(6).abbr, 'b5');
  assert.equal(intervalInfo(7).name, '5ª justa');
  assert.equal(intervalInfo(12).abbr, '8');
  assert.throws(() => intervalInfo(13));
});

test('fórmulas de escala (4.4)', () => {
  assert.deepEqual([...SCALE_FORMULAS.major], [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual([...SCALE_FORMULAS.naturalMinor], [0, 2, 3, 5, 7, 8, 10]);
  assert.deepEqual([...SCALE_FORMULAS.minorPentatonic], [0, 3, 5, 7, 10]);
  assert.deepEqual([...SCALE_FORMULAS.majorPentatonic], [0, 2, 4, 7, 9]);
  assert.deepEqual([...SCALE_FORMULAS.blues], [0, 3, 5, 6, 7, 10]);
  // Escala mayor: T T S T T T S
  const steps = [...SCALE_FORMULAS.major, 12].slice(1).map((s, i) => s - SCALE_FORMULAS.major[i]);
  assert.deepEqual(steps, [2, 2, 1, 2, 2, 2, 1]);
});

test('scalePcs', () => {
  assert.deepEqual(scalePcs(0, 'major'), [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual(scalePcs(9, 'minorPentatonic'), [9, 0, 2, 4, 7]); // La Do Re Mi Sol
  assert.deepEqual(scalePcs(9, 'blues'), [9, 0, 2, 3, 4, 7]); // con Mib
  assert.deepEqual(scalePcs(0, [0, 7]), [0, 7]);
  assert.throws(() => scalePcs(0, 'lydian'));
});

test('chordPcs', () => {
  assert.deepEqual(chordPcs(0, 'major'), [0, 4, 7]);
  assert.deepEqual(chordPcs(9, 'minor'), [9, 0, 4]);
  assert.deepEqual(chordPcs(11, 'diminished'), [11, 2, 5]);
  assert.deepEqual(chordPcs(9, 'dom7'), [9, 1, 4, 7]);
  assert.throws(() => chordPcs(0, 'sus4'));
});

test('acordes de la tonalidad: Do y Sol mayor', () => {
  const c = diatonicChords(0);
  assert.deepEqual(c.map((d) => d.roman), ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
  assert.deepEqual(c.map((d) => d.root), [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual(c.map((d) => d.quality),
    ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']);
  const g = diatonicChords(7);
  assert.deepEqual(g.map((d) => d.root), [7, 9, 11, 0, 2, 4, 6]); // G Am Bm C D Em F#°
});

test('noteFunction para el código de colores', () => {
  assert.equal(noteFunction(9, 9), 'root');
  assert.equal(noteFunction(9, 0), 'third'); // Do en La: b3
  assert.equal(noteFunction(9, 1), 'third'); // Do# en La: 3
  assert.equal(noteFunction(9, 4), 'fifth');
  assert.equal(noteFunction(9, 7), 'seventh');
  assert.equal(noteFunction(9, 3), 'blue'); // Mib en La
  assert.equal(noteFunction(9, 2), 'other');
});
