// Pantalla "Próximamente" para lo que aún no está construido (lección, consulta, sesión mezclada).

import { h } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { renderScreen } from './screen.js';

export function renderSoon(view, { title, phase }, nav) {
  renderScreen(view, {
    title,
    nav,
    help: 'soon',
    content: h('div', { class: 'soon' },
      h('span', { class: 'soon__icon' }, icon('info', { size: 40 })),
      h('p', { class: 'soon__title' }, 'Próximamente'),
      h('p', { class: 'soon__text' }, `Llega en la Fase ${phase}.`),
    ),
  });
}
