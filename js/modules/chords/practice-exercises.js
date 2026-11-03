// Ejercicios de Práctica de Acordes abiertos (BUILD_PLAN 8, Fase 3, 6.6.11 y 6.6.12), sin DOM.
// "Cambios de acordes" y "Rasgueo" los juega el motor de acordes (engine/chord-runner.js):
// la progresión en bucle, con metrónomo, durante la duración elegida. "Cambios en un
// minuto" tiene su propio motor (60 s fijos y récord por pareja). "Acorde cantado" usa el
// motor de Práctica normal (consigna, cuenta atrás y diagrama al acabar).

import { getChord, chordsForLevel, CHORD_SPOKEN, chordSpelling } from '../../data/chords.js';
import { spokenName } from '../../core/notation.js';
import { resolveProgressionChoice, PRESETS } from '../../core/progressions.js';
import { STRUM_TEMPO, levelPatterns, getStrumPattern } from '../../data/strum-patterns.js';
import { EXERCISE_TEXTS } from '../../data/concepts.js';
import { SHOW_DIAGRAMS_OPTION, chordKey } from './common.js';

const base = (slug, props) => Object.freeze({
  id: `acordes.practica.${slug}`,
  module: 'acordes',
  section: 'practica',
  slug,
  tunings: 'standard',
  statKeys: () => [],
  ...props,
});

/** Nombre hablado de un acorde: "La menor", "Mi siete", "A minor". */
export function chordSpeech(chord, { notation = 'es' } = {}) {
  const lang = notation === 'en' ? 'en' : 'es';
  return spokenName(chordSpelling(chord)[0], lang) + CHORD_SPOKEN[lang][chord.quality];
}

const PROGRESSION_OPTION = Object.freeze({ id: 'progression', type: 'progression', label: 'Progresión', default: PRESETS[0].id });

/* ===== Cambios de acordes ===== */

/** Niveles (tabla de la Fase 3): 60 BPM y cambio cada 8 tiempos; 80 y cada 4; 100 y cada 2. */
export const CHANGES_LEVELS = Object.freeze({
  basico: Object.freeze({ bpm: 60, beatsPerChange: 8 }),
  intermedio: Object.freeze({ bpm: 80, beatsPerChange: 4 }),
  avanzado: Object.freeze({ bpm: 100, beatsPerChange: 2 }),
});

/** Plan de una ronda con progresión: los acordes (en bucle), el tempo y cada cuántos tiempos se cambia. */
function progressionPlan(params, { options = {}, progressions = [] }) {
  const prog = resolveProgressionChoice(options.progression, progressions);
  return { progression: prog, chords: prog.chords, bpm: params.bpm, beatsPerChange: params.beatsPerChange, showDiagrams: options.diagrams !== false };
}

export const chordChanges = base('cambios', {
  runner: 'chords',
  title: 'Cambios de acordes',
  description: 'Tocas una progresión con metrónomo, cambiando de acorde cada pocos tiempos.',
  howTo: EXERCISE_TEXTS['acordes.practica.cambios'].howTo,
  concepts: Object.freeze(['chord-changes', 'progression', 'metronome']),
  itemNoun: Object.freeze(['cambio', 'cambios']),
  duration: Object.freeze({ default: 60 }),
  options: Object.freeze([PROGRESSION_OPTION, SHOW_DIAGRAMS_OPTION]),
  levels: CHANGES_LEVELS,
  generate: (params, rng, ctx) => progressionPlan(params, ctx),
  speech: (chord, prefs) => chordSpeech(chord, prefs),
});

/* ===== Rasgueo ===== */

/** Niveles: tempo de la tabla y cambio de acorde cada 2 compases en Básico y cada compás en el resto. */
export const STRUM_LEVELS = Object.freeze({
  basico: Object.freeze({ tempo: STRUM_TEMPO.basico, beatsPerChange: 8 }),
  intermedio: Object.freeze({ tempo: STRUM_TEMPO.intermedio, beatsPerChange: 4 }),
  avanzado: Object.freeze({ tempo: STRUM_TEMPO.avanzado, beatsPerChange: 4 }),
});

/** Opción "Patrón": los patrones del nivel, con "Escuchar el patrón". */
export const PATTERN_OPTION = Object.freeze({
  id: 'pattern',
  type: 'strum-pattern',
  label: 'Patrón',
  byLevel: Object.freeze(Object.fromEntries(Object.keys(STRUM_TEMPO).map((level) => [level, Object.freeze(levelPatterns(level).map((p) => p.id))]))),
});

/** Opción "Tempo": dentro del rango del nivel; empieza en el más bajo. */
export const TEMPO_OPTION = Object.freeze({ id: 'tempo', type: 'tempo', label: 'Tempo', byLevel: STRUM_TEMPO, step: 5 });

export const strumming = base('rasgueo', {
  runner: 'chords',
  title: 'Rasgueo',
  description: 'Tocas una progresión con un patrón de rasgueo, al ritmo del metrónomo.',
  howTo: EXERCISE_TEXTS['acordes.practica.rasgueo'].howTo,
  concepts: Object.freeze(['strumming', 'accent', 'swing']),
  itemNoun: Object.freeze(['compás', 'compases']),
  duration: Object.freeze({ default: 60 }),
  options: Object.freeze([PROGRESSION_OPTION, PATTERN_OPTION, TEMPO_OPTION, SHOW_DIAGRAMS_OPTION]),
  levels: STRUM_LEVELS,
  generate(params, rng, ctx) {
    const plan = progressionPlan({ ...params, bpm: ctx.options?.tempo ?? params.tempo.min }, ctx);
    return { ...plan, pattern: getStrumPattern(ctx.options?.pattern) ?? levelPatterns(ctx.level ?? 'basico')[0] };
  },
  speech: (chord, prefs) => chordSpeech(chord, prefs),
});

/* ===== Cambios en un minuto ===== */

export const MINUTE_SECONDS = 60;

/** Opción "Acordes": la pareja, entre los acordes del nivel. */
export const PAIR_OPTION = Object.freeze({ id: 'pair', type: 'chord-pair', label: 'Acordes', default: Object.freeze(['C', 'G']) });

/** Clave del récord de una pareja, sin importar el orden (Do–Sol = Sol–Do). */
export const pairRecordKey = (a, b) => `acordes.practica.un-minuto:${[a, b].sort().join('+')}`;

export const oneMinuteChanges = base('un-minuto', {
  runner: 'minute',
  title: 'Cambios en un minuto',
  description: 'Cambias entre dos acordes todo lo que puedas en 60 segundos.',
  howTo: EXERCISE_TEXTS['acordes.practica.un-minuto'].howTo,
  concepts: Object.freeze(['chord-changes', 'chord-diagram']),
  itemNoun: Object.freeze(['cambio', 'cambios']),
  roundSeconds: MINUTE_SECONDS,
  options: Object.freeze([PAIR_OPTION, SHOW_DIAGRAMS_OPTION]),
  levels: Object.freeze(Object.fromEntries(Object.keys(CHANGES_LEVELS).map((level) => [level, Object.freeze({ chords: Object.freeze(chordsForLevel(level).map((c) => c.id)) })]))),
  /** La pareja elegida; si no vale para el nivel, la primera pareja posible (Do y Sol). */
  generate(params, rng, { options = {} }) {
    const [a, b] = options.pair ?? PAIR_OPTION.default;
    const ok = a !== b && params.chords.includes(a) && params.chords.includes(b);
    const [x, y] = ok ? [a, b] : PAIR_OPTION.default;
    return { chords: [getChord(x), getChord(y)], showDiagrams: options.diagrams !== false };
  },
  speech: (chord, prefs) => chordSpeech(chord, prefs),
  record: ({ items, plan }) => ({ key: pairRecordKey(plan.chords[0].id, plan.chords[1].id), value: items, better: 'higher' }),
});

/* ===== Acorde cantado ===== */

const SUNG = EXERCISE_TEXTS['acordes.practica.acorde-cantado'];
export const SUNG_SECONDS = Object.freeze({ basico: 12, intermedio: 8, avanzado: 5 });

export const sungChord = base('acorde-cantado', {
  title: 'Acorde cantado',
  description: 'La app dice un acorde al azar y tú lo tocas.',
  howTo: SUNG.howTo,
  concepts: Object.freeze(['chord-diagram', 'open-chord']),
  itemNoun: Object.freeze(['acorde', 'acordes']),
  roundLength: 12,
  revealLabel: 'Ver diagrama',
  hideRevealLabel: 'Ocultar diagrama',
  options: Object.freeze([SHOW_DIAGRAMS_OPTION]),
  levels: Object.freeze(Object.fromEntries(Object.entries(SUNG_SECONDS).map(([level, seconds]) => [level, Object.freeze({
    chords: Object.freeze(chordsForLevel(level).map((c) => c.id)), seconds,
  })]))),
  generate(params, rng, { recentKeys = [], options = {} }) {
    const pool = params.chords.map(getChord);
    const fresh = pool.filter((c) => !recentKeys.includes(chordKey(c)));
    const chord = rng.pick(fresh.length ? fresh : pool);
    return { key: chordKey(chord), chord, seconds: params.seconds, showDiagram: options.diagrams !== false };
  },
  render(item, container, ctx) {
    container.append(
      ctx.chordLabel(item.chord, { className: 'note-label--huge' }),
      item.showDiagram ? ctx.chordDiagram(item.chord, { size: 'large' }) : ctx.text(SUNG.instruction, 'practice__instruction'),
    );
  },
  /** Al acabar el tiempo (o con "Ver diagrama"): el diagrama con las notas coloreadas por función. */
  reveal: (item, ctx) => ctx.chordDiagram(item.chord, { size: 'small', colorByFunction: true }),
  speech: (item, prefs) => chordSpeech(item.chord, prefs),
});

export const CHORDS_PRACTICE_EXERCISES = Object.freeze([chordChanges, oneMinuteChanges, sungChord, strumming]);
