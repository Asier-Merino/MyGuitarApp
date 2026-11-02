// Ejercicios de Práctica de Notas del mástil (BUILD_PLAN 8, Fase 2), sin DOM. Manos libres:
// la app dice la consigna, cuenta atrás y, al acabar, enseña las posiciones. Sin datos de
// fallo (7.4): se elige al azar evitando repetir las consignas más recientes.

import { positionsOf, octavesOf } from '../../core/fretboard-model.js';
import { spell, spokenName } from '../../core/notation.js';
import { fillTemplate } from '../../core/glossary.js';
import { EXERCISE_TEXTS } from '../../data/concepts.js';
import {
  NOTE_LEVELS, STRINGS_OPTION, ALL_STRINGS, notePool, levelStrings, fretsOf, position, spokenString,
} from './common.js';
import { UNISON_LEVELS, generateUnison } from './theory-exercises.js';

/** Consignas por ronda en los ejercicios de Práctica de Notas (sin selector de duración). */
export const PRACTICE_ROUND = 12;

const METRONOME_OPTION = Object.freeze({ id: 'metronome', type: 'metronome', label: 'Metrónomo', default: Object.freeze({ on: false, bpm: 60 }) });

const base = (slug, props) => Object.freeze({
  id: `notas.practica.${slug}`,
  module: 'notas',
  section: 'practica',
  slug,
  itemNoun: Object.freeze(['nota', 'notas']),
  roundLength: PRACTICE_ROUND,
  statKeys: () => [],
  ...props,
});

const pickFresh = (rng, pool, keyOf, recentKeys) => {
  const fresh = pool.filter((x) => !recentKeys.includes(keyOf(x)));
  return rng.pick(fresh.length ? fresh : pool);
};

const noteSpeech = (pc, { notation, accidentals }) => spokenName(spell(pc, accidentals), notation);

/* ===== Nota por todas las cuerdas ===== */

const ALL = EXERCISE_TEXTS['notas.practica.todas-las-cuerdas'];
/** Las posiciones se enseñan del traste 0 al 12: en cada cuerda, la nota sale al menos una vez. */
export const ALL_STRINGS_FRETS = Object.freeze({ from: 0, to: 12 });

export const allStringsPractice = base('todas-las-cuerdas', {
  title: 'Nota por todas las cuerdas',
  description: 'La app dice una nota y la tocas en las 6 cuerdas antes de que acabe el tiempo.',
  howTo: ALL.howTo,
  concepts: Object.freeze(['string-numbers', 'natural-notes', 'octave']),
  tunings: 'any',
  options: Object.freeze([METRONOME_OPTION]),
  levels: NOTE_LEVELS,

  generate(params, rng, { recentKeys = [], tuning }) {
    const pc = pickFresh(rng, notePool(params.naturalsOnly), (x) => `pc:${x}`, recentKeys);
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
      ctx.text(ALL.instruction, 'practice__instruction'),
    );
  },
  speech: (item, prefs) => noteSpeech(item.pc, prefs),
});

/* ===== Cuerda a cuerda ===== */

const ONE = EXERCISE_TEXTS['notas.practica.cuerda-a-cuerda'];

export const STRING_OPTION = Object.freeze({
  id: 'string',
  type: 'choice',
  label: 'Cuerda',
  choices: Object.freeze([
    ...[6, 5, 4, 3, 2, 1].map((s) => Object.freeze({ value: String(s), label: `${s}ª` })),
    Object.freeze({ value: 'random', label: 'Al azar' }),
  ]),
  default: '6',
});

/** Cuerda de la ronda: la elegida o, con "Al azar", una para toda la ronda. */
export function roundString(options, rng, round) {
  if (round.string) return round.string;
  const chosen = Number(options.string);
  round.string = ALL_STRINGS.includes(chosen) ? chosen : rng.pick(ALL_STRINGS);
  return round.string;
}

export const stringByString = base('cuerda-a-cuerda', {
  title: 'Cuerda a cuerda',
  description: 'Eliges una cuerda y la app dice notas al azar para que las toques.',
  howTo: ONE.howTo,
  concepts: Object.freeze(['string-numbers', 'semitone-tone', 'natural-notes']),
  tunings: 'any',
  options: Object.freeze([STRING_OPTION, METRONOME_OPTION]),
  levels: NOTE_LEVELS,

  generate(params, rng, { recentKeys = [], tuning, options = {}, round = {} }) {
    const string = roundString(options, rng, round);
    const range = { fromFret: params.fromFret, toFret: params.toFret, tuning };
    const pool = notePool(params.naturalsOnly).filter((pc) => fretsOf(pc, string, range).length > 0);
    const pc = pickFresh(rng, pool, (x) => `pc:${x}`, recentKeys);
    return {
      key: `pc:${pc}`,
      pc,
      string,
      seconds: params.seconds,
      fromFret: params.fromFret,
      toFret: params.toFret,
      positions: fretsOf(pc, string, range).map((fret) => ({ string, fret })),
    };
  },
  render(item, container, ctx) {
    container.append(
      ctx.noteLabel(item.pc, { className: 'note-label--huge' }),
      ctx.text(fillTemplate(ONE.instruction, { string: item.string }), 'practice__instruction'),
    );
  },
  speech: (item, prefs) => noteSpeech(item.pc, prefs),
});

/* ===== Paseo de octavas (afinación estándar) ===== */

const WALK = EXERCISE_TEXTS['notas.practica.paseo-octavas'];
/** Las octavas se buscan dentro de los trastes 0 a 12. */
export const WALK_BOARD = Object.freeze({ from: 0, to: 12 });

export const octaveWalk = base('paseo-octavas', {
  title: 'Paseo de octavas',
  description: 'La app dice una nota y la tocas; después, su octava.',
  howTo: WALK.howTo,
  concepts: Object.freeze(['octave-shapes', 'octave']),
  tunings: 'standard',
  options: Object.freeze([STRINGS_OPTION, METRONOME_OPTION]),
  levels: NOTE_LEVELS,

  generate(params, rng, { recentKeys = [], tuning, options = {} }) {
    const range = { fromFret: params.fromFret, toFret: params.toFret, tuning };
    const octaveRange = { minFret: WALK_BOARD.from, maxFret: WALK_BOARD.to };
    const pairs = [];
    for (const string of levelStrings(params, options)) {
      for (const pc of notePool(params.naturalsOnly)) {
        const frets = fretsOf(pc, string, range).filter((f) => octavesOf(string, f, octaveRange).length > 0);
        if (frets.length) pairs.push({ string, pc, frets });
      }
    }
    const { string, pc, frets } = pickFresh(rng, pairs, (x) => `pc:${x.pc}@s${x.string}`, recentKeys);
    const starts = frets.map((fret) => position(string, fret, tuning));
    const octaves = [];
    for (const s of starts) {
      for (const o of octavesOf(s.string, s.fret, octaveRange)) {
        if (!octaves.some((x) => x.string === o.string && x.fret === o.fret)) octaves.push(position(o.string, o.fret, tuning));
      }
    }
    return {
      key: `pc:${pc}@s${string}`,
      pc,
      string,
      seconds: params.seconds,
      fromFret: WALK_BOARD.from,
      toFret: WALK_BOARD.to,
      positions: [...starts, ...octaves],
      markers: [
        ...starts.map((p) => ({ string: p.string, fret: p.fret, pc: p.pc, color: 'amber' })),
        ...octaves.map((p) => ({ string: p.string, fret: p.fret, text: '8', color: 'neutral' })),
      ],
      legend: WALK.legend,
    };
  },
  render(item, container, ctx) {
    container.append(
      ctx.noteLabel(item.pc, { className: 'note-label--huge' }),
      ctx.text(fillTemplate(WALK.instruction, { string: item.string }), 'practice__instruction'),
    );
  },
  speech: (item, prefs) => fillTemplate(prefs.notation === 'en' ? WALK.speechEn : WALK.speechEs, {
    note: noteSpeech(item.pc, prefs), string: spokenString(item.string, prefs.notation),
  }),
});

/* ===== Unísonos (Práctica) ===== */

const UNI = EXERCISE_TEXTS['notas.practica.unisonos'];

export const unisonsPractice = base('unisonos', {
  title: 'Unísonos',
  description: 'La app dice un punto del mástil; lo tocas y después su unísono en la cuerda de al lado.',
  howTo: UNI.howTo,
  concepts: Object.freeze(['unison', 'five-fret-rule']),
  tunings: 'any',
  itemNoun: Object.freeze(['punto', 'puntos']),
  options: Object.freeze([METRONOME_OPTION]),
  levels: UNISON_LEVELS,

  generate(params, rng, { recentKeys = [], tuning, tuningId }) {
    const u = generateUnison(params, rng, { tuning, tuningId, weighted: false, avoidKeys: recentKeys });
    return {
      ...u,
      seconds: params.seconds,
      positions: [{ string: u.string, fret: u.fret }, ...u.answers.map((a) => ({ string: a.string, fret: a.fret }))],
      markers: [
        { string: u.string, fret: u.fret, pc: u.pc, color: 'amber' },
        ...u.answers.map((a) => ({ string: a.string, fret: a.fret, pc: a.pc, color: 'neutral' })),
      ],
      legend: UNI.legend,
      // Al enseñar la solución suenan el punto y su unísono, para oír que son iguales.
      revealSound: [u.midi, ...u.answers.map((a) => a.midi)],
    };
  },
  render(item, container, ctx) {
    container.append(
      ctx.text(fillTemplate(UNI.point, { string: item.string, fret: item.fret }), 'practice__big'),
      ctx.text(item.all ? UNI.instructionAll : fillTemplate(UNI.instruction, { target: item.target }), 'practice__instruction'),
    );
  },
  speech: (item, { notation }) => fillTemplate(notation === 'en' ? UNI.speechEn : UNI.speechEs, {
    string: spokenString(item.string, notation), fret: item.fret,
  }),
});

export const NOTES_PRACTICE_EXERCISES = Object.freeze([allStringsPractice, stringByString, octaveWalk, unisonsPractice]);

