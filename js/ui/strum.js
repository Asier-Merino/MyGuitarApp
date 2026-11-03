// Patrón de rasgueo en pantalla (BUILD_PLAN 5.6 y 6.6.12): 8 casillas con ↓, ↑ o ·, el conteo
// "1 y 2 y…" debajo y un > encima de los golpes acentuados. La casilla que suena se ilumina
// (con borde, además del color). StrumDiagram: el esquema de las fichas, que suena al pulsarlo.

import { h } from './components.js';
import { STRUM_SYMBOLS, STRUM_COUNT } from '../data/strum-patterns.js';
import { getChord, chordMidis } from '../data/chords.js';
import { playStrumPattern } from '../audio/strum-player.js';

const SPOKEN = Object.freeze({ D: 'abajo', U: 'arriba', '-': 'sin golpe' });

/** Las 8 casillas. Devuelve el elemento con light(index) y clear(). */
export function StrumCells(pattern, { size = 'large' } = {}) {
  const cells = [...pattern.cells].map((c, i) => h('div', {
    class: ['strum__cell', c === '-' && 'strum__cell--rest', pattern.accents.includes(i) && 'strum__cell--accent'].filter(Boolean).join(' '),
  },
  h('span', { class: 'strum__accent', 'aria-hidden': 'true' }, pattern.accents.includes(i) ? '>' : ''),
  h('span', { class: 'strum__arrow', 'aria-hidden': 'true' }, STRUM_SYMBOLS[c]),
  h('span', { class: 'strum__count', 'aria-hidden': 'true' }, STRUM_COUNT[i])));
  const spoken = [...pattern.cells].map((c, i) => `${STRUM_COUNT[i]}: ${SPOKEN[c]}${pattern.accents.includes(i) ? ' (acento)' : ''}`).join(', ');
  const el = h('div', { class: `strum strum--${size}`, role: 'img', 'aria-label': `Patrón: ${spoken}${pattern.swing ? ', con swing' : ''}` }, cells);
  el.light = (index) => cells.forEach((c, i) => c.classList.toggle('is-on', i === index));
  el.clear = () => cells.forEach((c) => c.classList.remove('is-on'));
  return el;
}

/** Esquema de un patrón (fichas del glosario): al pulsarlo suena dos compases con el acorde. */
export function StrumDiagram(pattern, { chord = 'G', bpm = 70 } = {}) {
  const cells = StrumCells(pattern, { size: 'small' });
  const hint = h('span', { class: 'beats-diagram__hint' }, `${bpm} BPM · toca para oírlo`);
  const btn = h('button', { type: 'button', class: 'beats-diagram strum-diagram', 'aria-pressed': 'false', 'aria-label': 'Escuchar el patrón o pararlo' }, cells, hint);
  let stop = null;
  btn.addEventListener('click', () => {
    if (stop) { stop(); return; }
    stop = playStrumPattern({
      pattern,
      midis: chordMidis(getChord(chord)),
      bpm,
      onCell: (i) => { if (!btn.isConnected) { stop?.(); return; } cells.light(i); },
      onEnd: () => { stop = null; cells.clear(); btn.setAttribute('aria-pressed', 'false'); },
    });
    if (stop) btn.setAttribute('aria-pressed', 'true');
  });
  return btn;
}
