// Fase 4: módulo Oído. Lo que suena (notas, intervalos y acordes) se comprueba con la teoría
// (MIDI, tabla 4.3 de intervalos, fórmulas de acorde), y lo que dicen sus fichas y ayudas,
// con los datos de cada nivel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EAR_RANGE, chordSound, melodicSound, notePair, startNotes, withoutStreak, intervalName, intervalShortName, pairOnOneString, positionsOfMidi,
  SLOW_STRUM_SPACING, STRUM_SPACING, ARPEGGIO_GAP,
} from '../js/core/ear.js';
import { earMajorMinor, higherOrLower, whichInterval, EAR_TIME, QUALITY_LEVELS, PITCH_LEVELS, INTERVAL_LEVELS } from '../js/modules/ear/theory-exercises.js';
import { findTheNote, mimicChord, FIND_LEVELS, MIMIC_SECONDS, findCandidates, EAR_PRACTICE_ROUND } from '../js/modules/ear/practice-exercises.js';
import { getExercise, validateExercise, findExercise, isPlayable } from '../js/engine/exercise-registry.js';
import { PLANNED_EXERCISES, LEVEL_IDS, getModule, isAvailable } from '../js/data/modules.js';
import { getChord, chordsForLevel, chordMidis, chordTones } from '../js/data/chords.js';
import { TUNINGS } from '../js/data/tunings.js';
import { INTERVALS, CHORD_FORMULAS, SCALE_FORMULAS, mod12 } from '../js/core/theory.js';
import { midiAt, STANDARD_TUNING, shapeNotes } from '../js/core/fretboard-model.js';
import { LETTER_PC } from '../js/core/notation.js';
import { createRng } from '../js/core/random.js';
import { getConcept, EXERCISE_TEXTS } from '../js/data/concepts.js';
import { fretboardDiagramPoints } from '../js/core/diagrams.js';
import { plainText } from '../js/core/glossary.js';

const NATURALS = Object.values(LETTER_PC);
const ROUNDS = 200;
const ids = (chords) => chords.map((c) => c.id);
const semisOf = (name) => INTERVALS.find((i) => i.name === name).semitones;

/** Juega `n` preguntas seguidas de un ejercicio de Teoría, como el motor (misma ronda, pregunta anterior). */
function playRound(exercise, level, n, seed) {
  const rng = createRng(seed);
  const round = {};
  const items = [];
  let previousKey = null;
  for (let i = 0; i < n; i++) {
    const item = exercise.generate(exercise.levels[level], rng, { stats: {}, previousKey, round, now: 0 });
    items.push(item);
    previousKey = item.key;
  }
  return items;
}

/* ===== Datos y sonido ===== */

test('el registro de oído va de la 6ª cuerda al aire a la 1ª en el traste 12 (estándar)', () => {
  assert.equal(EAR_RANGE.low, midiAt(6, 0));
  assert.equal(EAR_RANGE.high, midiAt(1, 12));
});

test('parejas de notas: la segunda está justo a esos semitonos, hacia arriba o abajo, y las dos en el registro', () => {
  const rng = createRng(1);
  for (let s = 1; s <= 12; s++) {
    for (const direction of ['up', 'down']) {
      assert.ok(startNotes(s, direction).length > 0);
      for (let i = 0; i < 30; i++) {
        const p = notePair(s, direction, rng);
        assert.equal(p.second - p.first, direction === 'up' ? s : -s);
        for (const m of [p.first, p.second]) assert.ok(m >= EAR_RANGE.low && m <= EAR_RANGE.high, `${m}`);
      }
    }
  }
  assert.throws(() => notePair(0, 'up', rng));
  assert.throws(() => notePair(13, 'up', rng));
});

test('nombres de intervalo de la tabla 4.3', () => {
  assert.equal(intervalName(3), '3ª menor');
  assert.equal(intervalName(4), '3ª mayor');
  assert.equal(intervalName(7), '5ª justa');
  assert.equal(intervalName(12), 'Octava');
  assert.match(intervalName(6), /^Tritono/);
  // En los botones, sin el paréntesis.
  assert.equal(intervalShortName(6), 'Tritono');
  for (let n = 1; n <= 12; n++) if (n !== 6) assert.equal(intervalShortName(n), intervalName(n));
});

test('sonido de los acordes: rasgueo lento, arpegio y arpegio + rasgueo, de la cuerda grave a la aguda', () => {
  const midis = chordMidis(getChord('C'));
  const slow = chordSound(midis, 'strum-slow');
  assert.deepEqual(slow.events.map((e) => e.midi), midis);
  slow.events.forEach((e, i) => assert.ok(Math.abs(e.at - i * SLOW_STRUM_SPACING) < 1e-9));
  assert.ok(SLOW_STRUM_SPACING > STRUM_SPACING, 'el lento es más lento que el normal');
  const arp = chordSound(midis, 'arpeggio');
  arp.events.forEach((e, i) => assert.ok(Math.abs(e.at - i * ARPEGGIO_GAP) < 1e-9));
  const both = chordSound(midis, 'arpeggio-strum');
  assert.equal(both.events.length, midis.length * 2);
  assert.deepEqual(both.events.slice(midis.length).map((e) => e.midi), midis);
  assert.ok(both.events[midis.length].at > arp.events.at(-1).at, 'el rasgueo va después del arpegio');
  for (const plan of [slow, arp, both]) assert.ok(plan.seconds > Math.max(...plan.events.map((e) => e.at)));
  // Las notas del plan son las del acorde.
  for (const e of both.events) assert.ok(chordTones(getChord('C')).includes(mod12(e.midi)));
  assert.throws(() => chordSound(midis, 'otra'));
  const mel = melodicSound([45, 52]);
  assert.deepEqual(mel.events.map((e) => e.midi), [45, 52]);
  assert.ok(mel.events[1].at > 0);
});

test('la misma respuesta no sale 3 veces seguidas', () => {
  assert.deepEqual(withoutStreak(['a', 'b'], ['a', 'a']), ['b']);
  assert.deepEqual(withoutStreak(['a', 'b'], ['a', 'b']), ['a', 'b']);
  assert.deepEqual(withoutStreak(['a', 'b'], ['b']), ['a', 'b']);
  assert.deepEqual(withoutStreak(['a'], ['a', 'a']), ['a']);
});

test('dos notas en una misma cuerda: cada traste da su MIDI exacto', () => {
  for (let low = EAR_RANGE.low; low <= EAR_RANGE.high; low++) {
    for (let s = 1; s <= 12 && low + s <= EAR_RANGE.high; s++) {
      const { string, low: a, high: b } = pairOnOneString(low, low + s, STANDARD_TUNING);
      assert.equal(midiAt(string, a.fret), low);
      assert.equal(midiAt(string, b.fret), low + s);
      assert.equal(b.fret - a.fret, s, 'en una cuerda, un traste = un semitono');
    }
  }
});

test('posiciones de una nota exacta: coinciden con la búsqueda por fuerza bruta en las 7 afinaciones', () => {
  for (const t of TUNINGS) {
    for (let midi = 30; midi <= 80; midi++) {
      const brute = [];
      for (const s of [6, 5, 4, 3, 2, 1]) for (let f = 0; f <= 12; f++) if (midiAt(s, f, t.midi) === midi) brute.push({ string: s, fret: f });
      assert.deepEqual(positionsOfMidi(midi, { tuning: t.midi }), brute, `${t.id} ${midi}`);
    }
  }
});

/* ===== Registro y niveles ===== */

test('los 5 ejercicios de la Fase 4 se pueden jugar y coinciden con su anuncio', () => {
  const planned = PLANNED_EXERCISES.filter((e) => e.phase === 4);
  assert.equal(planned.length, 5);
  for (const p of planned) {
    const def = getExercise(p.id);
    assert.ok(def, p.id);
    assert.deepEqual(validateExercise(def), [], p.id);
    assert.equal(def.title, p.title, p.id);
    assert.equal(def.description, p.description, p.id);
    assert.deepEqual(def.tunings, p.tunings, p.id);
    assert.ok(isPlayable(findExercise({ section: p.section, module: p.module, exercise: p.slug })), p.id);
    assert.equal(def.needsSound, true, `${p.id}: necesita sonido`);
  }
  assert.ok(isAvailable(getModule('oido')));
  // Teoría: suena cada pregunta. Práctica: suena cada consigna y no hay voz (diría la respuesta).
  for (const ex of [earMajorMinor, higherOrLower, whichInterval]) assert.equal(typeof ex.questionSound, 'function', ex.id);
  for (const ex of [findTheNote, mimicChord]) {
    assert.equal(typeof ex.itemSound, 'function', ex.id);
    assert.equal(ex.voice, false, ex.id);
    assert.equal(ex.roundLength, EAR_PRACTICE_ROUND);
  }
  assert.equal(EAR_PRACTICE_ROUND, 12);
  assert.equal(findTheNote.tunings, 'any');
  assert.equal(mimicChord.tunings, 'standard');
});

test('tiempo por pregunta: sin límite, 15 s y 10 s; 10 preguntas por ronda', () => {
  assert.deepEqual(LEVEL_IDS.map((l) => EAR_TIME[l]), [null, 15, 10]);
  for (const ex of [earMajorMinor, higherOrLower, whichInterval]) {
    assert.equal(ex.roundLength, 10);
    for (const l of LEVEL_IDS) assert.equal(ex.levels[l].timeLimit, EAR_TIME[l], `${ex.id} ${l}`);
  }
});

/* ===== ¿Mayor o menor? (de oído) ===== */

test('¿Mayor o menor?: acordes del nivel, solo mayores y menores hasta Intermedio, y séptimas en Avanzado', () => {
  assert.deepEqual(QUALITY_LEVELS.basico.chords, ids(chordsForLevel('basico')));
  assert.deepEqual(QUALITY_LEVELS.intermedio.chords, ids(chordsForLevel('intermedio').filter((c) => c.quality !== 'dom7')));
  assert.ok(QUALITY_LEVELS.intermedio.chords.includes('F-mini'));
  assert.deepEqual(QUALITY_LEVELS.avanzado.chords, ids(chordsForLevel('avanzado')));
  assert.deepEqual(LEVEL_IDS.map((l) => QUALITY_LEVELS[l].mode), ['strum-slow', 'arpeggio', 'arpeggio-strum']);
  for (const level of LEVEL_IDS) {
    const items = playRound(earMajorMinor, level, ROUNDS, 3);
    const expected = level === 'avanzado' ? ['major', 'minor', 'dom7'] : ['major', 'minor'];
    for (const [i, item] of items.entries()) {
      assert.deepEqual(item.options, expected);
      assert.equal(item.answer, item.chord.quality);
      assert.ok(QUALITY_LEVELS[level].chords.includes(item.chord.id));
      // Lo que suena son las notas del acorde de la biblioteca.
      assert.deepEqual(earMajorMinor.questionSound(item).events.map((e) => e.midi).slice(0, chordMidis(item.chord).length), chordMidis(item.chord));
      if (i > 0) assert.notEqual(item.chord.id, items[i - 1].chord.id, 'el mismo acorde dos veces seguidas');
      if (i > 1) assert.ok(!(item.answer === items[i - 1].answer && item.answer === items[i - 2].answer), 'tres respuestas iguales seguidas');
    }
    // Salen todas las calidades del nivel.
    assert.deepEqual([...new Set(items.map((x) => x.answer))].sort(), [...expected].sort());
  }
});

test('¿Mayor o menor?: corrección y «¿Por qué?» con la 3ª del acorde', () => {
  const item = { chord: getChord('Am'), answer: 'minor', mode: 'strum-slow' };
  assert.equal(earMajorMinor.check(item, 'minor').correct, true);
  const r = earMajorMinor.check(item, 'major');
  assert.equal(r.correct, false);
  assert.match(plainText(r.why), /3 semitonos/);
  assert.equal(plainText(r.feedback).split('.')[0], 'No es mayor: es menor');
  const t = earMajorMinor.check({ chord: getChord('E7'), answer: 'dom7', mode: 'arpeggio' }, null);
  assert.match(plainText(t.feedback), /Se acabó el tiempo/);
  assert.match(plainText(t.why), /10 semitonos/);
});

/* ===== ¿Más agudo o más grave? ===== */

test('¿Más agudo o más grave?: la distancia del nivel y la respuesta según la altura real', () => {
  assert.deepEqual(LEVEL_IDS.map((l) => [PITCH_LEVELS[l].minSemitones, PITCH_LEVELS[l].maxSemitones]), [[5, 12], [2, 4], [1, 2]]);
  for (const level of LEVEL_IDS) {
    const items = playRound(higherOrLower, level, ROUNDS, 5);
    for (const [i, item] of items.entries()) {
      const diff = item.second - item.first;
      assert.ok(Math.abs(diff) >= PITCH_LEVELS[level].minSemitones && Math.abs(diff) <= PITCH_LEVELS[level].maxSemitones);
      assert.equal(item.answer, diff > 0 ? 'higher' : 'lower');
      assert.deepEqual(higherOrLower.questionSound(item).events.map((e) => e.midi), [item.first, item.second]);
      if (i > 0) assert.notEqual(item.key, items[i - 1].key);
      if (i > 1) assert.ok(!(item.answer === items[i - 1].answer && item.answer === items[i - 2].answer));
    }
    assert.deepEqual([...new Set(items.map((x) => x.answer))].sort(), ['higher', 'lower']);
  }
});

test('¿Más agudo o más grave?: el «¿Por qué?» da los semitonos y los trastes reales', () => {
  const r = higherOrLower.check({ first: 45, second: 48, semitones: 3, direction: 'up', answer: 'higher' }, 'lower');
  assert.match(plainText(r.why), /3 semitonos por encima/);
  assert.match(plainText(r.why), /3 trastes hacia el cuerpo/);
  const d = higherOrLower.check({ first: 50, second: 49, semitones: 1, direction: 'down', answer: 'lower' }, 'higher');
  assert.match(plainText(d.why), /1 semitono por debajo/);
  assert.match(plainText(d.why), /1 traste hacia la cejuela/);
});

/* ===== ¿Qué intervalo es? ===== */

test('¿Qué intervalo es?: intervalos de cada nivel (3ªM, 5ª y 8ª; + 3ªm; todos de la 2ª menor a la octava)', () => {
  const names = (l) => INTERVAL_LEVELS[l].intervals.map(intervalName);
  assert.deepEqual(names('basico'), ['3ª mayor', '5ª justa', 'Octava']);
  assert.deepEqual(names('intermedio'), ['3ª menor', '3ª mayor', '5ª justa', 'Octava']);
  assert.deepEqual(INTERVAL_LEVELS.avanzado.intervals, INTERVALS.filter((i) => i.semitones > 0).map((i) => i.semitones));
  for (const level of LEVEL_IDS) {
    const items = playRound(whichInterval, level, ROUNDS, 7);
    for (const [i, item] of items.entries()) {
      assert.equal(Math.abs(item.second - item.first), item.answer);
      assert.ok(INTERVAL_LEVELS[level].intervals.includes(item.answer));
      assert.deepEqual(item.options, [...INTERVAL_LEVELS[level].intervals]);
      if (level !== 'avanzado') assert.equal(item.direction, 'up');
      if (i > 0) assert.notEqual(item.key, items[i - 1].key);
      if (i > 1) assert.ok(!(item.answer === items[i - 1].answer && item.answer === items[i - 2].answer));
    }
    assert.equal(new Set(items.map((x) => x.answer)).size, INTERVAL_LEVELS[level].intervals.length, `${level}: salen todos`);
    if (level === 'avanzado') assert.deepEqual([...new Set(items.map((x) => x.direction))].sort(), ['down', 'up']);
  }
});

test('¿Qué intervalo es?: corrección y «¿Por qué?» con los semitonos de la tabla 4.3', () => {
  const item = { first: 45, second: 49, semitones: 4, direction: 'up', answer: 4 };
  assert.equal(whichInterval.check(item, 4).correct, true);
  const r = whichInterval.check(item, 3);
  assert.equal(plainText(r.feedback), 'No es una 3ª menor: es una 3ª mayor.');
  assert.match(plainText(r.why), /4 semitonos por encima/);
  assert.match(plainText(r.why), /que son 3 semitonos/);
  assert.match(plainText(r.why), /más luminosa/);
  const o = whichInterval.check({ first: 60, second: 48, semitones: 12, direction: 'down', answer: 12 }, 7);
  assert.equal(plainText(o.feedback), 'No es una 5ª justa: es una octava.');
  assert.match(plainText(whichInterval.check({ first: 45, second: 51, semitones: 6, direction: 'up', answer: 6 }, 7).feedback), /es un tritono/);
  assert.match(plainText(o.why), /12 semitonos por debajo/);
  // El nombre que da el texto coincide con los semitonos de la tabla.
  for (let s = 1; s <= 12; s++) {
    const w = whichInterval.check({ first: 45, second: 45 + s, semitones: s, direction: 'up', answer: s }, null);
    assert.match(plainText(w.why), new RegExp(`${s} semitonos? por encima`));
    assert.equal(semisOf(intervalName(s)), s);
  }
});

/* ===== Encuentra la nota ===== */

test('Encuentra la nota: cuerdas, trastes y notas de cada nivel, en las 7 afinaciones', () => {
  assert.deepEqual(FIND_LEVELS.basico.strings, [6, 5]);
  assert.deepEqual(LEVEL_IDS.map((l) => FIND_LEVELS[l].seconds), [30, 20, 15]);
  assert.deepEqual(LEVEL_IDS.map((l) => FIND_LEVELS[l].hint), [true, true, false]);
  for (const t of TUNINGS) {
    for (const level of LEVEL_IDS) {
      const params = FIND_LEVELS[level];
      for (const c of findCandidates(params, t.midi)) {
        assert.ok(params.strings.includes(c.string));
        assert.ok(c.fret >= params.fromFret && c.fret <= params.toFret);
        assert.equal(c.midi, midiAt(c.string, c.fret, t.midi));
        if (params.naturalsOnly) assert.ok(NATURALS.includes(mod12(c.midi)));
      }
      const rng = createRng(9);
      let recentKeys = [];
      for (let i = 0; i < 60; i++) {
        const item = findTheNote.generate(params, rng, { recentKeys, tuning: t.midi, tuningId: t.id });
        assert.ok(!recentKeys.includes(item.key), 'repite una de las dos últimas');
        recentKeys = [...recentKeys, item.key].slice(-2);
        // Todas las posiciones de la solución suenan exactamente igual que la nota.
        assert.ok(item.positions.length > 0);
        for (const p of item.positions) assert.equal(midiAt(p.string, p.fret, t.midi), item.midi);
        assert.deepEqual(findTheNote.itemSound(item).events.map((e) => e.midi), [item.midi]);
        if (params.hint) {
          assert.ok(params.strings.includes(item.string));
          const hinted = item.markers.filter((m) => m.color === 'amber');
          assert.equal(hinted.length, 1);
          assert.equal(hinted[0].string, item.string);
          assert.ok(hinted[0].fret >= params.fromFret && hinted[0].fret <= params.toFret);
          // La leyenda solo habla de otras cuerdas si la nota está en otras cuerdas.
          assert.equal(/En gris/.test(item.legend), item.positions.length > 1);
        } else {
          assert.equal(item.string, null);
          assert.ok(item.markers.every((m) => m.color === 'amber'));
        }
      }
    }
  }
});

/* ===== Imita el acorde ===== */

test('Imita el acorde: acordes del nivel (Fase 3), tiempo 20/15/12 s y suena el acorde de la biblioteca', () => {
  assert.deepEqual(LEVEL_IDS.map((l) => MIMIC_SECONDS[l]), [20, 15, 12]);
  for (const level of LEVEL_IDS) {
    const params = mimicChord.levels[level];
    assert.deepEqual(params.chords, ids(chordsForLevel(level)));
    const rng = createRng(4);
    let recentKeys = [];
    for (let i = 0; i < 60; i++) {
      const item = mimicChord.generate(params, rng, { recentKeys });
      assert.ok(!recentKeys.includes(item.key));
      recentKeys = [...recentKeys, item.key].slice(-2);
      assert.equal(item.seconds, MIMIC_SECONDS[level]);
      assert.deepEqual(mimicChord.itemSound(item).events.map((e) => e.midi), shapeNotes(item.chord.frets).map((n) => n.midi));
    }
  }
});

/* ===== Lo que dicen las ayudas y las fichas ===== */

test('las ayudas «Cómo se juega» dicen los tiempos y rangos de cada nivel', () => {
  const T = EXERCISE_TEXTS;
  const quality = plainText(T['oido.teoria.mayor-menor'].howTo);
  assert.match(quality, new RegExp(`${EAR_TIME.intermedio} segundos`));
  assert.match(quality, new RegExp(`${EAR_TIME.avanzado} segundos`));
  assert.match(quality, new RegExp(`los ${chordsForLevel('basico').length} acordes básicos`));
  const pitch = plainText(T['oido.teoria.agudo-grave'].howTo);
  for (const l of LEVEL_IDS) {
    const { minSemitones: a, maxSemitones: b } = PITCH_LEVELS[l];
    assert.match(pitch, new RegExp(l === 'avanzado' ? `${a} o ${b} semitonos` : `de ${a} a ${b}`));
  }
  const find = plainText(T['oido.practica.encuentra-la-nota'].howTo);
  for (const l of LEVEL_IDS) assert.match(find, new RegExp(`${FIND_LEVELS[l].seconds} segundos`));
  assert.match(find, new RegExp(`del traste ${FIND_LEVELS.basico.fromFret} al ${FIND_LEVELS.basico.toFret}`));
  const mimic = plainText(T['oido.practica.imita-el-acorde'].howTo);
  for (const l of LEVEL_IDS) assert.match(mimic, new RegExp(`${MIMIC_SECONDS[l]} segundos`));
  // "la nota más grave, que en estos acordes es la fundamental": cierto en toda la biblioteca.
  for (const c of chordsForLevel('avanzado')) assert.equal(mod12(Math.min(...chordMidis(c))), c.root, c.id);
});

test('fichas de intervalos: lo que dicen coincide con la teoría', () => {
  const sound = (id) => getConcept(id).sound.midi;
  // Intervalo: el ejemplo (7 trastes) es una 5ª justa.
  const [a, b] = sound('interval');
  assert.equal(intervalName(b - a), '5ª justa');
  // Agudo y grave: la 6ª es la más grave y la 1ª la más aguda; el traste 12 es la octava.
  assert.ok([5, 4, 3, 2, 1].every((s) => STANDARD_TUNING[s] > STANDARD_TUNING[s + 1]));
  const [p, q] = sound('pitch');
  assert.equal(p, midiAt(6, 0));
  assert.equal(q - p, 12);
  // 3ªs: desde la 5ª al aire, traste 3 = 3ª menor, traste 4 = 3ª mayor.
  const [r, m3, M3] = sound('third-interval');
  assert.equal(r, midiAt(5, 0));
  assert.equal(intervalName(m3 - r), '3ª menor');
  assert.equal(intervalName(M3 - r), '3ª mayor');
  // 5ª justa: 7 semitonos; en la cuerda aguda de al lado, 2 trastes más (3 de la 3ª a la 2ª).
  const [f1, f2] = sound('perfect-fifth');
  assert.equal(intervalName(f2 - f1), '5ª justa');
  for (const s of [6, 5, 4, 3, 2]) {
    const shift = s === 3 ? 3 : 2;
    assert.equal(midiAt(s - 1, 5 + shift) - midiAt(s, 5), 7, `de la ${s}ª a la ${s - 1}ª`);
  }
  for (const q2 of ['major', 'minor']) assert.ok(CHORD_FORMULAS[q2].includes(7));
  // Tritono: 6 semitonos, la mitad de la octava, tres tonos; la blue note (b5) está a 6.
  const [t1, t2] = sound('tritone');
  assert.match(intervalName(t2 - t1), /^Tritono/);
  assert.equal((t2 - t1) * 2, 12);
  assert.ok(SCALE_FORMULAS.blues.includes(6));
});

test('esquemas de los intervalos: el punto de partida en ámbar y los trastes de su sonido', () => {
  for (const id of ['interval', 'pitch', 'third-interval', 'perfect-fifth', 'tritone']) {
    const c = getConcept(id);
    assert.equal(c.block, 'intervals');
    const { points } = fretboardDiagramPoints(c);
    assert.deepEqual(points.map((pt) => pt.midi), c.sound.midi, id);
    assert.equal(points[0].color, 'amber', id);
    assert.ok(points.slice(1).every((pt) => pt.color === 'neutral'), id);
  }
  // Las leyendas dicen los trastes que hay.
  const frets = (id) => fretboardDiagramPoints(getConcept(id)).points.map((pt) => pt.fret);
  assert.deepEqual(frets('interval'), [0, 7]);
  assert.deepEqual(frets('pitch'), [0, 12]);
  assert.deepEqual(frets('third-interval'), [0, 3, 4]);
  assert.deepEqual(frets('perfect-fifth'), [0, 7]);
  assert.deepEqual(frets('tritone'), [0, 6]);
});
