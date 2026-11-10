// Consulta de Escala y tonalidad (BUILD_PLAN 6.6.5 y Fase 5): se elige una tonalidad mayor y
// se ven su escala bien deletreada (con la fórmula T T S T T T S), sus 7 acordes con el grado
// (con diagrama si tienen forma abierta; si no, sus notas y el aviso de la cejilla) y las
// notas de la escala en el mástil: en todo el mástil o en la posición de dos octavas.
// Todo se calcula con js/core/keys.js.

import { h, render, button, segmented } from '../../ui/components.js';
import { renderScreen } from '../../screens/screen.js';
import { NoteLabel, ChordLabel } from '../../ui/note-label.js';
import { ChordDiagram } from '../../ui/chord-diagram.js';
import { Fretboard } from '../../ui/fretboard.js';
import { FunctionLegend } from '../../ui/concept-diagram.js';
import { richText } from '../../ui/term.js';
import { KEY_LEVELS, MAJOR_STEPS, ROMANS, keyScale, keyRootSpelling, majorScalePosition } from '../../core/keys.js';
import { keyProgression, keyChordMidis } from '../../core/progressions.js';
import { midiAt } from '../../core/fretboard-model.js';
import { mod12 } from '../../core/theory.js';
import { spellingPc } from '../../core/notation.js';
import { fillTemplate } from '../../core/glossary.js';
import { LEVELS } from '../../data/modules.js';
import { UI_TEXTS } from '../../data/concepts.js';
import { settings } from '../../state.js';
import { strum, playSequence } from '../../audio/synth.js';

const T = UI_TEXTS.keys;

// La tonalidad elegida y la vista del mástil se conservan mientras la app está abierta.
let selected = 0;
let boardView = 'whole';

/** Tonalidades que aparecen por primera vez en cada nivel (Básico, Intermedio, Avanzado). */
function keyGroups() {
  const seen = [];
  return LEVELS.map((level) => {
    const keys = KEY_LEVELS[level.id].filter((k) => !seen.includes(k));
    seen.push(...keys);
    return { level, keys };
  });
}

export function renderKeysReference(view, params, nav) {
  const chipsEl = h('div', { class: 'reference__filter key-filter' });
  const detailEl = h('div', { class: 'key-ref' });
  let stopScale = null;

  const draw = () => {
    stopScale?.();
    const accidentals = settings.get('accidentals');
    const rootLabel = (k, opts) => NoteLabel(k, { spelling: keyRootSpelling(k, { accidentals }), ...opts });
    render(chipsEl, keyGroups().map(({ level, keys }) => h('div', { class: 'chips', role: 'group', 'aria-label': `Tonalidades de nivel ${level.title}` },
      h('span', { class: 'chips__label' }, level.title),
      keys.map((k) => h('button', {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(k === selected),
        onClick: () => { selected = k; draw(); },
      }, rootLabel(k))))));

    const scale = keyScale(selected, { accidentals });
    const chords = keyProgression(selected, ROMANS, { accidentals });
    const pos = majorScalePosition(selected, { accidentals });

    const scaleRow = h('ol', { class: 'scale-slots scale-slots--static', 'aria-label': 'Escala' }, scale.map((n) => h('li', { class: ['scale-slot', n.degree === 1 && 'is-given'].filter(Boolean).join(' ') },
      h('span', { class: 'scale-slot__degree', 'aria-hidden': 'true' }, String(n.degree)),
      h('span', { class: 'scale-slot__note' }, NoteLabel(n.pc, { spelling: n.spelling, className: 'note-label--stacked' })))));
    const steps = h('ol', { class: 'scale-steps', 'aria-label': `${T.stepsLabel}: ${MAJOR_STEPS.join(' ')}` },
      MAJOR_STEPS.map((s) => h('li', { class: `scale-steps__step scale-steps__step--${s === 'T' ? 'tone' : 'semitone'}`, 'aria-hidden': 'true' }, s)));
    const listen = button({
      label: 'Escuchar la escala',
      iconName: 'play',
      onClick: () => { stopScale?.(); stopScale = playSequence(pos.notes.slice(0, 8).map((n) => n.midi), { gap: 0.45 }); },
    });

    const chordCards = chords.map((c) => h('button', {
      type: 'button',
      class: 'btn btn--grey key-card',
      'aria-label': `${c.roman}: tocar el acorde`,
      onClick: () => strum(keyChordMidis(c), 'down'),
    },
    h('span', { class: 'key-card__roman' }, c.roman),
    ChordLabel(c, { className: 'key-card__name' }),
    c.open
      ? ChordDiagram(c.open, { size: 'mini', playOnTap: false })
      : h('span', { class: 'key-card__no-open' }, T.noOpen),
    h('span', { class: 'key-card__notes' }, c.tones.flatMap((t, i) => [i ? ' ' : null, NoteLabel(spellingPc(t), { spelling: t })]))));

    const whole = boardView === 'whole';
    const markers = whole
      ? [6, 5, 4, 3, 2, 1].flatMap((string) => Array.from({ length: 13 }, (_, fret) => fret).flatMap((fret) => {
        const note = scale.find((n) => n.pc === mod12(midiAt(string, fret)));
        return note ? [{ string, fret, pc: note.pc, spelling: note.spelling, color: note.degree === 1 ? 'root' : 'other' }] : [];
      }))
      : pos.notes.map((n) => ({ string: n.string, fret: n.fret, pc: n.pc, spelling: n.spelling, color: n.degree === 1 ? 'root' : 'other' }));

    render(detailEl,
      h('div', { class: 'chord-ref__head key-ref__head' }, rootLabel(selected, { className: 'note-label--big' }), h('span', { class: 'key-ref__mayor' }, T.major)),
      h('h2', { class: 'section-title' }, T.scale),
      h('div', { class: 'card key-ref__scale' }, scaleRow, steps, h('div', { class: 'btn-row' }, listen)),
      h('h2', { class: 'section-title' }, T.chords),
      h('p', { class: 'key-ref__hint' }, T.scaleLegend),
      h('div', { class: 'key-cards' }, chordCards),
      h('h2', { class: 'section-title' }, T.onBoard),
      segmented({
        label: T.onBoard,
        value: boardView,
        options: [{ value: 'whole', label: T.wholeNeck }, { value: 'position', label: T.position }],
        onChange: (v) => { boardView = v; draw(); },
      }),
      richText(whole ? T.wholeHint : fillTemplate(T.positionHint, { from: pos.fromFret, to: pos.toFret }), { className: 'key-ref__hint' }),
      Fretboard({
        fromFret: whole ? 0 : Math.max(0, pos.fromFret - 1),
        toFret: whole ? 12 : pos.toFret + 1,
        markers,
        playOnTap: true,
        label: 'La escala en el mástil',
      }),
      FunctionLegend(['root', 'other']));
  };

  renderScreen(view, {
    title: 'Consulta',
    nav,
    help: 'referenceKeys',
    className: 'reference',
    content: [chipsEl, detailEl],
  });
  draw();
  return () => stopScale?.();
}
