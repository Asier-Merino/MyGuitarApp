// Acordes de BUILD_PLAN 5.1, comprobados con las reglas de la teoría (no contra sí mismos).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORDS, getChord, chordTones, CHORD_SUFFIX, chordSpelling, chordsForLevel, sameChordName, chordMidis } from '../js/data/chords.js';
import { spellingPc, LETTERS } from '../js/core/notation.js';
import { shapeNotes } from '../js/core/fretboard-model.js';
import { mod12, CHORD_FORMULAS } from '../js/core/theory.js';
import { LEVEL_IDS } from '../js/data/modules.js';

test('están los 14 acordes de la tabla, sin ids repetidos', () => {
  assert.equal(CHORDS.length, 14);
  assert.equal(new Set(CHORDS.map((c) => c.id)).size, 14);
  const byLevel = (l) => CHORDS.filter((c) => c.level === l).map((c) => c.id);
  assert.deepEqual(byLevel('basico'), ['C', 'D', 'E', 'G', 'A', 'Am', 'Em', 'Dm']);
  assert.deepEqual(byLevel('intermedio'), ['F-mini', 'A7', 'D7', 'E7', 'B7']);
  assert.deepEqual(byLevel('avanzado'), ['F-barre']);
  for (const c of CHORDS) {
    assert.ok(LEVEL_IDS.includes(c.level), c.id);
    assert.ok(c.quality in CHORD_FORMULAS && c.quality in CHORD_SUFFIX, c.id);
  }
});

test('todas las notas que suenan pertenecen al acorde, y aparecen todas', () => {
  for (const c of CHORDS) {
    const tones = chordTones(c);
    const sounding = shapeNotes(c.frets).map((n) => mod12(n.midi));
    for (const pc of sounding) assert.ok(tones.includes(pc), `${c.id}: suena ${pc}, que no es del acorde`);
    for (const pc of tones) assert.ok(sounding.includes(pc), `${c.id}: falta ${pc}`);
  }
});

test('la nota más grave es la fundamental (salvo excepciones declaradas)', () => {
  for (const c of CHORDS) {
    const notes = shapeNotes(c.frets);
    const lowest = notes.reduce((a, b) => (b.midi < a.midi ? b : a));
    assert.equal(mod12(lowest.midi), c.bassNote ?? c.root, c.id);
    // La más grave es además la de la cuerda más grave que suena.
    assert.equal(lowest.string, notes[0].string, c.id);
  }
});

test('dedos coherentes con los trastes: 0 al aire, 1–4 pisando, nada en las cuerdas que no se tocan', () => {
  for (const c of CHORDS) {
    c.frets.forEach((fret, i) => {
      const finger = c.fingers[i];
      if (fret === null) assert.equal(finger, null, c.id);
      else if (fret === 0) assert.equal(finger, 0, c.id);
      else assert.ok([1, 2, 3, 4].includes(finger), `${c.id}: dedo ${finger}`);
    });
  }
});

test('cejillas: todas sus cuerdas en ese traste con el dedo 1', () => {
  for (const c of CHORDS.filter((x) => x.barre)) {
    const { fret, from, to } = c.barre;
    assert.ok(from > to, c.id);
    for (let s = from; s >= to; s--) {
      const i = 6 - s;
      assert.ok(c.frets[i] >= fret, `${c.id}: cuerda ${s} por debajo de la cejilla`);
    }
    for (const s of [from, to]) {
      assert.equal(c.frets[6 - s], fret, `${c.id}: extremo ${s}`);
      assert.equal(c.fingers[6 - s], 1, `${c.id}: extremo ${s}`);
    }
  }
});

test('ejemplos concretos de la tabla', () => {
  assert.deepEqual(shapeNotes(getChord('C').frets).map((n) => n.midi), [48, 52, 55, 60, 64]); // Do Mi Sol Do Mi
  assert.deepEqual(shapeNotes(getChord('B7').frets).map((n) => mod12(n.midi)), [11, 3, 9, 11, 6]); // Si Re♯ La Si Fa♯
  assert.equal(getChord('nada'), null);
});

test('notas de cada acorde deletreadas por letra: R, 3, 5 (y 7) a dos letras de distancia', () => {
  const name = (sp) => sp.letter + (sp.accidental === 1 ? '#' : sp.accidental === -1 ? 'b' : '');
  const spelled = (id) => chordSpelling(getChord(id)).map(name).join(' ');
  assert.equal(spelled('E'), 'E G# B');   // Sol♯, no La♭
  assert.equal(spelled('B7'), 'B D# F# A'); // Re♯, no Mi♭
  assert.equal(spelled('D'), 'D F# A');
  assert.equal(spelled('F-mini'), 'F A C');
  assert.equal(spelled('Dm'), 'D F A');
  for (const c of CHORDS) {
    const sp = chordSpelling(c);
    assert.deepEqual(sp.map(spellingPc), chordTones(c), c.id); // mismo sonido que la fórmula
    const letters = sp.map((s) => LETTERS.indexOf(s.letter));
    letters.forEach((l, i) => assert.equal((l - letters[0] + 7) % 7, (2 * i) % 7, c.id));
  }
});

test('acordes de cada nivel: los 8 básicos; + Fa mini y séptimas; + Fa con cejilla', () => {
  assert.deepEqual(chordsForLevel('basico').map((c) => c.id), ['C', 'D', 'E', 'G', 'A', 'Am', 'Em', 'Dm']);
  assert.deepEqual(chordsForLevel('intermedio').map((c) => c.id).slice(8), ['F-mini', 'A7', 'D7', 'E7', 'B7']);
  assert.equal(chordsForLevel('avanzado').length, 14);
  assert.throws(() => chordsForLevel('nada'));
  assert.ok(sameChordName(getChord('F-mini'), getChord('F-barre')));
  assert.ok(!sameChordName(getChord('A'), getChord('Am')));
  assert.deepEqual(chordMidis(getChord('Em')), [40, 47, 52, 55, 59, 64]);
});
