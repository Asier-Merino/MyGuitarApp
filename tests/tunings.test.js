// Las 7 afinaciones (BUILD_PLAN 4.2), comprobadas contra la tabla del plan y contra la teoría.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TUNINGS, TUNING_GROUPS, TUNING_IDS, getTuning, tuningNameText, allowedTunings, STANDARD,
} from '../js/data/tunings.js';
import {
  STANDARD_TUNING, STRINGS, isValidTuning, pcAt, midiAt, tuningChanges, formatTuningChanges,
} from '../js/core/fretboard-model.js';
import { noteName } from '../js/core/notation.js';
import { chordPcs, mod12 } from '../js/core/theory.js';

// Tabla 4.2: id, MIDI (6→1), notas (6→1), cambios respecto a la estándar.
const PLAN = [
  ['standard', [40, 45, 50, 55, 59, 64], 'E A D G B E', '—'],
  ['half-down', [39, 44, 49, 54, 58, 63], 'Eb Ab Db Gb Bb Eb', 'todas ↓ ½ tono'],
  ['d-standard', [38, 43, 48, 53, 57, 62], 'D G C F A D', 'todas ↓ 1 tono'],
  ['drop-d', [38, 45, 50, 55, 59, 64], 'D A D G B E', '6ª ↓ 1 tono'],
  ['open-g', [38, 43, 50, 55, 59, 62], 'D G D G B D', '6ª, 5ª y 1ª ↓ 1 tono'],
  ['open-d', [38, 45, 50, 54, 57, 62], 'D A D F# A D', '6ª, 2ª y 1ª ↓ 1 tono; 3ª ↓ ½ tono'],
  ['open-e', [40, 47, 52, 56, 59, 64], 'E B E G# B E', '5ª y 4ª ↑ 1 tono; 3ª ↑ ½ tono'],
];

const from6to1 = (tuning) => [6, 5, 4, 3, 2, 1].map((s) => tuning.midi[s]);
const pcsOpen = (tuning) => STRINGS.map((s) => pcAt(s, 0, tuning.midi));

test('hay 7 afinaciones con 6 cuerdas válidas y ids únicos', () => {
  assert.equal(TUNINGS.length, 7);
  assert.equal(new Set(TUNING_IDS).size, 7);
  for (const tuning of TUNINGS) assert.ok(isValidTuning(tuning.midi), tuning.id);
});

test('los MIDI coinciden con la tabla 4.2, en el mismo orden', () => {
  assert.deepEqual(TUNINGS.map((x) => x.id), PLAN.map((p) => p[0]));
  for (const [id, midi] of PLAN) assert.deepEqual(from6to1(getTuning(id)), midi, id);
});

test('la estándar es la misma que usa el modelo del mástil', () => {
  assert.deepEqual({ ...STANDARD.midi }, { ...STANDARD_TUNING });
  assert.equal(midiAt(6, 0, STANDARD.midi), 40); // E2
  assert.equal(midiAt(1, 0, STANDARD.midi), 64); // E4
});

test('los nombres de las notas, calculados, coinciden con la columna "Notas"', () => {
  for (const [id, , names] of PLAN) {
    const tuning = getTuning(id);
    const got = from6to1(tuning).map((m) => noteName(m, { notation: 'en', accidentals: tuning.accidentals, ascii: true }));
    assert.equal(got.join(' '), names, id);
  }
});

test('la línea de cambios, calculada, coincide con la última columna', () => {
  for (const [id, , , changes] of PLAN) assert.equal(formatTuningChanges(getTuning(id).midi), changes, id);
  assert.deepEqual(tuningChanges(getTuning('drop-d').midi), [{ string: 6, semitones: -2 }]);
});

test('las abiertas suenan como su acorde mayor al aire (todas sus notas son de la tríada y están las tres)', () => {
  for (const [id, root] of [['open-g', 7], ['open-d', 2], ['open-e', 4]]) {
    const triad = chordPcs(root, 'major');
    const open = pcsOpen(getTuning(id));
    assert.ok(open.every((pc) => triad.includes(pc)), `${id}: nota fuera del acorde`);
    assert.deepEqual([...new Set(open)].sort(), [...triad].sort(), `${id}: falta alguna nota`);
    // El nombre ("Sol abierto"…) es la fundamental de ese acorde.
    assert.equal(getTuning(id).name.root, root);
  }
});

test('afinación abierta: en cualquier traste suena el acorde mayor desplazado (Sol abierto, traste 5 = Do)', () => {
  const g = getTuning('open-g');
  for (let fret = 0; fret <= 12; fret++) {
    const pcs = STRINGS.map((s) => pcAt(s, fret, g.midi));
    const triad = chordPcs(mod12(7 + fret), 'major');
    assert.deepEqual([...new Set(pcs)].sort(), [...triad].sort(), `traste ${fret}`);
  }
  const at5 = new Set(STRINGS.map((s) => pcAt(s, 5, g.midi)));
  assert.deepEqual([...at5].sort(), [...chordPcs(0, 'major')].sort());
});

test('Drop D: las cuerdas 6, 5 y 4 en el mismo traste dan fundamental, 5ª y octava', () => {
  const d = getTuning('drop-d').midi;
  for (let fret = 0; fret <= 12; fret++) {
    assert.equal(midiAt(5, fret, d) - midiAt(6, fret, d), 7);
    assert.equal(midiAt(4, fret, d) - midiAt(6, fret, d), 12);
  }
  // Solo cambia la 6ª: de Mi a Re, un tono.
  assert.equal(pcAt(6, 0, d), 2);
});

test('estándar: 5 semitonos entre cuerdas vecinas, salvo 4 entre la 3ª (Sol) y la 2ª (Si)', () => {
  const m = STANDARD.midi;
  assert.deepEqual([[6, 5], [5, 4], [4, 3], [3, 2], [2, 1]].map(([lo, hi]) => m[hi] - m[lo]), [5, 5, 5, 4, 5]);
});

test('las bajadas mantienen las distancias entre cuerdas de la estándar', () => {
  for (const id of ['half-down', 'd-standard']) {
    const changes = tuningChanges(getTuning(id).midi);
    assert.equal(changes.length, 6);
    assert.equal(new Set(changes.map((c) => c.semitones)).size, 1, id);
  }
});

test('grupos y nombres', () => {
  for (const tuning of TUNINGS) assert.ok(TUNING_GROUPS.some((g) => g.id === tuning.group), tuning.id);
  assert.deepEqual(TUNINGS.filter((x) => x.group === 'open').map((x) => x.id), ['open-g', 'open-d', 'open-e']);
  assert.equal(tuningNameText(getTuning('standard')), 'Mi estándar');
  assert.equal(tuningNameText(getTuning('open-g'), { notation: 'en' }), 'G abierto');
  assert.equal(tuningNameText(getTuning('d-standard')), 'Re estándar');
  assert.equal(tuningNameText(getTuning('drop-d')), 'Drop D');
  // Los nombres con nota se calculan: la nota del nombre es la de la 6ª cuerda (estándar) o la del acorde (abiertas).
  assert.equal(getTuning('standard').name.root, pcAt(6, 0, STANDARD.midi));
  assert.equal(getTuning('d-standard').name.root, pcAt(6, 0, getTuning('d-standard').midi));
});

test('afinaciones admitidas por un ejercicio (7.6)', () => {
  assert.deepEqual(allowedTunings('standard').map((x) => x.id), ['standard']);
  assert.equal(allowedTunings('any').length, 7);
  assert.deepEqual(allowedTunings(['open-g', 'standard']).map((x) => x.id), ['standard', 'open-g']);
});
