// Tonalidades mayores (Fase 5): escalas, acordes de cada grado, intervalos y posición de la
// escala, comprobados contra las reglas de la teoría (no contra sí mismos), en las 12 tonalidades.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_KEYS, KEY_LEVELS, keyLevel, MAJOR_STEPS, keyScale, keyChords, keyChord, ROMANS, nextDegreeOptions,
  intervalSpellings, intervalExample, spellAbove, majorScalePosition, scaleLap, scalePositionRootFret, chordToken, keyToken,
  TRITONE_NAMES,
} from '../js/core/keys.js';
import { LETTERS, LETTER_PC, spellingPc, formatSpelling } from '../js/core/notation.js';
import { mod12, SCALE_FORMULAS, CHORD_FORMULAS, intervalInfo } from '../js/core/theory.js';
import { midiAt, STANDARD_TUNING } from '../js/core/fretboard-model.js';
import { parseRichText } from '../js/core/glossary.js';

const name = (s) => formatSpelling(s, 'en', { ascii: true });
const names = (list) => list.map((x) => name(x.spelling ?? x)).join(' ');
const chordName = (c) => name(c.spelling) + { major: '', minor: 'm', diminished: 'dim' }[c.quality];
/** Las 12 tonalidades, y la del pc 6 escrita de las dos formas (Fa♯ y Sol♭). */
const ALL_SPELLED = [...ALL_KEYS.map((key) => ({ key, opts: { accidentals: 'sharp' } })), { key: 6, opts: { accidentals: 'flat' } }];

test('las 12 tonalidades, sin repetir, y los niveles de la tabla de la Fase 5', () => {
  assert.deepEqual([...ALL_KEYS].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  // Círculo de quintas: cada tonalidad está una 5ª justa (7 semitonos) por encima de la anterior.
  ALL_KEYS.forEach((k, i) => { if (i) assert.equal(mod12(k - ALL_KEYS[i - 1]), 7); });
  assert.deepEqual(names(KEY_LEVELS.basico.map((k) => keyScale(k)[0])), 'C G D');
  assert.deepEqual(names(KEY_LEVELS.intermedio.map((k) => keyScale(k)[0])), 'C G D A E F');
  assert.equal(KEY_LEVELS.avanzado.length, 12);
  assert.equal(keyLevel(9), 'intermedio');
  assert.equal(keyLevel(3), 'avanzado');
});

test('fórmula de la escala mayor: T T S T T T S', () => {
  assert.deepEqual(MAJOR_STEPS, ['T', 'T', 'S', 'T', 'T', 'T', 'S']);
});

test('escalas: una letra por grado, la fórmula T T S T T T S y alteraciones simples', () => {
  for (const { key, opts } of ALL_SPELLED) {
    const scale = keyScale(key, opts);
    assert.equal(scale.length, 7);
    assert.equal(scale[0].pc, key);
    // Las 7 letras, cada una una vez, en orden a partir de la de la fundamental.
    const start = LETTERS.indexOf(scale[0].spelling.letter);
    scale.forEach((n, i) => assert.equal(n.spelling.letter, LETTERS[(start + i) % 7], `${key}: grado ${i + 1}`));
    // Cada paso es un tono (2) o un semitono (1), según la fórmula.
    scale.forEach((n, i) => {
      const next = scale[(i + 1) % 7].pc;
      assert.equal(mod12(next - n.pc), MAJOR_STEPS[i] === 'T' ? 2 : 1, `${key}: paso ${i + 1}`);
      assert.equal(spellingPc(n.spelling), n.pc);
      assert.ok(Math.abs(n.spelling.accidental) <= 1, `${key}: ${name(n.spelling)}`);
    });
    // Una tonalidad usa solo sostenidos o solo bemoles, nunca los dos.
    const accs = new Set(scale.map((n) => n.spelling.accidental).filter(Boolean));
    assert.ok(accs.size <= 1, `${key}: mezcla sostenidos y bemoles`);
  }
});

test('número de alteraciones de cada tonalidad (círculo de quintas)', () => {
  const count = (key, opts) => keyScale(key, opts).filter((n) => n.spelling.accidental !== 0);
  // Con sostenidos: Sol 1, Re 2, La 3, Mi 4, Si 5, Fa♯ 6. Con bemoles: Fa 1, Si♭ 2, Mi♭ 3, La♭ 4, Re♭ 5, Sol♭ 6.
  [[0, 0], [7, 1], [2, 2], [9, 3], [4, 4], [11, 5]].forEach(([k, n]) => {
    assert.equal(count(k).length, n, `${k}`);
    assert.ok(count(k).every((x) => x.spelling.accidental === 1));
  });
  assert.equal(count(6, { accidentals: 'sharp' }).length, 6);
  [[5, 1], [10, 2], [3, 3], [8, 4], [1, 5]].forEach(([k, n]) => {
    assert.equal(count(k).length, n, `${k}`);
    assert.ok(count(k).every((x) => x.spelling.accidental === -1));
  });
  assert.equal(count(6, { accidentals: 'flat' }).length, 6);
  // Los sostenidos se añaden en el orden Fa Do Sol Re La Mi Si, y los bemoles al revés.
  assert.deepEqual(count(11).map((x) => x.spelling.letter).sort(), ['A', 'C', 'D', 'F', 'G']);
  assert.deepEqual(count(8).map((x) => x.spelling.letter).sort(), ['A', 'B', 'D', 'E']);
});

test('deletreo: Fa mayor con Si♭ (nunca La♯), Re mayor con Fa♯ y Do♯, Fa♯ con Mi♯ y Sol♭ con Do♭', () => {
  assert.equal(names(keyScale(5)), 'F G A Bb C D E');
  assert.equal(names(keyScale(5, { accidentals: 'sharp' })), 'F G A Bb C D E');
  assert.equal(names(keyScale(2, { accidentals: 'flat' })), 'D E F# G A B C#');
  assert.equal(names(keyScale(0)), 'C D E F G A B');
  assert.equal(names(keyScale(7)), 'G A B C D E F#');
  assert.equal(names(keyScale(6, { accidentals: 'sharp' })), 'F# G# A# B C# D# E#');
  assert.equal(names(keyScale(6, { accidentals: 'flat' })), 'Gb Ab Bb Cb Db Eb F');
  // Re♭ y Si: nunca Do♯ ni Do♭ mayor.
  assert.equal(name(keyScale(1, { accidentals: 'sharp' })[0].spelling), 'Db');
  assert.equal(name(keyScale(11, { accidentals: 'flat' })[0].spelling), 'B');
});

test('acordes de la tonalidad: Do = C Dm Em F G Am B°; Sol = G Am Bm C D Em F#°', () => {
  assert.deepEqual(keyChords(0).map(chordName), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  assert.deepEqual(keyChords(7).map(chordName), ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim']);
  assert.deepEqual(keyChords(5).map(chordName), ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim']);
  assert.deepEqual(keyChords(2).map(chordName), ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim']);
  assert.deepEqual(ROMANS, ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
});

test('acordes de la tonalidad: se apilan terceras de la escala, y su calidad sale de ahí', () => {
  for (const { key, opts } of ALL_SPELLED) {
    const scale = keyScale(key, opts);
    for (const [i, chord] of keyChords(key, opts).entries()) {
      // Grados i, i+2 e i+4 de la escala: fundamental, 3ª y 5ª.
      const stacked = [0, 2, 4].map((n) => scale[(i + n) % 7]);
      assert.deepEqual(chord.tones, stacked.map((n) => n.spelling), `${key} ${chord.roman}`);
      const third = mod12(stacked[1].pc - stacked[0].pc);
      const fifth = mod12(stacked[2].pc - stacked[0].pc);
      const quality = third === 4 && fifth === 7 ? 'major' : third === 3 && fifth === 7 ? 'minor' : third === 3 && fifth === 6 ? 'diminished' : null;
      assert.equal(chord.quality, quality, `${key} ${chord.roman}`);
      assert.deepEqual(chord.tones.map(spellingPc), CHORD_FORMULAS[quality].map((s) => mod12(chord.root + s)));
      // Números romanos: mayúscula si es mayor, minúscula si es menor y con ° si es disminuido.
      const upper = chord.roman.replace('°', '') === chord.roman.replace('°', '').toUpperCase();
      assert.equal(upper, quality === 'major', chord.roman);
      assert.equal(chord.roman.endsWith('°'), quality === 'diminished');
      assert.equal(chord.degree, i + 1);
      assert.ok(chord.tones.every((t) => Math.abs(t.accidental) <= 1));
    }
  }
  assert.equal(chordName(keyChord(5, 'IV')), 'Bb');
  assert.equal(chordName(keyChord(2, 'ii')), 'Em');
  assert.throws(() => keyChord(0, 'VIII'));
});

test('Construye la escala: la letra que toca con ♭, sin alteración y con ♯, y la nota con otra letra', () => {
  for (const { key, opts } of ALL_SPELLED) {
    for (const n of keyScale(key, opts).slice(1)) {
      const options = nextDegreeOptions(n.spelling);
      assert.equal(options.length, 4, `${key}: ${name(n.spelling)}`);
      assert.equal(options.filter((o) => o.correct).length, 1);
      assert.equal(new Set(options.map((o) => name(o.spelling))).size, 4);
      const sameLetter = options.filter((o) => !o.wrongLetter);
      assert.deepEqual(sameLetter.map((o) => o.spelling.accidental), [-1, 0, 1]);
      assert.ok(sameLetter.every((o) => o.spelling.letter === n.spelling.letter));
      const other = options.find((o) => o.wrongLetter);
      // Si la nota se puede escribir con otra letra (con una alteración), la trampa suena igual;
      // si no (Re, Sol y La), es la letra anterior con ♯.
      const canRespell = [1, -1].some((step) => {
        const letter = LETTERS[(LETTERS.indexOf(n.spelling.letter) + step + 7) % 7];
        const acc = mod12(n.pc - LETTER_PC[letter]);
        return acc === 0 || acc === 1 || acc === 11;
      });
      if (canRespell) assert.equal(other.pc, n.pc, 'suena igual');
      else assert.deepEqual(other.spelling, { letter: LETTERS[(LETTERS.indexOf(n.spelling.letter) + 6) % 7], accidental: 1 });
      assert.notEqual(other.spelling.letter, n.spelling.letter);
      assert.ok(Math.abs(other.spelling.accidental) <= 1);
      options.forEach((o) => assert.equal(o.pc, spellingPc(o.spelling)));
    }
  }
  // Fa mayor, 4º grado: Si♭ es la correcta y La♯ la trampa.
  const fourth = nextDegreeOptions(keyScale(5)[3].spelling);
  assert.equal(name(fourth.find((o) => o.correct).spelling), 'Bb');
  assert.equal(name(fourth.find((o) => o.wrongLetter).spelling), 'A#');
});

/* ----- Intervalos ----- */

const SIMPLE_SPELLINGS = LETTERS.flatMap((letter) => [-1, 0, 1].map((accidental) => ({ letter, accidental })));
/** Número del intervalo (2ª, 3ª…) de cada distancia de la tabla 4.3 (el tritono, 4 o 5). */
const NUMBER = { 1: [2], 2: [2], 3: [3], 4: [3], 5: [4], 6: [4, 5], 7: [5], 8: [6], 9: [6], 10: [7], 11: [7], 12: [8] };

test('intervalos: la segunda nota está a esos semitonos y a las letras que dice su número', () => {
  for (const from of SIMPLE_SPELLINGS) {
    for (let s = 1; s <= 12; s++) {
      const list = intervalSpellings(from, s);
      assert.deepEqual(list.map((x) => {
        const letters = mod12(0) + ((LETTERS.indexOf(x.spelling.letter) - LETTERS.indexOf(from.letter) + 7) % 7);
        return s === 12 ? 8 : letters + 1;
      }), NUMBER[s], `${name(from)} +${s}`);
      for (const x of list) assert.equal(mod12(spellingPc(x.spelling) - spellingPc(from)), s % 12);
    }
  }
  assert.deepEqual(intervalSpellings({ letter: 'C', accidental: 0 }, 6).map((x) => [x.name, name(x.spelling)]),
    [['4ª aumentada', 'F#'], ['5ª disminuida', 'Gb']]);
  assert.deepEqual(Object.values(TRITONE_NAMES), ['4ª aumentada', '5ª disminuida']);
  assert.equal(intervalSpellings({ letter: 'C', accidental: 0 }, 3)[0].name, intervalInfo(3).name);
  assert.equal(name(intervalSpellings({ letter: 'C', accidental: 0 }, 3)[0].spelling), 'Eb');
  assert.equal(name(spellAbove({ letter: 'D', accidental: 0 }, 4, 2)), 'F#');
});

test('intervalos: el ejemplo del «¿Por qué?» siempre tiene alteraciones simples', () => {
  for (const accidentals of ['sharp', 'flat']) {
    for (let pc = 0; pc < 12; pc++) {
      for (let s = 1; s <= 12; s++) {
        const ex = intervalExample(pc, s, { accidentals });
        assert.equal(spellingPc(ex.from), pc);
        assert.ok(ex.to.length >= 1, `${pc} +${s}`);
        assert.ok([ex.from, ...ex.to.map((x) => x.spelling)].every((sp) => Math.abs(sp.accidental) <= 1));
        if (s !== 6) assert.equal(ex.to.length, 1);
      }
    }
  }
  // Desde Do, el tritono se escribe de las dos formas.
  assert.equal(intervalExample(0, 6).to.length, 2);
});

/* ----- Posición de la escala ----- */

test('posición de la escala: dos octavas desde la 6ª cuerda, en 4 trastes, en las 12 tonalidades', () => {
  for (const { key, opts } of ALL_SPELLED) {
    const pos = majorScalePosition(key, opts);
    const scale = keyScale(key, opts);
    assert.ok(pos.rootFret >= 2 && pos.rootFret <= 13, `${key}: traste ${pos.rootFret}`);
    assert.equal(mod12(STANDARD_TUNING[6] + pos.rootFret), key);
    assert.equal(pos.toFret - pos.fromFret, 3, '4 trastes');
    assert.ok(pos.fromFret >= 0 && pos.toFret <= 15);
    assert.equal(pos.notes.length, 15, 'dos octavas: 15 notas');
    const first = pos.notes[0];
    const last = pos.notes.at(-1);
    assert.deepEqual([first.string, first.fret], [6, pos.rootFret]);
    assert.equal(last.string, 1);
    assert.equal(last.midi - first.midi, 24);
    pos.notes.forEach((n, i) => {
      assert.equal(n.midi, midiAt(n.string, n.fret));
      assert.ok(n.fret >= pos.fromFret && n.fret <= pos.toFret);
      assert.equal(n.finger, n.fret - pos.fromFret + 1);
      assert.ok(n.finger >= 1 && n.finger <= 4);
      // Grados seguidos (1, 2, 3… 7, 1, 2…), con la fórmula T T S T T T S y su deletreo.
      assert.equal(n.degree, (i % 7) + 1);
      assert.deepEqual(n.spelling, scale[n.degree - 1].spelling);
      assert.equal(n.pc, scale[n.degree - 1].pc);
      if (i) assert.equal(n.midi - pos.notes[i - 1].midi, MAJOR_STEPS[(i - 1) % 7] === 'T' ? 2 : 1);
      if (i) assert.ok(n.string <= pos.notes[i - 1].string, 'de la 6ª a la 1ª, sin volver atrás');
    });
    // 3 notas por cuerda salvo en la 2ª (2) y la 1ª (de la fundamental a ella misma, 2).
    const perString = [6, 5, 4, 3, 2, 1].map((s) => pos.notes.filter((n) => n.string === s).length);
    assert.equal(perString.reduce((a, b) => a + b), 15);
    assert.ok(perString.every((n) => n >= 2 && n <= 3), perString.join(' '));
  }
  // Sol mayor: fundamental en el traste 3, trastes 2 a 5.
  assert.deepEqual([majorScalePosition(7).fromFret, majorScalePosition(7).toFret], [2, 5]);
  assert.equal(scalePositionRootFret(4), 12, 'Mi, en el 12 (no al aire)');
  assert.equal(scalePositionRootFret(5), 13, 'Fa, en el 13 (no en el 1)');
  assert.equal(scalePositionRootFret(0), 8);
});

test('una vuelta de la escala: sube 15 notas y baja hasta la fundamental (29)', () => {
  for (const key of ALL_KEYS) {
    const lap = scaleLap(key);
    assert.equal(lap.length, 29);
    assert.deepEqual(lap.slice(14).map((n) => n.midi), lap.slice(0, 15).map((n) => n.midi).reverse());
    assert.equal(lap[0].pc, key);
    assert.equal(lap.at(-1).midi, lap[0].midi);
  }
});

test('marcado de acordes y tonalidades', () => {
  const chord = keyChord(2, 'iii');
  assert.equal(chordToken(chord), '{{ch:F#:minor}}');
  assert.equal(chordToken(keyChord(0, 'vii°')), '{{ch:B:diminished}}');
  assert.equal(chordToken(keyChord(5, 'IV')), '{{ch:Bb:major}}');
  assert.equal(keyToken(19), '{{key:7}}');
  const [part] = parseRichText(chordToken(chord));
  assert.deepEqual(part, { type: 'keyChord', spelling: { letter: 'F', accidental: 1 }, quality: 'minor' });
  assert.deepEqual(parseRichText('{{deg:7:vi}}')[0], { type: 'degree', key: 7, roman: 'vi' });
  assert.throws(() => parseRichText('{{deg:7:VIII}}'));
  assert.throws(() => parseRichText('{{ch:H:minor}}'));
  assert.throws(() => parseRichText('{{key:12}}'));
});

test('fórmulas de partida (4.4) que usa la tonalidad', () => {
  assert.deepEqual(SCALE_FORMULAS.major, [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual(CHORD_FORMULAS.diminished, [0, 3, 6]);
  assert.equal(LETTER_PC.B - LETTER_PC.A, 2);
});
