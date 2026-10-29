// Fila de afinación y panel para elegirla (BUILD_PLAN 6.6.6 y 6.5), agrupada como en 6.6.16.

import { h } from './components.js';
import { icon } from './icons.js';
import { TuningName, TuningNotes } from './term.js';
import { openSheet, closeSheet } from './help-sheet.js';
import { TUNING_GROUPS } from '../data/tunings.js';

/** Fila con la afinación actual; al tocarla abre el panel. */
export function tuningRow({ tuning, onClick, label = 'Afinación' }) {
  return h('button', { type: 'button', class: 'row row--tuning', onClick, 'aria-label': `${label}: cambiar` },
    h('span', { class: 'row__text' },
      h('span', { class: 'row__title' }, TuningName(tuning)),
      h('span', { class: 'row__subtitle' }, TuningNotes(tuning)),
    ),
    h('span', { class: 'row__chevron' }, icon('chevron', { size: 20 })),
  );
}

/** Panel con las afinaciones de `allowed`, agrupadas. onSelect(id) al elegir una. */
export function openTuningPicker({ allowed, value, onSelect, title = 'Afinación' }) {
  const groups = TUNING_GROUPS
    .map((g) => ({ group: g, items: allowed.filter((t) => t.group === g.id) }))
    .filter((g) => g.items.length);
  openSheet({
    title,
    content: groups.map(({ group, items }) => h('section', { class: 'picker-group' },
      h('h3', { class: 'group__title' }, group.title),
      h('div', { class: 'list' }, items.map((t) => {
        const selected = t.id === value;
        return h('button', {
          type: 'button',
          class: ['row', 'row--option', selected && 'is-selected'].filter(Boolean).join(' '),
          'aria-pressed': String(selected),
          onClick: () => { closeSheet(); if (!selected) onSelect(t.id); },
        },
        h('span', { class: 'row__text' },
          h('span', { class: 'row__title' }, TuningName(t)),
          h('span', { class: 'row__subtitle' }, TuningNotes(t)),
        ),
        h('span', { class: 'row__check' }, selected ? icon('check') : null));
      })),
    )),
  });
}
