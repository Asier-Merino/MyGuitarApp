// Ejercicios de Teoría de Acordes abiertos (BUILD_PLAN 8, Fase 3), sin DOM: lo que se dibuja
// lo hacen las herramientas que pasa el motor en `ctx`. Los acordes salen de la biblioteca
// (5.1) y todo lo que se dice de ellos (notas, 3ª, cuerdas) se calcula con la teoría.
// Afinación estándar (7.6: los acordes abiertos dependen de ella).

import { getChord, chordSpelling, chordTones, sameChordName } from '../../data/chords.js';
import { STANDARD_TUNING } from '../../core/fretboard-model.js';
import { mod12 } from '../../core/theory.js';
import { pickWeighted } from '../../core/stats.js';
import { fillTemplate, noteToken } from '../../core/glossary.js';
import { EXERCISE_TEXTS, UI_TEXTS } from '../../data/concepts.js';
import {
  chordLevels, chordKey, shapeText, tonesMarkup, joinAnd, chordNotes, thirdSemitones, functionText, toneSpelling,
  chordOptions, chordMidis,
} from './common.js';

const base = (slug, props) => Object.freeze({
  id: `acordes.teoria.${slug}`,
  module: 'acordes',
  section: 'teoria',
  slug,
  tunings: 'standard',
  roundLength: 10,
  sound: (item) => ({ strum: chordMidis(item.chord) }),
  review: (item, ctx) => ctx.chordDiagram(item.chord, { size: 'small', colorByFunction: true }),
  ...props,
});

const QUICK_LEVELS = chordLevels('quick');
const SLOW_LEVELS = chordLevels('slow');

const pool = (params) => params.chords.map(getChord);

function pickChord(params, rng, { stats = {}, previousKey = null, now = Date.now() }, candidates = pool(params)) {
  return pickWeighted(candidates, { keyOf: (c) => chordKey(c), stats, rng, avoidKey: previousKey, now });
}

/** Explicación de la calidad de un acorde: fundamental, 3ª (y 7ª), con las notas deletreadas. */
export function qualityWhy(chord) {
  const T = EXERCISE_TEXTS['acordes.teoria.mayor-menor'];
  const [r, t, , s] = chordSpelling(chord).map(noteToken);
  const vars = { root: r, third: t, seventh: s ?? '' };
  if (chord.quality === 'dom7') return fillTemplate(T.whyDom7, vars);
  return fillTemplate(chord.quality === 'minor' ? T.whyMinor : T.whyMajor, vars);
}

/* ===== ¿Qué acorde es? ===== */

const WHICH = EXERCISE_TEXTS['acordes.teoria.que-acorde'];

export const whichChord = base('que-acorde', {
  title: '¿Qué acorde es?',
  description: 'Ves un diagrama de acorde y eliges cuál es entre 4 opciones.',
  howTo: WHICH.howTo,
  concepts: Object.freeze(['chord-diagram', 'root', 'chord-third']),
  prompt: WHICH.prompt,
  levels: QUICK_LEVELS,

  generate(params, rng, ctx) {
    const chord = pickChord(params, rng, ctx);
    return { key: chordKey(chord), chord, answer: chord.id, options: chordOptions(chord, pool(params), rng).map((c) => c.id) };
  },
  render(item, container, ctx) {
    const diagram = ctx.chordDiagram(item.chord, { playOnTap: false });
    container.append(diagram);
    ctx.answerButtons(item.options.map((id) => ({ value: id, label: ctx.chordLabel(getChord(id)) })));
    return { reveal: () => diagram.replaceWith(ctx.chordDiagram(item.chord, { colorByFunction: true })) };
  },
  /** La respuesta es el id de un acorde (o null). El Fa mini y el Fa con cejilla son el mismo Fa. */
  check(item, answer) {
    const label = fillTemplate(WHICH.missLabel, { shape: shapeText(item.chord.frets) });
    const chosen = answer ? getChord(answer) : null;
    if (chosen && sameChordName(chosen, item.chord)) return { correct: true, feedback: null, why: null, label };
    const vars = { chord: item.chord.id, chosen: chosen?.id ?? '', tones: tonesMarkup(item.chord) };
    const feedback = fillTemplate(chosen ? WHICH.feedbackWrong : WHICH.feedbackTimeout, vars);
    let why = fillTemplate(WHICH.whyName, vars) + qualityWhy(item.chord);
    if (chosen) {
      why += fillTemplate(WHICH.whyChosen, { chosen: chosen.id, chosenTones: tonesMarkup(chosen) });
      if (chosen.root === item.chord.root) why += WHICH.whySameRoot;
    }
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (id) => `{{chord:${id}}}`,
  statKeys: (item) => [item.key],
});

/* ===== Constrúyelo ===== */

const BUILD = EXERCISE_TEXTS['acordes.teoria.construyelo'];

/** Qué va en una cuerda, en texto: al aire, sin tocar o el traste con su nota. */
function stringState(fret, string) {
  if (fret === null) return BUILD.stringMuted;
  if (fret === 0) return BUILD.stringOpen;
  return fillTemplate(BUILD.stringFret, { fret, note: `{{pc:${mod12(STANDARD_TUNING[string] + fret)}}}` });
}

export const buildChord = base('construyelo', {
  answerBy: 'tap',
  title: 'Constrúyelo',
  description: 'Te piden un acorde y lo construyes en un diagrama vacío.',
  howTo: BUILD.howTo,
  concepts: Object.freeze(['chord-diagram', 'open-chord', 'triad']),
  prompt: (item) => fillTemplate(BUILD.prompt, { chord: item.chord.id }),
  levels: SLOW_LEVELS,

  generate(params, rng, ctx) {
    const chord = pickChord(params, rng, ctx);
    return { key: chordKey(chord), chord, answer: [...chord.frets] };
  },
  render(item, container, ctx) {
    const editor = ctx.chordEditor();
    container.append(editor);
    ctx.checkButton(() => ctx.answer(editor.value()));
    return {
      reveal(result, value) {
        editor.lock();
        if (value) {
          editor.showMarks(Object.fromEntries(value.map((f, i) => [6 - i, f === item.answer[i] ? 'correct' : 'wrong'])));
        }
        if (!result.correct) container.append(ctx.chordLabel(item.chord), ctx.chordDiagram(item.chord, { size: 'small', colorByFunction: true }));
      },
    };
  },
  /** La respuesta son los trastes de la 6ª a la 1ª (null = no se toca), o null si se acabó el tiempo. */
  check(item, value) {
    const label = fillTemplate(BUILD.missLabel, { chord: item.chord.id });
    const wrong = value ? item.answer.map((f, i) => (f === value[i] ? null : 6 - i)).filter(Boolean) : [];
    if (value && !wrong.length) return { correct: true, feedback: null, why: null, label };
    const vars = { chord: item.chord.id, shape: shapeText(item.answer), tones: tonesMarkup(item.chord) };
    const feedback = fillTemplate(value ? BUILD.feedbackWrong : BUILD.feedbackTimeout, vars);
    let why = fillTemplate(BUILD.whyTones, vars);
    for (const string of wrong) {
      why += fillTemplate(BUILD.whyString, {
        string,
        expected: stringState(item.answer[6 - string], string),
        got: stringState(value[6 - string], string),
      });
    }
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (frets) => shapeText(frets),
  statKeys: (item) => [item.key],
});

/* ===== ¿Qué notas tiene? ===== */

const NOTES = EXERCISE_TEXTS['acordes.teoria.que-notas'];
const ALL_PCS = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const pcList = (pcs) => joinAnd(pcs.map((pc) => `{{pc:${pc}}}`));

export const chordNotesQuiz = base('que-notas', {
  title: '¿Qué notas tiene?',
  description: 'Eliges todas las notas que forman un acorde.',
  howTo: NOTES.howTo,
  concepts: Object.freeze(['triad', 'chord-third', 'dominant-seventh']),
  prompt: (item) => fillTemplate(NOTES.prompt, { count: item.answer.pcs.length, chord: item.chord.id }),
  levels: SLOW_LEVELS,

  generate(params, rng, ctx) {
    const chord = pickChord(params, rng, ctx);
    return { key: chordKey(chord), chord, answer: { chord: chord.id, pcs: [...chordTones(chord)].sort((a, b) => a - b) } };
  },
  render(item, container, ctx) {
    const diagram = ctx.chordDiagram(item.chord, { size: 'small', playOnTap: false });
    container.append(diagram);
    const keys = ctx.noteToggles(ALL_PCS.map((pc) => ({ pc, spelling: toneSpelling(item.chord, pc) ?? undefined })));
    ctx.checkButton(() => ctx.answer(keys.selected()));
    return {
      reveal(result, value) {
        keys.reveal(item.answer.pcs, value ?? []);
        diagram.replaceWith(ctx.chordDiagram(item.chord, { size: 'small', colorByFunction: true }));
      },
    };
  },
  /** La respuesta es la lista de pitch classes elegidas (o null). */
  check(item, value) {
    const label = fillTemplate(NOTES.missLabel, { chord: item.chord.id });
    const chosen = [...new Set(value ?? [])].map(mod12);
    const extra = chosen.filter((pc) => !item.answer.pcs.includes(pc)).sort((a, b) => a - b);
    const missing = item.answer.pcs.filter((pc) => !chosen.includes(pc));
    if (value && !extra.length && !missing.length) return { correct: true, feedback: null, why: null, label };
    const [r, t, f, s] = chordSpelling(item.chord).map(noteToken);
    const thirdSemis = thirdSemitones(item.chord);
    const feedback = fillTemplate(value ? NOTES.feedbackWrong : NOTES.feedbackTimeout, { chord: item.chord.id, tones: tonesMarkup(item.chord) });
    let why = fillTemplate(NOTES.whyTriad, {
      root: r, third: t, fifth: f, thirdSemis, thirdKind: thirdSemis === 4 ? NOTES.thirdMajor : NOTES.thirdMinor,
    });
    if (s) why += fillTemplate(NOTES.whySeventh, { seventh: s });
    if (value && extra.length) why += fillTemplate(NOTES.whyExtra, { list: pcList(extra) });
    if (value && missing.length) why += fillTemplate(NOTES.whyMissing, { list: joinAnd(missing.map((pc) => noteToken(toneSpelling(item.chord, pc)))) });
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (value) => (Array.isArray(value) ? (value.length ? pcList([...value].sort((a, b) => a - b)) : '—') : tonesMarkup(getChord(value.chord))),
  statKeys: (item) => [item.key],
});

/* ===== ¿Mayor o menor? (visual) ===== */

const QUALITY = EXERCISE_TEXTS['acordes.teoria.mayor-menor'];
const QUALITY_ORDER = Object.freeze(['major', 'minor', 'dom7']);

/** Calidades que pueden salir en un nivel: las de sus acordes (la séptima, desde Intermedio). */
export const levelQualities = (params) => QUALITY_ORDER.filter((q) => pool(params).some((c) => c.quality === q));

export const majorOrMinor = base('mayor-menor', {
  title: '¿Mayor o menor?',
  description: 'Ves un diagrama y decides si el acorde es mayor o menor.',
  howTo: QUALITY.howTo,
  concepts: Object.freeze(['chord-third', 'root', 'dominant-seventh']),
  prompt: QUALITY.prompt,
  levels: QUICK_LEVELS,

  generate(params, rng, ctx) {
    const qualities = levelQualities(params);
    const quality = rng.pick(qualities);
    const chord = pickChord(params, rng, ctx, pool(params).filter((c) => c.quality === quality));
    return { key: chordKey(chord), chord, answer: chord.quality, options: qualities };
  },
  render(item, container, ctx) {
    const diagram = ctx.chordDiagram(item.chord, { playOnTap: false });
    container.append(diagram);
    ctx.answerButtons(item.options.map((q) => ({ value: q, label: UI_TEXTS.chordQualities[q] })));
    return { reveal: () => diagram.replaceWith(ctx.chordDiagram(item.chord, { colorByFunction: true })) };
  },
  check(item, answer) {
    const label = fillTemplate(QUALITY.missLabel, { shape: shapeText(item.chord.frets) });
    if (answer === item.answer) return { correct: true, feedback: null, why: null, label };
    const names = UI_TEXTS.chordQualities;
    const vars = { chosen: names[answer] ?? '', answer: names[item.answer], chord: item.chord.id };
    const feedback = fillTemplate(answer ? QUALITY.feedbackWrong : QUALITY.feedbackTimeout, vars);
    const thirdString = chordNotes(item.chord).find((n) => n.fn === 'third').string;
    const why = qualityWhy(item.chord) + fillTemplate(QUALITY.whyWhere, { string: thirdString });
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (q) => UI_TEXTS.chordQualities[q],
  statKeys: (item) => [item.key],
});

/* ===== ¿Qué nota falta? ===== */

const MISSING = EXERCISE_TEXTS['acordes.teoria.nota-falta'];

/** Cuerdas pisadas de los acordes del nivel: cada una puede ser la que falta. */
export function missingCandidates(params) {
  return pool(params).flatMap((chord) => chordNotes(chord).filter((n) => n.fret > 0).map((n) => ({ chord, ...n })));
}

export const missingNote = base('nota-falta', {
  title: '¿Qué nota falta?',
  description: 'A un diagrama le falta un punto y eliges la nota que va ahí.',
  howTo: MISSING.howTo,
  concepts: Object.freeze(['chord-diagram', 'triad', 'semitone-tone']),
  prompt: (item) => fillTemplate(MISSING.prompt, { chord: item.chord.id }),
  levels: QUICK_LEVELS,

  generate(params, rng, { stats = {}, previousKey = null, now = Date.now() }) {
    const spot = pickWeighted(missingCandidates(params), {
      keyOf: (c) => chordKey(c.chord, c.string), stats, rng, avoidKey: previousKey, now,
    });
    const { chord, pc } = spot;
    // Opciones: la nota, las otras del acorde y, hasta 4, notas vecinas que no son del acorde.
    const tones = chordTones(chord);
    const options = [pc, ...rng.shuffle(tones.filter((x) => x !== pc))].slice(0, 4);
    for (const step of rng.shuffle([1, -1, 2, -2])) {
      if (options.length >= 4) break;
      const near = mod12(pc + step);
      if (!options.includes(near)) options.push(near);
    }
    return {
      key: chordKey(chord, spot.string),
      chord,
      string: spot.string,
      fret: spot.fret,
      pc,
      answer: pc,
      options: rng.shuffle(options),
    };
  },
  render(item, container, ctx) {
    const diagram = ctx.chordDiagram(item.chord, { hiddenString: item.string, playOnTap: false });
    container.append(diagram);
    ctx.answerButtons(item.options.map((pc) => ({ value: pc, pc, spelling: toneSpelling(item.chord, pc) ?? undefined })));
    return { reveal: () => diagram.replaceWith(ctx.chordDiagram(item.chord, { colorByFunction: true })) };
  },
  check(item, answer) {
    const label = fillTemplate(MISSING.missLabel, { chord: item.chord.id, string: item.string });
    if (answer === item.pc) return { correct: true, feedback: null, why: null, label };
    const answerName = noteToken(toneSpelling(item.chord, item.pc));
    const vars = { chosen: answer ?? 0, answer: answerName, string: item.string, fret: item.fret };
    const feedback = fillTemplate(answer === null ? MISSING.feedbackTimeout : MISSING.feedbackWrong, vars);
    let why = fillTemplate(MISSING.why, {
      ...vars,
      open: mod12(STANDARD_TUNING[item.string]),
      frets: item.fret === 1 ? MISSING.fretOne : MISSING.fretMany,
      function: functionText(item.chord, item.pc),
      chord: item.chord.id,
    });
    if (answer !== null) {
      why += fillTemplate(chordTones(item.chord).includes(answer) ? MISSING.whyChosenTone : MISSING.whyChosenOther, { chosen: answer });
    }
    return { correct: false, feedback, why, label };
  },
  answerMarkup: (pc) => `{{pc:${pc}}}`,
  statKeys: (item) => [item.key],
});

export const CHORDS_THEORY_EXERCISES = Object.freeze([whichChord, buildChord, chordNotesQuiz, majorOrMinor, missingNote]);
