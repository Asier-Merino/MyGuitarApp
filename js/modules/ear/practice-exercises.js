// Ejercicios de Práctica de Oído (BUILD_PLAN 8, Fase 4), sin DOM. Manos libres y sin voz
// (diría la respuesta): la consigna suena al aparecer, otra vez a mitad del tiempo y al
// enseñar la solución (itemSound), y «Repetir sonido» la vuelve a tocar. Sin datos de fallo
// (7.4): se elige al azar evitando repetir las consignas más recientes.

import { getChord, chordsForLevel, chordMidis } from '../../data/chords.js';
import { chordSound, melodicSound, positionsOfMidi, pcOf } from '../../core/ear.js';
import { midiAt } from '../../core/fretboard-model.js';
import { fillTemplate } from '../../core/glossary.js';
import { EXERCISE_TEXTS } from '../../data/concepts.js';
import { notePool, ALL_STRINGS } from '../notes/common.js';
import { chordKey } from '../chords/common.js';

/** Consignas por ronda (decidido en la Fase 4). */
export const EAR_PRACTICE_ROUND = 12;
/** Las soluciones se enseñan del traste 0 al 12. */
export const FIND_BOARD = Object.freeze({ from: 0, to: 12 });

const base = (slug, props) => Object.freeze({
  id: `oido.practica.${slug}`,
  module: 'oido',
  section: 'practica',
  slug,
  needsSound: true,
  voice: false,
  speech: () => '',
  roundLength: EAR_PRACTICE_ROUND,
  statKeys: () => [],
  ...props,
});

const pickFresh = (rng, pool, keyOf, recentKeys) => {
  const fresh = pool.filter((x) => !recentKeys.includes(keyOf(x)));
  return rng.pick(fresh.length ? fresh : pool);
};

/* ===== Encuentra la nota ===== */

const FIND = EXERCISE_TEXTS['oido.practica.encuentra-la-nota'];

/**
 * Niveles (tabla de la Fase 4 y decisiones de la fase): Básico, 6ª o 5ª cuerda, naturales,
 * trastes 0–5, con la cuerda indicada; Intermedio, cualquier cuerda, naturales, 0–12, con la
 * cuerda indicada; Avanzado, con alteraciones y sin pista de cuerda. Segundos por nota.
 */
export const FIND_LEVELS = Object.freeze({
  basico: Object.freeze({ strings: Object.freeze([6, 5]), fromFret: 0, toFret: 5, naturalsOnly: true, hint: true, seconds: 30 }),
  intermedio: Object.freeze({ strings: ALL_STRINGS, fromFret: 0, toFret: 12, naturalsOnly: true, hint: true, seconds: 20 }),
  avanzado: Object.freeze({ strings: ALL_STRINGS, fromFret: 0, toFret: 12, naturalsOnly: false, hint: false, seconds: 15 }),
});

/** Posiciones del nivel (cuerda, traste, MIDI) con las notas que admite. */
export function findCandidates(params, tuning) {
  const pcs = notePool(params.naturalsOnly);
  const list = [];
  for (const string of params.strings) {
    for (let fret = params.fromFret; fret <= params.toFret; fret++) {
      const midi = midiAt(string, fret, tuning);
      if (pcs.includes(pcOf(midi))) list.push({ string, fret, midi });
    }
  }
  return list;
}

export const findTheNote = base('encuentra-la-nota', {
  title: 'Encuentra la nota',
  description: 'Suena una nota y la buscas en tu guitarra.',
  howTo: FIND.howTo,
  concepts: Object.freeze(['pitch', 'unison', 'string-numbers']),
  tunings: 'any',
  itemNoun: Object.freeze(['nota', 'notas']),
  revealLabel: 'Ver',
  hideRevealLabel: 'Ocultar',
  levels: FIND_LEVELS,

  generate(params, rng, { recentKeys = [], tuning }) {
    const candidates = findCandidates(params, tuning);
    // Con pista, se sortea la posición (la cuerda importa); sin pista, la nota exacta, para
    // que las notas que salen en varias cuerdas no salgan más a menudo.
    const spot = params.hint
      ? pickFresh(rng, candidates, (c) => `midi:${c.midi}`, recentKeys)
      : (() => {
        const midis = [...new Set(candidates.map((c) => c.midi))];
        const midi = pickFresh(rng, midis, (m) => `midi:${m}`, recentKeys);
        return { midi };
      })();
    const all = positionsOfMidi(spot.midi, { fromFret: FIND_BOARD.from, toFret: FIND_BOARD.to, tuning });
    const isHint = (p) => params.hint && p.string === spot.string;
    return {
      key: `midi:${spot.midi}`,
      midi: spot.midi,
      pc: pcOf(spot.midi),
      string: params.hint ? spot.string : null,
      seconds: params.seconds,
      fromFret: FIND_BOARD.from,
      toFret: FIND_BOARD.to,
      positions: all,
      markers: all.map((p) => ({ string: p.string, fret: p.fret, pc: pcOf(spot.midi), color: !params.hint || isHint(p) ? 'amber' : 'neutral' })),
      legend: params.hint
        ? fillTemplate(all.length > 1 ? FIND.legendHint : FIND.legendHintOnly, { string: spot.string })
        : FIND.legendAll,
    };
  },
  render(item, container, ctx) {
    container.append(
      ctx.text(FIND.listen, 'practice__big'),
      ctx.text(item.string ? fillTemplate(FIND.instructionHint, { string: item.string }) : FIND.instruction, 'practice__instruction'),
    );
  },
  itemSound: (item) => melodicSound([item.midi]),
});

/* ===== Imita el acorde ===== */

const MIMIC = EXERCISE_TEXTS['oido.practica.imita-el-acorde'];
export const MIMIC_SECONDS = Object.freeze({ basico: 20, intermedio: 15, avanzado: 12 });

export const mimicChord = base('imita-el-acorde', {
  title: 'Imita el acorde',
  description: 'Suena un acorde abierto y lo tocas en tu guitarra.',
  howTo: MIMIC.howTo,
  concepts: Object.freeze(['open-chord', 'chord-third', 'chord-diagram']),
  tunings: 'standard',
  itemNoun: Object.freeze(['acorde', 'acordes']),
  revealLabel: 'Ver acorde',
  hideRevealLabel: 'Ocultar acorde',
  levels: Object.freeze(Object.fromEntries(Object.entries(MIMIC_SECONDS).map(([level, seconds]) => [level, Object.freeze({
    chords: Object.freeze(chordsForLevel(level).map((c) => c.id)), seconds,
  })]))),

  generate(params, rng, { recentKeys = [] }) {
    const chord = pickFresh(rng, params.chords.map(getChord), (c) => chordKey(c), recentKeys);
    return { key: chordKey(chord), chord, seconds: params.seconds };
  },
  render(item, container, ctx) {
    container.append(ctx.text(MIMIC.listen, 'practice__big'), ctx.text(MIMIC.instruction, 'practice__instruction'));
  },
  /** Al acabar el tiempo (o con «Ver acorde»): su nombre y el diagrama con las notas por función. */
  reveal: (item, ctx) => [ctx.chordLabel(item.chord, { className: 'note-label--big practice__reveal-name' }), ctx.chordDiagram(item.chord, { size: 'small', colorByFunction: true })],
  itemSound: (item) => chordSound(chordMidis(item.chord), 'strum'),
});

export const EAR_PRACTICE_EXERCISES = Object.freeze([findTheNote, mimicChord]);
