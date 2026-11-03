// Motor de "Cambios en un minuto" (BUILD_PLAN 8, Fase 3): los dos acordes de la pareja,
// 3 segundos para prepararse y 60 s fijos (sin selector de duración, para que el récord sea
// comparable). Al acabar, se anotan los cambios hechos y se guarda el récord de la pareja.
// No es autoevaluación: es contar lo que se ha hecho, como pide el plan.

import { h, render, button, iconButton } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { ChordLabel } from '../ui/note-label.js';
import { ChordDiagram } from '../ui/chord-diagram.js';
import { onSheetChange, confirmSheet } from '../ui/help-sheet.js';
import { roundHeader, pausedPanel, practiceSummary, countText } from './practice-common.js';
import { createCountdown } from './countdown.js';
import { saveRound, saveRecord } from './rounds.js';
import { speak, stopSpeech } from './speech.js';
import { keepScreenOn, releaseScreen } from './wake-lock.js';
import { createRng } from '../core/random.js';
import { formatClock } from '../core/session.js';
import { EXERCISE_TEXTS, UI_TEXTS } from '../data/concepts.js';
import { settings, store } from '../state.js';
import { getAudio } from '../audio/context.js';
import { click } from '../audio/metronome.js';

const GET_READY_S = 3;
const MAX_COUNT = 300;

export function runMinute(view, { exercise, level, options = {}, nav, onRepeat }) {
  const plan = exercise.generate(exercise.levels[level], createRng(), { options, level });
  const [a, b] = plan.chords;
  const T = EXERCISE_TEXTS['acordes.practica.un-minuto'];
  const roundMs = exercise.roundSeconds * 1000;
  const pauses = new Set();
  let phase = 'ready'; // ready | playing | counting | done
  let saved = false;

  const top = roundHeader({ onExit: () => exit() });
  const big = h('p', { class: 'minute__clock', 'aria-live': 'polite' });
  const pair = h('div', { class: 'minute__pair' }, [a, b].map((chord) => h('div', { class: 'minute__chord' },
    ChordLabel(chord, { className: 'note-label--big' }),
    plan.showDiagrams && ChordDiagram(chord, { size: 'small' }))));
  const pausedEl = pausedPanel(exercise);
  const pauseLabel = h('span', {}, 'Pausa');
  const pauseIcon = h('span', { class: 'practice__btn-icon' }, icon('pause'));
  const pauseBtn = h('button', { type: 'button', class: 'btn btn--grey practice__btn', onClick: () => setPaused('user', !pauses.has('user')) }, pauseIcon, pauseLabel);
  const body = h('div', { class: 'screen practice minute' }, big, pair, pausedEl,
    h('div', { class: 'practice__actions practice__actions--one' }, pauseBtn));
  render(view, top.header, body);

  const tick = (kind) => {
    const audio = settings.get('sound') ? getAudio() : null;
    if (audio) click(audio.ctx, audio.master, audio.ctx.currentTime + 0.01, kind);
  };

  let lastSecond = null;
  const ready = createCountdown({
    ms: GET_READY_S * 1000,
    onTick: (left) => {
      const s = Math.ceil(left / 1000);
      big.textContent = `${UI_TEXTS.round.getReady} ${s}`;
      if (s !== lastSecond && s > 0) { lastSecond = s; tick('beat'); }
    },
    onDone: () => {
      phase = 'playing';
      tick('accent');
      if (settings.get('voice')) speak(T.go, { notation: settings.get('notation') });
      if (!pauses.size) clock.start();
    },
  });
  const clock = createCountdown({
    ms: roundMs,
    onTick: (left) => {
      big.textContent = formatClock(left / 1000);
      top.set(formatClock(left / 1000), 1 - left / roundMs);
    },
    onDone: () => { tick('accent'); askCount(); },
  });
  top.set(formatClock(exercise.roundSeconds), 0);

  function setPaused(reason, on) {
    if (phase !== 'ready' && phase !== 'playing') return;
    if (on) pauses.add(reason); else pauses.delete(reason);
    const userPaused = pauses.has('user');
    pausedEl.hidden = !userPaused;
    pauseLabel.textContent = userPaused ? 'Seguir' : 'Pausa';
    render(pauseIcon, icon(userPaused ? 'play' : 'pause'));
    const running = phase === 'ready' ? ready : clock;
    if (pauses.size) { running.pause(); stopSpeech(); } else running.start();
  }
  const offSheet = onSheetChange((open) => setPaused('sheet', open));
  const onVisibility = () => { if (document.visibilityState === 'hidden') setPaused('user', true); };
  document.addEventListener('visibilitychange', onVisibility);

  function cleanupListeners() {
    ready.cancel();
    clock.pause();
    stopSpeech();
    releaseScreen();
    offSheet();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  /* ----- Al acabar: cuántos cambios ----- */
  function askCount() {
    phase = 'counting';
    cleanupListeners();
    top.set(formatClock(0), 1);
    const key = exercise.record({ items: 0, plan }).key;
    const best = store.data.records[key]?.value;
    let count = 0;
    const value = h('input', {
      class: 'text-input count__input', type: 'number', inputmode: 'numeric', min: '0', max: String(MAX_COUNT),
      value: '0', 'aria-label': T.countTitle,
    });
    const set = (n) => { count = Math.max(0, Math.min(MAX_COUNT, Math.round(Number(n) || 0))); value.value = String(count); };
    value.addEventListener('input', () => { count = Math.max(0, Math.min(MAX_COUNT, Math.round(Number(value.value) || 0))); });
    render(view, top.header, h('div', { class: 'screen minute minute--count' },
      h('h2', { class: 'quiz__prompt' }, T.countTitle),
      h('p', { class: 'lead' }, T.countHint),
      h('div', { class: 'count' },
        iconButton({ iconName: 'minus', label: 'Uno menos', onClick: () => set(count - 1) }),
        value,
        iconButton({ iconName: 'plus', label: 'Uno más', onClick: () => set(count + 1) })),
      h('p', { class: 'count__best' }, best != null ? `${UI_TEXTS.chordPractice.record}: ${best}` : UI_TEXTS.chordPractice.noRecord),
      h('div', { class: 'summary__actions' },
        button({ label: UI_TEXTS.chordPractice.countSave, variant: 'primary', block: true, onClick: () => finish(count) }))));
    value.focus({ preventScroll: true });
  }

  function save(items, finished) {
    if (saved) return false;
    saved = true;
    const seconds = phase === 'ready' ? 0 : clock.elapsed / 1000;
    if (seconds < 1 && !finished) return false;
    saveRound({ exercise, level, tuning: 'standard', seconds, items, done: finished });
    if (!finished || !(items > 0)) return false;
    const rec = exercise.record({ items, plan });
    return saveRecord(rec.key, rec.value, rec.better);
  }

  function finish(items) {
    phase = 'done';
    const isRecord = save(items, true);
    practiceSummary(view, { exercise, level, done: countText(exercise, items), seconds: exercise.roundSeconds, isRecord, nav, onRepeat });
  }

  async function exit() {
    if (phase === 'playing' || phase === 'counting') {
      const ok = await confirmSheet({ title: UI_TEXTS.round.exitTitle, text: UI_TEXTS.round.exitText, confirmLabel: 'Salir' });
      if (!ok) return;
    }
    nav.back();
  }

  keepScreenOn();
  ready.start();

  return () => {
    if (phase !== 'done') {
      cleanupListeners();
      save(null, false);
      phase = 'done';
    }
  };
}
