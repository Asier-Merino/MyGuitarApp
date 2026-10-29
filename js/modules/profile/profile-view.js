// Perfil provisional (BUILD_PLAN 6.6.13): días practicados y tiempo total, calculados del
// registro de sesiones (vacío hasta que la Fase 1B empiece a registrar rondas), y "Acerca de".

import { h, list, listRow, statTile } from '../../ui/components.js';
import { logo } from '../../ui/icons.js';
import { renderScreen } from '../../screens/screen.js';
import { store } from '../../state.js';
import { APP_NAME, APP_VERSION, APP_AUTHOR } from '../../version.js';
import { practiceTotals, formatDuration } from '../../core/history.js';

export function renderProfile(view, params, nav) {
  const { days, seconds } = practiceTotals(store.data.history);
  renderScreen(view, {
    title: 'Perfil',
    nav,
    help: 'profile',
    content: [
      h('div', { class: 'stats' },
        statTile('Días practicados', days ? String(days) : '—'),
        statTile('Tiempo total', seconds ? formatDuration(seconds) : '—'),
      ),
      h('h2', { class: 'section-title' }, 'Más detalle'),
      list([listRow({ href: '#/perfil/acerca-de', iconName: 'info', title: 'Acerca de' })]),
    ],
  });
}

export function renderAbout(view, params, nav) {
  renderScreen(view, {
    title: 'Acerca de',
    nav,
    help: 'about',
    content: h('div', { class: 'about' },
      logo({ size: 88 }),
      h('p', { class: 'about__name' }, APP_NAME),
      h('dl', { class: 'about__list' },
        h('dt', {}, 'Versión'), h('dd', {}, `v${APP_VERSION}`),
        h('dt', {}, 'Autor'), h('dd', {}, APP_AUTHOR),
      ),
    ),
  });
}
