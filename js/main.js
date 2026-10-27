// Arranque: cabecera, router, vistas de inicio y service worker.

import { createRouter } from './router.js';
import { settings } from './state.js';
import { h, render, segmented, badge } from './ui/components.js';
import { NoteLabel } from './ui/note-label.js';
import { renderSettings } from './settings-view.js';
import { registerServiceWorker, applyUpdate } from './pwa.js';

const SECTIONS = {
  teoria: { title: 'Teoría', lead: 'Sin guitarra: explicaciones cortas, consulta y ejercicios tipo quiz.' },
  practica: { title: 'Práctica', lead: 'Con la guitarra en las manos: consignas grandes, voz y metrónomo.' },
};

const MODULES = [
  {
    slug: 'notas', num: 1, title: 'Notas del mástil', phase: 2,
    teoria: 'Quiz «¿qué nota es?», encuéntrala y octavas.',
    practica: 'La app dice una nota y la tocas en todas las cuerdas a contrarreloj.',
  },
  {
    slug: 'acordes', num: 2, title: 'Acordes abiertos', phase: 3,
    teoria: 'Diagramas, notas que los forman y quiz.',
    practica: 'Cambios de acordes con metrónomo.',
  },
  {
    slug: 'oido', num: 3, title: 'Oído', phase: 4,
    teoria: '¿Mayor o menor? y otros ejercicios de escucha.',
    practica: 'Suena una nota y la buscas en la guitarra.',
  },
  {
    slug: 'tonalidad', num: 4, title: 'Intervalos, escala mayor y tonalidad', phase: 5,
    teoria: 'Construcción de escalas, grados y quiz.',
    practica: 'Escala con metrónomo y progresiones de la tonalidad.',
  },
  {
    slug: 'blues', num: 5, title: 'Pentatónica y blues', phase: 6,
    teoria: 'Blues de 12 compases, la blue note y quiz.',
    practica: 'Base shuffle, notas objetivo y licks pregunta-respuesta.',
  },
  {
    slug: 'caged', num: 6, title: 'CAGED', phase: 7,
    teoria: 'Explorador de las 5 formas y quiz.',
    practica: 'Tocar un acorde en una forma y recorrer las 5 formas.',
  },
  {
    slug: 'progreso', num: 7, title: 'Progreso', phase: 8,
    teoria: 'Estadísticas, mapa de calor del mástil y puntos débiles.',
    practica: 'Estadísticas, mapa de calor del mástil y puntos débiles.',
  },
];

const view = document.getElementById('view');

function setTitle(text) {
  document.title = text ? `${text} · MyGuitarApp` : 'MyGuitarApp';
}

/* ----- Vistas ----- */

function renderSectionHome(section) {
  const info = SECTIONS[section];
  setTitle(info.title);
  render(view, 
    h('h1', { class: 'sr-only' }, info.title),
    h('p', { class: 'lead' }, info.lead),

    h('div', { class: 'card card--featured' },
      h('div', {},
        h('p', { class: 'card-title' }, 'Sesión mezclada'),
        h('p', { class: 'card-desc' }, 'Ejercicios de varios módulos, centrados en lo que más te cuesta.'),
        badge('Próximamente · Fase 8'),
      ),
    ),

    h('h2', {}, 'Módulos'),
    h('ul', { class: 'module-grid' },
      MODULES.map((m) => h('li', {},
        h('a', { class: 'card module-card', href: `#/${section}/${m.slug}` },
          h('span', { class: 'module-card__num', 'aria-hidden': 'true' }, m.num),
          h('span', { class: 'card-title' }, m.title),
          h('span', { class: 'card-desc' }, m[section]),
          badge(`Próximamente · Fase ${m.phase}`),
        ),
      )),
    ),

    section === 'teoria' && h('section', { class: 'card', 'aria-labelledby': 'notes-ref' },
      h('h2', { id: 'notes-ref' }, 'Las 12 notas'),
      h('p', { class: 'card-desc' },
        'Cambia la notación con ES | EN arriba, y sostenidos o bemoles en Ajustes.'),
      h('ul', { class: 'note-strip' },
        Array.from({ length: 12 }, (_, pc) => h('li', {}, NoteLabel(pc))),
      ),
    ),
  );
}

function renderModule(section, slug) {
  const mod = MODULES.find((m) => m.slug === slug);
  if (!mod) { renderNotFound(); return; }
  const info = SECTIONS[section];
  setTitle(mod.title);
  render(view, 
    h('a', { class: 'back-link', href: `#/${section}` }, `← ${info.title}`),
    h('h1', {}, mod.title),
    h('p', { class: 'lead' }, mod[section]),
    h('div', { class: 'card' },
      h('p', { class: 'card-title' }, 'Próximamente'),
      h('p', { class: 'card-desc' }, `Este módulo se construye en la Fase ${mod.phase}.`),
    ),
  );
}

function renderSettingsPage() {
  setTitle('Ajustes');
  renderSettings(view);
}

function renderNotFound() {
  setTitle('No encontrado');
  render(view, 
    h('h1', {}, 'Página no encontrada'),
    h('p', {}, h('a', { href: '#/teoria' }, 'Volver al inicio')),
  );
}

/* ----- Cabecera ----- */

function renderNotationSwitch() {
  document.getElementById('notation-switch').replaceChildren(segmented({
    label: 'Notación principal',
    value: settings.get('notation'),
    options: [
      { value: 'es', label: 'ES', ariaLabel: 'Notación española (Do, Re, Mi)' },
      { value: 'en', label: 'EN', ariaLabel: 'Notación inglesa (C, D, E)' },
    ],
    onChange: (v) => settings.set('notation', v),
  }));
}

function updateHeaderState(path) {
  const section = path.split('/')[1];
  document.querySelectorAll('.section-tabs a').forEach((a) => {
    if (a.dataset.section === section) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const settingsLink = document.getElementById('settings-link');
  if (section === 'ajustes') settingsLink.setAttribute('aria-current', 'page');
  else settingsLink.removeAttribute('aria-current');
}

function applyTheme() {
  const theme = settings.get('theme');
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

/* ----- Arranque ----- */

const router = createRouter({
  defaultPath: '/teoria',
  routes: [
    { path: '/teoria', view: () => renderSectionHome('teoria') },
    { path: '/practica', view: () => renderSectionHome('practica') },
    { path: '/teoria/:module', view: (p) => renderModule('teoria', p.module) },
    { path: '/practica/:module', view: (p) => renderModule('practica', p.module) },
    { path: '/ajustes', view: renderSettingsPage },
  ],
  notFound: renderNotFound,
});

let lastPath = null;
router.onChange((path) => {
  updateHeaderState(path);
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
});

settings.subscribe(() => {
  applyTheme();
  renderNotationSwitch();
  // Volver a pintar conservando el scroll.
  const y = window.scrollY;
  router.refresh();
  window.scrollTo(0, y);
});

applyTheme();
renderNotationSwitch();
router.start();

const banner = document.getElementById('update-banner');
document.getElementById('update-apply').addEventListener('click', applyUpdate);
registerServiceWorker({ onUpdateReady: () => { banner.hidden = false; } });
