// Glosario (BUILD_PLAN 6.6.17): buscador, bloques, lista de conceptos de un bloque y ficha.

import { h, render, list, listRow } from '../../ui/components.js';
import { icon } from '../../ui/icons.js';
import { richText } from '../../ui/term.js';
import { listenButton, relatedTerms } from '../../ui/help-sheet.js';
import { renderScreen } from '../../screens/screen.js';
import { CONCEPTS, getConcept, getBlock, blockConcepts, nonEmptyBlocks } from '../../data/concepts.js';
import { searchConcepts, displayAliases } from '../../core/glossary.js';
import { resolvePath } from '../../routes.js';

// La búsqueda se conserva al volver a la pantalla (p. ej. tras abrir una ficha).
let lastQuery = '';

const conceptRow = (c) => listRow({ href: `#/glosario/concepto/${c.id}`, title: c.title, subtitle: richText(c.short, { tag: 'span' }) });

export function renderGlossary(view, params, nav) {
  const results = h('div', { class: 'search-results', 'aria-live': 'polite' });
  const blocks = h('section', { class: 'glossary-blocks' },
    h('h2', { class: 'section-title' }, 'Bloques'),
    list(nonEmptyBlocks().map((b) => listRow({
      href: `#/glosario/${b.id}`,
      title: b.title,
      end: blockConcepts(b.id).length,
    }))),
  );

  const update = (query) => {
    lastQuery = query;
    const q = query.trim();
    blocks.hidden = Boolean(q);
    if (!q) { render(results); return; }
    const found = searchConcepts(CONCEPTS, q);
    render(results, found.length
      ? list(found.map(conceptRow))
      : h('p', { class: 'empty' }, `No hay ningún concepto que contenga «${q}».`));
  };

  const input = h('input', {
    type: 'search',
    class: 'search__input',
    placeholder: 'Busca un concepto: octava, sharp…',
    'aria-label': 'Buscar en el glosario',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    enterkeyhint: 'search',
    onInput: (e) => update(e.target.value),
  });
  input.value = lastQuery;

  renderScreen(view, {
    title: 'Glosario',
    nav,
    help: 'glossary',
    content: [
      h('label', { class: 'search' }, icon('search', { size: 20 }), input),
      results,
      blocks,
    ],
  });
  update(lastQuery);
}

export function renderGlossaryBlock(view, { block }, nav) {
  const info = getBlock(block);
  renderScreen(view, {
    title: info.title,
    nav,
    help: 'glossary',
    content: list(blockConcepts(block).map(conceptRow)),
  });
}

export function renderConcept(view, { id }, nav) {
  const c = getConcept(id);
  const lessonRoute = c.lesson ? resolvePath(c.lesson) : null;
  const aliases = displayAliases(c);
  const lessonLabel = lessonRoute?.name === 'lesson' ? 'Ver la lección completa' : 'Ir a Afinaciones';
  renderScreen(view, {
    title: c.title,
    nav,
    help: 'glossary',
    className: 'concept',
    content: [
      h('p', { class: 'concept-meta' },
        h('span', {}, getBlock(c.block).title),
        aliases.length > 0 && h('span', { class: 'concept-meta__aliases' }, ` · También: ${aliases.join(', ')}`),
      ),
      richText(c.summary, { className: 'concept-summary' }),
      c.sound && h('div', { class: 'btn-row' }, listenButton(c.sound)),
      relatedTerms(c.related),
      lessonRoute && h('p', { class: 'concept-lesson' }, h('a', { href: c.lesson }, lessonLabel)),
    ],
  });
}
