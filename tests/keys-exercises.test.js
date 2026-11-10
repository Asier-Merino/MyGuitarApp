// Ejercicios de Escala y tonalidad (Fase 5) y lo que dicen sus fichas y su lección, comprobado
// contra la teoría: tonalidades de cada nivel, respuestas, opciones, el «¿Por qué?» y los esquemas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/core/random.js';
import { parseRichText, plainText } from '../js/core/glossary.js';
import { mod12, interval, CHORD_FORMULAS } from '../js/core/theory.js';
import { spellingPc, LETTER_PC } from '../js/core/notation.js';
import { midiAt, STANDARD_TUNING } from '../js/core/fretboard-model.js';
import {
  KEY_LEVELS, keyScale, keyChords, keyChord, majorScalePosition, scaleLap, chordToken, ROMANS,
} from '../js/core/keys.js';
import { keyProgression, allOpen } from '../js/core/progressions.js';
import { fretboardDiagramPoints, keyDiagram } from '../js/core/diagrams.js';
import { getConcept, EXERCISE_TEXTS, LESSONS } from '../js/data/concepts.js';
import { LEVEL_IDS } from '../js/data/modules.js';
import { KEY_PROGRESSIONS } from '../js/data/progressions.js';
import {
  buildScale, whichDegree, keyChordsQuiz, whichIntervalOnNeck, completeProgression, INTERVAL_LEVELS, intervalPairs, pairWindow,
} from '../js/modules/theory/theory-exercises.js';
import { chordValue, chordFromValue } from '../js/modules/theory/common.js';
import {
  scaleWithMetronome, keyProgressionPractice, progressionKeys, SCALE_LEVELS, KEY_CHANGES_LEVELS,
} from '../js/modules/theory/practice-exercises.js';
import { getExercise } from '../js/engine/exercise-registry.js';

const ROUNDS = 150;
const valid = (text) => { parseRichText(text); assert.ok(!/%\w+%/.test(text), text); };
const gen = (ex, level, seed, extra = {}) => ex.generate(ex.levels[level], createRng(seed), { stats: {}, accidentals: extra.accidentals ?? 'sharp', round: {}, ...extra });

test('los 7 ejercicios están registrados, en afinación estándar, con sus conceptos', () => {
  for (const id of ['construye-escala', 'que-grado', 'que-acordes', 'que-intervalo', 'completa-progresion']) {
    const ex = getExercise(`tonalidad.teoria.${id}`);
    assert.ok(ex, id);
    assert.equal(ex.tunings, 'standard');
  }
  for (const id of ['escala', 'progresion']) assert.equal(getExercise(`tonalidad.practica.${id}`).tunings, 'standard');
});

test('las tonalidades que dice cada «Cómo se juega» son las de cada nivel', () => {
  for (const [id, texts] of Object.entries(EXERCISE_TEXTS).filter(([k]) => k.startsWith('tonalidad.'))) {
    const sentences = texts.howTo.split(/(?<=\.)\s+/);
    const keysIn = (prefix) => parseRichText(sentences.find((s) => s.startsWith(prefix)) ?? '').filter((p) => p.type === 'key').map((p) => p.key);
    if (id.endsWith('que-intervalo')) continue; // sin tonalidades
    assert.deepEqual(keysIn('Básico'), [...KEY_LEVELS.basico], id);
    assert.deepEqual([...KEY_LEVELS.basico, ...keysIn('Intermedio')], [...KEY_LEVELS.intermedio], id);
    assert.ok(sentences.find((s) => s.startsWith('Avanzado')).includes('las 12 tonalidades'), id);
  }
});

test('Construye la escala: tonalidad del nivel, 4 opciones por grado y el «¿Por qué?» de cada fallo', () => {
  for (const level of LEVEL_IDS) {
    for (let seed = 0; seed < ROUNDS; seed++) {
      const accidentals = seed % 2 ? 'flat' : 'sharp';
      const item = gen(buildScale, level, seed, { accidentals });
      assert.ok(KEY_LEVELS[level].includes(item.tonic));
      assert.equal(item.showSteps, level !== 'avanzado');
      assert.deepEqual(item.scale, keyScale(item.tonic, { accidentals }));
      item.options.forEach((opts, i) => {
        assert.equal(opts.length, 4);
        assert.deepEqual(opts.find((o) => o.correct).spelling, item.scale[i + 1].spelling);
      });
      // Todo bien: correcta.
      assert.equal(buildScale.check(item, item.answer).correct, true);
      // Cada opción equivocada de cada grado: el «¿Por qué?» se escribe y nombra la correcta.
      item.options.forEach((opts, i) => {
        for (const o of opts.filter((x) => !x.correct)) {
          const picks = [...item.scale.slice(0, i + 1).map((n) => n.spelling), o.spelling];
          const r = buildScale.check(item, { picks, failedAt: i + 1 });
          assert.equal(r.correct, false);
          [r.feedback, r.why, r.label].forEach(valid);
          const answer = item.scale[i + 1];
          assert.ok(parseRichText(r.feedback).some((p) => p.type === 'note' && p.spelling.letter === answer.spelling.letter && p.spelling.accidental === answer.spelling.accidental));
          if (o.wrongLetter) assert.match(plainText(r.why), /letra siguiente/);
          else assert.match(plainText(r.why), /T\sT\sS\sT\sT\sT\sS/);
        }
      });
      const t = buildScale.check(item, null);
      [t.feedback, t.why].forEach(valid);
    }
  }
});

test('Construye la escala: el paso que explica el «¿Por qué?» es el de la fórmula', () => {
  // Fa mayor, 4º grado: de La a Si♭ hay un semitono; Si (natural) estaría a un tono.
  const item = gen(buildScale, 'intermedio', 1);
  const fa = { ...item, tonic: 5, scale: keyScale(5) };
  const picks = [...fa.scale.slice(0, 3).map((n) => n.spelling), { letter: 'B', accidental: 0 }];
  const r = buildScale.check(fa, { picks, failedAt: 3 });
  assert.match(plainText(r.why), /un semitono: de \w+ a \w+ hay 1 semitono\. De \w+ a \w+ hay 2 semitonos/);
  const sharp = buildScale.check(fa, { picks: [...picks.slice(0, 3), { letter: 'A', accidental: 1 }], failedAt: 3 });
  assert.match(plainText(sharp.why), /suena igual/);
});

test('¿Qué grado es?: el acorde es el de ese grado y las opciones incluyen la respuesta', () => {
  for (const level of LEVEL_IDS) {
    for (let seed = 0; seed < ROUNDS; seed++) {
      const item = gen(whichDegree, level, seed);
      assert.ok(KEY_LEVELS[level].includes(item.tonic));
      assert.deepEqual(item.chord, keyChord(item.tonic, item.answer));
      assert.equal(item.options.length, level === 'basico' ? 4 : 7);
      assert.ok(item.options.includes(item.answer));
      assert.deepEqual(item.options, ROMANS.filter((r) => item.options.includes(r)), 'en orden');
      // La fundamental del acorde está a esa distancia de la tónica, según la escala.
      assert.equal(mod12(item.chord.root - item.tonic), [0, 2, 4, 5, 7, 9, 11][item.chord.degree - 1]);
      assert.equal(whichDegree.check(item, item.answer).correct, true);
      for (const o of item.options.filter((x) => x !== item.answer)) {
        const r = whichDegree.check(item, o);
        [r.feedback, r.why].forEach(valid);
      }
    }
  }
});

test('¿Qué acordes tiene la tonalidad?: 7 correctos y trampas con la misma fundamental y otra calidad', () => {
  for (const level of LEVEL_IDS) {
    for (let seed = 0; seed < ROUNDS; seed++) {
      const item = gen(keyChordsQuiz, level, seed);
      const chords = keyChords(item.tonic);
      assert.equal(item.options.length, level === 'avanzado' ? 12 : 10);
      assert.deepEqual([...item.answer].sort(), chords.map(chordValue).sort());
      const traps = item.options.filter((c) => !item.answer.includes(chordValue(c)));
      for (const t of traps) {
        const real = chords.find((c) => c.root === t.root);
        assert.ok(real, 'misma fundamental que uno de la tonalidad');
        assert.notEqual(t.quality, real.quality);
        // La trampa suena distinta: sus notas no son las del acorde de la tonalidad.
        assert.notDeepEqual(CHORD_FORMULAS[t.quality].map((s) => mod12(t.root + s)), CHORD_FORMULAS[real.quality].map((s) => mod12(real.root + s)));
      }
      assert.equal(new Set(item.options.map(chordValue)).size, item.options.length, 'sin repetir');
      assert.equal(keyChordsQuiz.check(item, [...item.answer].reverse()).correct, true);
      const r = keyChordsQuiz.check(item, [...item.answer.slice(1), chordValue(traps[0])]);
      assert.equal(r.correct, false);
      [r.feedback, r.why].forEach(valid);
      assert.match(plainText(r.why), /no es de la tonalidad/);
      assert.match(plainText(r.why), /Te faltó|Te faltaron/);
    }
  }
});

test('¿Qué intervalo hay?: los dos puntos están a esos semitonos, en las cuerdas que dice el nivel', () => {
  for (const level of LEVEL_IDS) {
    const params = INTERVAL_LEVELS[level];
    let crossed = 0;
    for (let seed = 0; seed < ROUNDS; seed++) {
      const item = gen(whichIntervalOnNeck, level, seed);
      assert.ok(params.intervals.includes(item.answer));
      assert.equal(item.midi1, midiAt(item.s1, item.f1));
      assert.equal(item.midi2, midiAt(item.s2, item.f2));
      assert.equal(item.midi2 - item.midi1, item.semitones, 'el 2 es más agudo');
      assert.ok([item.f1, item.f2].every((f) => f >= 0 && f <= 12));
      if (params.strings === 'same') assert.equal(item.s1, item.s2);
      if (params.strings === 'near') assert.ok(Math.abs(item.s1 - item.s2) <= 1);
      if (item.s1 !== item.s2) crossed += 1;
      // El trozo de mástil enseña los dos puntos, con al menos 5 trastes, dentro del 0–12.
      const win = pairWindow(item);
      assert.ok(win.fromFret >= 0 && win.toFret <= 12 && win.toFret - win.fromFret >= 5);
      assert.ok([item.f1, item.f2].every((f) => f >= win.fromFret && f <= win.toFret));
      assert.equal(whichIntervalOnNeck.check(item, item.answer).correct, true);
      for (const o of item.options.filter((x) => x !== item.answer)) {
        const r = whichIntervalOnNeck.check(item, o);
        [r.feedback, r.why, r.label].forEach(valid);
        // El ejemplo escrito: la nota de llegada está a esos semitonos de la de partida.
        const notes = parseRichText(r.why).filter((p) => p.type === 'note');
        assert.equal(mod12(spellingPc(notes[1].spelling) - spellingPc(notes[0].spelling)), item.semitones % 12);
        assert.equal(spellingPc(notes[0].spelling), mod12(item.midi1));
      }
    }
    if (level !== 'basico') assert.ok(crossed > 0, `${level}: también entre cuerdas`);
  }
  // Niveles de la Fase 5.
  assert.deepEqual(INTERVAL_LEVELS.basico.intervals, [1, 2, 3, 4, 7, 12]);
  assert.deepEqual(INTERVAL_LEVELS.intermedio.intervals, [1, 2, 3, 4, 5, 7, 8, 9, 12]);
  assert.equal(INTERVAL_LEVELS.avanzado.intervals.length, 12);
  // Las parejas cubren cada intervalo en el rango 0–12.
  for (let s = 1; s <= 12; s++) assert.ok(intervalPairs(s, 'same').length > 0);
});

test('¿Qué intervalo hay?: el tritono se explica con sus dos nombres', () => {
  const item = { s1: 5, f1: 3, s2: 5, f2: 9, midi1: 48, midi2: 54, semitones: 6, answer: 6, accidentals: 'sharp', options: [5, 6, 7] };
  const r = whichIntervalOnNeck.check(item, 7);
  const why = plainText(r.why);
  assert.match(why, /4ª aumentada/);
  assert.match(why, /5ª disminuida/);
  const notes = parseRichText(r.why).filter((p) => p.type === 'note').map((p) => `${p.spelling.letter}${p.spelling.accidental}`);
  assert.deepEqual(notes, ['C0', 'F1', 'G-1']);
});

test('Completa la progresión: el acorde que falta es el de su grado, y las opciones tienen trampas', () => {
  for (const level of LEVEL_IDS) {
    for (let seed = 0; seed < ROUNDS; seed++) {
      const item = gen(completeProgression, level, seed);
      assert.ok(KEY_LEVELS[level].includes(item.tonic));
      assert.ok(KEY_PROGRESSIONS.some((p) => p.degrees === item.degrees));
      assert.deepEqual(item.chords, keyProgression(item.tonic, item.degrees));
      const target = item.chords[item.missing];
      assert.equal(item.answer, chordValue(keyChord(item.tonic, item.degrees[item.missing])));
      assert.equal(item.roman, target.roman);
      assert.equal(item.options.length, 4);
      assert.equal(new Set(item.options.map((o) => o.value)).size, 4);
      assert.ok(item.options.some((o) => o.value === item.answer));
      assert.equal(completeProgression.check(item, item.answer).correct, true);
      for (const o of item.options.filter((x) => x.value !== item.answer)) {
        const r = completeProgression.check(item, o.value);
        [r.feedback, r.why].forEach(valid);
        const c = chordFromValue(o.value);
        assert.equal(c.root, o.chord.root);
      }
    }
  }
});

/* ----- Práctica ----- */

test('Escala con metrónomo: la tablatura es la vuelta de la escala, y el tempo, el del nivel', () => {
  for (const level of LEVEL_IDS) {
    for (const key of KEY_LEVELS[level]) {
      const plan = scaleWithMetronome.generate(SCALE_LEVELS[level], createRng(1), { options: { key: String(key) }, level });
      assert.equal(plan.key, key);
      const lap = scaleLap(key);
      assert.deepEqual(plan.tab.events.map((e) => e.notes[0].string * 100 + e.notes[0].fret), lap.map((n) => n.string * 100 + n.fret));
      assert.equal(plan.preview.tab.events.length, 15);
      assert.equal(plan.startBpm, SCALE_LEVELS[level].tempo.min);
      assert.equal(plan.rampEveryLaps, null);
    }
  }
  assert.deepEqual(Object.values(SCALE_LEVELS).map((p) => [p.notesPerBeat, p.tempo.min, p.tempo.max]), [[1, 50, 80], [2, 60, 100], [2, 80, 120]]);
  // «Al azar» elige una de las del nivel.
  for (let seed = 0; seed < 30; seed++) {
    const plan = scaleWithMetronome.generate(SCALE_LEVELS.basico, createRng(seed), { options: { key: 'random' }, level: 'basico' });
    assert.ok(KEY_LEVELS.basico.includes(plan.key));
  }
});

test('Progresión de la tonalidad: en Básico solo se tocan enteras con acordes abiertos', () => {
  for (const prog of KEY_PROGRESSIONS) {
    const keys = progressionKeys('basico', prog.id);
    assert.ok(keys.length > 0, prog.id);
    for (const key of keys) assert.ok(allOpen(keyProgression(key, prog.degrees)));
    assert.deepEqual(progressionKeys('avanzado', prog.id), [...KEY_LEVELS.avanzado]);
    for (let seed = 0; seed < 20; seed++) {
      const plan = keyProgressionPractice.generate(KEY_CHANGES_LEVELS.basico, createRng(seed), { options: { progression: prog.id, key: 'random' }, level: 'basico' });
      assert.ok(keys.includes(plan.key));
      assert.ok(plan.chords.every((c) => c.open));
    }
  }
  assert.deepEqual(progressionKeys('basico', 'I-V-vi-IV'), [0, 7]);
  assert.deepEqual(Object.values(KEY_CHANGES_LEVELS).map((p) => [p.bpm, p.beatsPerChange]), [[60, 8], [80, 4], [100, 2]]);
});

/* ----- Lo que dicen las fichas y la lección ----- */

const pts = (concept) => fretboardDiagramPoints(concept).points;

test('fichas de intervalos: cada esquema tiene las distancias que dice su texto', () => {
  // 2ª: 1 y 2 trastes desde el punto ámbar.
  assert.deepEqual(pts(getConcept('second-interval')).map((p) => p.midi - 48), [0, 1, 2]);
  // 4ª justa: 5 trastes, y suena igual que la 5ª cuerda al aire.
  const fourth = pts(getConcept('perfect-fourth'));
  assert.equal(fourth[1].midi - fourth[0].midi, 5);
  assert.equal(fourth[1].midi, midiAt(5, 0));
  // «casi todas las cuerdas al aire están a una 4ª justa de la de al lado» (todas menos 3ª–2ª).
  const pairs = [6, 5, 4, 3, 2].map((s) => STANDARD_TUNING[s - 1] - STANDARD_TUNING[s]);
  assert.deepEqual(pairs, [5, 5, 5, 4, 5]);
  // 6ª: 8 y 9 en la misma cuerda, y la 6ª mayor dos cuerdas más aguda, un traste más atrás.
  const sixth = pts(getConcept('sixth-interval'));
  assert.deepEqual(sixth.map((p) => p.midi - sixth[0].midi), [0, 8, 9, 9]);
  assert.deepEqual([sixth[3].string, sixth[3].fret], [4, sixth[0].fret - 1]);
  assert.deepEqual(sixth.map((p) => p.text), ['R', 'b6', '6', '6']);
  // «si se cruza la 2ª cuerda, la 6ª mayor queda en el mismo traste» (desde la 4ª y la 3ª).
  for (const s of [4, 3]) for (let f = 0; f <= 5; f++) assert.equal(midiAt(s - 2, f) - midiAt(s, f), 9);
  for (const s of [6, 5]) for (let f = 1; f <= 5; f++) assert.equal(midiAt(s - 2, f - 1) - midiAt(s, f), 9);
  // 7ª: 10, 11 y la octava a 12.
  const seventh = pts(getConcept('seventh-interval'));
  assert.deepEqual(seventh.map((p) => p.fret), [0, 10, 11, 12]);
  assert.deepEqual(seventh.map((p) => p.text), ['R', 'b7', '7', '8']);
  assert.ok(CHORD_FORMULAS.dom7.includes(10));
  // Formas entre cuerdas: 3ª mayor un traste atrás, 5ª dos más allá, octava en la 4ª dos más allá.
  const shapes = pts(getConcept('interval-shapes'));
  assert.deepEqual(shapes.map((p) => [p.string, p.fret, p.midi - shapes[0].midi]), [[6, 3, 0], [5, 2, 4], [5, 5, 7], [4, 5, 12]]);
  // «Al cruzar de la 3ª a la 2ª, todo se corre un traste»: la 3ª mayor desde la 3ª cuerda está en la 2ª, mismo traste.
  assert.equal(midiAt(2, 5) - midiAt(3, 5), 4);
  assert.equal(midiAt(5, 4) - midiAt(6, 5), 4);
});

test('fichas de escalas y tonalidad: lo que dicen coincide con la teoría', () => {
  const scale = pts(getConcept('scale'));
  assert.deepEqual(scale.map((p) => p.midi), getConcept('scale').sound.midi);
  assert.deepEqual(scale.filter((p) => p.color === 'root').map((p) => p.fret), [0, 12]);
  const major = pts(getConcept('major-scale'));
  assert.deepEqual(major.map((p) => p.midi), getConcept('major-scale').sound.midi);
  assert.deepEqual(major.map((p, i) => (i ? p.fret - major[i - 1].fret : null)).slice(1), [2, 2, 1, 2, 2, 2, 1]);
  assert.deepEqual(keyScale(0).map((n) => n.spelling.accidental), [0, 0, 0, 0, 0, 0, 0], 'desde Do, las 7 naturales');
  // Una letra por grado: Fa mayor con Si♭ (4º grado); Re mayor con Fa♯ y Do♯.
  assert.deepEqual(keyScale(5)[3].spelling, { letter: 'B', accidental: -1 });
  assert.deepEqual(keyScale(2).filter((n) => n.spelling.accidental).map((n) => n.spelling), [{ letter: 'F', accidental: 1 }, { letter: 'C', accidental: 1 }]);
  const fa = pts(getConcept('key-spelling'));
  assert.ok(fa.some((p) => p.spelling.letter === 'B' && p.spelling.accidental === -1));
  assert.ok(!fa.some((p) => p.spelling.letter === 'A' && p.spelling.accidental === 1));
  // Disminuido: R, b3 y b5 son las notas del vii° de Do (Si, Re, Fa).
  const dim = pts(getConcept('diminished-chord'));
  assert.deepEqual(dim.map((p) => p.pc), keyChord(0, 'vii°').tones.map(spellingPc));
  assert.deepEqual(dim.map((p) => p.text), ['R', 'b3', 'b5']);
  assert.deepEqual(dim.map((p) => p.midi), getConcept('diminished-chord').sound.midi);
  assert.deepEqual(keyChord(0, 'vii°').tones.map((t) => t.letter), ['B', 'D', 'F']);
  assert.deepEqual([interval(LETTER_PC.B, LETTER_PC.D), interval(LETTER_PC.B, LETTER_PC.F)], [3, 6]);
  // Posición: en Sol mayor, la fundamental en el traste 3 y la posición del 2 al 5.
  const pos = majorScalePosition(7);
  assert.equal(pos.rootFret, 3);
  assert.deepEqual([pos.fromFret, pos.toFret], [2, 5]);
  assert.equal(pts(getConcept('scale-position')).length, 15);
  // Acordes de la tonalidad: el patrón de calidades.
  assert.deepEqual(keyChords(0).map((c) => c.quality), ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']);
  assert.equal(keyDiagram(getConcept('diatonic-chords').diagram).progressions[0].chords.map((c) => c.open.id).join(' '), 'C G Am F-mini');
});

test('lección de Escala y tonalidad: lo que dice cada tarjeta coincide con su esquema', () => {
  const card = (id) => LESSONS.tonalidad.cards.find((c) => c.id === id);
  const cpts = (id) => fretboardDiagramPoints(card(id)).points;
  assert.equal(LESSONS.tonalidad.cards.length, 6);
  // Un semitono = un traste; un tono = dos.
  assert.deepEqual(cpts('tonos-semitonos').map((p) => p.fret), [3, 4, 5]);
  // 3, 4, 7 y 12 semitonos: b3, 3, 5 y 8.
  assert.deepEqual(cpts('intervalos-cuerda').map((p) => [p.fret, p.text]), [[0, 'R'], [3, 'b3'], [4, '3'], [7, '5'], [12, '8']]);
  assert.deepEqual(cpts('intervalos-cuerdas'), pts(getConcept('interval-shapes')));
  // La escala de La mayor en la 5ª cuerda: 2 2 1 2 2 2 1 trastes, del aire al 12.
  const a = cpts('escala-cuerda');
  assert.deepEqual(a.map((p) => p.fret), [0, 2, 4, 5, 7, 9, 11, 12]);
  assert.deepEqual(a.map((p) => p.spelling.letter).join(''), 'ABCDEFGA');
  // Posición en Sol mayor, del traste 2 al 5.
  const g = cpts('escala-posicion');
  assert.deepEqual([Math.min(...g.map((p) => p.fret)), Math.max(...g.map((p) => p.fret))], [2, 5]);
  // Las progresiones de la tarjeta se tocan con acordes abiertos en Do.
  const key = keyDiagram(card('acordes-tonalidad').diagram);
  assert.equal(key.chords.length, 7);
  assert.ok(key.progressions.every((p) => allOpen(p.chords)));
  assert.deepEqual(key.progressions.map((p) => p.degrees.join('-')), ['I-V-vi-IV', 'I-IV-V', 'ii-V-I']);
});

test('el marcado {{deg:…}} de las fichas escribe los acordes de Do mayor', () => {
  const degs = parseRichText(getConcept('diatonic-chords').summary).filter((p) => p.type === 'degree');
  assert.deepEqual(degs.map((d) => d.roman), ROMANS);
  assert.ok(degs.every((d) => d.key === 0));
  assert.equal(chordToken(keyChord(0, 'vii°')), '{{ch:B:diminished}}');
});
