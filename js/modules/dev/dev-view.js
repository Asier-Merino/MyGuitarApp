// Página de prueba interna (#/dev, BUILD_PLAN 1B), enlazada solo desde Ajustes: mástil,
// diagramas de acorde, sonido, voz, pulso y los ejercicios de prueba de los dos motores
// (con nivel, afinación y duración). El usuario tiene el Metrónomo en su propia pantalla.

import { h, render, button, segmented, list, listRow } from '../../ui/components.js';
import { renderScreen } from '../../screens/screen.js';
import { Fretboard, positionMarkers } from '../../ui/fretboard.js';
import { ChordDiagram } from '../../ui/chord-diagram.js';
import { ChordLabel, NoteLabel } from '../../ui/note-label.js';
import { BeatsDiagram } from '../../ui/beats.js';
import { tuningRow, openTuningPicker } from '../../ui/tuning-picker.js';
import { TUNINGS, getTuning } from '../../data/tunings.js';
import { CHORDS, getChord } from '../../data/chords.js';
import { shapeNotes } from '../../core/fretboard-model.js';
import { spell, spokenName } from '../../core/notation.js';
import { createRng } from '../../core/random.js';
import { EXERCISES, exercisePath } from '../../engine/exercise-registry.js';
import { speak, speechSupported, primeSpeech } from '../../engine/speech.js';
import { strum, arpeggio, soundEnabled } from '../../audio/synth.js';
import { settings } from '../../state.js';
import { UI_TEXTS } from '../../data/concepts.js';

const RANGES = [
  { value: '0-5', label: '0–5', from: 0, to: 5 },
  { value: '0-12', label: '0–12', from: 0, to: 12 },
  { value: '0-15', label: '0–15', from: 0, to: 15 },
  { value: '5-9', label: '5–9', from: 5, to: 9 },
];

// Lo elegido se conserva mientras la app está abierta (es solo para probar).
const state = { orientation: 'auto', range: '0-12', tuning: 'standard', chord: 'C', said: null };
const rng = createRng();

export function renderDev(view, params, nav) {
  const boardBox = h('div');
  const chordBox = h('div');
  const voiceBox = h('p', { class: 'dev__said', 'aria-live': 'polite' });

  const drawBoard = () => {
    const range = RANGES.find((r) => r.value === state.range);
    const tuning = getTuning(state.tuning);
    const positions = [];
    for (const string of [6, 5, 4, 3, 2, 1]) for (let fret = range.from; fret <= range.to; fret++) positions.push({ string, fret });
    render(boardBox,
      segmented({
        label: 'Orientación',
        value: state.orientation,
        options: [{ value: 'auto', label: 'Auto' }, { value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horiz.' }],
        onChange: (v) => { state.orientation = v; drawBoard(); },
      }),
      segmented({
        label: 'Trastes',
        value: state.range,
        options: RANGES.map((r) => ({ value: r.value, label: r.label })),
        onChange: (v) => { state.range = v; drawBoard(); },
      }),
      h('div', { class: 'list dev__tuning' }, tuningRow({
        tuning,
        onClick: () => openTuningPicker({ allowed: TUNINGS, value: state.tuning, onSelect: (id) => { state.tuning = id; drawBoard(); } }),
      })),
      Fretboard({
        fromFret: range.from,
        toFret: range.to,
        orientation: state.orientation === 'auto' ? undefined : state.orientation,
        tuning: tuning.midi,
        markers: positionMarkers(positions, { tuning: tuning.midi }),
        playOnTap: true,
        label: 'Mástil de prueba',
      }),
    );
  };

  const drawChord = () => {
    const chord = getChord(state.chord);
    const midis = shapeNotes(chord.frets).map((n) => n.midi);
    render(chordBox,
      h('div', { class: 'chips' }, CHORDS.map((c) => h('button', {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(c.id === state.chord),
        onClick: () => { state.chord = c.id; drawChord(); },
      }, ChordLabel(c)))),
      h('div', { class: 'dev__chord' },
        h('p', { class: 'dev__chord-name' }, ChordLabel(chord)),
        ChordDiagram(chord, { size: 'large' }),
        h('div', { class: 'dev__minis' },
          ChordDiagram(chord, { size: 'small', playOnTap: false }),
          ChordDiagram(chord, { size: 'mini', playOnTap: false })),
      ),
      h('div', { class: 'btn-row' },
        button({ label: 'Rasgueo ↓', onClick: () => strum(midis, 'down') }),
        button({ label: 'Rasgueo ↑', onClick: () => strum(midis, 'up') }),
        button({ label: 'Arpegio', onClick: () => arpeggio(midis) })),
    );
  };

  const sayRandom = () => {
    primeSpeech();
    const pc = rng.int(0, 11);
    const notation = settings.get('notation');
    const text = spokenName(spell(pc, settings.get('accidentals')), notation);
    const ok = speak(text, { notation });
    render(voiceBox, ok ? [`Dice: «${text}» · `, NoteLabel(pc)] : 'Este navegador no tiene voz.');
  };

  drawBoard();
  drawChord();
  renderScreen(view, {
    title: 'Página de prueba',
    nav,
    help: 'dev',
    className: 'dev',
    content: [
      !soundEnabled() && h('p', { class: 'notice' }, UI_TEXTS.soundOff),
      h('h2', { class: 'section-title' }, 'Ejercicios de prueba'),
      list(EXERCISES.filter((e) => e.module === 'dev').map((e) => listRow({
        href: `#${exercisePath(e)}`,
        iconName: e.section === 'teoria' ? 'theory' : 'guitar',
        title: e.title,
        subtitle: e.section === 'teoria' ? 'Motor de Teoría' : 'Motor de Práctica, con duración',
      }))),
      h('h2', { class: 'section-title' }, 'Mástil'),
      boardBox,
      h('h2', { class: 'section-title' }, 'Diagramas de acorde'),
      chordBox,
      h('h2', { class: 'section-title' }, 'Voz'),
      h('div', { class: 'btn-row' }, button({ label: 'Decir una nota al azar', iconName: 'volume', onClick: sayRandom, disabled: !speechSupported() })),
      voiceBox,
      h('h2', { class: 'section-title' }, 'Pulso'),
      BeatsDiagram({ beatsPerBar: 4, bpm: 100 }),
      h('p', { class: 'lead' }, h('a', { href: '#/metronomo' }, 'Abrir el Metrónomo')),
    ],
  });
}
