// Ejercicios de Práctica de Escala y tonalidad (BUILD_PLAN 8, Fase 5), sin DOM.
// "Escala con metrónomo" lo juega el motor del Calentamiento (engine/warmup-runner.js): la
// tablatura de una vuelta de la escala, con la nota que toca en ámbar, tempo con − y + y récord
// de tempo máximo. "Progresión de la tonalidad" lo juega el motor de acordes (6.6.12), con el
// grado de cada acorde y su diagrama si tiene forma abierta. Afinación estándar.

import { KEY_LEVELS, scaleLap, scalePositionRootFret, keyRootSpelling } from '../../core/keys.js';
import { keyProgression, allOpen } from '../../core/progressions.js';
import { KEY_PROGRESSIONS, getKeyProgression } from '../../data/progressions.js';
import { CHORD_SPOKEN } from '../../data/chords.js';
import { tabFromNotes } from '../../core/tab.js';
import { spokenName } from '../../core/notation.js';
import { fillTemplate, noteToken } from '../../core/glossary.js';
import { EXERCISE_TEXTS } from '../../data/concepts.js';
import { SHOW_DIAGRAMS_OPTION } from '../chords/common.js';
import { CHANGES_LEVELS } from '../chords/practice-exercises.js';
import { noteDur } from '../warmup/exercises.js';

const base = (slug, props) => Object.freeze({
  id: `tonalidad.practica.${slug}`,
  module: 'tonalidad',
  section: 'practica',
  slug,
  tunings: 'standard',
  statKeys: () => [],
  ...props,
});

/** Valor de la opción "Tonalidad": el pitch class en texto, o 'random' («Al azar»). */
export const RANDOM_KEY = 'random';

/** La tonalidad elegida en la preparación (o una al azar entre las permitidas). */
export function chosenKey(value, allowed, rng) {
  if (value === RANDOM_KEY || value === undefined) return rng ? rng.pick(allowed) : allowed[0];
  const key = Number(value);
  return allowed.includes(key) ? key : allowed[0];
}

/* ===== Escala con metrónomo ===== */

const SCALE = EXERCISE_TEXTS['tonalidad.practica.escala'];

/** Niveles (decididos en la Fase 5): tonalidades, notas por tiempo y rango de tempo. */
export const SCALE_LEVELS = Object.freeze({
  basico: Object.freeze({ keys: KEY_LEVELS.basico, notesPerBeat: 1, tempo: Object.freeze({ min: 50, max: 80 }) }),
  intermedio: Object.freeze({ keys: KEY_LEVELS.intermedio, notesPerBeat: 2, tempo: Object.freeze({ min: 60, max: 100 }) }),
  avanzado: Object.freeze({ keys: KEY_LEVELS.avanzado, notesPerBeat: 2, tempo: Object.freeze({ min: 80, max: 120 }) }),
});
export const SCALE_TEMPO_STEP = 5;

const scaleKeyOption = Object.freeze({
  id: 'key',
  type: 'key',
  label: 'Tonalidad',
  random: true,
  keysFor: (level) => SCALE_LEVELS[level].keys,
});

const scaleTempoOption = Object.freeze({
  id: 'tempo',
  type: 'tempo',
  label: 'Tempo',
  step: SCALE_TEMPO_STEP,
  byLevel: Object.freeze(Object.fromEntries(Object.entries(SCALE_LEVELS).map(([level, p]) => [level, p.tempo]))),
});

/** Tablatura de una vuelta de la escala (o solo de la subida, para escucharla en la preparación). */
export function scaleTab(key, { notesPerBeat, accidentals, upOnly = false }) {
  const lap = scaleLap(key, { accidentals });
  const notes = upOnly ? lap.slice(0, (lap.length + 1) / 2) : lap;
  return tabFromNotes(notes.map(({ string, fret }) => ({ string, fret, dur: noteDur(notesPerBeat) })));
}

export const scaleRecordKey = (level) => `tonalidad.practica.escala:${level}`;

export const scaleWithMetronome = base('escala', {
  runner: 'warmup',
  title: 'Escala con metrónomo',
  description: 'Tocas la escala mayor en una posición, subiendo y bajando, con tablatura y metrónomo.',
  howTo: SCALE.howTo,
  concepts: Object.freeze(['scale-position', 'major-scale', 'metronome']),
  itemNoun: Object.freeze(['vuelta', 'vueltas']),
  duration: Object.freeze({ default: 60 }),
  options: Object.freeze([scaleKeyOption, scaleTempoOption]),
  levels: SCALE_LEVELS,
  /** Plan de la ronda: tonalidad, tablatura de una vuelta y tempo (sin subida automática). */
  generate(params, rng, { options = {}, level = 'basico', accidentals = 'sharp' }) {
    const key = chosenKey(options.key, params.keys, rng);
    const bpm = Number.isFinite(options.tempo) ? options.tempo : params.tempo.min;
    return {
      level,
      key,
      notesPerBeat: params.notesPerBeat,
      startBpm: bpm,
      rampEveryLaps: null,
      tempoStep: SCALE_TEMPO_STEP,
      tempoRange: params.tempo,
      heading: fillTemplate(SCALE.heading, { key: noteToken(keyRootSpelling(key, { accidentals })), fret: scalePositionRootFret(key) }),
      tabLabel: SCALE.tabLabel,
      tab: scaleTab(key, { notesPerBeat: params.notesPerBeat, accidentals }),
      preview: {
        title: SCALE.preview,
        label: SCALE.previewLabel,
        tab: scaleTab(key, { notesPerBeat: params.notesPerBeat, accidentals, upOnly: true }),
      },
    };
  },
  speech: () => '',
  /** Récord: el tempo más alto al que se termina una vuelta entera, por nivel. */
  record: ({ plan, value }) => (value ? { key: scaleRecordKey(plan.level), value, better: 'higher' } : null),
});

/* ===== Progresión de la tonalidad ===== */

const PROGRESSION = EXERCISE_TEXTS['tonalidad.practica.progresion'];

/** Niveles: los tempos y cambios de "Cambios de acordes" (Fase 3) y las tonalidades de la Fase 5. */
export const KEY_CHANGES_LEVELS = Object.freeze(Object.fromEntries(Object.entries(CHANGES_LEVELS).map(([level, p]) => [level, Object.freeze({
  ...p,
  keys: KEY_LEVELS[level],
  // En Básico, solo las combinaciones que se tocan enteras con acordes abiertos.
  openOnly: level === 'basico',
})])));

/** Tonalidades que se pueden elegir con una progresión en un nivel. */
export function progressionKeys(level, progressionId) {
  const params = KEY_CHANGES_LEVELS[level];
  const prog = getKeyProgression(progressionId) ?? KEY_PROGRESSIONS[0];
  if (!params.openOnly) return params.keys;
  return params.keys.filter((key) => allOpen(keyProgression(key, prog.degrees)));
}

const keyProgressionOption = Object.freeze({
  id: 'progression',
  type: 'choice',
  label: 'Progresión',
  choices: Object.freeze(KEY_PROGRESSIONS.map((p) => Object.freeze({ value: p.id, label: p.degrees.join('–') }))),
  default: KEY_PROGRESSIONS[0].id,
});

const progressionKeyOption = Object.freeze({
  id: 'key',
  type: 'key',
  label: 'Tonalidad',
  random: true,
  keysFor: (level, options) => progressionKeys(level, options.progression),
});

/** Nombre hablado de un acorde de la tonalidad: "Fa sostenido menor", "Si disminuido". */
export function keyChordSpeech(chord, { notation = 'es' } = {}) {
  const lang = notation === 'en' ? 'en' : 'es';
  return spokenName(chord.spelling, lang) + CHORD_SPOKEN[lang][chord.quality];
}

export const keyProgressionPractice = base('progresion', {
  runner: 'chords',
  title: 'Progresión de la tonalidad',
  description: 'Tocas una progresión por grados en una tonalidad, con metrónomo.',
  howTo: PROGRESSION.howTo,
  concepts: Object.freeze(['progression', 'scale-degree', 'diatonic-chords']),
  itemNoun: Object.freeze(['cambio', 'cambios']),
  duration: Object.freeze({ default: 60 }),
  options: Object.freeze([keyProgressionOption, progressionKeyOption, SHOW_DIAGRAMS_OPTION]),
  levels: KEY_CHANGES_LEVELS,
  generate(params, rng, { options = {}, level = 'basico', accidentals = 'sharp' }) {
    const prog = getKeyProgression(options.progression) ?? KEY_PROGRESSIONS[0];
    const key = chosenKey(options.key, progressionKeys(level, prog.id), rng);
    return {
      key,
      degrees: prog.degrees,
      chords: keyProgression(key, prog.degrees, { accidentals }),
      bpm: params.bpm,
      beatsPerChange: params.beatsPerChange,
      showDiagrams: options.diagrams !== false,
      heading: fillTemplate(PROGRESSION.heading, { degrees: prog.degrees.join('–'), key: noteToken(keyRootSpelling(key, { accidentals })) }),
    };
  },
  speech: (chord, prefs) => keyChordSpeech(chord, prefs),
});

export const KEYS_PRACTICE_EXERCISES = Object.freeze([scaleWithMetronome, keyProgressionPractice]);
