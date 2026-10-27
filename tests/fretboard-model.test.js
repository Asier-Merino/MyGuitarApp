import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_TUNING, STRINGS, FRET_INLAYS, midiAt, pcAt, positionsOf, octavesOf, OCTAVE_SHAPES,
} from '../js/core/fretboard-model.js';

test('afinación estándar (4.2)', () => {
  assert.deepEqual({ ...STANDARD_TUNING }, { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 });
  assert.deepEqual([...STRINGS], [1, 2, 3, 4, 5, 6]);
});

test('midiAt y pcAt', () => {
  assert.equal(midiAt(6, 0), 40);
  assert.equal(midiAt(5, 3), 48); // Do3
  assert.equal(pcAt(6, 5), 9); // La
  assert.equal(pcAt(5, 3), 0); // Do
  assert.equal(pcAt(2, 1), 0); // Do en la cuerda Si
  assert.equal(pcAt(3, 4), 11); // Si
  assert.throws(() => midiAt(7, 0));
  assert.throws(() => midiAt(1, -1));
});

test('el traste 12 es la octava de la cuerda al aire', () => {
  for (const s of STRINGS) {
    assert.equal(midiAt(s, 12), midiAt(s, 0) + 12);
    assert.equal(pcAt(s, 12), pcAt(s, 0));
  }
});

test('positionsOf: todos los Sol entre 0 y 12', () => {
  const pos = positionsOf(7);
  assert.deepEqual(pos, [
    { string: 6, fret: 3 },
    { string: 5, fret: 10 },
    { string: 4, fret: 5 },
    { string: 3, fret: 0 }, { string: 3, fret: 12 },
    { string: 2, fret: 8 },
    { string: 1, fret: 3 },
  ]);
  pos.forEach(({ string, fret }) => assert.equal(pcAt(string, fret), 7));
});

test('positionsOf respeta rango y cuerdas', () => {
  assert.deepEqual(positionsOf(4, { strings: [6], toFret: 15 }), [{ string: 6, fret: 0 }, { string: 6, fret: 12 }]);
  assert.deepEqual(positionsOf(9, { strings: [6, 5], fromFret: 1, toFret: 5 }), [{ string: 6, fret: 5 }]);
  // Cada nota aparece 6 o 7 veces... al menos una por cuerda en 0–11
  for (let pc = 0; pc < 12; pc++) {
    assert.equal(positionsOf(pc, { toFret: 11 }).length, 6);
  }
});

test('marcas del mástil', () => {
  assert.deepEqual(FRET_INLAYS.map((m) => m.fret), [3, 5, 7, 9, 12, 15]);
  assert.deepEqual(FRET_INLAYS.filter((m) => m.double).map((m) => m.fret), [12]);
});

test('formas de octava suenan una (o dos) octavas más arriba', () => {
  for (const shape of OCTAVE_SHAPES) {
    for (let fret = 0; fret <= 10; fret++) {
      assert.equal(midiAt(shape.to, fret + shape.fretShift) - midiAt(shape.from, fret), shape.semitones);
    }
  }
});

test('octavesOf según 4.3', () => {
  // La en cuerda 6 traste 5 → cuerda 4 traste 7 y cuerda 1 traste 5
  assert.deepEqual(octavesOf(6, 5), [
    { string: 4, fret: 7, direction: 'up', semitones: 12 },
    { string: 1, fret: 5, direction: 'up', semitones: 24 },
  ]);
  // Do en cuerda 5 traste 3 → cuerda 3 traste 5
  assert.deepEqual(octavesOf(5, 3), [{ string: 3, fret: 5, direction: 'up', semitones: 12 }]);
  // Cuerda 4: +3 hacia la 2, y −2 hacia la 6
  assert.deepEqual(octavesOf(4, 2), [
    { string: 6, fret: 0, direction: 'down', semitones: -12 },
    { string: 2, fret: 5, direction: 'up', semitones: 12 },
  ]);
  // Fuera de rango se descarta
  assert.deepEqual(octavesOf(3, 1), [{ string: 1, fret: 4, direction: 'up', semitones: 12 }]);
  for (const o of octavesOf(2, 8)) {
    assert.equal(midiAt(o.string, o.fret) - midiAt(2, 8), o.semitones);
  }
});
