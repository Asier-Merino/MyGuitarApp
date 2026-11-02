// Registro de ejercicios (BUILD_PLAN 7.1) y ejercicios de Notas del mástil (Fase 2),
// comprobados con la teoría (por MIDI) en todas las afinaciones que admiten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXERCISES, validateExercise, findExercise, isPlayable, exercisePath, exerciseById, exerciseModuleTitle, getExercise,
} from '../js/engine/exercise-registry.js';
import {
  whichNote, findIt, allOnString, octaves, unisonsTheory, fillBoard, timeTrial, UNISON_LEVELS, OCTAVE_BOARD,
} from '../js/modules/notes/theory-exercises.js';
import { allStringsPractice, stringByString, octaveWalk, unisonsPractice, PRACTICE_ROUND } from '../js/modules/notes/practice-exercises.js';
import { positionKey, levelStrings, NOTE_LEVELS, fretsText, positionsText } from '../js/modules/notes/common.js';
import { TUNINGS, allowedTunings, getTuning } from '../js/data/tunings.js';
import { LEVEL_IDS, PLANNED_EXERCISES } from '../js/data/modules.js';
import { createRng } from '../js/core/random.js';
import { mod12 } from '../js/core/theory.js';
import { LETTER_PC } from '../js/core/notation.js';
import { midiAt, STANDARD_TUNING } from '../js/core/fretboard-model.js';
import { parseRichText, plainText } from '../js/core/glossary.js';
import { getConcept } from '../js/data/concepts.js';

const NATURALS = Object.values(LETTER_PC);
const STD = STANDARD_TUNING;
const notesOf = (text) => parseRichText(text).filter((p) => p.type === 'note').map((p) => p.pc);
const STRING_CHOICES = ['6-5', '6', '5', 'all'];
const ctxFor = (tuning, extra = {}) => ({ tuning: tuning.midi, tuningId: tuning.id, ...extra });

/** Todas las posiciones (cuerda, traste) de un MIDI exacto en un rango, por fuerza bruta. */
function sameMidi(midi, tuning, toFret) {
  const out = [];
  for (const s of [6, 5, 4, 3, 2, 1]) for (let f = 0; f <= toFret; f++) if (tuning[s] + f === midi) out.push({ string: s, fret: f });
  return out;
}

/* ===== Registro ===== */

test('todos los ejercicios están bien declarados (howTo, concepts, tunings, niveles, why)', () => {
  assert.equal(EXERCISES.length, 11);
  for (const ex of EXERCISES) {
    assert.deepEqual(validateExercise(ex), [], ex.id);
    assert.ok(ex.howTo && ex.concepts.length >= 1, ex.id);
    for (const id of ex.concepts) assert.ok(getConcept(id), `${ex.id}: ${id}`);
  }
  assert.ok(validateExercise({ id: 'x', section: 'teoria', concepts: [] }).length > 3);
});

test('los 11 ejercicios anunciados de la Fase 2 se pueden jugar y coinciden con su anuncio', () => {
  const planned = PLANNED_EXERCISES.filter((e) => e.module === 'notas');
  assert.equal(planned.length, 11);
  for (const p of planned) {
    const def = getExercise(p.id);
    assert.ok(def, p.id);
    assert.equal(def.title, p.title, p.id);
    assert.equal(def.description, p.description, p.id);
    assert.deepEqual(def.tunings, p.tunings, p.id);
    assert.ok(isPlayable(findExercise({ section: p.section, module: p.module, exercise: p.slug })), p.id);
  }
  // Afinaciones (7.6): las formas de octava dependen de la estándar; el resto se calcula por MIDI.
  assert.equal(octaves.tunings, 'standard');
  assert.equal(octaveWalk.tunings, 'standard');
  for (const ex of [whichNote, findIt, allOnString, unisonsTheory, fillBoard, timeTrial, allStringsPractice, stringByString, unisonsPractice]) {
    assert.equal(allowedTunings(ex.tunings).length, 7, ex.id);
  }
});

test('búsqueda de ejercicios por ruta e id', () => {
  const ex = findExercise({ section: 'teoria', module: 'notas', exercise: 'que-nota' });
  assert.equal(ex.title, '¿Qué nota es?');
  assert.equal(isPlayable(ex), true);
  assert.equal(findExercise({ section: 'teoria', module: 'notas', exercise: 'nada' }), null);
  assert.equal(exercisePath(ex), '/teoria/notas/que-nota');
  assert.equal(exerciseById('notas.practica.unisonos').title, 'Unísonos');
  assert.equal(exerciseById('dev.teoria.que-nota'), null); // los de prueba de la 1B ya no existen
  assert.equal(exerciseModuleTitle(ex), 'Notas del mástil');
  // Un ejercicio de una fase posterior se anuncia, pero no se juega.
  assert.equal(isPlayable(findExercise({ section: 'teoria', module: 'acordes', exercise: 'x' })), false);
});

/* ===== Niveles (tabla de la Fase 2) ===== */

test('niveles de Notas: trastes, cuerdas, notas y tiempos de la tabla', () => {
  const { basico, intermedio, avanzado } = NOTE_LEVELS;
  assert.deepEqual([basico.fromFret, basico.toFret], [0, 5]);
  assert.deepEqual([intermedio.fromFret, intermedio.toFret, avanzado.toFret], [0, 12, 12]);
  assert.deepEqual([basico.naturalsOnly, intermedio.naturalsOnly, avanzado.naturalsOnly], [true, false, false]);
  assert.deepEqual([basico.timeLimit, intermedio.timeLimit, avanzado.timeLimit], [null, 10, 5]);
  assert.deepEqual([basico.seconds, intermedio.seconds, avanzado.seconds], [20, 12, 7]);
  // Cuerdas: en Básico, 6ª y 5ª por defecto (configurable); en el resto, todas.
  assert.deepEqual(levelStrings(basico, {}), [6, 5]);
  assert.deepEqual(levelStrings(basico, { strings: '6' }), [6]);
  assert.deepEqual(levelStrings(basico, { strings: 'all' }), [6, 5, 4, 3, 2, 1]);
  assert.deepEqual(levelStrings(intermedio, { strings: '6' }), [6, 5, 4, 3, 2, 1]);
  assert.equal(positionKey(5, 3, 'standard'), 'note:s5f3');
  assert.equal(positionKey(5, 3, 'open-g'), 'note:s5f3@open-g');
});

/* ===== ¿Qué nota es? y Contrarreloj ===== */

test('¿Qué nota es?: posiciones del nivel y respuestas calculadas por MIDI, en las 7 afinaciones', () => {
  const rng = createRng(3);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = whichNote.levels[level];
      for (const strings of STRING_CHOICES) {
        const options = { strings };
        const allowed = levelStrings(params, options);
        let previousKey = null;
        for (let i = 0; i < 15; i++) {
          const item = whichNote.generate(params, rng, ctxFor(tuning, { previousKey, options }));
          assert.notEqual(item.key, previousKey, 'no repite la pregunta anterior');
          previousKey = item.key;
          assert.ok(allowed.includes(item.string) && item.fret >= params.fromFret && item.fret <= params.toFret);
          assert.equal(item.midi, midiAt(item.string, item.fret, tuning.midi));
          assert.equal(item.answer, mod12(item.midi));
          assert.equal(item.options.length, 4);
          assert.equal(new Set(item.options).size, 4);
          assert.ok(item.options.includes(item.pc));
          if (params.naturalsOnly) assert.ok(item.options.every((pc) => NATURALS.includes(pc)), 'Básico: solo naturales');
          assert.deepEqual(whichNote.statKeys(item), [positionKey(item.string, item.fret, tuning.id)]);
        }
      }
    }
  }
});

test('¿Qué nota es?: la corrección y el «¿Por qué?» dicen la verdad', () => {
  const rng = createRng(11);
  for (const tuning of TUNINGS) {
    for (let i = 0; i < 40; i++) {
      const item = whichNote.generate(whichNote.levels.intermedio, rng, ctxFor(tuning));
      assert.equal(whichNote.check(item, item.pc).correct, true);
      const wrong = item.options.find((pc) => pc !== item.pc);
      for (const answer of [wrong, null]) {
        const r = whichNote.check(item, answer);
        assert.equal(r.correct, false);
        assert.deepEqual(notesOf(r.feedback), answer === null ? [item.pc] : [answer, item.pc]);
        assert.match(plainText(r.feedback), new RegExp(`${item.string}ª cuerda, traste ${item.fret}\\)`));
        const whyNotes = notesOf(r.why);
        if (item.fret === 0) {
          assert.equal(whyNotes[0], item.pc);
          assert.equal(mod12(tuning.midi[item.string]), item.pc);
        } else {
          const [open, answerPc] = whyNotes;
          assert.equal(open, mod12(tuning.midi[item.string]));
          assert.equal(mod12(open + item.fret), answerPc);
        }
        if (answer !== null) {
          const m = plainText(r.why).match(/estaría en el traste (\d+)/);
          if (m) assert.equal(mod12(tuning.midi[item.string] + Number(m[1])), answer);
          else assert.equal(answer, mod12(tuning.midi[item.string]));
        }
      }
    }
  }
});

test('Contrarreloj: 60 s sin tiempo por pregunta, y el récord cuenta los aciertos por nivel', () => {
  assert.equal(timeTrial.roundSeconds, 60);
  for (const level of LEVEL_IDS) assert.equal(timeTrial.levels[level].timeLimit, null);
  const results = [{ result: { correct: true } }, { result: { correct: false } }, { result: { correct: true } }];
  assert.deepEqual(timeTrial.record({ results, level: 'basico', tuningId: 'standard' }),
    { key: 'notas.teoria.contrarreloj:basico', value: 2, better: 'higher' });
  assert.equal(timeTrial.record({ results, level: 'avanzado', tuningId: 'drop-d' }).key, 'notas.teoria.contrarreloj:avanzado@drop-d');
});

/* ===== Encuéntrala y Todas en una cuerda ===== */

test('Encuéntrala: la nota pedida está en esos trastes de esa cuerda, y solo en ellos', () => {
  const rng = createRng(21);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = findIt.levels[level];
      for (let i = 0; i < 25; i++) {
        const item = findIt.generate(params, rng, ctxFor(tuning));
        const expected = [];
        for (let f = params.fromFret; f <= params.toFret; f++) if (mod12(tuning.midi[item.string] + f) === item.pc) expected.push(f);
        assert.deepEqual(item.frets, expected);
        if (params.naturalsOnly) assert.ok(NATURALS.includes(item.pc));
        for (const fret of item.frets) assert.equal(findIt.check(item, { string: item.string, fret }).correct, true);
        // Otro traste de la misma cuerda, u otra cuerda: fallo con la corrección verdadera.
        const otherFret = (item.frets[0] + 1) % (params.toFret + 1);
        if (!item.frets.includes(otherFret)) {
          const r = findIt.check(item, { string: item.string, fret: otherFret });
          assert.equal(r.correct, false);
          assert.deepEqual(notesOf(r.feedback), [mod12(tuning.midi[item.string] + otherFret), item.pc]);
          assert.match(plainText(r.feedback), new RegExp(`${item.string}ª cuerda, ${fretsText(item.frets)}\\.$`));
        }
        const otherString = item.string === 6 ? 5 : 6;
        assert.equal(findIt.check(item, { string: otherString, fret: item.frets[0] }).correct, false);
        const r = findIt.check(item, null);
        if (item.frets[0] > 0) {
          const [open, note] = notesOf(r.why);
          assert.equal(mod12(open + item.frets[0]), note);
          assert.match(plainText(r.why), new RegExp(`cae en el traste ${item.frets[0]}\\.`));
        }
      }
    }
  }
});

test('Todas en una cuerda: del traste 0 al 12, todas las posiciones (dos solo si es la nota al aire)', () => {
  const rng = createRng(22);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = allOnString.levels[level];
      assert.deepEqual([params.fromFret, params.toFret], [0, 12]);
      for (let i = 0; i < 25; i++) {
        const item = allOnString.generate(params, rng, ctxFor(tuning));
        const open = mod12(tuning.midi[item.string]);
        assert.equal(item.frets.length, item.pc === open ? 2 : 1);
        for (const f of item.frets) assert.equal(mod12(tuning.midi[item.string] + f), item.pc);
        assert.equal(item.timeLimit, params.timeLimit ? params.timeLimit * item.frets.length : null);
        assert.equal(allOnString.check(item, { found: item.frets, wrong: null }).correct, true);
        assert.equal(allOnString.check(item, { found: [], wrong: { string: item.string === 1 ? 2 : 1, fret: 0 } }).correct, false);
        assert.equal(allOnString.check(item, null).correct, false);
        assert.deepEqual(allOnString.statKeys(item), item.frets.map((f) => positionKey(item.string, f, tuning.id)));
      }
    }
  }
});

/* ===== Octavas ===== */

// Formas de octava de BUILD_PLAN 4.3 (hacia agudos): cuerda de origen → [cuerda de destino, trastes].
const SHAPES_4_3 = [[6, 4, 2], [5, 3, 2], [4, 2, 3], [3, 1, 3], [6, 1, 0]];
function expectedOctaves(string, fret, maxFret) {
  const out = [];
  for (const [from, to, shift] of SHAPES_4_3) {
    if (from === string) out.push({ string: to, fret: fret + shift });
    if (to === string) out.push({ string: from, fret: fret - shift });
  }
  return out.filter((p) => p.fret >= 0 && p.fret <= maxFret);
}

test('Octavas: las respuestas válidas son exactamente las formas de 4.3, y suenan 1 o 2 octavas', () => {
  const rng = createRng(31);
  const std = getTuning('standard');
  for (const level of LEVEL_IDS) {
    const params = octaves.levels[level];
    assert.equal(params.boardTo, OCTAVE_BOARD[level]);
    for (const strings of STRING_CHOICES) {
      for (let i = 0; i < 25; i++) {
        const item = octaves.generate(params, rng, ctxFor(std, { options: { strings } }));
        const want = expectedOctaves(item.string, item.fret, params.boardTo);
        assert.ok(want.length > 0);
        assert.deepEqual(new Set(item.targets.map((t) => `${t.string}/${t.fret}`)), new Set(want.map((t) => `${t.string}/${t.fret}`)));
        for (const t of item.targets) {
          assert.equal(t.pc, item.pc, 'misma nota');
          const diff = Math.abs(t.midi - item.midi);
          assert.ok(diff === 12 || (diff === 24 && [1, 6].includes(t.string) && [1, 6].includes(item.string)), `${diff} semitonos`);
          assert.equal(octaves.check(item, { ...t }).correct, true);
        }
      }
    }
  }
  // La 5ª al aire (La) y la 4ª en el traste 7 suenan a una octava, pero no es una forma: no cuenta.
  const item = { ...octaves.generate(octaves.levels.intermedio, createRng(1), ctxFor(std)) };
  Object.assign(item, { string: 5, fret: 0, midi: 45, pc: 9, targets: [{ string: 3, fret: 2, midi: 57, pc: 9 }] });
  const r = octaves.check(item, { string: 4, fret: 7, midi: midiAt(4, 7) });
  assert.equal(midiAt(4, 7) - 45, 12);
  assert.equal(r.correct, false);
  assert.match(plainText(r.why), /la misma nota a otra altura, pero no con una forma de octava/);
  // Su unísono (6ª cuerda, traste 5) tampoco: es la misma nota exacta.
  assert.match(plainText(octaves.check(item, { string: 6, fret: 5, midi: midiAt(6, 5) }).why), /unísono/);
  assert.match(plainText(octaves.check(item, { string: 5, fret: 0, midi: 45 }).why), /propia nota marcada/);
});

test('Octavas: las formas desde la 4ª y la 3ª llevan un traste más por la pareja 3ª–2ª (4 semitonos)', () => {
  assert.equal(STD[2] - STD[3], 4);
  for (const s of [6, 5, 4, 2]) assert.equal(STD[s - 1] - STD[s], 5);
  // 6ª → 4ª y 5ª → 3ª cruzan dos parejas de 5: 10 semitonos + 2 trastes = 12.
  assert.equal(STD[4] - STD[6] + 2, 12);
  assert.equal(STD[3] - STD[5] + 2, 12);
  // 4ª → 2ª y 3ª → 1ª cruzan la pareja 3ª–2ª: 9 semitonos + 3 trastes = 12.
  assert.equal(STD[2] - STD[4] + 3, 12);
  assert.equal(STD[1] - STD[3] + 3, 12);
});

/* ===== Unísonos ===== */

test('Unísonos (Teoría): la respuesta tiene siempre el mismo MIDI y cae dentro del rango, en las 7 afinaciones', () => {
  const rng = createRng(41);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = unisonsTheory.levels[level];
      const directions = new Set();
      for (let i = 0; i < 60; i++) {
        const item = unisonsTheory.generate(params, rng, ctxFor(tuning));
        assert.ok(item.answers.length > 0);
        for (const a of item.answers) {
          assert.equal(a.midi, item.midi, 'mismo MIDI');
          assert.equal(midiAt(a.string, a.fret, tuning.midi), item.midi);
          assert.ok(a.fret >= 0 && a.fret <= params.toFret, 'dentro del rango');
          assert.notEqual(a.string, item.string);
        }
        if (level === 'basico') {
          assert.ok([5, 4].includes(item.string));
          assert.equal(item.target, item.string + 1, 'hacia la cuerda grave de al lado');
          if (tuning.id === 'standard') assert.equal(item.answers[0].fret - item.fret, 5, '+5 trastes');
        } else if (level === 'intermedio') {
          assert.equal(Math.abs(item.target - item.string), 1, 'cuerda de al lado');
          directions.add(item.target > item.string ? 'grave' : 'aguda');
        } else {
          assert.equal(item.target, null);
          assert.deepEqual(item.answers.map((a) => `${a.string}/${a.fret}`),
            sameMidi(item.midi, tuning.midi, 15).filter((p) => p.string !== item.string).map((p) => `${p.string}/${p.fret}`));
        }
        assert.equal(unisonsTheory.check(item, { found: item.answers.length, wrong: null }).correct, true);
      }
      if (level === 'intermedio') assert.equal(directions.size, 2, 'las dos direcciones');
    }
  }
  assert.deepEqual(UNISON_LEVELS.avanzado.toFret, 15);
});

test('Unísonos: el paso de la 3ª a la 2ª sale en Intermedio y está a 4 trastes en la estándar', () => {
  const rng = createRng(42);
  const std = getTuning('standard');
  let seen = false;
  for (let i = 0; i < 400 && !seen; i++) {
    const item = unisonsTheory.generate(unisonsTheory.levels.intermedio, rng, ctxFor(std));
    if ([item.string, item.target].sort().join() === '2,3') {
      seen = true;
      assert.equal(Math.abs(item.answers[0].fret - item.fret), 4);
    }
  }
  assert.ok(seen);
});

test('Unísonos: el «¿Por qué?» calcula bien los semitonos entre las cuerdas al aire', () => {
  const rng = createRng(43);
  for (const tuning of TUNINGS) {
    for (let i = 0; i < 40; i++) {
      const item = unisonsTheory.generate(unisonsTheory.levels.intermedio, rng, ctxFor(tuning));
      const r = unisonsTheory.check(item, null);
      assert.equal(r.correct, false);
      const gap = tuning.midi[item.string] - tuning.midi[item.target];
      const text = plainText(r.why);
      assert.match(text, new RegExp(`suena ${Math.abs(gap)} semitonos más ${gap > 0 ? 'grave' : 'aguda'}`));
      assert.match(text, new RegExp(`traste ${item.fret + gap}\\.`));
      assert.equal(item.answers[0].fret, item.fret + gap);
      // Tocar la misma nota a otra altura se explica como octava.
      const octave = item.answers[0].fret + 12 <= 12 ? { string: item.target, fret: item.answers[0].fret + 12 } : null;
      if (octave) {
        const w = unisonsTheory.check(item, { found: 0, wrong: { ...octave, midi: midiAt(octave.string, octave.fret, tuning.midi) } });
        assert.match(plainText(w.why), /es una octava, no un unísono/);
      }
    }
  }
});

/* ===== Rellena el mástil ===== */

test('Rellena el mástil: casillas, pistas y tiempo de cada nivel', () => {
  const rng = createRng(51);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = fillBoard.levels[level];
      const sizes = new Set();
      for (let i = 0; i < 30; i++) {
        const puzzle = fillBoard.generate(params, rng, ctxFor(tuning));
        sizes.add(puzzle.strings.length);
        assert.equal(puzzle.cells.length, 13 * puzzle.strings.length);
        for (const cell of puzzle.cells) {
          assert.equal(cell.midi, midiAt(cell.string, cell.fret, tuning.midi));
          assert.equal(cell.answer, mod12(cell.midi));
          assert.equal(fillBoard.check(cell, cell.pc).correct, true);
          assert.equal(fillBoard.check(cell, mod12(cell.pc + 1)).correct, false);
          const hint = { basico: [0, 5, 7, 12], intermedio: [0], avanzado: [] }[level].includes(cell.fret);
          const natural = NATURALS.includes(cell.pc);
          assert.equal(cell.given, hint || (level === 'basico' && !natural), `${level} ${cell.string}/${cell.fret}`);
        }
        if (level === 'basico') assert.ok([6, 5].includes(puzzle.strings[0]));
        assert.equal(puzzle.timeLimit, level === 'avanzado' ? (puzzle.strings.length === 2 ? 90 : 60) : null);
      }
      assert.deepEqual([...sizes].sort(), level === 'avanzado' ? [1, 2] : [1]);
    }
  }
});

test('Rellena el mástil: el récord es el tiempo por cuerda y nivel, solo sin fallos', () => {
  const puzzle = { strings: [6], tuningId: 'standard' };
  const ok = [{ result: { correct: true } }, { result: { correct: true } }];
  assert.deepEqual(fillBoard.record({ puzzle, results: ok, level: 'basico', seconds: 41.26 }),
    { key: 'notas.teoria.rellena:basico:s6', value: 41.3, better: 'lower' });
  assert.equal(fillBoard.record({ puzzle, results: [...ok, { result: { correct: false } }], level: 'basico', seconds: 30 }), null);
  assert.equal(fillBoard.record({ puzzle: { strings: [6, 4], tuningId: 'open-g' }, results: ok, level: 'avanzado', seconds: 50 }).key,
    'notas.teoria.rellena:avanzado:s6+4@open-g');
});

/* ===== Práctica ===== */

test('Nota por todas las cuerdas: la nota en las 6 cuerdas, sin repetir las recientes, voz en ES y EN', () => {
  const rng = createRng(61);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = allStringsPractice.levels[level];
      const recentKeys = [];
      for (let i = 0; i < 20; i++) {
        const item = allStringsPractice.generate(params, rng, { tuning: tuning.midi, recentKeys: recentKeys.slice(-2) });
        assert.ok(!recentKeys.slice(-2).includes(item.key));
        recentKeys.push(item.key);
        if (params.naturalsOnly) assert.ok(NATURALS.includes(item.pc));
        assert.equal(item.seconds, params.seconds);
        for (const s of [1, 2, 3, 4, 5, 6]) assert.ok(item.positions.some((p) => p.string === s), `cuerda ${s}`);
        for (const p of item.positions) assert.equal(mod12(midiAt(p.string, p.fret, tuning.midi)), item.pc);
      }
    }
  }
  assert.equal(allStringsPractice.roundLength, PRACTICE_ROUND);
  assert.equal(allStringsPractice.speech({ pc: 6 }, { notation: 'es', accidentals: 'sharp' }), 'Fa sostenido');
  assert.equal(allStringsPractice.speech({ pc: 6 }, { notation: 'es', accidentals: 'flat' }), 'Sol bemol');
  assert.equal(allStringsPractice.speech({ pc: 6 }, { notation: 'en', accidentals: 'sharp' }), 'F sharp');
});

test('Cuerda a cuerda: la misma cuerda toda la ronda (también «Al azar») y la nota en su rango', () => {
  const rng = createRng(62);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = stringByString.levels[level];
      for (const choice of ['6', '3', '1', 'random']) {
        const round = {};
        let string = null;
        for (let i = 0; i < 12; i++) {
          const item = stringByString.generate(params, rng, { tuning: tuning.midi, options: { string: choice }, round });
          string ??= item.string;
          assert.equal(item.string, string, 'la cuerda no cambia en la ronda');
          if (choice !== 'random') assert.equal(item.string, Number(choice));
          assert.ok(item.positions.length > 0);
          for (const p of item.positions) {
            assert.equal(p.string, string);
            assert.ok(p.fret >= params.fromFret && p.fret <= params.toFret);
            assert.equal(mod12(midiAt(p.string, p.fret, tuning.midi)), item.pc);
          }
          if (params.naturalsOnly) assert.ok(NATURALS.includes(item.pc));
        }
      }
    }
  }
});

test('Paseo de octavas: la nota en su cuerda y sus octavas con las formas de 4.3', () => {
  const rng = createRng(63);
  const std = getTuning('standard');
  for (const level of LEVEL_IDS) {
    const params = octaveWalk.levels[level];
    for (const strings of STRING_CHOICES) {
      for (let i = 0; i < 20; i++) {
        const item = octaveWalk.generate(params, rng, { tuning: std.midi, options: { strings } });
        assert.ok(levelStrings(params, { strings }).includes(item.string));
        const starts = item.markers.filter((m) => m.color === 'amber');
        const eights = item.markers.filter((m) => m.text === '8');
        assert.ok(starts.length > 0 && eights.length > 0);
        for (const s of starts) {
          assert.equal(s.string, item.string);
          assert.ok(s.fret >= params.fromFret && s.fret <= params.toFret);
          assert.equal(mod12(midiAt(s.string, s.fret)), item.pc);
        }
        const allowed = new Set(starts.flatMap((s) => expectedOctaves(s.string, s.fret, 12)).map((p) => `${p.string}/${p.fret}`));
        assert.deepEqual(new Set(eights.map((p) => `${p.string}/${p.fret}`)), allowed);
      }
    }
  }
  const speak = (notation) => octaveWalk.speech({ pc: 7, string: 6 }, { notation, accidentals: 'sharp' });
  assert.equal(speak('es'), 'Sol, sexta cuerda, y su octava');
  assert.equal(speak('en'), 'G, string 6, and its octave');
});

test('Unísonos (Práctica): al enseñar la solución suenan notas con el mismo MIDI', () => {
  const rng = createRng(64);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const recentKeys = [];
      for (let i = 0; i < 20; i++) {
        const item = unisonsPractice.generate(unisonsPractice.levels[level], rng, { tuning: tuning.midi, tuningId: tuning.id, recentKeys: recentKeys.slice(-2) });
        assert.ok(!recentKeys.slice(-2).includes(item.key));
        recentKeys.push(item.key);
        assert.ok(item.revealSound.length >= 2);
        assert.ok(item.revealSound.every((m) => m === midiAt(item.string, item.fret, tuning.midi)));
        assert.equal(item.positions.length, item.revealSound.length);
        assert.equal(item.seconds, UNISON_LEVELS[level].seconds);
      }
    }
  }
  const item = { string: 6, fret: 7 };
  assert.equal(unisonsPractice.speech(item, { notation: 'es' }), 'sexta cuerda, traste 7');
  assert.equal(unisonsPractice.speech(item, { notation: 'en' }), 'string 6, fret 7');
});

/* ===== Textos de las respuestas ===== */

test('textos de posiciones', () => {
  assert.equal(fretsText([3]), 'traste 3');
  assert.equal(fretsText([0, 12]), 'trastes 0 y 12');
  assert.equal(positionsText([{ string: 4, fret: 5 }]), '4ª cuerda, traste 5');
  assert.equal(positionsText([{ string: 4, fret: 5 }, { string: 1, fret: 3 }]), '4ª cuerda, traste 5; o 1ª cuerda, traste 3');
});

test('todas las correcciones y etiquetas de fallo se entienden (marcado válido)', () => {
  const rng = createRng(71);
  const std = getTuning('standard');
  const cases = [
    [whichNote, (it) => [mod12(it.pc + 1), null]],
    [findIt, (it) => [{ string: it.string === 1 ? 2 : 1, fret: 0 }, null]],
    [allOnString, (it) => [{ found: [], wrong: { string: it.string === 1 ? 2 : 1, fret: 0 } }, null]],
    [octaves, (it) => [{ string: it.string, fret: it.fret, midi: it.midi }, null]],
    [unisonsTheory, (it) => [{ found: 0, wrong: { string: it.string, fret: it.fret === 0 ? 1 : 0, midi: 40 } }, null]],
  ];
  for (const [ex, wrongs] of cases) {
    for (const level of LEVEL_IDS) {
      const item = ex.generate(ex.levels[level], rng, ctxFor(std));
      for (const answer of wrongs(item)) {
        const r = ex.check(item, answer);
        for (const text of [r.feedback, r.why, r.label]) assert.doesNotThrow(() => plainText(text), ex.id);
        assert.doesNotThrow(() => parseRichText(ex.answerMarkup(item.answer)));
        if (answer !== null) assert.doesNotThrow(() => parseRichText(ex.answerMarkup(answer)));
      }
      const prompt = typeof ex.prompt === 'function' ? ex.prompt(item) : ex.prompt;
      assert.doesNotThrow(() => plainText(prompt));
    }
  }
});

test('¿Qué nota es?: el trozo de mástil tiene el punto dentro (5 trastes, o 0–5 entero en Básico)', () => {
  const rng = createRng(81);
  const std = getTuning('standard');
  for (const level of LEVEL_IDS) {
    const params = whichNote.levels[level];
    for (let i = 0; i < 60; i++) {
      const item = whichNote.generate(params, rng, ctxFor(std, { options: { strings: 'all' } }));
      assert.ok(item.fret >= item.fromFret && item.fret <= item.toFret);
      assert.ok(item.fromFret >= params.fromFret && item.toFret <= params.toFret);
      if (level === 'basico') assert.deepEqual([item.fromFret, item.toFret], [0, 5]);
      else assert.equal(item.toFret - item.fromFret + 1, 5);
    }
  }
});
