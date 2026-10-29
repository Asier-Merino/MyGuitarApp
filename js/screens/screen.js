// Esqueleto de las pantallas interiores: cabecera ← título ? y contenido (BUILD_PLAN 6.4).

import { h, render, screenHeader } from '../ui/components.js';
import { openScreenHelp } from '../ui/help-sheet.js';

/**
 * nav.back(): vuelve a la pantalla anterior (o a la madre si no hay historial).
 * help: clave de SCREEN_HELP (concepts.js) o función propia.
 */
export function renderScreen(view, { title, nav, help, content, className }) {
  const onHelp = typeof help === 'function' ? help : help ? () => openScreenHelp(help) : null;
  render(view,
    screenHeader({ title, onBack: nav.back, onHelp }),
    h('div', { class: ['screen', className].filter(Boolean).join(' ') }, content),
  );
}
