// Arranque: router, pantallas, tema y service worker.

import { createRouter } from './router.js';
import { resolvePath } from './routes.js';
import { settings } from './state.js';
import { h, render } from './ui/components.js';
import { closeSheet } from './ui/help-sheet.js';
import { registerServiceWorker, applyUpdate } from './pwa.js';
import { APP_NAME } from './version.js';
import { SECTIONS, getModule, getPlannedExercise, moduleTitle, MIXED_SESSION_PHASE } from './data/modules.js';
import { getConcept, getBlock } from './data/concepts.js';
import { renderHome } from './screens/home.js';
import { renderSection } from './screens/section.js';
import { renderModule } from './screens/module.js';
import { renderSetup } from './screens/setup.js';
import { renderSoon } from './screens/soon.js';
import { renderTunings, leaveTunings } from './modules/tunings/tunings-view.js';
import { renderGlossary, renderGlossaryBlock, renderConcept } from './modules/glossary/glossary-view.js';
import { renderProfile, renderAbout } from './modules/profile/profile-view.js';
import { renderSettings } from './settings-view.js';

const view = document.getElementById('view');

/** Título de la pestaña del navegador para cada pantalla. */
function pageTitle({ name, params }) {
  switch (name) {
    case 'home': return null;
    case 'section': return SECTIONS[params.section].title;
    case 'mixed': return 'Sesión mezclada';
    case 'module': return moduleTitle(getModule(params.module), params.section);
    case 'lesson': return `Aprender · ${getModule(params.module).title}`;
    case 'reference': return `Consulta · ${getModule(params.module).title}`;
    case 'setup': return getPlannedExercise(params.section, params.module, params.exercise).title;
    case 'tunings': return 'Afinaciones';
    case 'glossary': return 'Glosario';
    case 'glossaryBlock': return getBlock(params.block).title;
    case 'concept': return getConcept(params.id).title;
    case 'profile': return 'Perfil';
    case 'about': return 'Acerca de';
    case 'settings': return 'Ajustes';
    default: return null;
  }
}

const VIEWS = {
  home: (p) => renderHome(view, p),
  section: (p, nav) => renderSection(view, p, nav),
  mixed: (p, nav) => renderSoon(view, { title: 'Sesión mezclada', phase: MIXED_SESSION_PHASE }, nav),
  module: (p, nav) => renderModule(view, p, nav),
  lesson: (p, nav) => renderSoon(view, { title: 'Aprender', phase: getModule(p.module).phase }, nav),
  reference: (p, nav) => renderSoon(view, { title: 'Consulta', phase: getModule(p.module).phase }, nav),
  setup: (p, nav) => renderSetup(view, p, nav),
  tunings: (p, nav) => renderTunings(view, p, nav),
  glossary: (p, nav) => renderGlossary(view, p, nav),
  glossaryBlock: (p, nav) => renderGlossaryBlock(view, p, nav),
  concept: (p, nav) => renderConcept(view, p, nav),
  profile: (p, nav) => renderProfile(view, p, nav),
  about: (p, nav) => renderAbout(view, p, nav),
  settings: (p, nav) => renderSettings(view, p, nav),
};

function renderNotFound(nav) {
  render(view, h('div', { class: 'screen soon' },
    h('p', { class: 'soon__title' }, 'Pantalla no encontrada'),
    h('p', {}, h('a', { href: '#/', onClick: (e) => { e.preventDefault(); nav.home(); } }, 'Volver al inicio')),
  ));
}

let lastPath = null;
let lastName = null;

const router = createRouter({
  onRoute(path) {
    const match = resolvePath(path);
    if (lastName === 'tunings' && match?.name !== 'tunings') leaveTunings();
    const nav = {
      back: () => router.back(match?.parent ?? '/'),
      home: () => router.replace('/'),
    };
    if (path !== lastPath) closeSheet();
    if (!match) {
      document.title = APP_NAME;
      renderNotFound(nav);
    } else {
      const title = pageTitle(match);
      document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
      VIEWS[match.name](match.params, nav);
    }
    if (path !== lastPath) {
      window.scrollTo(0, 0);
      view.focus({ preventScroll: true });
    }
    lastPath = path;
    lastName = match?.name ?? null;
  },
});

/* ----- Tema ----- */

function applyTheme() {
  document.documentElement.dataset.theme = settings.get('theme');
  // La barra del navegador toma el color de fondo del tema que se ve.
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

settings.subscribe(() => {
  applyTheme();
  // Volver a pintar conservando el scroll (p. ej. al cambiar la notación).
  const y = window.scrollY;
  router.refresh();
  window.scrollTo(0, y);
});

/* ----- Arranque ----- */

applyTheme();
router.start();

// Pedir al navegador que no borre los datos (BUILD_PLAN 6.9). Si no se puede, no pasa nada.
try {
  navigator.storage?.persist?.().catch(() => {});
} catch { /* no disponible */ }

const banner = document.getElementById('update-banner');
document.getElementById('update-apply').addEventListener('click', applyUpdate);
registerServiceWorker({ onUpdateReady: () => { banner.hidden = false; } });
