// Consulta de Notas del mástil (BUILD_PLAN 6.6.5 y Fase 2): el mástil completo, del traste 0
// al 12, con todas las notas, y un filtro por nota (p. ej. ver todos los Sol). Cada punto
// suena al tocarlo. Las notas se calculan con la afinación estándar.

import { h, render } from '../../ui/components.js';
import { renderScreen } from '../../screens/screen.js';
import { Fretboard, positionMarkers } from '../../ui/fretboard.js';
import { NoteLabel } from '../../ui/note-label.js';
import { positionsOf } from '../../core/fretboard-model.js';
import { ALL_PCS } from './common.js';

const RANGE = Object.freeze({ from: 0, to: 12 });

// El filtro elegido se conserva mientras la app está abierta.
let filter = 'all';

function positions() {
  if (filter !== 'all') return positionsOf(filter, { fromFret: RANGE.from, toFret: RANGE.to });
  const all = [];
  for (const string of [6, 5, 4, 3, 2, 1]) for (let fret = RANGE.from; fret <= RANGE.to; fret++) all.push({ string, fret });
  return all;
}

export function renderNotesReference(view, params, nav) {
  const chipsEl = h('div', { class: 'chips reference__filter', role: 'group', 'aria-label': 'Filtrar por nota' });
  const boardEl = h('div', { class: 'reference__board' });

  const draw = () => {
    render(chipsEl, ['all', ...ALL_PCS].map((value) => h('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': String(value === filter),
      onClick: () => { filter = value; draw(); },
    }, value === 'all' ? 'Todas' : NoteLabel(value))));
    render(boardEl, Fretboard({
      fromFret: RANGE.from,
      toFret: RANGE.to,
      markers: positionMarkers(positions(), { color: filter === 'all' ? 'neutral' : 'amber' }),
      playOnTap: true,
      label: 'Mástil con todas las notas',
    }));
  };

  renderScreen(view, {
    title: 'Consulta',
    nav,
    help: 'referenceNotes',
    className: 'reference',
    content: [chipsEl, boardEl],
  });
  draw();
}
