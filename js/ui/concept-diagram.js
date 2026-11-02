// Esquema visual de un concepto (BUILD_PLAN 6.8): el mismo en la ficha del glosario y, en
// pequeño, en el panel "?". Los puntos se calculan en js/core/diagrams.js y suenan al tocarlos.

import { h } from './components.js';
import { richText } from './term.js';
import { Fretboard } from './fretboard.js';
import { ChordDiagram } from './chord-diagram.js';
import { BeatsDiagram } from './beats.js';
import { fretboardDiagramPoints } from '../core/diagrams.js';
import { getTuning } from '../data/tunings.js';
import { getChord } from '../data/chords.js';
import { UI_TEXTS } from '../data/concepts.js';

const FUNCTION_ORDER = ['root', 'third', 'fifth', 'seventh', 'blue', 'other'];

/** Leyenda de los colores de función que aparecen (nunca se informa solo con color). */
export function FunctionLegend(colors) {
  const present = FUNCTION_ORDER.filter((c) => colors.includes(c));
  if (!present.length) return null;
  return h('ul', { class: 'fn-legend' }, present.map((c) => h('li', { class: `fn-legend__item fb-dot--${c}` },
    h('span', { class: 'fn-legend__dot', 'aria-hidden': 'true' }), UI_TEXTS.functionNames[c])));
}

/** Devuelve el esquema del concepto (o null si no tiene). compact: versión del panel. */
export function ConceptDiagram(concept, { compact = false } = {}) {
  const d = concept.diagram;
  if (!d) return null;
  let figure = null;
  let legend = null;
  if (d.type === 'fretboard') {
    const { tuning, points } = fretboardDiagramPoints(concept);
    if (d.colorBy === 'function') legend = FunctionLegend(points.map((p) => p.color));
    figure = Fretboard({
      fromFret: d.fromFret,
      toFret: d.toFret,
      tuning,
      accidentals: getTuning(d.tuning ?? 'standard').accidentals === 'flat' ? 'flat' : undefined,
      markers: points,
      playOnTap: true,
      showFretNumbers: d.showFretNumbers ?? true,
      showStringNumbers: Boolean(d.showStringNumbers),
      label: `Esquema de «${concept.title}»`,
    });
  } else if (d.type === 'chord') {
    figure = ChordDiagram(getChord(d.chord), { size: compact ? 'small' : 'large' });
  } else if (d.type === 'beats') {
    figure = BeatsDiagram({ beatsPerBar: d.beatsPerBar, bpm: d.bpm });
  }
  if (!figure) return null;
  return h('figure', { class: ['concept-diagram', compact && 'concept-diagram--compact'].filter(Boolean).join(' ') },
    figure,
    legend,
    d.caption && richText(d.caption, { tag: 'figcaption', className: 'concept-diagram__caption' }),
  );
}
