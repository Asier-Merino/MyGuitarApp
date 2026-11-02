// Ejercicios de Teoría de Notas del mástil (BUILD_PLAN 8, Fase 2), sin DOM: lo que se
// dibuja lo hacen las herramientas que pasa el motor en `ctx`. Todo se calcula por MIDI a
// partir de la afinación de la ronda; las respuestas de nota se comparan por pitch class.

import { octavesOf, unisonsOf, unisonOn } from '../../core/fretboard-model.js';
import { mod12, interval } from '../../core/theory.js';
import { pickWeighted } from '../../core/stats.js';
import { fillTemplate } from '../../core/glossary.js';
import { EXERCISE_TEXTS } from '../../data/concepts.js';
import {
  NOTE_LEVELS, STRINGS_OPTION, ALL_STRINGS, notePool, isNatural, levelStrings, positionKey, tuningSuffix,
  position, positionsIn, fretsOf, fretWindow, positionText, fretsText, positionsText, positionsTextAll,
} from './common.js';

const base = (slug, props) => Object.freeze({
  id: `notas.teoria.${slug}`,
  module: 'notas',
  section: 'teoria',
  slug,
  ...props,
});

const sameSpot = (a, b) => a.string === b.string && a.fret === b.fret;

/* ===== ¿Qué nota es? (y Contrarreloj, que usa las mismas preguntas) ===== */

const WHICH = EXERCISE_TEXTS['notas.teoria.que-nota'];

/** Posiciones posibles de "¿Qué nota es?" con un nivel, unas opciones y una afinación. */
export function whichNoteCandidates(params, options, tuning) {
  return positionsIn({
    strings: levelStrings(params, options),
    fromFret: params.fromFret,
    toFret: params.toFret,
    tuning,
    filter: (p) => !params.naturalsOnly || isNatural(p.pc),
  });
}

function whichNoteGenerate(params, rng, { stats = {}, previousKey = null, tuning, tuningId, options = {}, now = Date.now() }) {
  const pos = pickWeighted(whichNoteCandidates(params, options, tuning), {
    keyOf: (c) => positionKey(c.string, c.fret, tuningId), stats, rng, avoidKey: previousKey, now,
  });
  const distractors = rng.sample(notePool(params.naturalsOnly).filter((pc) => pc !== pos.pc), params.optionCount - 1);
  return {
    key: positionKey(pos.string, pos.fret, tuningId),
    ...pos,
    answer: pos.pc,
    openPc: mod12(tuning[pos.string]),
    ...fretWindow(pos.fret, params),
    options: rng.shuffle([pos.pc, ...distractors]),
  };
}

/** Corrección y "¿Por qué?" de una nota en una posición (también para Rellena el mástil). */
export function explainPositionNote(item, answer, texts = WHICH) {
  const vars = { answer: item.pc, string: item.string, fret: item.fret, open: mod12(item.openPc) };
  const label = fillTemplate(texts.missLabel, vars);
  if (answer === item.pc) return { correct: true, feedback: null, why: null, label };
  const feedback = answer === null
    ? fillTemplate(texts.feedbackTimeout, vars)
    : fillTemplate(texts.feedbackWrong, { ...vars, chosen: answer });
  let why = fillTemplate(item.fret === 0 ? texts.whyOpen : texts.whyFretted, vars);
  if (answer !== null) {
    const chosenFret = interval(vars.open, answer);
    why += fillTemplate(chosenFret === 0 ? texts.whyChosenOpen : texts.whyChosen, { chosen: answer, chosenFret });
  }
  return { correct: false, feedback, why, label };
}

const whichNoteFns = {
  generate: whichNoteGenerate,
  render(item, container, ctx) {
    const board = ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [{ string: item.string, fret: item.fret, color: 'amber', text: '?' }],
    });
    container.append(board);
    ctx.answerButtons(item.options.map((pc) => ({ value: pc, pc })));
    return {
      reveal() {
        board.setMarkers([{ string: item.string, fret: item.fret, pc: item.pc, state: 'correct' }]);
      },
    };
  },
  check: (item, answer) => explainPositionNote(item, answer),
  answerMarkup: (pc) => `{{pc:${pc}}}`,
  sound: (item) => ({ midi: [item.midi] }),
  review(item, ctx) {
    return ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [{ string: item.string, fret: item.fret, pc: item.pc, color: 'amber' }],
    });
  },
  statKeys: (item) => [item.key],
};

const withOptions = (count) => Object.freeze(Object.fromEntries(Object.entries(NOTE_LEVELS)
  .map(([id, p]) => [id, Object.freeze({ ...p, optionCount: count })])));

export const whichNote = base('que-nota', {
  title: '¿Qué nota es?',
  description: 'Se ilumina un traste y respondes qué nota es.',
  howTo: WHICH.howTo,
  concepts: Object.freeze(['natural-notes', 'semitone-tone', 'open-string']),
  tunings: 'any',
  prompt: WHICH.prompt,
  roundLength: 10,
  options: Object.freeze([STRINGS_OPTION]),
  levels: withOptions(4),
  ...whichNoteFns,
});

/* ===== Contrarreloj: el máximo de aciertos en 60 s ===== */

const TRIAL = EXERCISE_TEXTS['notas.teoria.contrarreloj'];
export const TIME_TRIAL_SECONDS = 60;

export const timeTrial = base('contrarreloj', {
  title: 'Contrarreloj',
  description: 'Todos los aciertos que puedas en 60 segundos.',
  howTo: TRIAL.howTo,
  concepts: Object.freeze(['natural-notes', 'semitone-tone', 'open-string']),
  tunings: 'any',
  prompt: WHICH.prompt,
  roundSeconds: TIME_TRIAL_SECONDS,
  options: Object.freeze([STRINGS_OPTION]),
  // Sin tiempo por pregunta: manda el reloj de la ronda.
  levels: Object.freeze(Object.fromEntries(Object.entries(withOptions(4)).map(([id, p]) => [id, Object.freeze({ ...p, timeLimit: null })]))),
  ...whichNoteFns,
  /** Récord: aciertos en 60 s, por nivel (y afinación si no es la estándar). */
  record: ({ results, level, tuningId }) => ({
    key: `notas.teoria.contrarreloj:${level}${tuningSuffix(tuningId)}`,
    value: results.filter((r) => r.result.correct).length,
    better: 'higher',
  }),
});

/* ===== Encuéntrala y Todas en una cuerda: tocar una nota en una cuerda ===== */

const FIND = EXERCISE_TEXTS['notas.teoria.encuentrala'];
const ALL_ON = EXERCISE_TEXTS['notas.teoria.todas-en-una-cuerda'];

/** Pregunta "esta nota en esta cuerda": todas sus posiciones en la cuerda, dentro del rango. */
function noteOnStringItem(pos, { fromFret, toFret, tuning, tuningId }) {
  const frets = fretsOf(pos.pc, pos.string, { fromFret, toFret, tuning });
  return {
    key: positionKey(pos.string, pos.fret, tuningId),
    string: pos.string,
    pc: pos.pc,
    frets,
    openPc: mod12(tuning[pos.string]),
    midis: frets.map((f) => tuning[pos.string] + f),
    fromFret,
    toFret,
    tuningId,
    answer: { string: pos.string, frets },
  };
}

/** Corrección de "esta nota en esta cuerda" (Encuéntrala y Todas en una cuerda). */
function explainNoteOnString(item, chosen, texts) {
  const vars = { note: item.pc, string: item.string, where: fretsText(item.frets), open: item.openPc };
  const label = fillTemplate(texts.missLabel, vars);
  let feedback;
  if (!chosen) feedback = fillTemplate(texts.feedbackTimeout, vars);
  else if (chosen.string !== item.string) feedback = fillTemplate(texts.feedbackWrongString, { ...vars, chosenString: chosen.string });
  else feedback = fillTemplate(texts.feedbackWrong, { ...vars, chosen: mod12(item.openPc + chosen.fret), chosenFret: chosen.fret });
  const first = item.frets[0];
  let why = first === 0
    ? fillTemplate(texts.whyOpen, vars)
    : fillTemplate(texts.whyFretted, { ...vars, fret: first });
  if (item.frets.length > 1) why += fillTemplate(texts.whyOctave, { fret: item.frets[1] });
  if (chosen && chosen.string !== item.string) why += texts.whyString;
  return { correct: false, feedback, why, label };
}

const positionAnswerMarkup = (value) => (value.frets
  ? `${value.string}ª cuerda, ${fretsText(value.frets)}`
  : positionText(value));

export const findIt = base('encuentrala', {
  answerBy: 'tap',
  title: 'Encuéntrala',
  description: 'Te piden una nota en una cuerda y la tocas en el mástil.',
  howTo: FIND.howTo,
  concepts: Object.freeze(['string-numbers', 'semitone-tone', 'natural-notes']),
  tunings: 'any',
  prompt: (item) => fillTemplate(FIND.prompt, { note: item.pc, string: item.string }),
  roundLength: 10,
  options: Object.freeze([STRINGS_OPTION]),
  levels: NOTE_LEVELS,

  generate(params, rng, { stats = {}, previousKey = null, tuning, tuningId, options = {}, now = Date.now() }) {
    const pos = pickWeighted(whichNoteCandidates(params, options, tuning), {
      keyOf: (c) => positionKey(c.string, c.fret, tuningId), stats, rng, avoidKey: previousKey, now,
    });
    return noteOnStringItem(pos, { fromFret: params.fromFret, toFret: params.toFret, tuning, tuningId });
  },

  render(item, container, ctx) {
    const board = ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [],
      onTap: (string, fret) => ctx.answer({ string, fret }),
    });
    container.append(board);
    return {
      reveal(result, chosen) {
        board.setMarkers([
          ...item.frets.map((fret) => ({ string: item.string, fret, pc: item.pc, state: 'correct' })),
          ...(chosen && !result.correct ? [{ ...chosen, pc: ctx.pcAt(chosen.string, chosen.fret), state: 'wrong' }] : []),
        ]);
      },
    };
  },

  /** La respuesta es { string, fret } (o null si se acabó el tiempo). */
  check(item, chosen) {
    if (chosen && chosen.string === item.string && item.frets.includes(chosen.fret)) {
      return { correct: true, feedback: null, why: null, label: fillTemplate(FIND.missLabel, { note: item.pc, string: item.string }) };
    }
    return explainNoteOnString(item, chosen, FIND);
  },
  answerMarkup: positionAnswerMarkup,
  sound: (item) => ({ midi: [item.midis[0]] }),
  review(item, ctx) {
    return ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: item.frets.map((fret) => ({ string: item.string, fret, pc: item.pc, color: 'amber' })),
    });
  },
  statKeys: (item) => [item.key],
});

export const allOnString = base('todas-en-una-cuerda', {
  answerBy: 'tap',
  title: 'Todas en una cuerda',
  description: 'Encuentras todas las posiciones de una nota en una cuerda, del traste 0 al 12.',
  howTo: ALL_ON.howTo,
  concepts: Object.freeze(['octave', 'semitone-tone', 'string-numbers']),
  tunings: 'any',
  prompt: (item) => fillTemplate(ALL_ON.prompt, { note: item.pc, string: item.string }),
  roundLength: 10,
  options: Object.freeze([STRINGS_OPTION]),
  // Del traste 0 al 12 en los tres niveles: el nivel cambia las cuerdas, las notas y el tiempo.
  levels: Object.freeze(Object.fromEntries(Object.entries(NOTE_LEVELS).map(([id, p]) => [id, Object.freeze({ ...p, toFret: 12 })]))),

  generate(params, rng, { stats = {}, previousKey = null, tuning, tuningId, options = {}, now = Date.now() }) {
    const pos = pickWeighted(whichNoteCandidates(params, options, tuning), {
      keyOf: (c) => positionKey(c.string, c.fret, tuningId), stats, rng, avoidKey: previousKey, now,
    });
    const item = noteOnStringItem(pos, { fromFret: params.fromFret, toFret: params.toFret, tuning, tuningId });
    // La clave de la pregunta es la de su primera posición, para no repetirla seguida.
    item.key = positionKey(item.string, item.frets[0], tuningId);
    item.timeLimit = params.timeLimit ? params.timeLimit * item.frets.length : null;
    return item;
  },

  render(item, container, ctx) {
    const found = [];
    let done = false;
    const markers = () => found.map((fret) => ({ string: item.string, fret, pc: item.pc, state: 'correct' }));
    const board = ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [],
      onTap(string, fret) {
        if (done) return;
        if (string === item.string && found.includes(fret)) return;
        if (string === item.string && item.frets.includes(fret)) {
          found.push(fret);
          board.setMarkers(markers());
          if (found.length === item.frets.length) ctx.answer({ found: [...found], wrong: null });
          return;
        }
        ctx.answer({ found: [...found], wrong: { string, fret } });
      },
    });
    container.append(board);
    return {
      reveal(result, value) {
        done = true;
        board.setMarkers([
          ...item.frets.map((fret) => ({ string: item.string, fret, pc: item.pc, state: 'correct' })),
          ...(value?.wrong ? [{ ...value.wrong, pc: ctx.pcAt(value.wrong.string, value.wrong.fret), state: 'wrong' }] : []),
        ]);
      },
    };
  },

  /** La respuesta es { found, wrong } (o null si se acabó el tiempo). */
  check(item, value) {
    if (value && !value.wrong && value.found.length === item.frets.length) {
      return { correct: true, feedback: null, why: null, label: fillTemplate(ALL_ON.missLabel, { note: item.pc, string: item.string }) };
    }
    return explainNoteOnString(item, value?.wrong ?? null, ALL_ON);
  },
  answerMarkup: (value) => (value.wrong ? positionText(value.wrong) : positionAnswerMarkup(value)),
  sound: (item) => ({ midi: item.midis }),
  review(item, ctx) {
    return ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: item.frets.map((fret) => ({ string: item.string, fret, pc: item.pc, color: 'amber' })),
    });
  },
  statKeys: (item) => item.frets.map((fret) => positionKey(item.string, fret, item.tuningId)),
});

/* ===== Octavas: tocar una octava con una forma de octava (afinación estándar) ===== */

const OCT = EXERCISE_TEXTS['notas.teoria.octavas'];
/** Trastes visibles: en Básico basta hasta el 7 (las octavas de los trastes 0–5 de la 6ª y la 5ª). */
export const OCTAVE_BOARD = Object.freeze({ basico: 7, intermedio: 12, avanzado: 12 });

export const octaves = base('octavas', {
  answerBy: 'tap',
  title: 'Octavas',
  description: 'Ves una nota marcada en el mástil y tocas su octava con la forma correcta.',
  howTo: OCT.howTo,
  concepts: Object.freeze(['octave-shapes', 'octave', 'five-fret-rule']),
  tunings: 'standard',
  prompt: OCT.prompt,
  roundLength: 10,
  options: Object.freeze([STRINGS_OPTION]),
  levels: Object.freeze(Object.fromEntries(Object.entries(NOTE_LEVELS)
    .map(([id, p]) => [id, Object.freeze({ ...p, boardTo: OCTAVE_BOARD[id] })]))),

  generate(params, rng, { stats = {}, previousKey = null, tuning, tuningId, options = {}, now = Date.now() }) {
    const range = { minFret: 0, maxFret: params.boardTo };
    const candidates = whichNoteCandidates(params, options, tuning)
      .filter((p) => octavesOf(p.string, p.fret, range).length > 0);
    const pos = pickWeighted(candidates, {
      keyOf: (c) => positionKey(c.string, c.fret, tuningId), stats, rng, avoidKey: previousKey, now,
    });
    const targets = octavesOf(pos.string, pos.fret, range).map((t) => position(t.string, t.fret, tuning));
    return {
      key: positionKey(pos.string, pos.fret, tuningId),
      ...pos,
      targets,
      fromFret: 0,
      toFret: params.boardTo,
      answer: { targets },
    };
  },

  render(item, container, ctx) {
    const start = { string: item.string, fret: item.fret, pc: item.pc, color: 'amber' };
    const board = ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [start],
      onTap: (string, fret) => ctx.answer({ string, fret, midi: ctx.midiAt(string, fret) }),
    });
    container.append(board);
    return {
      reveal(result, chosen) {
        board.setMarkers([
          start,
          ...item.targets.map((t) => ({ string: t.string, fret: t.fret, pc: t.pc, state: 'correct' })),
          ...(chosen && !result.correct && !sameSpot(chosen, item) ? [{ ...chosen, pc: ctx.pcAt(chosen.string, chosen.fret), state: 'wrong' }] : []),
        ]);
      },
    };
  },

  /** La respuesta es { string, fret, midi } (o null). Vale cualquier forma de octava de 4.3. */
  check(item, chosen) {
    const vars = { note: item.pc, string: item.string, fret: item.fret, targets: positionsText(item.targets) };
    const label = fillTemplate(OCT.missLabel, vars);
    if (chosen && item.targets.some((t) => sameSpot(t, chosen))) return { correct: true, feedback: null, why: null, label };
    const feedback = fillTemplate(chosen ? OCT.feedbackWrong : OCT.feedbackTimeout, vars);
    let why = OCT.whyRule;
    if (chosen) {
      const chosenMidi = chosen.midi;
      const chosenPc = mod12(chosenMidi);
      if (sameSpot(chosen, item)) why += OCT.whySame;
      else if (chosenMidi === item.midi) why += OCT.whyUnison;
      else if (chosenPc === item.pc) why += fillTemplate(OCT.whySameNote, { chosen: chosenPc });
      else why += fillTemplate(OCT.whyOther, { chosen: chosenPc });
    }
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (value) => (value.targets ? positionsText(value.targets) : positionText(value)),
  sound: (item) => ({ midi: [item.midi, item.targets[0].midi] }),
  review(item, ctx) {
    return ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [
        { string: item.string, fret: item.fret, pc: item.pc, color: 'amber' },
        ...item.targets.map((t) => ({ string: t.string, fret: t.fret, pc: t.pc, color: 'neutral' })),
      ],
    });
  },
  statKeys: (item) => [item.key],
});

/* ===== Unísonos (Teoría): la misma nota exacta en otra cuerda ===== */

const UNI = EXERCISE_TEXTS['notas.teoria.unisonos'];

/**
 * Niveles de Unísonos (tabla de la Fase 2):
 *  Básico: el punto en la 5ª o la 4ª y el unísono en la cuerda grave de al lado.
 *  Intermedio: cualquier cuerda, hacia la de al lado en las dos direcciones.
 *  Avanzado: todos los unísonos del punto entre los trastes 0 y 15.
 */
export const UNISON_LEVELS = Object.freeze({
  basico: Object.freeze({ mode: 'lower', strings: Object.freeze([5, 4]), toFret: 12, timeLimit: null, seconds: 20 }),
  intermedio: Object.freeze({ mode: 'neighbor', strings: ALL_STRINGS, toFret: 12, timeLimit: 10, seconds: 12 }),
  avanzado: Object.freeze({ mode: 'all', strings: ALL_STRINGS, toFret: 15, timeLimit: 5, seconds: 7 }),
});

/** Cuerdas de destino posibles de un punto según el nivel. */
function unisonTargets(params, string) {
  if (params.mode === 'lower') return [string + 1];
  if (params.mode === 'neighbor') return [string + 1, string - 1].filter((s) => s >= 1 && s <= 6);
  return null;
}

/**
 * Puntos con al menos un unísono válido en el nivel: [{ ...posición, options }], donde cada
 * opción es una lista de respuestas (una sola en Básico e Intermedio; todas en Avanzado).
 */
export function unisonCandidates(params, tuning) {
  const range = { fromFret: 0, toFret: params.toFret, tuning };
  return positionsIn({ strings: params.strings, fromFret: 0, toFret: params.toFret, tuning })
    .map((p) => {
      const targets = unisonTargets(params, p.string);
      const options = targets
        ? targets.map((t) => unisonOn(p.string, p.fret, t, range)).filter(Boolean).map((u) => [u])
        : [unisonsOf(p.string, p.fret, range)].filter((list) => list.length > 0);
      return { ...p, options };
    })
    .filter((p) => p.options.length > 0);
}

/** Genera un punto y sus unísonos (lo usan Teoría y Práctica). */
export function generateUnison(params, rng, { stats = {}, previousKey = null, tuning, tuningId, now = Date.now(), weighted = true, avoidKeys = [] }) {
  const candidates = unisonCandidates(params, tuning);
  const keyOf = (c) => positionKey(c.string, c.fret, tuningId);
  let pos;
  if (weighted) {
    pos = pickWeighted(candidates, { keyOf, stats, rng, avoidKey: previousKey, now });
  } else {
    const fresh = candidates.filter((c) => !avoidKeys.includes(keyOf(c)));
    pos = rng.pick(fresh.length ? fresh : candidates);
  }
  const answers = rng.pick(pos.options).map((u) => position(u.string, u.fret, tuning));
  return {
    key: keyOf(pos),
    string: pos.string,
    fret: pos.fret,
    midi: pos.midi,
    pc: pos.pc,
    all: params.mode === 'all',
    target: params.mode === 'all' ? null : answers[0].string,
    answers,
    answer: { positions: answers },
    openMidi: tuning[pos.string],
    fromFret: 0,
    toFret: params.toFret,
    tuningId,
  };
}

export const unisonsTheory = base('unisonos', {
  answerBy: 'tap',
  title: 'Unísonos',
  description: 'Ves un punto marcado y tocas la misma nota exacta en la cuerda indicada.',
  howTo: UNI.howTo,
  concepts: Object.freeze(['unison', 'five-fret-rule']),
  tunings: 'any',
  prompt: (item) => (item.all ? UNI.promptAll : fillTemplate(UNI.prompt, { target: item.target })),
  roundLength: 10,
  levels: UNISON_LEVELS,

  generate(params, rng, ctx) {
    const item = generateUnison(params, rng, ctx);
    item.timeLimit = params.timeLimit ? params.timeLimit * item.answers.length : null;
    item.targetOpenMidi = item.target ? ctx.tuning[item.target] : null;
    return item;
  },

  render(item, container, ctx) {
    const start = { string: item.string, fret: item.fret, pc: item.pc, color: 'amber' };
    const found = [];
    let done = false;
    const board = ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [start],
      onTap(string, fret) {
        if (done || (string === item.string && fret === item.fret)) return;
        const hit = item.answers.find((a) => a.string === string && a.fret === fret);
        if (hit && found.includes(hit)) return;
        if (hit) {
          found.push(hit);
          board.setMarkers([start, ...found.map((a) => ({ string: a.string, fret: a.fret, pc: a.pc, state: 'correct' }))]);
          if (found.length === item.answers.length) ctx.answer({ found: found.length, wrong: null });
          return;
        }
        ctx.answer({ found: found.length, wrong: { string, fret, midi: ctx.midiAt(string, fret) } });
      },
    });
    container.append(board);
    return {
      reveal(result, value) {
        done = true;
        board.setMarkers([
          start,
          ...item.answers.map((a) => ({ string: a.string, fret: a.fret, pc: a.pc, state: 'correct' })),
          ...(value?.wrong ? [{ string: value.wrong.string, fret: value.wrong.fret, pc: mod12(value.wrong.midi), state: 'wrong' }] : []),
        ]);
      },
    };
  },

  /** La respuesta es { found, wrong } (o null si se acabó el tiempo). */
  check(item, value) {
    const vars = {
      note: item.pc, string: item.string, fret: item.fret,
      answers: item.all ? positionsTextAll(item.answers) : positionText(item.answers[0]),
    };
    const label = fillTemplate(UNI.missLabel, vars);
    if (value && !value.wrong && value.found === item.answers.length) return { correct: true, feedback: null, why: null, label };
    const wrong = value?.wrong ?? null;
    const feedback = fillTemplate(item.all
      ? (wrong ? UNI.feedbackWrongAll : UNI.feedbackTimeoutAll)
      : (wrong ? UNI.feedbackWrong : UNI.feedbackTimeout), vars);
    let why = fillTemplate(UNI.whyPoint, vars);
    if (item.all) {
      why += fillTemplate(UNI.whyAll, vars);
    } else {
      const answer = item.answers[0];
      const gap = item.openMidi - item.targetOpenMidi; // > 0: la cuerda de destino es más grave
      why += fillTemplate(gap > 0 ? UNI.whyLower : UNI.whyHigher, {
        ...vars, target: item.target, gap: Math.abs(gap), answerFret: answer.fret,
      });
    }
    if (wrong) {
      const chosenPc = mod12(wrong.midi);
      why += fillTemplate(chosenPc === item.pc ? UNI.whyChosenOctave : UNI.whyChosenOther, { chosen: chosenPc });
    }
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (value) => (value.wrong ? positionText(value.wrong) : positionsTextAll(value.positions)),
  sound: (item) => ({ midi: [item.midi, ...item.answers.map((a) => a.midi)] }),
  review(item, ctx) {
    return ctx.fretboard({
      fromFret: item.fromFret,
      toFret: item.toFret,
      markers: [
        { string: item.string, fret: item.fret, pc: item.pc, color: 'amber' },
        ...item.answers.map((a) => ({ string: a.string, fret: a.fret, pc: a.pc, color: 'neutral' })),
      ],
    });
  },
  statKeys: (item) => [item.key],
});

/* ===== Rellena el mástil: un puzle por ronda ===== */

const FILL = EXERCISE_TEXTS['notas.teoria.rellena'];

/** Niveles de Rellena el mástil (tabla de la Fase 2). */
export const FILL_LEVELS = Object.freeze({
  basico: Object.freeze({ strings: Object.freeze([6, 5]), twoStrings: false, naturalsOnly: true, hints: Object.freeze([0, 5, 7, 12]), timeLimit: null }),
  intermedio: Object.freeze({ strings: ALL_STRINGS, twoStrings: false, naturalsOnly: false, hints: Object.freeze([0]), timeLimit: null }),
  avanzado: Object.freeze({ strings: ALL_STRINGS, twoStrings: true, naturalsOnly: false, hints: Object.freeze([]), timeLimit: 60, twoStringsTimeLimit: 90 }),
});
export const FILL_FRETS = Object.freeze({ from: 0, to: 12 });

export const fillBoard = base('rellena', {
  title: 'Rellena el mástil',
  description: 'Completas una cuerda vacía, del traste 0 al 12.',
  howTo: FILL.howTo,
  concepts: Object.freeze(['natural-notes', 'semitone-tone', 'natural-semitones', 'octave']),
  tunings: 'any',
  runner: 'fill',
  prompt: (puzzle) => (puzzle.strings.length === 1
    ? fillTemplate(FILL.prompt, { string: puzzle.strings[0] })
    : fillTemplate(FILL.promptTwo, { a: puzzle.strings[0], b: puzzle.strings[1] })),
  levels: FILL_LEVELS,

  /** Un puzle: las cuerdas, sus casillas (dadas o por rellenar) y el tiempo (o null). */
  generate(params, rng, { tuning, tuningId }) {
    const two = params.twoStrings && rng.next() < 0.5;
    const strings = two
      ? rng.sample(params.strings, 2).sort((a, b) => b - a)
      : [rng.pick(params.strings)];
    const cells = positionsIn({ strings, fromFret: FILL_FRETS.from, toFret: FILL_FRETS.to, tuning }).map((p) => ({
      ...p,
      key: positionKey(p.string, p.fret, tuningId),
      openPc: mod12(tuning[p.string]),
      answer: p.pc,
      given: params.hints.includes(p.fret) || (params.naturalsOnly && !isNatural(p.pc)),
      fromFret: FILL_FRETS.from,
      toFret: FILL_FRETS.to,
    }));
    return {
      strings,
      cells,
      tuningId,
      timeLimit: params.timeLimit ? (two ? params.twoStringsTimeLimit : params.timeLimit) : null,
    };
  },

  /** Una casilla: la respuesta es un pitch class (o null si se acabó el tiempo). */
  check: (cell, answer) => explainPositionNote(cell, answer, FILL),
  answerMarkup: (pc) => `{{pc:${pc}}}`,
  sound: (cell) => ({ midi: [cell.midi] }),
  review(cell, ctx) {
    return ctx.fretboard({
      fromFret: cell.fromFret,
      toFret: cell.toFret,
      markers: [{ string: cell.string, fret: cell.fret, pc: cell.pc, color: 'amber' }],
    });
  },
  statKeys: (cell) => [cell.key],
  /** Récord: el tiempo de la ronda, por cuerda y nivel, solo si se termina sin fallos. */
  record({ puzzle, results, level, seconds }) {
    if (!results.length || results.some((r) => !r.result.correct)) return null;
    return {
      key: `notas.teoria.rellena:${level}:s${puzzle.strings.join('+')}${tuningSuffix(puzzle.tuningId)}`,
      value: Math.round(seconds * 10) / 10,
      better: 'lower',
    };
  },
});

export const NOTES_THEORY_EXERCISES = Object.freeze([whichNote, findIt, allOnString, octaves, unisonsTheory, fillBoard, timeTrial]);

