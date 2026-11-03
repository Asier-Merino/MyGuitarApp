// Esquemas de los conceptos (BUILD_PLAN 6.8), sin DOM: a partir de la descripción del
// esquema (`diagram` en concepts.js) se calculan los puntos con la teoría. Nunca se
// escriben a mano notas ni trastes que se puedan calcular.
//
// diagram (type 'fretboard'):
//   fromFret, toFret · tuning: id de afinación (estándar por defecto)
//   points: qué puntos se marcan
//     { select: 'naturals', strings?: [..] }   notas naturales en esas cuerdas (todas por defecto)
//     { select: 'open' }                       las 6 cuerdas al aire
//     { select: 'sound', string }              las notas de `sound.midi` del concepto, en esa cuerda
//                                              (la primera es el punto de partida)
//     { select: 'string', string }             todos los trastes del rango en esa cuerda
//     { select: 'frets', frets: [..] }         esos trastes en las 6 cuerdas
//     { select: 'unison', string, fret }       el punto y sus unísonos (mismo MIDI) en el rango
//     { select: 'octaves', string, fret }      el punto y, hacia agudos, sus formas de octava
//     { select: 'five-fret-rule' }             de la 6ª a la 2ª: el traste que suena como la
//                                              cuerda siguiente al aire, y esa cuerda al aire
//   highlight (opcional): 'natural-semitones' (Mi–Fa y Si–Do) · 'changed' (cuerdas que cambian
//     respecto a la estándar) · 'accidentals' (notas con sostenido o bemol) · 'start' (el
//     punto de partida de 'unison', 'octaves' o 'sound') · 'gap' (en 'five-fret-rule', las parejas
//     que no están a 5 trastes) · colorBy: 'function' (colores de R, 3 y 5 respecto a la nota
//     que da nombre a la afinación)
//   showStringNumbers, showFretNumbers · caption (texto con marcado, opcional)
// diagram (type 'beats'): { beatsPerBar, bpm }  esquema de pulsos
// diagram (type 'chord'): { chord: id, compare?: id o lista (acordes al lado), colorBy?: 'function' }
// diagram (type 'strum'): { pattern: id de strum-patterns.js, chord?: id }  patrón de rasgueo
// diagram (type 'tab'): { tab (formato de js/core/tab.js), bpm? }

import { mod12, noteFunction } from './theory.js';
import { LETTER_PC } from './notation.js';
import { STRINGS, STANDARD_TUNING, midiAt, unisonsOf, octavesOf } from './fretboard-model.js';
import { getTuning } from '../data/tunings.js';
import { getChord } from '../data/chords.js';

export const DIAGRAM_TYPES = Object.freeze(['fretboard', 'chord', 'tab', 'beats', 'strum']);

/** Cuerdas de la 6ª (grave) a la 1ª (aguda). */
const LOW_TO_HIGH = Object.freeze([...STRINGS].reverse());

const NATURAL_PCS = Object.freeze(Object.values(LETTER_PC).sort((a, b) => a - b));

/** Trastes de la "regla de los 5 trastes" entre cuerdas vecinas (salvo 3ª–2ª, a 4). */
export const RULE_GAP = 5;

/** Naturales separadas de su vecina natural por un solo semitono: Mi, Fa, Si y Do. */
export function naturalSemitonePcs() {
  return NATURAL_PCS.filter((pc) => {
    const up = NATURAL_PCS.find((n) => n > pc) ?? NATURAL_PCS[0] + 12;
    const down = [...NATURAL_PCS].reverse().find((n) => n < pc) ?? NATURAL_PCS.at(-1) - 12;
    return up - pc === 1 || pc - down === 1;
  });
}

function selectPositions(diagram, concept, tuning) {
  const { fromFret, toFret, points } = diagram;
  const frets = [];
  for (let f = fromFret; f <= toFret; f++) frets.push(f);
  const strings = points.strings ?? (points.string ? [points.string] : LOW_TO_HIGH);
  switch (points.select) {
    case 'naturals':
      return strings.flatMap((string) => frets
        .filter((fret) => NATURAL_PCS.includes(mod12(midiAt(string, fret, tuning))))
        .map((fret) => ({ string, fret })));
    case 'open':
      return LOW_TO_HIGH.map((string) => ({ string, fret: 0 }));
    case 'string':
      return frets.map((fret) => ({ string: points.string, fret }));
    case 'sound':
      // La primera nota es el punto de partida (highlight 'start'), p. ej. en los intervalos.
      return (concept.sound?.midi ?? []).map((midi, i) => ({ string: points.string, fret: midi - tuning[points.string], start: i === 0 }));
    case 'frets':
      return LOW_TO_HIGH.flatMap((string) => points.frets.map((fret) => ({ string, fret })));
    case 'unison':
      return [
        { string: points.string, fret: points.fret, start: true },
        ...unisonsOf(points.string, points.fret, { fromFret, toFret, tuning }),
      ];
    case 'octaves': {
      // Formas de octava hacia agudos, encadenadas (6ª → 4ª → 2ª…), sin repetir posiciones.
      const found = [{ string: points.string, fret: points.fret, start: true }];
      for (let i = 0; i < found.length; i++) {
        for (const o of octavesOf(found[i].string, found[i].fret, { minFret: fromFret, maxFret: toFret })) {
          if (o.direction === 'up' && !found.some((p) => p.string === o.string && p.fret === o.fret)) found.push({ string: o.string, fret: o.fret });
        }
      }
      return found;
    }
    case 'five-fret-rule':
      // Para cada cuerda (6ª a 2ª), el traste que suena como la siguiente más aguda al aire.
      return LOW_TO_HIGH.slice(0, -1).flatMap((string) => {
        const gap = tuning[string - 1] - tuning[string];
        return [{ string, fret: gap, gap }, { string: string - 1, fret: 0, gap }];
      });
    default:
      throw new Error(`Selección de puntos desconocida: ${points.select}`);
  }
}

/**
 * Puntos de un esquema de mástil: { tuning (MIDI por cuerda), points: [{ string, fret, midi, pc, color, root }] }.
 * color: 'neutral' | 'amber' | 'root' | 'third' | 'fifth' | … (tokens de 4.5).
 * Lanza un error si algún punto queda fuera del rango del esquema (lo detectan los tests).
 */
export function fretboardDiagramPoints(concept) {
  const diagram = concept.diagram;
  const tuningData = getTuning(diagram.tuning ?? 'standard');
  if (!tuningData) throw new Error(`${concept.id}: afinación ${diagram.tuning}`);
  const tuning = tuningData.midi;
  const semis = naturalSemitonePcs();
  const root = diagram.colorBy === 'function' ? tuningData.name.root : undefined;
  if (diagram.colorBy === 'function' && root === undefined) throw new Error(`${concept.id}: la afinación no tiene nota de nombre`);

  const points = selectPositions(diagram, concept, tuning).map(({ string, fret, start, gap }) => {
    if (!Number.isInteger(fret) || fret < diagram.fromFret || fret > diagram.toFret) {
      throw new RangeError(`${concept.id}: cuerda ${string}, traste ${fret} fuera del esquema`);
    }
    const midi = midiAt(string, fret, tuning);
    const pc = mod12(midi);
    let color = 'neutral';
    if (diagram.highlight === 'natural-semitones' && semis.includes(pc)) color = 'amber';
    if (diagram.highlight === 'changed' && tuning[string] !== STANDARD_TUNING[string]) color = 'amber';
    if (diagram.highlight === 'accidentals' && !NATURAL_PCS.includes(pc)) color = 'amber';
    if (diagram.highlight === 'start' && start) color = 'amber';
    if (diagram.highlight === 'gap' && gap !== undefined && gap !== RULE_GAP) color = 'amber';
    if (root !== undefined) color = noteFunction(root, pc);
    return { string, fret, midi, pc, color, root };
  });
  return { tuning, points };
}

/**
 * Funciones (R, 3, 5, 7) de las notas que suenan en un esquema de acorde, para su leyenda.
 * Lanza un error si el acorde no existe (lo detectan los tests).
 */
export function chordDiagramFunctions(diagram) {
  const ids = [diagram.chord, ...[].concat(diagram.compare ?? [])];
  return ids.flatMap((id) => {
    const chord = getChord(id);
    if (!chord) throw new Error(`Acorde desconocido: ${id}`);
    return chord.frets.map((fret, i) => (fret === null ? null : noteFunction(chord.root, midiAt(6 - i, fret))))
      .filter(Boolean);
  });
}
