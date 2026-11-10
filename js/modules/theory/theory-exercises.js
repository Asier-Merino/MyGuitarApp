// Ejercicios de Teoría de Escala y tonalidad (BUILD_PLAN 8, Fase 5), sin DOM: lo que se dibuja
// lo hacen las herramientas que pasa el motor en `ctx`. Escalas, acordes, grados e intervalos
// se calculan con js/core/keys.js, con el deletreo de la tonalidad (Si♭ en Fa mayor, nunca La♯).
// Afinación estándar (decidido en la Fase 5). La preferencia ♯/♭ del usuario solo decide entre
// Fa♯ y Sol♭ mayor y cómo se escribe la nota de partida de un intervalo.

import {
  MAJOR_STEPS, ROMANS, keyScale, keyChords, keyChord, nextDegreeOptions, majorScalePosition, intervalExample, chordToken,
} from '../../core/keys.js';
import { keyProgression, keyChordMidis, progressionSound } from '../../core/progressions.js';
import { KEY_PROGRESSIONS } from '../../data/progressions.js';
import { STANDARD_TUNING } from '../../core/fretboard-model.js';
import { mod12 } from '../../core/theory.js';
import { spellingPc } from '../../core/notation.js';
import { pickWeighted } from '../../core/stats.js';
import { fillTemplate, noteToken } from '../../core/glossary.js';
import { melodicSound, withoutStreak, intervalShortName } from '../../core/ear.js';
import { EXERCISE_TEXTS, UI_TEXTS } from '../../data/concepts.js';
import { joinAnd } from '../chords/common.js';
import { semitonesText, fretsText } from '../ear/common.js';
import {
  keyLevels, keyMarkup, scaleMarkup, chordsMarkup, chordValue, chordFromValue, qualityWord, fresh,
} from './common.js';

const base = (slug, props) => Object.freeze({
  id: `tonalidad.teoria.${slug}`,
  module: 'tonalidad',
  section: 'teoria',
  slug,
  tunings: 'standard',
  roundLength: 10,
  ...props,
});

/** Tiempos por pregunta (criterio de 7.5): sin límite en Básico. */
const QUICK = Object.freeze({ basico: null, intermedio: 15, avanzado: 10 });

/** Los 7 acordes de una tonalidad, con su forma abierta (para que suenen y se vean). */
const allKeyChords = (key, accidentals) => keyProgression(key, ROMANS, { accidentals });

/* ===== Construye la escala ===== */

const BUILD = EXERCISE_TEXTS['tonalidad.teoria.construye-escala'];

export const BUILD_LEVELS = keyLevels({ basico: null, intermedio: 60, avanzado: 45 }, {
  basico: { showSteps: true },
  intermedio: { showSteps: true },
  avanzado: { showSteps: false },
});

/** La escala de una vuelta de la posición, una octava subiendo (para el altavoz). */
const octaveUp = (key) => majorScalePosition(key).notes.slice(0, 8).map((n) => n.midi);

/** Mástil con la posición de la escala, la fundamental en coral y el resto en gris. */
function positionFigure(key, accidentals, ctx) {
  const pos = majorScalePosition(key, { accidentals });
  return ctx.fretboard({
    dense: true,
    fromFret: Math.max(0, pos.fromFret - 1),
    toFret: pos.toFret + 1,
    markers: pos.notes.map((n) => ({ string: n.string, fret: n.fret, pc: n.pc, spelling: n.spelling, color: n.degree === 1 ? 'root' : 'other' })),
  });
}

export const buildScale = base('construye-escala', {
  answerBy: 'tap',
  title: 'Construye la escala',
  description: 'Ves la fundamental de una tonalidad y eliges, una a una, las notas de su escala mayor.',
  howTo: BUILD.howTo,
  concepts: Object.freeze(['major-scale', 'key-spelling', 'semitone-tone']),
  prompt: (item) => fillTemplate(BUILD.prompt, { key: keyMarkup(item.tonic, item.accidentals) }),
  levels: BUILD_LEVELS,

  generate(params, rng, { stats = {}, previousKey = null, now = Date.now(), accidentals = 'sharp' }) {
    const tonic = pickWeighted([...params.keys], { keyOf: (k) => `scale:${k}`, stats, rng, avoidKey: previousKey, now });
    const scale = keyScale(tonic, { accidentals });
    return {
      key: `scale:${tonic}`,
      tonic,
      accidentals,
      scale,
      showSteps: params.showSteps,
      options: scale.slice(1).map((n) => rng.shuffle(nextDegreeOptions(n.spelling))),
      answer: { picks: scale.map((n) => n.spelling), failedAt: null },
    };
  },
  render(item, container, ctx) {
    const builder = ctx.scaleBuilder({
      scale: item.scale,
      steps: MAJOR_STEPS,
      showSteps: item.showSteps,
      options: item.options,
      onDone: (value) => ctx.answer(value),
      label: 'Escala por construir',
    });
    container.append(builder);
    return { reveal: () => builder.reveal() };
  },
  /** La respuesta es { picks: deletreos elegidos (con la fundamental), failedAt: grado (índice) del fallo o null }. */
  check(item, value) {
    const key = keyMarkup(item.tonic, item.accidentals);
    const scale = scaleMarkup(item.tonic, item.accidentals);
    const label = fillTemplate(BUILD.missLabel, { key });
    if (value && value.failedAt === null && value.picks.length === item.scale.length) return { correct: true, feedback: null, why: null, label };
    if (!value) {
      return { correct: false, feedback: fillTemplate(BUILD.feedbackTimeout, { key, scale }), why: fillTemplate(BUILD.whyTimeout, { key, scale }), label };
    }
    const i = value.failedAt;
    const chosen = value.picks[i];
    const answer = item.scale[i];
    const prev = item.scale[i - 1];
    const vars = {
      chosen: noteToken(chosen), answer: noteToken(answer.spelling), prev: noteToken(prev.spelling),
      letter: noteToken({ letter: answer.spelling.letter, accidental: 0 }), degree: i + 1, degreeBefore: i, key,
    };
    const feedback = fillTemplate(BUILD.feedbackWrong, vars);
    let why;
    if (chosen.letter !== answer.spelling.letter) {
      why = fillTemplate(spellingPc(chosen) === answer.pc ? BUILD.whySameSound : BUILD.whyOtherLetter, vars);
    } else {
      const step = MAJOR_STEPS[i - 1];
      why = fillTemplate(BUILD.whyStep, {
        ...vars, step: step === 'T' ? BUILD.stepTone : BUILD.stepSemitone, semis: semitonesText(mod12(answer.pc - prev.pc)),
      });
      const chosenSemis = mod12(spellingPc(chosen) - prev.pc);
      why += chosenSemis === 0 ? fillTemplate(BUILD.whyChosenSame, vars) : fillTemplate(BUILD.whyChosenSemis, { ...vars, chosenSemis: semitonesText(chosenSemis) });
      why += BUILD.whyFormula;
    }
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (value) => value.picks.map(noteToken).join(' '),
  sound: (item) => ({ midi: octaveUp(item.tonic) }),
  review: (item, ctx) => positionFigure(item.tonic, item.accidentals, ctx),
  statKeys: (item) => [item.key],
});

/* ===== ¿Qué grado es? ===== */

const DEGREE = EXERCISE_TEXTS['tonalidad.teoria.que-grado'];

export const DEGREE_LEVELS = keyLevels(QUICK, { basico: { options: 4 }, intermedio: { options: 7 }, avanzado: { options: 7 } });

export const whichDegree = base('que-grado', {
  title: '¿Qué grado es?',
  description: 'Ves un acorde y una tonalidad, y eliges su grado en números romanos.',
  howTo: DEGREE.howTo,
  concepts: Object.freeze(['scale-degree', 'diatonic-chords', 'key']),
  prompt: (item) => fillTemplate(DEGREE.prompt, { chord: chordToken(item.chord), key: keyMarkup(item.tonic, item.accidentals) }),
  levels: DEGREE_LEVELS,

  generate(params, rng, { stats = {}, previousKey = null, now = Date.now(), accidentals = 'sharp' }) {
    const candidates = params.keys.flatMap((tonic) => ROMANS.map((roman) => ({ tonic, roman })));
    const keyOf = (c) => `degree:${c.tonic}:${c.roman}`;
    const { tonic, roman } = pickWeighted(candidates, { keyOf, stats, rng, avoidKey: previousKey, now });
    const others = rng.shuffle(ROMANS.filter((r) => r !== roman)).slice(0, params.options - 1);
    const options = ROMANS.filter((r) => r === roman || others.includes(r));
    return { key: keyOf({ tonic, roman }), tonic, accidentals, chord: keyChord(tonic, roman, { accidentals }), answer: roman, options };
  },
  render(item, container, ctx) {
    container.append(ctx.chordLabel(item.chord, { className: 'note-label--big tonality__chord' }));
    ctx.answerButtons(item.options.map((r) => ({ value: r, label: r })));
  },
  check(item, answer) {
    const key = keyMarkup(item.tonic, item.accidentals);
    const chord = chordToken(item.chord);
    const label = fillTemplate(DEGREE.missLabel, { chord, key });
    if (answer === item.answer) return { correct: true, feedback: null, why: null, label };
    const vars = { chord, key, answer: item.answer, chosen: answer ?? '' };
    const feedback = fillTemplate(answer ? DEGREE.feedbackWrong : DEGREE.feedbackTimeout, vars);
    let why = fillTemplate(DEGREE.why, {
      ...vars, scale: scaleMarkup(item.tonic, item.accidentals), root: noteToken(item.chord.spelling), degree: item.chord.degree, quality: qualityWord(item.chord.quality),
    });
    if (answer) why += fillTemplate(DEGREE.whyChosen, { ...vars, chosenChord: chordToken(keyChord(item.tonic, answer, { accidentals: item.accidentals })) });
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (roman) => roman,
  sound: (item) => ({ strum: keyChordMidis(keyProgression(item.tonic, [item.answer])[0]) }),
  review: (item, ctx) => ctx.keyChords({ chords: allKeyChords(item.tonic, item.accidentals) }),
  statKeys: (item) => [item.key],
});

/* ===== ¿Qué acordes tiene la tonalidad? ===== */

const CHORDS_OF = EXERCISE_TEXTS['tonalidad.teoria.que-acordes'];

export const CHORDS_LEVELS = keyLevels({ basico: null, intermedio: 30, avanzado: 20 }, {
  basico: { traps: 3 }, intermedio: { traps: 3 }, avanzado: { traps: 5 },
});

/** La otra calidad con la misma fundamental: mayor ↔ menor, y el disminuido pasa a menor. */
export const TRAP_QUALITY = Object.freeze({ major: 'minor', minor: 'major', diminished: 'minor' });

export const keyChordsQuiz = base('que-acordes', {
  title: '¿Qué acordes tiene la tonalidad?',
  description: 'Ves una tonalidad y marcas sus 7 acordes entre varios.',
  howTo: CHORDS_OF.howTo,
  concepts: Object.freeze(['diatonic-chords', 'diminished-chord', 'scale-degree']),
  prompt: (item) => fillTemplate(CHORDS_OF.prompt, { key: keyMarkup(item.tonic, item.accidentals) }),
  levels: CHORDS_LEVELS,

  generate(params, rng, { stats = {}, previousKey = null, now = Date.now(), accidentals = 'sharp' }) {
    const tonic = pickWeighted([...params.keys], { keyOf: (k) => `keychords:${k}`, stats, rng, avoidKey: previousKey, now });
    const chords = keyChords(tonic, { accidentals });
    const traps = rng.sample(chords, params.traps).map((c) => ({ spelling: c.spelling, root: c.root, quality: TRAP_QUALITY[c.quality] }));
    return {
      key: `keychords:${tonic}`,
      tonic,
      accidentals,
      options: rng.shuffle([...chords, ...traps]),
      answer: chords.map(chordValue),
    };
  },
  render(item, container, ctx) {
    const toggles = ctx.choiceToggles(item.options.map((c) => ({ value: chordValue(c), content: ctx.chordLabel(c) })), { wrongText: ', elegida, no es de la tonalidad' });
    ctx.checkButton(() => ctx.answer(toggles.selected()));
    return { reveal: (result, value) => toggles.reveal(item.answer, value ?? []) };
  },
  /** La respuesta es la lista de acordes elegidos ('F#:minor'…), o null si se acabó el tiempo. */
  check(item, value) {
    const key = keyMarkup(item.tonic, item.accidentals);
    const label = fillTemplate(CHORDS_OF.missLabel, { key });
    const chosen = value ?? [];
    const extra = chosen.filter((v) => !item.answer.includes(v));
    const missing = item.answer.filter((v) => !chosen.includes(v));
    if (value && !extra.length && !missing.length) return { correct: true, feedback: null, why: null, label };
    const chords = keyChords(item.tonic, { accidentals: item.accidentals });
    const feedback = fillTemplate(value ? CHORDS_OF.feedbackWrong : CHORDS_OF.feedbackTimeout, { key, chords: chordsMarkup(chords) });
    let why = fillTemplate(CHORDS_OF.why, { key, scale: scaleMarkup(item.tonic, item.accidentals) });
    for (const v of extra) {
      const trap = chordFromValue(v);
      const real = chords.find((c) => c.root === trap.root);
      why += fillTemplate(CHORDS_OF.whyExtra, { chosen: chordToken(trap), root: noteToken(trap.spelling), correct: chordToken(real), roman: real.roman });
    }
    if (value && missing.length) why += fillTemplate(missing.length === 1 ? CHORDS_OF.whyMissingOne : CHORDS_OF.whyMissingMany, { list: joinAnd(missing.map((v) => chordToken(chordFromValue(v)))) });
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (values) => (values.length ? values.map((v) => chordToken(chordFromValue(v))).join(' ') : '—'),
  sound: (item) => progressionSound(allKeyChords(item.tonic, item.accidentals), 0.9),
  review: (item, ctx) => ctx.keyChords({ chords: allKeyChords(item.tonic, item.accidentals) }),
  statKeys: (item) => [item.key],
});

/* ===== ¿Qué intervalo hay? ===== */

const INTERVAL = EXERCISE_TEXTS['tonalidad.teoria.que-intervalo'];

/**
 * Niveles (decididos en la Fase 5): qué intervalos salen y dónde puede estar el punto 2
 * ('same': en la misma cuerda; 'near': también en las cuerdas vecinas; 'any': en cualquiera).
 */
export const INTERVAL_LEVELS = Object.freeze({
  basico: Object.freeze({ intervals: Object.freeze([1, 2, 3, 4, 7, 12]), strings: 'same', timeLimit: QUICK.basico }),
  intermedio: Object.freeze({ intervals: Object.freeze([1, 2, 3, 4, 5, 7, 8, 9, 12]), strings: 'near', timeLimit: QUICK.intermedio }),
  avanzado: Object.freeze({ intervals: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), strings: 'any', timeLimit: QUICK.avanzado }),
});
export const INTERVAL_FRETS = Object.freeze({ from: 0, to: 12 });

/** Todas las parejas de puntos a `semitones` (el 2 más agudo), dentro de los trastes 0–12. */
export function intervalPairs(semitones, strings, tuning = STANDARD_TUNING) {
  const pairs = [];
  for (let s1 = 1; s1 <= 6; s1++) {
    for (let f1 = INTERVAL_FRETS.from; f1 <= INTERVAL_FRETS.to; f1++) {
      const midi2 = tuning[s1] + f1 + semitones;
      const targets = strings === 'same' ? [s1] : strings === 'near' ? [s1 - 1, s1, s1 + 1] : [1, 2, 3, 4, 5, 6];
      for (const s2 of targets.filter((s) => s >= 1 && s <= 6)) {
        const f2 = midi2 - tuning[s2];
        if (f2 >= INTERVAL_FRETS.from && f2 <= INTERVAL_FRETS.to) pairs.push({ s1, f1, s2, f2, midi1: tuning[s1] + f1, midi2 });
      }
    }
  }
  return pairs;
}

/** El intervalo en una frase, con su artículo: «una 3ª mayor», «un tritono». */
const intervalText = (s) => {
  const name = intervalShortName(s);
  return `${s === 6 ? 'un' : 'una'} ${name[0].toLowerCase()}${name.slice(1)}`;
};
/** Con artículo determinado, para el ejemplo con notas: «la 3ª mayor», «la octava». */
const intervalTheName = (name) => `la ${name[0].toLowerCase()}${name.slice(1)}`;
const positionText = (string, fret) => fillTemplate(INTERVAL.position, { string, fret });

export const whichIntervalOnNeck = base('que-intervalo', {
  title: '¿Qué intervalo hay?',
  description: 'Ves dos puntos en el mástil y eliges el intervalo que hay entre ellos.',
  howTo: INTERVAL.howTo,
  concepts: Object.freeze(['interval', 'interval-shapes', 'tritone']),
  prompt: INTERVAL.prompt,
  levels: INTERVAL_LEVELS,

  generate(params, rng, { stats = {}, previousKey = null, now = Date.now(), accidentals = 'sharp', round = {} }) {
    const choices = withoutStreak(params.intervals, round.answers);
    const item = fresh(() => {
      const semitones = pickWeighted(choices, { keyOf: (s) => `interval:${s}`, stats, rng, now });
      const all = intervalPairs(semitones, params.strings);
      // Desde Intermedio, un tercio de las veces en la misma cuerda y el resto entre cuerdas.
      const same = all.filter((p) => p.s1 === p.s2);
      const other = all.filter((p) => p.s1 !== p.s2);
      const pool = params.strings === 'same' || !other.length || rng.next() < 1 / 3 ? same : other;
      const pair = rng.pick(pool.length ? pool : all);
      return { key: `${pair.s1}/${pair.f1}>${pair.s2}/${pair.f2}`, ...pair, semitones, accidentals, answer: semitones, options: [...params.intervals] };
    }, previousKey);
    round.answers = [...(round.answers ?? []), item.answer];
    return item;
  },
  render(item, container, ctx) {
    container.append(ctx.fretboard({ dense: true, ...pairWindow(item), markers: pairMarkers(item) }), ctx.text(UI_TEXTS.keys.pairLegend, 'practice__legend'));
    ctx.answerButtons(item.options.map((s) => ({ value: s, label: intervalShortName(s) })));
  },
  check(item, answer) {
    const label = fillTemplate(INTERVAL.missLabel, { from: positionText(item.s1, item.f1), to: positionText(item.s2, item.f2) });
    if (answer === item.answer) return { correct: true, feedback: null, why: null, label };
    const s = item.semitones;
    const vars = { answer: intervalText(s), chosen: answer ? intervalText(answer) : '', semis: semitonesText(s), frets: fretsText(s) };
    const feedback = fillTemplate(answer ? INTERVAL.feedbackWrong : INTERVAL.feedbackTimeout, vars);
    let why = fillTemplate(item.s1 === item.s2 ? INTERVAL.whySame : INTERVAL.whyOther, { ...vars, eqFret: item.f1 + s });
    const ex = intervalExample(mod12(item.midi1), s, { accidentals: item.accidentals });
    const from = noteToken(ex.from);
    if (ex.to.length === 2) {
      why += fillTemplate(INTERVAL.whyTritoneBoth, { from, to: noteToken(ex.to[0].spelling), to2: noteToken(ex.to[1].spelling) });
    } else {
      why += fillTemplate(INTERVAL.whyExample, { from, name: intervalTheName(ex.to[0].name), to: noteToken(ex.to[0].spelling) });
    }
    if (answer) why += fillTemplate(INTERVAL.whyChosen, { chosen: vars.chosen, chosenSemis: semitonesText(answer) });
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (s) => intervalShortName(s),
  sound: (item) => melodicSound([item.midi1, item.midi2]),
  review: (item, ctx) => [
    ctx.fretboard({ dense: true, ...pairWindow(item), markers: pairMarkers(item) }),
    ctx.text(UI_TEXTS.keys.pairLegend, 'practice__legend'),
  ],
  statKeys: (item) => [`interval:${item.semitones}`],
});

/**
 * Trozo de mástil alrededor de los dos puntos (6.6.7: en las preguntas con botones no se
 * enseña el mástil entero), con un traste de margen y al menos 5 trastes, dentro del 0–12.
 * Se mira sin tocarlo, así que va en tamaño «dense» y caben los botones debajo.
 */
export function pairWindow(item) {
  const fromFret = Math.max(INTERVAL_FRETS.from, Math.min(item.f1, item.f2) - 1);
  const toFret = Math.min(INTERVAL_FRETS.to, Math.max(item.f1, item.f2, fromFret + 4) + 1);
  return { fromFret: Math.max(INTERVAL_FRETS.from, Math.min(fromFret, toFret - 5)), toFret };
}

/** Los dos puntos: el 1 en ámbar y el 2 en gris, con su número (no el nombre de la nota). */
function pairMarkers(item) {
  return [
    { string: item.s1, fret: item.f1, pc: mod12(item.midi1), midi: item.midi1, text: '1', color: 'amber' },
    { string: item.s2, fret: item.f2, pc: mod12(item.midi2), midi: item.midi2, text: '2', color: 'neutral' },
  ];
}

/* ===== Completa la progresión ===== */

const COMPLETE = EXERCISE_TEXTS['tonalidad.teoria.completa-progresion'];

export const COMPLETE_LEVELS = keyLevels(QUICK);

export const completeProgression = base('completa-progresion', {
  title: 'Completa la progresión',
  description: 'A una progresión por grados le falta un acorde y eliges cuál va.',
  howTo: COMPLETE.howTo,
  concepts: Object.freeze(['progression', 'scale-degree', 'diatonic-chords']),
  prompt: (item) => fillTemplate(COMPLETE.prompt, { key: keyMarkup(item.tonic, item.accidentals) }),
  levels: COMPLETE_LEVELS,

  generate(params, rng, { stats = {}, previousKey = null, now = Date.now(), accidentals = 'sharp' }) {
    const candidates = params.keys.flatMap((tonic) => KEY_PROGRESSIONS.flatMap((prog) => prog.degrees.map((roman, missing) => ({ tonic, prog, roman, missing }))));
    const keyOf = (c) => `progression:${c.tonic}:${c.roman}`;
    const itemKey = (c) => `${c.prog.id}@${c.tonic}#${c.missing}`;
    const pick = fresh(() => {
      const c = pickWeighted(candidates, { keyOf, stats, rng, now });
      return { ...c, key: itemKey(c) };
    }, previousKey);
    const { tonic, prog, missing } = pick;
    const chords = keyProgression(tonic, prog.degrees, { accidentals });
    const answer = chords[missing];
    const scaleChords = keyChords(tonic, { accidentals });
    // Opciones: el acorde, la misma fundamental con otra calidad y otros dos de la tonalidad.
    const twin = { spelling: answer.spelling, root: answer.root, quality: TRAP_QUALITY[answer.quality] };
    const others = rng.sample(scaleChords.filter((c) => c.root !== answer.root), 2);
    return {
      key: pick.key,
      tonic,
      accidentals,
      degrees: prog.degrees,
      chords,
      missing,
      roman: answer.roman,
      statKey: keyOf(pick),
      answer: chordValue(answer),
      options: rng.shuffle([answer, twin, ...others]).map((c) => ({ value: chordValue(c), chord: c })),
    };
  },
  render(item, container, ctx) {
    const slots = ctx.progressionSlots(item.chords, item.missing);
    container.append(slots);
    ctx.answerButtons(item.options.map((o) => ({ value: o.value, label: ctx.chordLabel(o.chord) })));
    return { reveal: () => slots.fill(item.chords[item.missing]) };
  },
  check(item, answer) {
    const key = keyMarkup(item.tonic, item.accidentals);
    const label = fillTemplate(COMPLETE.missLabel, { degrees: item.degrees.join('–'), key });
    if (answer === item.answer) return { correct: true, feedback: null, why: null, label };
    const target = item.chords[item.missing];
    const vars = { key, roman: item.roman, answer: chordToken(target), chosen: answer ? chordToken(chordFromValue(answer)) : '' };
    const feedback = fillTemplate(answer ? COMPLETE.feedbackWrong : COMPLETE.feedbackTimeout, vars);
    let why = fillTemplate(COMPLETE.why, { ...vars, degree: target.degree, root: noteToken(target.spelling), quality: qualityWord(target.quality) });
    if (answer) {
      const inKey = keyChords(item.tonic, { accidentals: item.accidentals }).find((c) => chordValue(c) === answer);
      why += inKey ? fillTemplate(COMPLETE.whyChosenIn, { ...vars, chosenRoman: inKey.roman }) : fillTemplate(COMPLETE.whyChosenOut, vars);
    }
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (value) => chordToken(chordFromValue(value)),
  sound: (item) => progressionSound(item.chords),
  review: (item, ctx) => ctx.keyChords({ chords: allKeyChords(item.tonic, item.accidentals), progressions: [{ degrees: item.degrees, chords: item.chords }] }),
  statKeys: (item) => [item.statKey],
});

export const KEYS_THEORY_EXERCISES = Object.freeze([buildScale, whichDegree, keyChordsQuiz, whichIntervalOnNeck, completeProgression]);
