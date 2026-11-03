// Fase 3: ejercicios de Acordes abiertos y Calentamiento, comprobados con la teoría
// (notas por MIDI, fórmulas de acorde, grados), y lo que dicen sus fichas y su lección.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, getExercise, findExercise, isPlayable, validateExercise } from '../js/engine/exercise-registry.js';
import { whichChord, buildChord, chordNotesQuiz, majorOrMinor, missingNote, levelQualities, missingCandidates } from '../js/modules/chords/theory-exercises.js';
import {
  chordChanges, strumming, oneMinuteChanges, sungChord, CHANGES_LEVELS, STRUM_LEVELS, PATTERN_OPTION, TEMPO_OPTION, pairRecordKey, chordSpeech, SUNG_SECONDS,
} from '../js/modules/chords/practice-exercises.js';
import { chromaticWarmup, warmupTab } from '../js/modules/warmup/exercises.js';
import { chordKey, shapeText, joinAnd } from '../js/modules/chords/common.js';
import { exerciseOptions } from '../js/engine/rounds.js';
import { PLANNED_EXERCISES, LEVEL_IDS } from '../js/data/modules.js';
import { CHORDS, getChord, chordTones, chordsForLevel } from '../js/data/chords.js';
import { PRESETS, degreeChord } from '../js/core/progressions.js';
import { getStrumPattern, STRUM_TEMPO } from '../js/data/strum-patterns.js';
import { warmupLap, warmupOutward, WARMUP_LEVELS } from '../js/core/warmup.js';
import { plainPieces, NATURAL_HARMONICS, eventTimes } from '../js/core/tab.js';
import { shapeNotes, STANDARD_TUNING, midiAt } from '../js/core/fretboard-model.js';
import { mod12, interval } from '../js/core/theory.js';
import { LETTER_PC } from '../js/core/notation.js';
import { createRng } from '../js/core/random.js';
import { parseRichText, plainText } from '../js/core/glossary.js';
import { getConcept, LESSONS, EXERCISE_TEXTS } from '../js/data/concepts.js';

const L = LETTER_PC;
const pcsOf = (chord) => shapeNotes(chord.frets).map((n) => mod12(n.midi));
const notesIn = (text) => parseRichText(text).filter((p) => p.type === 'note').map((p) => p.pc);
const chordsIn = (text) => parseRichText(text).filter((p) => p.type === 'chord').map((p) => p.id);
const ROUNDS = 60;

/* ===== Registro ===== */

test('los 10 ejercicios de la Fase 3 se pueden jugar y coinciden con su anuncio', () => {
  const planned = PLANNED_EXERCISES.filter((e) => e.phase === 3);
  assert.equal(planned.length, 10);
  for (const p of planned) {
    const def = getExercise(p.id);
    assert.ok(def, p.id);
    assert.deepEqual(validateExercise(def), [], p.id);
    assert.equal(def.title, p.title, p.id);
    assert.equal(def.description, p.description, p.id);
    assert.deepEqual(def.tunings, p.tunings, p.id);
    assert.ok(isPlayable(findExercise({ section: p.section, module: p.module, exercise: p.slug })), p.id);
    for (const id of def.concepts) assert.ok(getConcept(id), `${p.id}: ${id}`);
  }
  // Los acordes abiertos dependen de la afinación estándar (7.6); el calentamiento admite cualquiera.
  for (const ex of EXERCISES.filter((e) => e.module === 'acordes')) assert.equal(ex.tunings, 'standard', ex.id);
  assert.equal(chromaticWarmup.tunings, 'any');
});

test('niveles de los acordes (tabla de la Fase 3) en todos los ejercicios', () => {
  for (const ex of [whichChord, buildChord, chordNotesQuiz, majorOrMinor, missingNote, sungChord, oneMinuteChanges]) {
    for (const level of LEVEL_IDS) assert.deepEqual(ex.levels[level].chords, chordsForLevel(level).map((c) => c.id), `${ex.id} ${level}`);
  }
  assert.deepEqual(LEVEL_IDS.map((l) => whichChord.levels[l].timeLimit), [null, 15, 8]);
  assert.deepEqual(LEVEL_IDS.map((l) => buildChord.levels[l].timeLimit), [null, 30, 20]);
});

/* ===== ¿Qué acorde es? ===== */

test('¿Qué acorde es?: 4 opciones con nombres distintos del nivel, una es la correcta', () => {
  const rng = createRng(11);
  for (const level of LEVEL_IDS) {
    const params = whichChord.levels[level];
    for (let i = 0; i < ROUNDS; i++) {
      const item = whichChord.generate(params, rng, {});
      assert.equal(item.options.length, 4);
      assert.ok(item.options.includes(item.answer));
      const names = item.options.map((id) => { const c = getChord(id); return `${c.root}:${c.quality}`; });
      assert.equal(new Set(names).size, 4, 'dos opciones con el mismo nombre');
      for (const id of item.options) assert.ok(params.chords.includes(id), `${level}: ${id}`);
      assert.equal(item.key, chordKey(item.chord));
    }
  }
});

test('¿Qué acorde es?: el Fa mini y el Fa con cejilla son el mismo Fa; el «¿Por qué?» dice las notas que suenan', () => {
  const item = { chord: getChord('F-barre'), answer: 'F-barre' };
  assert.equal(whichChord.check(item, 'F-mini').correct, true);
  const r = whichChord.check({ chord: getChord('E'), answer: 'E' }, 'Em');
  assert.equal(r.correct, false);
  assert.deepEqual(chordsIn(r.feedback), ['Em', 'E']);
  // Las notas del "¿Por qué?" son exactamente las del acorde (Mi, Sol♯, Si) y las del elegido.
  const tones = notesIn(r.why);
  for (const pc of chordTones(getChord('E'))) assert.ok(tones.includes(pc));
  assert.ok(tones.includes(L.G)); // la 3ª de Mim, Sol
  assert.match(plainText(r.why), /misma fundamental/);
  assert.match(plainText(r.why), /a 4 semitonos/);
  assert.equal(whichChord.check({ chord: getChord('E'), answer: 'E' }, null).correct, false);
});

/* ===== Constrúyelo ===== */

test('Constrúyelo: solo vale la forma exacta, y el «¿Por qué?» dice qué va en cada cuerda equivocada', () => {
  const item = buildChord.generate(buildChord.levels.basico, createRng(2), {});
  assert.deepEqual(item.answer, [...item.chord.frets]);
  const c = { chord: getChord('C'), answer: [...getChord('C').frets] };
  assert.equal(buildChord.check(c, [null, 3, 2, 0, 1, 0]).correct, true);
  const wrong = buildChord.check(c, [0, 3, 2, 0, 2, 0]); // 6ª al aire (debería no tocarse) y 2ª en el 2
  assert.equal(wrong.correct, false);
  const plain = plainText(wrong.why);
  assert.match(plain, /6ª cuerda va sin tocar \(×\), y has puesto al aire \(o\)/);
  assert.match(plain, /2ª cuerda va el traste 1/);
  // La nota que se nombra para el traste 1 de la 2ª cuerda es Do (MIDI), y para el 2, Do♯.
  const pcs = notesIn(wrong.why);
  assert.ok(pcs.includes(mod12(midiAt(2, 1))) && pcs.includes(mod12(midiAt(2, 2))));
  assert.equal(buildChord.check(c, null).correct, false);
  assert.equal(buildChord.answerMarkup(getChord('C').frets), 'x 3 2 0 1 0');
});

/* ===== ¿Qué notas tiene? ===== */

test('¿Qué notas tiene?: la respuesta son las notas de la fórmula, que son las que suenan en el diagrama', () => {
  for (const chord of CHORDS) {
    const item = { chord, answer: { chord: chord.id, pcs: [...chordTones(chord)].sort((a, b) => a - b) } };
    assert.deepEqual(new Set(pcsOf(chord)), new Set(item.answer.pcs), chord.id);
    assert.equal(chordNotesQuiz.check(item, [...item.answer.pcs].reverse()).correct, true, chord.id);
    assert.equal(chordNotesQuiz.check(item, item.answer.pcs.slice(1)).correct, false, chord.id);
    const r = chordNotesQuiz.check(item, [...item.answer.pcs, mod12(chord.root + 1)]);
    assert.equal(r.correct, false);
    const third = interval(chord.root, chordTones(chord)[1]);
    assert.match(plainText(r.why), new RegExp(`a ${third} semitonos \\(3ª ${third === 4 ? 'mayor' : 'menor'}\\)`), chord.id);
    if (chord.quality === 'dom7') assert.match(plainText(r.why), /7ª, .* a 10 semitonos/);
    assert.match(plainText(r.why), /Sobra/);
  }
  const item = chordNotesQuiz.generate(chordNotesQuiz.levels.intermedio, createRng(5), {});
  assert.equal(chordNotesQuiz.prompt(item).includes(String(item.answer.pcs.length)), true);
});

/* ===== ¿Mayor o menor? ===== */

test('¿Mayor o menor?: la calidad sale de la 3ª que suena (4 semitonos mayor, 3 menor), y la séptima desde Intermedio', () => {
  assert.deepEqual(levelQualities(majorOrMinor.levels.basico), ['major', 'minor']);
  assert.deepEqual(levelQualities(majorOrMinor.levels.intermedio), ['major', 'minor', 'dom7']);
  for (const chord of CHORDS) {
    const sounding = pcsOf(chord).map((pc) => interval(chord.root, pc));
    const hasMajor3 = sounding.includes(4);
    const hasMinor3 = sounding.includes(3);
    const has7 = sounding.includes(10);
    const quality = has7 ? 'dom7' : hasMajor3 ? 'major' : hasMinor3 ? 'minor' : null;
    assert.equal(chord.quality, quality, chord.id);
    const r = majorOrMinor.check({ chord, answer: chord.quality }, chord.quality === 'minor' ? 'major' : 'minor');
    const thirdString = shapeNotes(chord.frets).find((n) => [3, 4].includes(interval(chord.root, mod12(n.midi)))).string;
    assert.match(plainText(r.why), new RegExp(`la 3ª suena en la ${thirdString}ª cuerda`), chord.id);
  }
  const rng = createRng(4);
  const seen = new Set();
  for (let i = 0; i < ROUNDS; i++) seen.add(majorOrMinor.generate(majorOrMinor.levels.intermedio, rng, {}).answer);
  assert.deepEqual([...seen].sort(), ['dom7', 'major', 'minor']);
});

/* ===== ¿Qué nota falta? ===== */

test('¿Qué nota falta?: la respuesta es la nota que suena en esa cuerda y ese traste, entre 4 opciones distintas', () => {
  const rng = createRng(9);
  for (const level of LEVEL_IDS) {
    for (let i = 0; i < ROUNDS; i++) {
      const item = missingNote.generate(missingNote.levels[level], rng, {});
      assert.equal(item.answer, mod12(midiAt(item.string, item.fret)));
      assert.equal(item.fret, item.chord.frets[6 - item.string]);
      assert.ok(item.fret > 0);
      assert.equal(item.options.length, 4);
      assert.equal(new Set(item.options).size, 4);
      assert.ok(item.options.includes(item.answer));
      assert.ok(chordTones(item.chord).includes(item.answer));
    }
  }
  // El «¿Por qué?»: la cuerda al aire y la función de la nota (Do en Lam, 2ª cuerda: la 3ª).
  const am = getChord('Am');
  const r = missingNote.check({ chord: am, string: 2, fret: 1, pc: L.C, answer: L.C }, L.E);
  assert.equal(r.correct, false);
  assert.match(plainText(r.why), /1 traste más arriba suena .*la 3ª/);
  assert.equal(notesIn(r.why)[0], L.B); // la 2ª cuerda al aire es Si
  assert.match(plainText(r.why), /también es del acorde/);
  assert.equal(missingCandidates(missingNote.levels.basico).every((c) => c.fret > 0), true);
});

/* ===== Práctica ===== */

test('Cambios de acordes: niveles de la tabla y la progresión elegida en bucle', () => {
  assert.deepEqual(LEVEL_IDS.map((l) => [CHANGES_LEVELS[l].bpm, CHANGES_LEVELS[l].beatsPerChange]), [[60, 8], [80, 4], [100, 2]]);
  const plan = chordChanges.generate(CHANGES_LEVELS.intermedio, createRng(1), { options: { progression: PRESETS[4].id, diagrams: false } });
  assert.deepEqual(plan.chords.map((c) => c.id), ['G', 'D', 'Em', 'C']);
  assert.equal(plan.showDiagrams, false);
  assert.equal(plan.bpm, 80);
  const custom = chordChanges.generate(CHANGES_LEVELS.basico, createRng(1), {
    options: { progression: 'custom:x' }, progressions: [{ id: 'x', name: 'Blues', chords: ['A7', 'D7', 'E7'] }],
  });
  assert.deepEqual(custom.chords.map((c) => c.id), ['A7', 'D7', 'E7']);
  assert.equal(chordChanges.duration.default, 60);
});

test('Rasgueo: patrones y tempo del nivel; cambio cada 2 compases en Básico y cada compás en el resto', () => {
  assert.deepEqual(LEVEL_IDS.map((l) => STRUM_LEVELS[l].beatsPerChange), [8, 4, 4]);
  for (const level of LEVEL_IDS) {
    for (const id of PATTERN_OPTION.byLevel[level]) assert.equal(getStrumPattern(id).level, level);
    assert.deepEqual(TEMPO_OPTION.byLevel[level], STRUM_TEMPO[level]);
  }
  // La preparación guarda el tempo de cada nivel y lo devuelve dentro de su rango.
  const opts = (saved, level) => exerciseOptions(strumming, saved, level);
  assert.equal(opts({}, 'avanzado').tempo, 90);
  assert.equal(opts({ tempo: { basico: 65 } }, 'basico').tempo, 65);
  assert.equal(opts({ tempo: { basico: 65 } }, 'intermedio').tempo, 70);
  assert.equal(opts({ tempo: { basico: 200 } }, 'basico').tempo, 60);
  assert.equal(opts({ pattern: 'swing' }, 'basico').pattern, 'negras');
  assert.equal(opts({ pattern: 'swing' }, 'avanzado').pattern, 'swing');
  const plan = strumming.generate(STRUM_LEVELS.avanzado, createRng(1), { options: { tempo: 95, pattern: 'pop-acento' }, level: 'avanzado' });
  assert.equal(plan.bpm, 95);
  assert.equal(plan.pattern.id, 'pop-acento');
});

test('Cambios en un minuto: 60 s fijos, pareja del nivel y récord por pareja en cualquier orden', () => {
  assert.equal(oneMinuteChanges.roundSeconds, 60);
  assert.equal(oneMinuteChanges.duration, undefined); // sin selector de duración
  assert.equal(pairRecordKey('C', 'G'), pairRecordKey('G', 'C'));
  assert.notEqual(pairRecordKey('C', 'G'), pairRecordKey('C', 'Am'));
  // Una pareja con un acorde que no es del nivel vuelve a la de por defecto.
  assert.deepEqual(exerciseOptions(oneMinuteChanges, { pair: ['C', 'B7'] }, 'basico').pair, ['C', 'G']);
  assert.deepEqual(exerciseOptions(oneMinuteChanges, { pair: ['C', 'B7'] }, 'intermedio').pair, ['C', 'B7']);
  assert.deepEqual(exerciseOptions(oneMinuteChanges, { pair: ['C', 'C'] }, 'intermedio').pair, ['C', 'G']);
  const plan = oneMinuteChanges.generate(oneMinuteChanges.levels.basico, null, { options: { pair: ['Am', 'E'] } });
  assert.deepEqual(oneMinuteChanges.record({ items: 30, plan }), { key: pairRecordKey('Am', 'E'), value: 30, better: 'higher' });
});

test('Acorde cantado: 12 acordes, tiempo por nivel y nombre hablado en ES y EN', () => {
  assert.equal(sungChord.roundLength, 12);
  assert.deepEqual(LEVEL_IDS.map((l) => sungChord.levels[l].seconds), [SUNG_SECONDS.basico, SUNG_SECONDS.intermedio, SUNG_SECONDS.avanzado]);
  assert.equal(chordSpeech(getChord('Am'), { notation: 'es' }), 'La menor');
  assert.equal(chordSpeech(getChord('Am'), { notation: 'en' }), 'A minor');
  assert.equal(chordSpeech(getChord('E7'), { notation: 'es' }), 'Mi siete');
  assert.equal(chordSpeech(getChord('F-barre'), { notation: 'es' }), 'Fa');
  const rng = createRng(3);
  const recent = [];
  for (let i = 0; i < 30; i++) {
    const item = sungChord.generate(sungChord.levels.basico, rng, { recentKeys: recent.slice(-2) });
    assert.ok(!recent.slice(-2).includes(item.key));
    recent.push(item.key);
  }
});

test('Calentamiento: la tablatura del ejercicio es la vuelta del core, nota a nota, con el ritmo del nivel', () => {
  for (const level of LEVEL_IDS) {
    const p = WARMUP_LEVELS[level];
    for (const variant of p.variants) {
      for (const position of [1, 5]) {
        const plan = chromaticWarmup.generate(p, null, { options: { variant, position: String(position) }, level });
        const lap = warmupLap(variant, position);
        assert.deepEqual(plan.tab.events.map((e) => `${e.notes[0].string}:${e.notes[0].fret}`), lap.map((n) => `${n.string}:${n.fret}`));
        // Negras (2 corcheas), corcheas (1) o semicorcheas (½): notas por tiempo del nivel.
        const times = eventTimes(plan.tab);
        assert.equal(times[p.notesPerBeat], 2, `${level}: ${p.notesPerBeat} notas por tiempo`);
      }
    }
  }
  // Una variante que no es del nivel vuelve a la primera.
  assert.equal(chromaticWarmup.generate(WARMUP_LEVELS.basico, null, { options: { variant: 'spider' }, level: 'basico' }).variant, '1234');
  assert.deepEqual(chromaticWarmup.record({ plan: { variant: '1234', level: 'basico' }, value: 0 }), null);
  assert.equal(chromaticWarmup.record({ plan: { variant: '1234', level: 'basico' }, value: 72 }).value, 72);
  assert.equal(warmupTab({ variant: '1234', position: 1, notesPerBeat: 1, outwardOnly: true }).events.length, 24);
});

/* ===== Fichas y lección: lo que dicen coincide con los datos ===== */

test('fichas de Acordes: lo que dicen se comprueba con los datos y la teoría', () => {
  // Tríada: Do suena con Do, Mi, Sol, Do y Mi.
  assert.deepEqual(notesIn(getConcept('triad').summary).slice(-5), pcsOf(getChord('C')));
  // Mi y Mim: solo cambia una nota, Sol♯ → Sol, en la 3ª cuerda.
  const diff = (a, b) => getChord(a).frets.map((f, i) => (f === getChord(b).frets[i] ? null : 6 - i)).filter(Boolean);
  assert.deepEqual(diff('E', 'Em'), [3]);
  assert.equal(mod12(midiAt(3, getChord('E').frets[3])), L.G + 1);
  assert.equal(mod12(midiAt(3, getChord('Em').frets[3])), L.G);
  // Mim: dos dedos y cuatro cuerdas al aire.
  const em = getChord('Em');
  assert.equal(em.frets.filter((f) => f === 0).length, 4);
  assert.equal(new Set(em.fingers.filter((f) => f > 0)).size, 2);
  // La7 sale de La levantando el dedo de la 3ª cuerda, que suena al aire: Sol, la 7ª menor (10 semitonos).
  assert.deepEqual(diff('A', 'A7'), [3]);
  assert.equal(getChord('A7').frets[3], 0);
  assert.equal(interval(L.A, mod12(STANDARD_TUNING[3])), 10);
  // Cejilla: el Fa con cejilla pisa las 6 cuerdas en el traste 1; el Fa mini, la 1ª y la 2ª.
  assert.deepEqual(getChord('F-barre').barre, { fret: 1, from: 6, to: 1 });
  assert.deepEqual(getChord('F-mini').barre, { fret: 1, from: 2, to: 1 });
  // Progresión: I–IV–V en Sol es Sol–Do–Re, y en Re, Re–Sol–La.
  const prog = chordsIn(getConcept('progression').summary);
  assert.deepEqual(prog, ['G', 'C', 'D', 'D', 'G', 'A']);
  for (const [key, ids] of [[L.G, prog.slice(0, 3)], [L.D, prog.slice(3)]]) {
    ['I', 'IV', 'V'].forEach((roman, i) => assert.equal(degreeChord(key, roman).root, getChord(ids[i]).root));
  }
  // Cambios: Do y Lam comparten los dedos 1 y 2 en las mismas casillas; el 3 se mueve.
  const place = (id, finger) => { const c = getChord(id); const i = c.fingers.indexOf(finger); return `${6 - i}:${c.frets[i]}`; };
  assert.equal(place('C', 1), place('Am', 1));
  assert.equal(place('C', 2), place('Am', 2));
  assert.notEqual(place('C', 3), place('Am', 3));
  // Fundamental: en Sol es Sol; y es la nota más grave.
  assert.equal(shapeNotes(getChord('G').frets)[0].midi % 12, L.G);
  // Diagrama de acorde: el de Re, que se usa de ejemplo, existe con sus dedos.
  assert.equal(getConcept('chord-diagram').diagram.chord, 'D');
});

test('lección de Acordes: cada tarjeta dice lo que enseñan sus diagramas', () => {
  const card = (id) => LESSONS.acordes.cards.find((c) => c.id === id);
  assert.equal(LESSONS.acordes.cards.length, 5);
  assert.deepEqual([card('tercera').diagram.chord, card('tercera').diagram.compare], ['E', 'Em']);
  // La y Lam: la 3ª baja de Do♯ a Do y solo cambia la 2ª cuerda, del traste 2 al 1.
  const a = getChord('A');
  const am = getChord('Am');
  const changed = a.frets.map((f, i) => (f === am.frets[i] ? null : 6 - i)).filter(Boolean);
  assert.deepEqual(changed, [2]);
  assert.deepEqual([a.frets[4], am.frets[4]], [2, 1]);
  assert.deepEqual(notesIn(card('otra-pareja').text), [L.C + 1, L.C]);
  assert.notDeepEqual(a.fingers, am.fingers); // "aunque los dedos se colocan de otra forma"
  // La 5ª, a 7 semitonos tanto en mayor como en menor; la 7ª menor, a 10.
  for (const c of CHORDS) assert.equal(interval(c.root, chordTones(c)[2]), 7, c.id);
  assert.equal(interval(L.A, chordTones(getChord('A7'))[3]), 10);
  const linked = new Set(LESSONS.acordes.cards.flatMap((c) => parseRichText(c.text).filter((p) => p.type === 'term').map((p) => p.id)));
  for (const id of ['chord', 'triad', 'root', 'open-chord', 'chord-third', 'semitone-tone', 'dominant-seventh', 'chord-diagram']) assert.ok(linked.has(id), id);
});

test('fichas de Tablatura: la forma en texto de cada esquema aparece en su explicación', () => {
  for (const id of ['hammer-on', 'pull-off', 'slide-up', 'slide-down', 'bend', 'release', 'pre-bend', 'vibrato', 'dead-note', 'ghost-note',
    'natural-harmonic', 'artificial-harmonic', 'tapping', 'trill']) {
    const c = getConcept(id);
    assert.equal(c.block, 'tablature');
    const withTech = c.diagram.tab.events.map((ev, i) => ({ ev, i }));
    const pieces = plainPieces(c.diagram.tab);
    // Las piezas con una técnica (las que llevan algo más que un número) se citan en el texto.
    const shown = pieces.filter((p) => !/^\d+$/.test(p));
    assert.ok(shown.length > 0, id);
    for (const p of shown) assert.ok(c.summary.includes(p), `${id}: «${p}» no está en la ficha`);
    assert.ok(withTech.length > 0);
  }
  assert.match(getConcept('palm-mute').summary, /PM/);
  assert.match(getConcept('let-ring').summary, /let ring/);
  assert.ok(getConcept('palm-mute').diagram.tab.spans.some((s) => s.type === 'pm'));
  assert.ok(getConcept('let-ring').diagram.tab.spans.some((s) => s.type === 'letring'));
  // Armónicos: <12> una octava, <7> octava y quinta, <5> dos octavas.
  assert.deepEqual([NATURAL_HARMONICS[12], NATURAL_HARMONICS[7], NATURAL_HARMONICS[5]], [12, 12 + 7, 24]);
  // El ejemplo de "dejar sonar" es el arpegio de Do: las notas de su forma.
  const ring = getConcept('let-ring').diagram.tab.events.slice(0, 5).map((e) => `${e.notes[0].string}:${e.notes[0].fret}`);
  const c = getChord('C');
  assert.deepEqual(ring, c.frets.map((f, i) => (f === null ? null : `${6 - i}:${f}`)).filter(Boolean));
});

test('fichas de ritmo: péndulo, acento en 2 y 4, swing 2:1 y el calentamiento con un dedo por traste', () => {
  assert.equal(getConcept('accent').diagram.pattern, 'pop-acento');
  assert.match(getConcept('accent').summary, /tiempos 2 y 4/);
  assert.equal(getConcept('swing').diagram.pattern, 'swing');
  assert.match(getConcept('swing').summary, /2:1/);
  assert.equal(getStrumPattern(getConcept('strumming').diagram.pattern).level, 'intermedio');
  const tab = getConcept('chromatic-warmup').diagram.tab;
  assert.deepEqual(tab.events.map((e) => e.notes[0].fret), warmupOutward('1234', 1).slice(0, 8).map((n) => n.fret));
  assert.deepEqual(tab.events.map((e) => e.notes[0].fret), [1, 2, 3, 4, 1, 2, 3, 4]);
});

test('textos de los ejercicios de la Fase 3: todas las plantillas se rellenan y se entienden', () => {
  const rng = createRng(21);
  for (const ex of [whichChord, buildChord, chordNotesQuiz, majorOrMinor, missingNote]) {
    for (const level of LEVEL_IDS) {
      for (let i = 0; i < 20; i++) {
        const item = ex.generate(ex.levels[level], rng, {});
        const prompt = typeof ex.prompt === 'function' ? ex.prompt(item) : ex.prompt;
        assert.ok(plainText(prompt).length > 3);
        for (const wrongAnswer of [null, ex === chordNotesQuiz ? item.answer.pcs : item.answer]) {
          const r = ex.check(item, wrongAnswer);
          for (const t of [r.label, r.feedback, r.why].filter(Boolean)) {
            for (const p of parseRichText(t)) if (p.type === 'chord') assert.ok(getChord(p.id), `${ex.id}: ${p.id}`);
            assert.ok(!/%\w+%/.test(t), `${ex.id}: plantilla sin rellenar`);
          }
        }
        assert.ok(ex.answerMarkup(item.answer).length > 0);
      }
    }
  }
  assert.equal(shapeText([null, 0, 2, 2, 1, 0]), 'x 0 2 2 1 0');
  assert.equal(joinAnd(['a', 'b', 'c']), 'a, b y c');
  assert.ok(EXERCISE_TEXTS['calentamiento.practica.cromatico'].howTo);
});
