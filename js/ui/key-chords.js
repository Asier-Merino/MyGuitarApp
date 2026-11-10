// Acordes de una tonalidad (Fase 5): cada grado con su número romano y su acorde, que suena
// al tocarlo, y progresiones por grados que se pueden escuchar. Los acordes se calculan en
// js/core/keys.js y suenan con su forma abierta o, si no la tienen, con la tríada cerrada.

import { h, render } from './components.js';
import { icon } from './icons.js';
import { ChordLabel } from './note-label.js';
import { keyChordMidis, progressionSound } from '../core/progressions.js';
import { strum, playEvents } from '../audio/synth.js';

/** Botón de un acorde de la tonalidad: grado arriba y nombre debajo. Suena al tocarlo. */
export function KeyChordButton(chord, { onClick, pressed, className } = {}) {
  return h('button', {
    type: 'button',
    class: ['btn', 'btn--grey', 'key-chord', className].filter(Boolean).join(' '),
    'aria-pressed': pressed === undefined ? undefined : String(pressed),
    onClick: onClick ?? (() => strum(keyChordMidis(chord), 'down')),
  }, h('span', { class: 'key-chord__roman' }, chord.roman), ChordLabel(chord));
}

/** Línea de una progresión: "I–V–vi–IV" y sus acordes, con un botón para escucharla. */
export function ProgressionLine({ degrees, chords }) {
  let stop = null;
  const names = h('span', { class: 'prog-line' });
  chords.forEach((c, i) => { if (i) names.append('–'); names.append(ChordLabel(c)); });
  return h('div', { class: 'key-prog' },
    h('div', { class: 'key-prog__text' },
      h('span', { class: 'key-prog__degrees' }, degrees.join('–')),
      names),
    h('button', {
      type: 'button',
      class: 'btn btn--grey btn--small key-prog__play',
      'aria-label': `Escuchar ${degrees.join(', ')}`,
      onClick: () => { stop?.(); stop = playEvents(progressionSound(chords)); },
    }, icon('play'), h('span', {}, 'Escuchar')));
}

/**
 * Casillas de una progresión: cada acorde con su grado encima; el que falta lleva «?».
 * Devuelve el elemento con fill(chord, state) para poner el que falta ('correct' o 'answer').
 */
export function ProgressionSlots(chords, missing) {
  const slots = chords.map((c, i) => h('li', { class: ['prog-slot', i === missing && 'is-missing'].filter(Boolean).join(' ') },
    h('span', { class: 'prog-slot__roman' }, c.roman),
    h('span', { class: 'prog-slot__chord' }, i === missing ? '?' : ChordLabel(c)),
    i === missing && h('span', { class: 'sr-only' }, 'Falta este acorde')));
  const el = h('ol', { class: 'prog-slots', 'aria-label': `Progresión ${chords.map((c) => c.roman).join(', ')}` }, slots);
  el.fill = (chord) => {
    const slot = slots[missing];
    render(slot.querySelector('.prog-slot__chord'), ChordLabel(chord));
    slot.classList.add('is-filled');
  };
  return el;
}

/** Los 7 acordes de la tonalidad y, debajo, las progresiones (datos de core/diagrams.js, keyDiagram). */
export function KeyChords({ chords, progressions = [] }) {
  return h('div', { class: 'key-diagram' },
    h('div', { class: 'key-chords', role: 'group', 'aria-label': 'Acordes de la tonalidad' }, chords.map((c) => KeyChordButton(c))),
    progressions.length > 0 && h('div', { class: 'key-progs' }, progressions.map(ProgressionLine)));
}
