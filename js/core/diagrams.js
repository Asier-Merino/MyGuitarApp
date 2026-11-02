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
//     { select: 'string', string }             todos los trastes del rango en esa cuerda
//   highlight (opcional): 'natural-semitones' (Mi–Fa y Si–Do) · 'changed' (cuerdas que cambian
//     respecto a la estándar) · colorBy: 'function' (colores de R, 3 y 5 respecto a la nota
//     que da nombre a la afinación)
//   showStringNumbers, showFretNumbers · caption (texto con marcado, opcional)
// diagram (type 'beats'): { beatsPerBar, bpm }  esquema de pulsos

import { mod12, noteFunction } from './theory.js';
import { LETTER_PC } from './notation.js';
import { STRINGS, STANDARD_TUNING, midiAt } from './fretboard-model.js';
import { getTuning } from '../data/tunings.js';

export const DIAGRAM_TYPES = Object.freeze(['fretboard', 'chord', 'tab', 'beats']);

/** Cuerdas de la 6ª (grave) a la 1ª (aguda). */
const LOW_TO_HIGH = Object.freeze([...STRINGS].reverse());

const NATURAL_PCS = Object.freeze(Object.values(LETTER_PC).sort((a, b) => a - b));

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
      return (concept.sound?.midi ?? []).map((midi) => ({ string: points.string, fret: midi - tuning[points.string] }));
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

  const points = selectPositions(diagram, concept, tuning).map(({ string, fret }) => {
    if (!Number.isInteger(fret) || fret < diagram.fromFret || fret > diagram.toFret) {
      throw new RangeError(`${concept.id}: cuerda ${string}, traste ${fret} fuera del esquema`);
    }
    const midi = midiAt(string, fret, tuning);
    const pc = mod12(midi);
    let color = 'neutral';
    if (diagram.highlight === 'natural-semitones' && semis.includes(pc)) color = 'amber';
    if (diagram.highlight === 'changed' && tuning[string] !== STANDARD_TUNING[string]) color = 'amber';
    if (root !== undefined) color = noteFunction(root, pc);
    return { string, fret, midi, pc, color, root };
  });
  return { tuning, points };
}
