// Panel que sube desde abajo (BUILD_PLAN 6.8): ayuda "?" de cada pantalla y de cada ejercicio
// ("Cómo se juega" y "La teoría detrás"), "¿Por qué?" de un fallo, ficha corta de un
// concepto y confirmaciones. Solo hay un panel abierto a la vez.
// Los ejercicios se pausan mientras hay un panel abierto (onSheetChange).

import { h, button, iconButton } from './components.js';
import { richText, Term } from './term.js';
import { getConcept, getBlock, SCREEN_HELP } from '../data/concepts.js';
import { ConceptDiagram } from './concept-diagram.js';
import { getTuning } from '../data/tunings.js';
import { playSequence } from '../audio/synth.js';

let current = null; // { close }
const sheetListeners = new Set();

/** fn(abierto) se llama cada vez que se abre o se cierra un panel. Devuelve cómo dejar de escuchar. */
export function onSheetChange(fn) {
  sheetListeners.add(fn);
  return () => sheetListeners.delete(fn);
}
const notifySheet = (open) => sheetListeners.forEach((fn) => fn(open));

export const isSheetOpen = () => Boolean(current);

/**
 * Abre un panel. content: nodos del cuerpo. Devuelve la función que lo cierra.
 * onClose se llama al cerrarlo de cualquier forma (X, fondo, Escape o al navegar).
 */
export function openSheet({ title, content, onClose, labelledBy = 'sheet-title' }) {
  current?.close();
  const previousFocus = document.activeElement;
  let stopSound = null;

  const titleEl = h('h2', { class: 'sheet__title', id: labelledBy, tabindex: '-1' }, title);
  const panel = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': labelledBy },
    h('div', { class: 'sheet__head' },
      titleEl,
      iconButton({ iconName: 'close', label: 'Cerrar', onClick: () => close() }),
    ),
    h('div', { class: 'sheet__body' }, content),
  );
  const backdrop = h('div', { class: 'sheet-backdrop', onClick: (e) => { if (e.target === backdrop) close(); } }, panel);

  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const onNavigate = () => close({ restoreFocus: false });

  function close({ restoreFocus = true } = {}) {
    if (!backdrop.isConnected) return;
    stopSound?.();
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('hashchange', onNavigate);
    document.body.classList.remove('has-sheet');
    if (current?.close === close) current = null;
    if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    onClose?.();
    if (!current) notifySheet(false);
  }

  document.body.append(backdrop);
  document.body.classList.add('has-sheet');
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', onNavigate);
  requestAnimationFrame(() => backdrop.classList.add('is-open'));
  titleEl.focus({ preventScroll: true });
  current = { close, setStop: (fn) => { stopSound = fn; } };
  notifySheet(true);
  return close;
}

export const closeSheet = () => current?.close();

/** Hace sonar el `sound` de un concepto: notas seguidas o las 6 cuerdas de una afinación. */
export function playConceptSound(sound, opts = {}) {
  if (sound.tuning) {
    const tuning = getTuning(sound.tuning);
    return playSequence([6, 5, 4, 3, 2, 1].map((s) => tuning.midi[s]), { gap: 0.9, ...opts });
  }
  return playSequence(sound.midi, { gap: 0.7, ...opts });
}

/** Botón "Escuchar" de las fichas. */
export function listenButton(sound) {
  return button({
    label: 'Escuchar',
    iconName: 'volume',
    onClick: () => {
      const stop = playConceptSound(sound);
      current?.setStop?.(stop);
    },
  });
}

/** Lista de conceptos relacionados, como palabras pulsables. */
export function relatedTerms(ids) {
  if (!ids?.length) return null;
  return h('div', { class: 'related' },
    h('h3', { class: 'related__title' }, 'Relacionados'),
    h('div', { class: 'related__list' }, ids.map((id) => Term(id, getConcept(id).title))),
  );
}

/** Ficha corta de un concepto (la misma que la del glosario, en un panel). */
export function openConceptSheet(id) {
  const concept = getConcept(id);
  if (!concept) return;
  openSheet({
    title: concept.title,
    content: [
      h('p', { class: 'concept-meta' }, getBlock(concept.block).title),
      ConceptDiagram(concept, { compact: true }),
      richText(concept.summary, { className: 'concept-summary' }),
      concept.sound && h('div', { class: 'btn-row' }, listenButton(concept.sound)),
      relatedTerms(concept.related),
      h('p', { class: 'sheet__link' }, h('a', { href: `#/glosario/concepto/${concept.id}` }, 'Abrir en el glosario')),
    ],
  });
}

/** Ayuda "?" de una pantalla (SCREEN_HELP de concepts.js). */
export function openScreenHelp(key) {
  const help = SCREEN_HELP[key];
  if (!help) return;
  openSheet({
    title: help.title,
    content: [
      richText(help.text),
      help.concepts?.length && h('div', { class: 'related' },
        h('h3', { class: 'related__title' }, 'Conceptos'),
        h('div', { class: 'related__list' }, help.concepts.map((cid) => Term(cid, getConcept(cid).title))),
      ),
    ],
  });
}

/** Tarjeta de un concepto dentro de la ayuda de un ejercicio: esquema, texto y enlace. */
function conceptCard(id) {
  const concept = getConcept(id);
  return h('section', { class: 'concept-card' },
    h('h4', { class: 'concept-card__title' }, concept.title),
    ConceptDiagram(concept, { compact: true }),
    richText(concept.summary, { className: 'concept-card__text' }),
    h('p', { class: 'sheet__link' }, h('a', { href: `#/glosario/concepto/${concept.id}` }, 'Abrir en el glosario')),
  );
}

/** Ayuda "?" de un ejercicio (6.8): "Cómo se juega" y "La teoría detrás". */
export function openExerciseHelp(exercise) {
  openSheet({
    title: exercise.title,
    content: [
      h('h3', { class: 'sheet__section' }, 'Cómo se juega'),
      richText(exercise.howTo),
      h('h3', { class: 'sheet__section' }, 'La teoría detrás'),
      exercise.concepts.map(conceptCard),
    ],
  });
}

/**
 * "¿Por qué?" de un fallo (6.8): la corrección, la explicación generada por reglas,
 * un esquema opcional (`figure`) y los conceptos del ejercicio.
 */
export function openWhySheet({ feedback, why, figure, concepts = [] }) {
  openSheet({
    title: '¿Por qué?',
    content: [
      feedback && richText(feedback, { className: 'why__feedback' }),
      figure,
      richText(why, { className: 'why__text' }),
      concepts.length > 0 && h('div', { class: 'related' },
        h('h3', { class: 'related__title' }, 'Conceptos'),
        h('div', { class: 'related__list' }, concepts.map((id) => Term(id, getConcept(id).title))),
      ),
    ],
  });
}

/** Confirmación en un panel. Devuelve una promesa con true (confirmar) o false. */
export function confirmSheet({ title, text, confirmLabel = 'Aceptar', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (value) => { answered = true; resolve(value); close(); };
    const close = openSheet({
      title,
      content: [
        h('p', {}, text),
        h('div', { class: 'btn-row btn-row--end' },
          button({ label: 'Cancelar', onClick: () => answer(false) }),
          button({ label: confirmLabel, variant: danger ? 'danger' : 'primary', onClick: () => answer(true) }),
        ),
      ],
      onClose: () => { if (!answered) resolve(false); },
    });
  });
}
