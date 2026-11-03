// Motor de práctica de acordes (BUILD_PLAN 6.6.12): "Cambios de acordes" y "Rasgueo".
// El acorde actual en grande con su diagrama (si "Mostrar diagramas" está activado), los
// tiempos hasta el cambio (el último, en ámbar, avisa), el siguiente acorde en pequeño y, en
// Rasgueo, el patrón con la casilla que toca iluminada. La progresión se repite en bucle con
// el metrónomo hasta que acaba la duración elegida. Pausa (con el "?") y pantalla encendida.
// El pulso va sobre el reloj del audio con el planificador con lookahead, como el metrónomo.

import { h, render } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { ChordLabel } from '../ui/note-label.js';
import { ChordDiagram } from '../ui/chord-diagram.js';
import { StrumCells } from '../ui/strum.js';
import { onSheetChange, confirmSheet } from '../ui/help-sheet.js';
import { roundHeader, pausedPanel, practiceSummary, countText } from './practice-common.js';
import { createCountdown } from './countdown.js';
import { saveRound } from './rounds.js';
import { speak, stopSpeech } from './speech.js';
import { keepScreenOn, releaseScreen } from './wake-lock.js';
import { createRng } from '../core/random.js';
import { formatClock } from '../core/session.js';
import { secondsPerBeat, eighthTime } from '../core/rhythm.js';
import { STRUM_CELLS } from '../data/strum-patterns.js';
import { UI_TEXTS } from '../data/concepts.js';
import { settings, store } from '../state.js';
import { getAudio, setMasterVolume } from '../audio/context.js';
import { createScheduler } from '../audio/scheduler.js';
import { click } from '../audio/metronome.js';

/** La voz dice el acorde solo si da tiempo antes del siguiente cambio. */
const SPEAK_MIN_S = 2.5;
const START_DELAY_S = 0.6;

export function runChords(view, { exercise, level, duration, options = {}, nav, onRepeat }) {
  const params = exercise.levels[level];
  const plan = exercise.generate(params, createRng(), { options, progressions: store.data.progressions, level });
  const { chords, bpm, beatsPerChange, pattern, showDiagrams } = plan;
  const strumMode = Boolean(pattern);
  const spb = secondsPerBeat(bpm);
  const stepsPerChord = strumMode ? beatsPerChange * 2 : beatsPerChange;
  const roundMs = duration * 1000;
  const pauses = new Set();
  let step = 0;          // pasos desde el principio (tiempos, o corcheas en Rasgueo)
  let barStart = null;   // instante del principio del compás (Rasgueo)
  let changes = 0;
  let bars = 0;
  let state = 'running'; // running | done
  let saved = false;
  let scheduler = null;
  const timers = new Set();

  /* ----- Pantalla ----- */
  const voiceBtn = h('button', { type: 'button', class: 'icon-btn icon-btn--amber' });
  const drawVoice = () => {
    const on = settings.get('voice');
    voiceBtn.setAttribute('aria-label', on ? 'Silenciar la voz' : 'Activar la voz');
    voiceBtn.setAttribute('aria-pressed', String(!on));
    render(voiceBtn, icon(on ? 'volume' : 'volumeOff'));
  };
  voiceBtn.addEventListener('click', () => { settings.set('voice', !settings.get('voice')); if (!settings.get('voice')) stopSpeech(); drawVoice(); });
  drawVoice();
  const top = roundHeader({ onExit: () => exit(), right: voiceBtn });

  const currentEl = h('div', { class: 'chords__current', 'aria-live': 'polite' });
  const dots = Array.from({ length: beatsPerChange }, (_, i) => h('span', {
    class: ['beat-dot', i === beatsPerChange - 1 && 'beat-dot--warn'].filter(Boolean).join(' '),
  }));
  const dotsEl = h('div', { class: 'beat-dots chords__beats', 'aria-hidden': 'true' }, dots);
  const cells = strumMode ? StrumCells(pattern) : null;
  const nextEl = h('div', { class: 'chords__next' });
  const pausedEl = pausedPanel(exercise);
  const pauseLabel = h('span', {}, 'Pausa');
  const pauseIcon = h('span', { class: 'practice__btn-icon' }, icon('pause'));
  const pauseBtn = h('button', { type: 'button', class: 'btn btn--grey practice__btn', onClick: () => setPaused('user', !pauses.has('user')) }, pauseIcon, pauseLabel);
  render(view, top.header, h('div', { class: 'screen practice chords' },
    currentEl, dotsEl, cells, nextEl, pausedEl,
    h('div', { class: 'practice__actions practice__actions--one' }, pauseBtn)));

  function showChord(index) {
    const chord = chords[index % chords.length];
    const next = chords[(index + 1) % chords.length];
    render(currentEl,
      ChordLabel(chord, { className: 'note-label--huge' }),
      showDiagrams && ChordDiagram(chord, { size: 'large' }));
    render(nextEl,
      h('span', { class: 'chords__next-label' }, `${UI_TEXTS.chordPractice.next}:`),
      ChordLabel(next),
      showDiagrams && ChordDiagram(next, { size: 'mini', playOnTap: false }));
    if (settings.get('voice') && beatsPerChange * spb >= SPEAK_MIN_S && !pauses.size) {
      speak(exercise.speech(chord, { notation: settings.get('notation') }), { notation: settings.get('notation') });
    }
  }
  const lightBeat = (beat) => dots.forEach((d, i) => d.classList.toggle('is-on', i === beat));

  /* ----- Reloj de la ronda ----- */
  const roundClock = createCountdown({
    ms: roundMs,
    onTick: (left) => top.set(formatClock(left / 1000), 1 - left / roundMs),
    onDone: () => finish(),
  });
  top.set(formatClock(duration), 0);

  /* ----- Pulso ----- */
  const later = (ctx, time, fn) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, Math.max(0, (time - ctx.currentTime) * 1000));
    timers.add(id);
  };

  function startPulse() {
    const audio = getAudio();
    if (!audio) return;
    const { ctx, master } = audio;
    setMasterVolume(settings.get('volume'));
    scheduler = createScheduler({
      now: () => ctx.currentTime,
      onEvent: (time) => {
        const inChord = step % stepsPerChord;
        const chordIndex = Math.floor(step / stepsPerChord);
        const cell = step % STRUM_CELLS;
        const onBeat = !strumMode || cell % 2 === 0;
        const beat = strumMode ? Math.floor(inChord / 2) : inChord;
        if (strumMode && cell === 0) barStart = time;
        if (onBeat && settings.get('sound')) {
          const accent = strumMode ? cell === 0 : inChord === 0;
          click(ctx, master, time, accent ? 'accent' : 'beat');
        }
        const isChange = inChord === 0;
        const first = step === 0;
        const barDone = strumMode && cell === 0 && !first;
        later(ctx, time, () => {
          if (state === 'done') return;
          if (isChange && !first) { changes += 1; showChord(chordIndex); }
          if (barDone) bars += 1;
          if (onBeat) lightBeat(beat);
          cells?.light(cell);
        });
        step += 1;
        if (!strumMode) return time + spb;
        const next = step % STRUM_CELLS;
        return next === 0 ? barStart + 4 * spb : barStart + eighthTime(next, { swing: pattern.swing }) * spb;
      },
    });
    // Al seguir tras una pausa a mitad de compás, el compás se recoloca para que el swing cuadre.
    const first = ctx.currentTime + (step === 0 ? START_DELAY_S : 0.15);
    if (strumMode) barStart = first - eighthTime(step % STRUM_CELLS, { swing: pattern.swing }) * spb;
    scheduler.start(first);
  }

  function stopPulse() {
    scheduler?.stop();
    scheduler = null;
    timers.forEach(clearTimeout);
    timers.clear();
  }

  /* ----- Pausa ----- */
  function setPaused(reason, on) {
    if (state === 'done') return;
    if (on) pauses.add(reason); else pauses.delete(reason);
    const userPaused = pauses.has('user');
    pausedEl.hidden = !userPaused;
    pauseLabel.textContent = userPaused ? 'Seguir' : 'Pausa';
    render(pauseIcon, icon(userPaused ? 'play' : 'pause'));
    if (pauses.size) {
      roundClock.pause();
      stopPulse();
      stopSpeech();
    } else if (!scheduler) {
      roundClock.start();
      startPulse();
    }
  }
  const offSheet = onSheetChange((open) => setPaused('sheet', open));
  const onVisibility = () => { if (document.visibilityState === 'hidden') setPaused('user', true); };
  document.addEventListener('visibilitychange', onVisibility);

  /* ----- Final ----- */
  const done = () => (strumMode ? bars : changes);

  function stopAll() {
    stopPulse();
    roundClock.pause();
    stopSpeech();
    releaseScreen();
    offSheet();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  function save(finished) {
    if (saved) return;
    const seconds = roundClock.elapsed / 1000;
    if (seconds < 1) return;
    saved = true;
    saveRound({ exercise, level, tuning: 'standard', seconds, items: done(), done: finished });
  }

  function finish() {
    if (state === 'done') return;
    state = 'done';
    stopAll();
    save(true);
    practiceSummary(view, { exercise, level, done: countText(exercise, done()), seconds: roundClock.elapsed / 1000, nav, onRepeat });
  }

  async function exit() {
    if (roundClock.elapsed > 1000) {
      const ok = await confirmSheet({ title: UI_TEXTS.round.exitTitle, text: UI_TEXTS.round.exitText, confirmLabel: 'Salir' });
      if (!ok) return;
    }
    nav.back();
  }

  showChord(0);
  lightBeat(-1);
  keepScreenOn();
  roundClock.start();
  startPulse();

  return () => {
    if (state !== 'done') {
      state = 'done';
      stopAll();
      save(false);
    }
  };
}
