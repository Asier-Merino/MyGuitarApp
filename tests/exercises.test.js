// Registro de ejercicios (BUILD_PLAN 7.1) y ejercicios de prueba de la Fase 1B,
// comprobados con la teoría y en todas las afinaciones que admiten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXERCISES, validateExercise, findExercise, isPlayable, exercisePath, exerciseById, exerciseModuleTitle,
} from '../js/engine/exercise-registry.js';
import { devWhichNote, devAllStrings, positionKey } from '../js/modules/dev/dev-exercises.js';
import { TUNINGS, allowedTunings } from '../js/data/tunings.js';
import { LEVEL_IDS } from '../js/data/modules.js';
import { createRng } from '../js/core/random.js';
import { mod12 } from '../js/core/theory.js';
import { LETTER_PC } from '../js/core/notation.js';
import { midiAt } from '../js/core/fretboard-model.js';
import { parseRichText, plainText } from '../js/core/glossary.js';
import { getConcept } from '../js/data/concepts.js';

const NATURALS = Object.values(LETTER_PC);

test('todos los ejercicios están bien declarados (howTo, concepts, tunings, niveles, why)', () => {
  assert.ok(EXERCISES.length >= 2);
  for (const ex of EXERCISES) {
    assert.deepEqual(validateExercise(ex), [], ex.id);
    assert.ok(ex.howTo && ex.concepts.length >= 1, ex.id);
    for (const id of ex.concepts) assert.ok(getConcept(id), `${ex.id}: ${id}`);
  }
  assert.ok(validateExercise({ id: 'x', section: 'teoria', concepts: [] }).length > 3);
});

test('búsqueda de ejercicios por ruta e id', () => {
  assert.equal(findExercise({ module: 'dev', exercise: 'que-nota' }).id, 'dev.teoria.que-nota');
  assert.equal(findExercise({ module: 'dev', exercise: 'nada' }), null);
  const planned = findExercise({ section: 'teoria', module: 'notas', exercise: 'que-nota' });
  assert.equal(planned.title, '¿Qué nota es?');
  assert.equal(isPlayable(planned), false); // llega en la Fase 2
  assert.equal(isPlayable(devWhichNote), true);
  assert.equal(exercisePath(devAllStrings), '/dev/seis-cuerdas');
  assert.equal(exercisePath(planned), '/teoria/notas/que-nota');
  assert.equal(exerciseById('dev.practica.seis-cuerdas').id, 'dev.practica.seis-cuerdas');
  assert.equal(exerciseById('notas.teoria.que-nota').title, '¿Qué nota es?');
  assert.equal(exerciseById('nada.x.y'), null);
  assert.equal(exerciseModuleTitle(devWhichNote), 'Prueba');
});

test('¿Qué nota es? (prueba): respuestas calculadas por MIDI en las 7 afinaciones y los 3 niveles', () => {
  assert.equal(allowedTunings(devWhichNote.tunings).length, 7);
  const rng = createRng(3);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = devWhichNote.levels[level];
      let previousKey = null;
      for (let i = 0; i < 30; i++) {
        const item = devWhichNote.generate(params, rng, { tuning: tuning.midi, tuningId: tuning.id, previousKey });
        assert.notEqual(item.key, previousKey, 'no repite la pregunta anterior');
        previousKey = item.key;
        assert.ok([5, 6].includes(item.string) && item.fret >= 0 && item.fret <= 5);
        assert.equal(item.midi, midiAt(item.string, item.fret, tuning.midi));
        assert.equal(item.pc, mod12(item.midi));
        assert.equal(item.answer, item.pc);
        assert.equal(devWhichNote.answerMarkup(item.answer), `{{pc:${item.pc}}}`);
        assert.equal(item.key, positionKey(item.string, item.fret, tuning.id));
        assert.equal(item.options.length, params.optionCount);
        assert.equal(new Set(item.options).size, item.options.length);
        assert.ok(item.options.includes(item.pc));
        if (params.naturalsOnly) assert.ok(item.options.every((pc) => NATURALS.includes(pc)), 'Básico: solo naturales');
        assert.deepEqual(devWhichNote.sound(item), { midi: [item.midi] });
        assert.deepEqual(devWhichNote.statKeys(item), [item.key]);
      }
    }
  }
  assert.equal(positionKey(5, 3, 'standard'), 'note:s5f3');
  assert.equal(positionKey(5, 3, 'open-g'), 'note:s5f3@open-g');
});

test('¿Qué nota es? (prueba): la corrección y el «¿Por qué?» dicen la verdad', () => {
  const rng = createRng(11);
  for (const tuning of TUNINGS) {
    for (let i = 0; i < 40; i++) {
      const item = devWhichNote.generate(devWhichNote.levels.intermedio, rng, { tuning: tuning.midi, tuningId: tuning.id });
      assert.equal(devWhichNote.check(item, item.pc).correct, true);
      const wrong = item.options.find((pc) => pc !== item.pc);
      for (const answer of [wrong, null]) {
        const r = devWhichNote.check(item, answer);
        assert.equal(r.correct, false);
        // El marcado se entiende y las notas que nombra son las calculadas.
        const notes = (text) => parseRichText(text).filter((p) => p.type === 'note').map((p) => p.pc);
        assert.deepEqual(notes(r.feedback), answer === null ? [item.pc] : [answer, item.pc]);
        assert.match(plainText(r.feedback), new RegExp(`${item.string}ª cuerda, traste ${item.fret}\\)`));
        const whyNotes = notes(r.why);
        if (item.fret === 0) {
          assert.equal(whyNotes[0], item.pc);
          assert.equal(mod12(tuning.midi[item.string]), item.pc); // "la cuerda al aire suena …"
        } else {
          // "la Nª cuerda al aire es X … en el traste F suena Y": X + F semitonos = Y.
          const [open, answerPc] = whyNotes;
          assert.equal(open, mod12(tuning.midi[item.string]));
          assert.equal(mod12(open + item.fret), answerPc);
          assert.match(plainText(r.why), new RegExp(`en el traste ${item.fret} suena`));
        }
        if (answer !== null) {
          // "X estaría en el traste N de esa cuerda": la cuerda al aire + N semitonos = X.
          const m = plainText(r.why).match(/estaría en el traste (\d+)/);
          if (m) assert.equal(mod12(tuning.midi[item.string] + Number(m[1])), answer);
          else assert.equal(answer, mod12(tuning.midi[item.string])); // "es esa cuerda al aire"
        }
        assert.equal(plainText(r.label), `${item.string}ª cuerda · traste ${item.fret}`);
      }
    }
  }
});

test('Nota por las 6 cuerdas (prueba): posiciones por MIDI, sin repetir las recientes, voz en ES y EN', () => {
  const rng = createRng(5);
  for (const tuning of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = devAllStrings.levels[level];
      const recentKeys = [];
      for (let i = 0; i < 30; i++) {
        const item = devAllStrings.generate(params, rng, { tuning: tuning.midi, recentKeys: recentKeys.slice(-2) });
        assert.ok(!recentKeys.slice(-2).includes(item.key), 'no repite las dos últimas');
        recentKeys.push(item.key);
        if (params.naturalsOnly) assert.ok(NATURALS.includes(item.pc));
        assert.equal(item.seconds, params.seconds);
        // En cada cuerda hay una posición entre 0 y 11, y todas suenan como la nota pedida.
        for (const s of [1, 2, 3, 4, 5, 6]) {
          assert.equal(item.positions.filter((p) => p.string === s && p.fret <= 11).length, 1, `cuerda ${s}`);
        }
        for (const p of item.positions) assert.equal(mod12(midiAt(p.string, p.fret, tuning.midi)), item.pc);
      }
    }
  }
  assert.deepEqual([20, 12, 7], LEVEL_IDS.map((l) => devAllStrings.levels[l].seconds)); // tabla de la Fase 2
  const fs = { pc: 6 };
  assert.equal(devAllStrings.speech(fs, { notation: 'es', accidentals: 'sharp' }), 'Fa sostenido');
  assert.equal(devAllStrings.speech(fs, { notation: 'es', accidentals: 'flat' }), 'Sol bemol');
  assert.equal(devAllStrings.speech(fs, { notation: 'en', accidentals: 'sharp' }), 'F sharp');
});
