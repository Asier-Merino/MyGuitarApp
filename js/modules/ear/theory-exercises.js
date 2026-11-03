// Ejercicios de Teoría de Oído (BUILD_PLAN 8, Fase 4), sin DOM: suena algo y se responde
// con botones. Lo que suena se calcula por MIDI (js/core/ear.js) y los acordes salen de la
// biblioteca (5.1). Las preguntas suenan solas al aparecer (questionSound) y el tiempo del
// nivel empieza cuando acaba el sonido. Afinación estándar: no se toca el mástil.

import { getChord, chordsForLevel, chordMidis } from '../../data/chords.js';
import { STANDARD_TUNING } from '../../core/fretboard-model.js';
import { pickWeighted } from '../../core/stats.js';
import { fillTemplate } from '../../core/glossary.js';
import { chordSound, melodicSound, notePair, withoutStreak, intervalName, intervalShortName } from '../../core/ear.js';
import { EXERCISE_TEXTS, UI_TEXTS } from '../../data/concepts.js';
import { qualityWhy, levelQualities } from '../chords/theory-exercises.js';
import { semitonesText, fretsText, pairFigure } from './common.js';

/** Tiempo por pregunta (decidido en la Fase 4): sin límite en Básico, 15 s y 10 s. */
export const EAR_TIME = Object.freeze({ basico: null, intermedio: 15, avanzado: 10 });

const base = (slug, props) => Object.freeze({
  id: `oido.teoria.${slug}`,
  module: 'oido',
  section: 'teoria',
  slug,
  tunings: 'standard',
  needsSound: true,
  roundLength: 10,
  ...props,
});

/** Respuestas de la ronda, para que la misma no salga 3 veces seguidas. */
function remember(round, answer) {
  round.answers = [...(round.answers ?? []), answer];
}

/** Repite el sorteo si sale la misma pregunta que la anterior (hasta unos intentos). */
function fresh(make, previousKey) {
  let item = make();
  for (let i = 0; i < 20 && item.key === previousKey; i++) item = make();
  return item;
}

/* ===== ¿Mayor o menor? (de oído) ===== */

const QUALITY = EXERCISE_TEXTS['oido.teoria.mayor-menor'];
/** Cómo suena el acorde en cada nivel (tabla de la Fase 4). */
export const QUALITY_MODES = Object.freeze({ basico: 'strum-slow', intermedio: 'arpeggio', avanzado: 'arpeggio-strum' });

/**
 * Niveles: los acordes de la biblioteca del nivel (tabla de la Fase 3). En Básico e
 * Intermedio, solo mayores y menores; en Avanzado, además las séptimas de dominante.
 */
export const QUALITY_LEVELS = Object.freeze(Object.fromEntries(Object.keys(QUALITY_MODES).map((level) => [level, Object.freeze({
  chords: Object.freeze(chordsForLevel(level).filter((c) => level === 'avanzado' || c.quality !== 'dom7').map((c) => c.id)),
  mode: QUALITY_MODES[level],
  timeLimit: EAR_TIME[level],
})])));

/** Cómo suele describirse cada calidad, para el «¿Por qué?». */
const SOUND_WHY = Object.freeze({ major: 'whySoundMajor', minor: 'whySoundMinor', dom7: 'whySoundDom7' });

const qualitySound = (item) => chordSound(chordMidis(item.chord), item.mode);

export const earMajorMinor = base('mayor-menor', {
  title: '¿Mayor o menor?',
  description: 'Suena un acorde y decides si es mayor o menor.',
  howTo: QUALITY.howTo,
  concepts: Object.freeze(['chord-third', 'third-interval', 'dominant-seventh']),
  prompt: QUALITY.prompt,
  levels: QUALITY_LEVELS,
  questionSound: qualitySound,
  sound: qualitySound,

  generate(params, rng, { stats = {}, previousKey = null, round = {}, now = Date.now() }) {
    const pool = params.chords.map(getChord);
    const qualities = levelQualities(params);
    const quality = pickWeighted(withoutStreak(qualities, round.answers), { keyOf: (q) => `ear:quality:${q}`, stats, rng, now });
    const candidates = pool.filter((c) => c.quality === quality);
    const others = candidates.filter((c) => `chord:${c.id}` !== previousKey);
    const chord = rng.pick(others.length ? others : candidates);
    remember(round, quality);
    return { key: `chord:${chord.id}`, chord, mode: params.mode, answer: quality, options: qualities };
  },
  render(item, container, ctx) {
    ctx.answerButtons(item.options.map((q) => ({ value: q, label: UI_TEXTS.chordQualities[q] })));
    return {
      reveal: () => container.append(ctx.chordLabel(item.chord), ctx.chordDiagram(item.chord, { size: 'small', colorByFunction: true })),
    };
  },
  check(item, answer) {
    const label = fillTemplate(QUALITY.missLabel, { chord: item.chord.id });
    if (answer === item.answer) return { correct: true, feedback: null, why: null, label };
    const names = UI_TEXTS.chordQualities;
    const lower = (q) => (names[q] ?? '').toLowerCase();
    const vars = { chosen: lower(answer), answer: lower(item.answer), chord: item.chord.id };
    const feedback = fillTemplate(answer ? QUALITY.feedbackWrong : QUALITY.feedbackTimeout, vars);
    return { correct: false, feedback, why: qualityWhy(item.chord) + QUALITY[SOUND_WHY[item.answer]], label };
  },
  answerMarkup: (q) => UI_TEXTS.chordQualities[q],
  review: (item, ctx) => ctx.chordDiagram(item.chord, { size: 'small', colorByFunction: true }),
  statKeys: (item) => [`ear:quality:${item.answer}`],
});

/* ===== ¿Más agudo o más grave? ===== */

const PITCH = EXERCISE_TEXTS['oido.teoria.agudo-grave'];
const DIRECTION_ANSWER = Object.freeze({ up: 'higher', down: 'lower' });

/** Niveles (decididos en la Fase 4): cuántos semitonos separan las dos notas. */
export const PITCH_LEVELS = Object.freeze({
  basico: Object.freeze({ minSemitones: 5, maxSemitones: 12, timeLimit: EAR_TIME.basico }),
  intermedio: Object.freeze({ minSemitones: 2, maxSemitones: 4, timeLimit: EAR_TIME.intermedio }),
  avanzado: Object.freeze({ minSemitones: 1, maxSemitones: 2, timeLimit: EAR_TIME.avanzado }),
});

const pairSound = (item) => melodicSound([item.first, item.second]);
const pairKey = (pair) => `${pair.first}>${pair.second}`;

export const higherOrLower = base('agudo-grave', {
  title: '¿Más agudo o más grave?',
  description: 'Suenan dos notas y decides si la segunda es más aguda o más grave.',
  howTo: PITCH.howTo,
  concepts: Object.freeze(['pitch', 'semitone-tone', 'interval']),
  prompt: PITCH.prompt,
  levels: PITCH_LEVELS,
  questionSound: pairSound,
  sound: pairSound,

  generate(params, rng, { stats = {}, previousKey = null, round = {}, now = Date.now() }) {
    const sizes = [];
    for (let s = params.minSemitones; s <= params.maxSemitones; s++) sizes.push(s);
    const directions = withoutStreak(['up', 'down'], round.answers, (d) => DIRECTION_ANSWER[d]);
    const item = fresh(() => {
      const semitones = pickWeighted(sizes, { keyOf: (s) => `ear:pitch:${s}`, stats, rng, now });
      const pair = notePair(semitones, rng.pick(directions), rng);
      return { key: pairKey(pair), ...pair, answer: DIRECTION_ANSWER[pair.direction] };
    }, previousKey);
    remember(round, item.answer);
    return item;
  },
  render(item, container, ctx) {
    ctx.answerButtons(['higher', 'lower'].map((v) => ({ value: v, label: UI_TEXTS.ear[v] })));
  },
  check(item, answer) {
    const label = fillTemplate(PITCH.missLabel, { semis: semitonesText(item.semitones) });
    if (answer === item.answer) return { correct: true, feedback: null, why: null, label };
    const vars = { answer: UI_TEXTS.ear[item.answer].toLowerCase() };
    const feedback = fillTemplate(answer ? PITCH.feedbackWrong : PITCH.feedbackTimeout, vars);
    const why = fillTemplate(item.direction === 'up' ? PITCH.whyUp : PITCH.whyDown, {
      semis: semitonesText(item.semitones), frets: fretsText(item.semitones),
    }) + (item.semitones <= 2 ? PITCH.whyClose : '');
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (v) => UI_TEXTS.ear[v],
  review: (item, ctx) => pairFigure(item.first, item.second, ctx, STANDARD_TUNING),
  statKeys: (item) => [`ear:pitch:${item.semitones}`],
});

/* ===== ¿Qué intervalo es? ===== */

const INTERVAL = EXERCISE_TEXTS['oido.teoria.que-intervalo'];
const ALL_INTERVALS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

/**
 * Niveles (decididos en la Fase 4): Básico, 3ª mayor, 5ª y 8ª; Intermedio, además la 3ª
 * menor (tabla de la Fase 4); Avanzado, de la 2ª menor a la octava, hacia arriba o hacia abajo.
 */
export const INTERVAL_LEVELS = Object.freeze({
  basico: Object.freeze({ intervals: Object.freeze([4, 7, 12]), directions: Object.freeze(['up']), timeLimit: EAR_TIME.basico }),
  intermedio: Object.freeze({ intervals: Object.freeze([3, 4, 7, 12]), directions: Object.freeze(['up']), timeLimit: EAR_TIME.intermedio }),
  avanzado: Object.freeze({ intervals: ALL_INTERVALS, directions: Object.freeze(['up', 'down']), timeLimit: EAR_TIME.avanzado }),
});

/** Nombre del intervalo dentro de una frase, con su artículo: «una octava», «un tritono». */
const intervalText = (s) => {
  const name = intervalName(s);
  return `${s === 6 ? 'un' : 'una'} ${name[0].toLowerCase()}${name.slice(1)}`;
};

/** Pista para los intervalos que más se confunden (las dos 3ªs, la octava y el tritono). */
function intervalTip(answer) {
  if (answer === 3 || answer === 4) return INTERVAL.tipThird;
  if (answer === 12) return INTERVAL.tipOctave;
  if (answer === 6) return INTERVAL.tipTritone;
  return '';
}

export const whichInterval = base('que-intervalo', {
  title: '¿Qué intervalo es?',
  description: 'Suenan dos notas, una detrás de otra, y eliges el intervalo que hay entre ellas.',
  howTo: INTERVAL.howTo,
  concepts: Object.freeze(['interval', 'third-interval', 'perfect-fifth', 'octave', 'tritone']),
  prompt: (item) => (item.direction === 'down' ? INTERVAL.promptDown : INTERVAL.promptUp),
  levels: INTERVAL_LEVELS,
  questionSound: pairSound,
  sound: pairSound,

  generate(params, rng, { stats = {}, previousKey = null, round = {}, now = Date.now() }) {
    const choices = withoutStreak(params.intervals, round.answers);
    const item = fresh(() => {
      const semitones = pickWeighted(choices, { keyOf: (s) => `ear:interval:${s}`, stats, rng, now });
      const pair = notePair(semitones, rng.pick(params.directions), rng);
      return { key: pairKey(pair), ...pair, answer: semitones, options: [...params.intervals] };
    }, previousKey);
    remember(round, item.answer);
    return item;
  },
  render(item, container, ctx) {
    ctx.answerButtons(item.options.map((s) => ({ value: s, label: intervalShortName(s) })));
  },
  check(item, answer) {
    const label = fillTemplate(item.direction === 'down' ? INTERVAL.missLabelDown : INTERVAL.missLabelUp, { first: item.first % 12 });
    if (answer === item.answer) return { correct: true, feedback: null, why: null, label };
    const vars = { answer: intervalText(item.answer), chosen: answer ? intervalText(answer) : '' };
    const feedback = fillTemplate(answer ? INTERVAL.feedbackWrong : INTERVAL.feedbackTimeout, vars);
    let why = fillTemplate(item.direction === 'down' ? INTERVAL.whyDown : INTERVAL.whyUp, {
      ...vars, semis: semitonesText(item.answer), frets: fretsText(item.answer),
    });
    if (answer) why += fillTemplate(INTERVAL.whyChosen, { chosen: vars.chosen, semis: semitonesText(answer) });
    why += intervalTip(item.answer);
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (s) => intervalShortName(s),
  review: (item, ctx) => pairFigure(item.first, item.second, ctx, STANDARD_TUNING),
  statKeys: (item) => [`ear:interval:${item.answer}`],
});

export const EAR_THEORY_EXERCISES = Object.freeze([earMajorMinor, higherOrLower, whichInterval]);
