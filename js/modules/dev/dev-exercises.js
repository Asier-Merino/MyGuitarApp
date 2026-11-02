// Ejercicios de prueba de la Fase 1B (solo en la página #/dev): sirven para probar los
// motores de Teoría y Práctica antes de que lleguen los ejercicios de verdad (Fase 2).
// Sin DOM: lo que se dibuja lo hacen las herramientas que pasa el motor en `ctx`.

import { midiAt, positionsOf } from '../../core/fretboard-model.js';
import { mod12, interval } from '../../core/theory.js';
import { LETTER_PC, spell, spokenName } from '../../core/notation.js';
import { pickWeighted } from '../../core/stats.js';
import { fillTemplate } from '../../core/glossary.js';
import { EXERCISE_TEXTS } from '../../data/concepts.js';

const NATURAL_PCS = Object.freeze(Object.values(LETTER_PC));
const ALL_PCS = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const notePool = (naturalsOnly) => (naturalsOnly ? NATURAL_PCS : ALL_PCS);

/* ----- Teoría: ¿Qué nota es? (prueba) ----- */

const WHICH = EXERCISE_TEXTS['dev.teoria.que-nota'];
const WHICH_STRINGS = Object.freeze([6, 5]);
const WHICH_FRETS = Object.freeze({ from: 0, to: 5 });

/** Clave de estadística de una posición (BUILD_PLAN 8, Fase 2): 'note:s5f3' (+ '@afinación' si no es la estándar). */
export const positionKey = (string, fret, tuningId) =>
  `note:s${string}f${fret}${tuningId && tuningId !== 'standard' ? `@${tuningId}` : ''}`;

/** Posiciones posibles de un nivel con una afinación (MIDI por cuerda). */
export function whichNoteCandidates(params, tuning) {
  const list = [];
  for (const string of WHICH_STRINGS) {
    for (let fret = WHICH_FRETS.from; fret <= WHICH_FRETS.to; fret++) {
      const midi = midiAt(string, fret, tuning);
      const pc = mod12(midi);
      if (!params.naturalsOnly || NATURAL_PCS.includes(pc)) list.push({ string, fret, midi, pc });
    }
  }
  return list;
}

export const devWhichNote = Object.freeze({
  id: 'dev.teoria.que-nota',
  module: 'dev',
  section: 'teoria',
  slug: 'que-nota',
  title: '¿Qué nota es? (prueba)',
  description: 'Se marca un punto del mástil y eliges qué nota es. Ejercicio de prueba: cuerdas 6ª y 5ª, trastes 0 a 5.',
  howTo: WHICH.howTo,
  concepts: Object.freeze(['natural-notes', 'semitone-tone', 'open-string']),
  tunings: 'any',
  prompt: '¿Qué nota es?',
  roundLength: 10,
  levels: Object.freeze({
    basico: Object.freeze({ naturalsOnly: true, timeLimit: null, optionCount: 4 }),
    intermedio: Object.freeze({ naturalsOnly: false, timeLimit: 10, optionCount: 4 }),
    avanzado: Object.freeze({ naturalsOnly: false, timeLimit: 5, optionCount: 4 }),
  }),

  generate(params, rng, { stats = {}, previousKey = null, tuning, tuningId, now = Date.now() }) {
    const pos = pickWeighted(whichNoteCandidates(params, tuning), {
      keyOf: (c) => positionKey(c.string, c.fret, tuningId), stats, rng, avoidKey: previousKey, now,
    });
    const distractors = rng.sample(notePool(params.naturalsOnly).filter((pc) => pc !== pos.pc), params.optionCount - 1);
    return {
      key: positionKey(pos.string, pos.fret, tuningId),
      ...pos,
      answer: pos.pc,
      openPc: mod12(tuning[pos.string]),
      options: rng.shuffle([pos.pc, ...distractors]),
    };
  },

  render(item, container, ctx) {
    const board = ctx.fretboard({
      fromFret: WHICH_FRETS.from,
      toFret: WHICH_FRETS.to,
      markers: [{ string: item.string, fret: item.fret, color: 'amber', text: '?' }],
    });
    container.append(board);
    ctx.answerButtons(item.options.map((pc) => ({ value: pc, pc })));
    return {
      // El punto muestra siempre la respuesta correcta (en verde con ✓); lo elegido se marca en los botones.
      reveal() {
        board.setMarkers([{ string: item.string, fret: item.fret, pc: item.pc, state: 'correct' }]);
      },
    };
  },

  /** La respuesta es un pitch class (o null si se acabó el tiempo). Se compara por pitch class. */
  check(item, answer) {
    const vars = { answer: item.pc, string: item.string, fret: item.fret, open: item.openPc };
    const label = fillTemplate(WHICH.missLabel, vars);
    if (answer === item.pc) return { correct: true, feedback: null, why: null, label };
    const feedback = answer === null
      ? fillTemplate(WHICH.feedbackTimeout, vars)
      : fillTemplate(WHICH.feedbackWrong, { ...vars, chosen: answer });
    let why = fillTemplate(item.fret === 0 ? WHICH.whyOpen : WHICH.whyFretted, vars);
    if (answer !== null) {
      const chosenFret = interval(item.openPc, answer);
      why += fillTemplate(chosenFret === 0 ? WHICH.whyChosenOpen : WHICH.whyChosen, { chosen: answer, chosenFret });
    }
    return { correct: false, feedback, why, label };
  },

  /** Una respuesta como texto con marcado (la nota con la preferencia ♯/♭). */
  answerMarkup: (pc) => `{{pc:${pc}}}`,

  /** Lo que suena con el altavoz: la nota de la respuesta. */
  sound: (item) => ({ midi: [item.midi] }),

  /** Mástil del fallo en el resumen. */
  review(item, ctx) {
    return ctx.fretboard({
      fromFret: WHICH_FRETS.from,
      toFret: WHICH_FRETS.to,
      markers: [{ string: item.string, fret: item.fret, pc: item.pc, color: 'amber' }],
    });
  },

  statKeys: (item) => [item.key],
});

/* ----- Práctica: Nota por las 6 cuerdas (prueba) ----- */

const ALL_STRINGS = EXERCISE_TEXTS['dev.practica.seis-cuerdas'];
/** Mástil de las posiciones (trastes 0 a 12). */
const ALL_STRINGS_FRETS = Object.freeze({ from: 0, to: 12 });

export const devAllStrings = Object.freeze({
  id: 'dev.practica.seis-cuerdas',
  module: 'dev',
  section: 'practica',
  slug: 'seis-cuerdas',
  title: 'Nota por las 6 cuerdas (prueba)',
  description: 'La app dice una nota y la tocas en las seis cuerdas antes de que acabe la cuenta atrás. Ejercicio de prueba, con duración.',
  howTo: ALL_STRINGS.howTo,
  concepts: Object.freeze(['string-numbers', 'natural-notes', 'octave']),
  tunings: 'any',
  itemNoun: Object.freeze(['nota', 'notas']),
  duration: Object.freeze({ unlimited: true, default: 60 }),
  options: Object.freeze([Object.freeze({ id: 'metronome', type: 'metronome', label: 'Metrónomo', default: Object.freeze({ on: false, bpm: 60 }) })]),
  levels: Object.freeze({
    basico: Object.freeze({ naturalsOnly: true, seconds: 20 }),
    intermedio: Object.freeze({ naturalsOnly: false, seconds: 12 }),
    avanzado: Object.freeze({ naturalsOnly: false, seconds: 7 }),
  }),

  /** Práctica no tiene datos de fallo: al azar, sin repetir las dos últimas notas (7.4). */
  generate(params, rng, { recentKeys = [], tuning }) {
    const pool = notePool(params.naturalsOnly);
    const fresh = pool.filter((pc) => !recentKeys.includes(`pc:${pc}`));
    const pc = rng.pick(fresh.length ? fresh : pool);
    return {
      key: `pc:${pc}`,
      pc,
      seconds: params.seconds,
      guide: [6, 5, 4, 3, 2, 1],
      fromFret: ALL_STRINGS_FRETS.from,
      toFret: ALL_STRINGS_FRETS.to,
      positions: positionsOf(pc, { fromFret: ALL_STRINGS_FRETS.from, toFret: ALL_STRINGS_FRETS.to, tuning }),
    };
  },

  render(item, container, ctx) {
    container.append(
      ctx.noteLabel(item.pc, { className: 'note-label--huge' }),
      ctx.text(ALL_STRINGS.instruction, 'practice__instruction'),
    );
  },

  /** Lo que dice la voz: "Fa sostenido", "F sharp". */
  speech: (item, { notation, accidentals }) => spokenName(spell(item.pc, accidentals), notation),

  statKeys: () => [],
});
