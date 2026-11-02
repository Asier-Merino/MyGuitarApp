// Aprender: lección por tarjetas (BUILD_PLAN 6.6.4). Pantalla completa con X, título del
// módulo y "?"; barra de avance segmentada; una idea por tarjeta con su esquema interactivo
// (tocar un punto lo hace sonar); Anterior y Siguiente (ámbar), o deslizar el dedo. La
// última tarjeta muestra "Ir a los ejercicios" y la lección queda marcada como completada.

import { h, render, button, screenHeader } from '../ui/components.js';
import { richText } from '../ui/term.js';
import { ConceptDiagram } from '../ui/concept-diagram.js';
import { openScreenHelp } from '../ui/help-sheet.js';
import { getModule } from '../data/modules.js';
import { LESSONS } from '../data/concepts.js';
import { store } from '../state.js';

/** Distancia mínima (px) de un deslizamiento horizontal para cambiar de tarjeta. */
const SWIPE_PX = 50;

export function renderLesson(view, { module: slug }, nav) {
  const mod = getModule(slug);
  const { cards } = LESSONS[slug];
  let index = 0;

  const bar = h('div', { class: 'lesson__bar', 'aria-hidden': 'true' }, cards.map(() => h('span', { class: 'lesson__seg' })));
  const counter = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const cardEl = h('article', { class: 'lesson__card' });
  const actions = h('div', { class: 'lesson__actions' });

  render(view,
    screenHeader({ title: mod.title, onBack: nav.back, onHelp: () => openScreenHelp('lesson'), closeIcon: true }),
    h('div', { class: 'screen lesson' }, bar, counter, cardEl, actions));

  function complete() {
    if (!store.data.lessons[slug]) store.update((d) => { d.lessons[slug] = new Date().toISOString(); });
  }

  function show(i) {
    index = Math.max(0, Math.min(cards.length - 1, i));
    const card = cards[index];
    const last = index === cards.length - 1;
    [...bar.children].forEach((seg, n) => seg.classList.toggle('is-done', n <= index));
    counter.textContent = `Tarjeta ${index + 1} de ${cards.length}`;
    render(cardEl,
      h('h2', { class: 'lesson__title' }, card.title),
      ConceptDiagram(card),
      richText(card.text, { className: 'lesson__text' }));
    render(actions,
      button({ label: 'Anterior', disabled: index === 0, onClick: () => show(index - 1) }),
      last
        ? button({ label: 'Ir a los ejercicios', variant: 'primary', onClick: () => nav.replace(`/teoria/${slug}`) })
        : button({ label: 'Siguiente', variant: 'primary', onClick: () => show(index + 1) }));
    if (last) complete();
    window.scrollTo(0, 0);
  }

  // Deslizar el dedo: a la izquierda, siguiente; a la derecha, anterior.
  let touch = null;
  cardEl.addEventListener('touchstart', (e) => { touch = e.touches[0]; }, { passive: true });
  cardEl.addEventListener('touchend', (e) => {
    if (!touch) return;
    const end = e.changedTouches[0];
    const dx = end.clientX - touch.clientX;
    const dy = end.clientY - touch.clientY;
    touch = null;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Teclado (PC): flechas izquierda y derecha.
  const onKey = (e) => {
    if (e.target.closest?.('input, textarea') || document.body.classList.contains('has-sheet')) return;
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  };
  document.addEventListener('keydown', onKey);

  show(0);
  return () => document.removeEventListener('keydown', onKey);
}
