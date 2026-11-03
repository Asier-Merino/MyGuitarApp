// Consulta de Acordes abiertos (BUILD_PLAN 6.6.5 y Fase 3): la biblioteca de acordes (5.1).
// Del acorde elegido: diagrama grande, las notas que suenan coloreadas por función (con su
// leyenda escrita), botones para oírlo rasgueado y arpegiado, y un conmutador para verlo en
// el mástil. Todo se calcula a partir de los trastes de la biblioteca.

import { h, render, button, toggle, settingRow } from '../../ui/components.js';
import { renderScreen } from '../../screens/screen.js';
import { ChordLabel, NoteLabel } from '../../ui/note-label.js';
import { ChordDiagram } from '../../ui/chord-diagram.js';
import { Fretboard } from '../../ui/fretboard.js';
import { FunctionLegend } from '../../ui/concept-diagram.js';
import { CHORDS, getChord } from '../../data/chords.js';
import { LEVELS } from '../../data/modules.js';
import { UI_TEXTS } from '../../data/concepts.js';
import { strum, arpeggio } from '../../audio/synth.js';
import { chordNotes, toneSpelling, chordMidis } from './common.js';

// El acorde elegido y el conmutador se conservan mientras la app está abierta.
let selected = 'C';
let onBoard = false;

export function renderChordsReference(view, params, nav) {
  const chipsEl = h('div', { class: 'reference__filter chord-chips' });
  const detailEl = h('div', { class: 'chord-ref' });

  const draw = () => {
    const chord = getChord(selected);
    const notes = chordNotes(chord);
    render(chipsEl, LEVELS.map((level) => {
      const chords = CHORDS.filter((c) => c.level === level.id);
      return h('div', { class: 'chips', role: 'group', 'aria-label': `Acordes de nivel ${level.title}` },
        h('span', { class: 'chips__label' }, level.title),
        chords.map((c) => h('button', {
          type: 'button',
          class: 'chip',
          'aria-pressed': String(c.id === selected),
          onClick: () => { selected = c.id; draw(); },
        }, ChordLabel(c))));
    }));
    const midis = chordMidis(chord);
    render(detailEl,
      h('div', { class: 'chord-ref__head' }, ChordLabel(chord, { className: 'note-label--big' })),
      h('div', { class: 'chord-ref__figure' }, ChordDiagram(chord, { size: 'large', colorByFunction: true })),
      h('div', { class: 'btn-row chord-ref__play' },
        button({ label: 'Rasgueado', iconName: 'play', onClick: () => strum(midis, 'down') }),
        button({ label: 'Arpegiado', iconName: 'play', onClick: () => arpeggio(midis) })),
      h('h2', { class: 'section-title' }, 'Notas que suenan'),
      h('ul', { class: 'chord-ref__notes' }, notes.map((n) => h('li', { class: `chord-ref__note fb-dot--${n.fn}` },
        h('span', { class: 'chord-ref__string' }, `${n.string}ª`),
        h('span', { class: 'fn-legend__dot', 'aria-hidden': 'true' }),
        NoteLabel(n.pc, { spelling: toneSpelling(chord, n.pc) }),
        h('span', { class: 'chord-ref__fn' }, UI_TEXTS.functionNames[n.fn])))),
      FunctionLegend(notes.map((n) => n.fn)),
      h('div', { class: 'card setup__option' }, settingRow({
        label: 'Ver en el mástil',
        control: toggle({ label: 'Ver en el mástil', checked: onBoard, onChange: (on) => { onBoard = on; draw(); } }),
      })),
      onBoard && Fretboard({
        fromFret: 0,
        toFret: 5,
        markers: notes.map((n) => ({ string: n.string, fret: n.fret, pc: n.pc, root: chord.root })),
        playOnTap: true,
        label: 'El acorde en el mástil',
      }));
  };

  renderScreen(view, {
    title: 'Consulta',
    nav,
    help: 'referenceChords',
    className: 'reference',
    content: [chipsEl, detailEl],
  });
  draw();
}
