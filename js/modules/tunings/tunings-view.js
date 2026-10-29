// Pantalla Afinaciones (BUILD_PLAN 6.6.16): las 7 afinaciones agrupadas, cada nota suena
// al tocarla y "Tocar todas" recorre las cuerdas de la 6ª a la 1ª, despacio.

import { h } from '../../ui/components.js';
import { icon } from '../../ui/icons.js';
import { NoteLabel } from '../../ui/note-label.js';
import { TuningName, richText } from '../../ui/term.js';
import { renderScreen } from '../../screens/screen.js';
import { TUNINGS, TUNING_GROUPS, tuningNameText } from '../../data/tunings.js';
import { getConcept, UI_TEXTS } from '../../data/concepts.js';
import { settings } from '../../state.js';
import { STANDARD_TUNING, formatTuningChanges } from '../../core/fretboard-model.js';
import { playNote, playSequence, soundEnabled } from '../../audio/synth.js';

const STRING_ORDER = [6, 5, 4, 3, 2, 1];
const PLAY_ALL_GAP = 1.5; // segundos por cuerda (≈1,5 s, BUILD_PLAN 6.6.16)

let stopPlaying = null; // solo suena una ficha a la vez

function stopAll() {
  stopPlaying?.();
  stopPlaying = null;
}

function shiftText(semitones) {
  if (!semitones) return null;
  return `${semitones < 0 ? '↓' : '↑'}${Math.abs(semitones)}`;
}

function tuningCard(tuning) {
  const noteButtons = STRING_ORDER.map((string) => {
    const midi = tuning.midi[string];
    const shift = midi - STANDARD_TUNING[string];
    const semis = Math.abs(shift) === 1 ? 'semitono' : 'semitonos';
    return h('button', {
      type: 'button',
      class: ['string-btn', shift && 'string-btn--changed'].filter(Boolean).join(' '),
      dataset: { string },
      onClick: () => playNote(midi),
    },
    h('span', { class: 'string-btn__num' }, h('span', { class: 'sr-only' }, 'Cuerda '), `${string}ª`),
    NoteLabel(midi % 12, { accidentals: tuning.accidentals, className: 'note-label--stacked' }),
    h('span', { class: 'string-btn__shift', 'aria-hidden': 'true' }, shiftText(shift) ?? '·'),
    shift !== 0 && h('span', { class: 'sr-only' },
      `, ${Math.abs(shift)} ${semis} más ${shift < 0 ? 'grave' : 'aguda'} que en la estándar`));
  });

  const playLabel = h('span', {}, 'Tocar todas');
  const playBtn = h('button', { type: 'button', class: 'btn btn--grey play-all', 'aria-pressed': 'false' },
    icon('play', { className: 'icon icon--play' }), icon('stop', { className: 'icon icon--stop' }), playLabel);
  const setPlaying = (on) => {
    playBtn.classList.toggle('is-playing', on);
    playBtn.setAttribute('aria-pressed', String(on));
    playLabel.textContent = on ? 'Detener' : 'Tocar todas';
    if (!on) noteButtons.forEach((b) => b.classList.remove('is-sounding'));
  };
  playBtn.addEventListener('click', () => {
    const wasPlaying = playBtn.classList.contains('is-playing');
    stopAll();
    if (wasPlaying) return;
    setPlaying(true);
    const stop = playSequence(STRING_ORDER.map((s) => tuning.midi[s]), {
      gap: PLAY_ALL_GAP,
      onStep: (i) => noteButtons.forEach((b, j) => b.classList.toggle('is-sounding', i === j)),
      onEnd: () => { setPlaying(false); stopPlaying = null; },
    });
    stopPlaying = () => { stop(); setPlaying(false); };
  });

  const concept = getConcept(tuning.concept);
  const changes = formatTuningChanges(tuning.midi);
  const name = tuningNameText(tuning, { notation: settings.get('notation'), accidentals: tuning.accidentals });
  return h('article', { class: 'card tuning-card', 'aria-label': name },
    h('h3', { class: 'tuning-card__title' }, TuningName(tuning)),
    h('div', { class: 'string-row' }, noteButtons),
    changes !== '—' && h('p', { class: 'tuning-card__changes' }, changes),
    richText(`[[${concept.id}|${concept.short}]]`, { className: 'tuning-card__desc' }),
    h('div', { class: 'btn-row' }, playBtn),
  );
}

export function renderTunings(view, params, nav) {
  stopAll();
  renderScreen(view, {
    title: 'Afinaciones',
    nav,
    help: 'tunings',
    content: [
      !soundEnabled() && h('p', { class: 'notice' }, UI_TEXTS.soundOff),
      TUNING_GROUPS.map((g) => h('section', { class: 'tuning-group' },
        h('h2', { class: 'section-title' }, g.title),
        h('div', { class: 'tuning-grid' }, TUNINGS.filter((t) => t.group === g.id).map(tuningCard)),
      )),
    ],
  });
}

/** Al salir de la pantalla, deja de sonar. */
export const leaveTunings = stopAll;
