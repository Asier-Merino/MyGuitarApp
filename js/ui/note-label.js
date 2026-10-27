// Componente de doble notación: principal en grande y la otra en pequeño. **Fa** F
// Toda la interfaz debe usar este componente para mostrar nombres de nota.

import { spell, formatSpelling, spokenName } from '../core/notation.js';
import { settings } from '../state.js';
import { h } from './components.js';

/**
 * Textos de una nota según los ajustes (o las opciones dadas).
 * opts.spelling: deletreo explícito { letter, accidental } (p. ej. en una tonalidad).
 */
export function noteNames(pc, { spelling, notation, accidentals } = {}) {
  const main = notation ?? settings.get('notation');
  const other = main === 'es' ? 'en' : 'es';
  const sp = spelling ?? spell(pc, accidentals ?? settings.get('accidentals'));
  return {
    primary: formatSpelling(sp, main),
    secondary: formatSpelling(sp, other),
    spoken: spokenName(sp, main),
  };
}

/** Devuelve un <span class="note-label">. opts: { spelling, notation, accidentals, className } */
export function NoteLabel(pc, opts = {}) {
  const { primary, secondary, spoken } = noteNames(pc, opts);
  return h('span', { class: ['note-label', opts.className].filter(Boolean).join(' ') },
    h('span', { class: 'nl-main', 'aria-hidden': 'true' }, primary),
    h('span', { class: 'nl-alt', 'aria-hidden': 'true' }, secondary),
    h('span', { class: 'sr-only' }, spoken),
  );
}
