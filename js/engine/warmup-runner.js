// Motor del Calentamiento (BUILD_PLAN 8, Fase 3): la tablatura de una vuelta (ida y vuelta)
// con la nota que toca en ámbar, al ritmo del metrónomo (un clic por nota, acento en cada
// tiempo de compás). El tempo sube solo con la función de subida del metrónomo; "Bajar" resta
// 8 BPM y detiene la subida. Récord: el tempo más alto al que se termina una vuelta entera.

import { h, render } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { Tab } from '../ui/tab.js';
import { onSheetChange, confirmSheet } from '../ui/help-sheet.js';
import { roundHeader, pausedPanel, practiceSummary, countText } from './practice-common.js';
import { tuningTag } from './quiz-runner.js';
import { createCountdown } from './countdown.js';
import { saveRound, saveRecord } from './rounds.js';
import { keepScreenOn, releaseScreen } from './wake-lock.js';
import { createRng } from '../core/random.js';
import { formatClock, UNLIMITED } from '../core/session.js';
import { lapBeats, SLOW_DOWN_STEP } from '../core/warmup.js';
import { clampBpm } from '../core/rhythm.js';
import { getTuning } from '../data/tunings.js';
import { UI_TEXTS } from '../data/concepts.js';
import { createMetronome } from '../audio/metronome.js';

export function runWarmup(view, { exercise, level, tuningId, duration, options = {}, nav, onRepeat }) {
  const plan = exercise.generate(exercise.levels[level], createRng(), { options, level });
  const tuning = getTuning(tuningId);
  const lapLength = plan.tab.events.length;
  const roundMs = duration === UNLIMITED ? null : duration * 1000;
  const pauses = new Set();
  let note = -1;
  let laps = 0;
  let bestLapBpm = 0;
  let lapBpm = plan.startBpm; // tempo más bajo de la vuelta en curso
  let bpm = plan.startBpm;
  let state = 'running';
  let saved = false;

  const top = roundHeader({ onExit: () => exit() });
  const bpmEl = h('span', { class: 'metro__bpm' }, String(bpm));
  const rampEl = h('p', { class: 'warmup__ramp' });
  const lapsEl = h('p', { class: 'warmup__laps' });
  const tab = Tab(plan.tab, { tuning, label: 'Tablatura del ejercicio: una vuelta, ida y vuelta' });
  const pausedEl = pausedPanel(exercise);
  const pauseLabel = h('span', {}, 'Pausa');
  const pauseIcon = h('span', { class: 'practice__btn-icon' }, icon('pause'));
  const pauseBtn = h('button', { type: 'button', class: 'btn btn--grey practice__btn', onClick: () => setPaused('user', !pauses.has('user')) }, pauseIcon, pauseLabel);
  const slowBtn = h('button', { type: 'button', class: 'btn btn--grey practice__btn', onClick: () => slowDown() }, icon('minus'), h('span', {}, `${UI_TEXTS.chordPractice.slowDown} ${SLOW_DOWN_STEP}`));
  render(view, top.header, h('div', { class: 'screen practice warmup' },
    tuningTag(tuning),
    h('div', { class: 'warmup__tempo' }, bpmEl, h('span', { class: 'metro__unit' }, 'BPM')),
    rampEl, tab, lapsEl, pausedEl,
    h('div', { class: 'practice__actions' }, pauseBtn, slowBtn)));

  const drawRamp = () => {
    rampEl.textContent = metro.ramping
      ? `El tempo sube ${plan.rampStep} BPM ${plan.rampEveryLaps === 1 ? 'en cada vuelta' : `cada ${plan.rampEveryLaps} vueltas`}`
      : UI_TEXTS.chordPractice.rampStopped;
  };
  const drawLaps = () => { lapsEl.textContent = `${countText(exercise, laps)} · ${UI_TEXTS.chordPractice.lapMax}: ${bestLapBpm ? `${bestLapBpm} BPM` : '—'}`; };

  let activeLine = null;
  const metro = createMetronome({
    onPulse: ({ bpm: now }) => {
      if (state !== 'running') return;
      note += 1;
      if (note >= lapLength) {
        note = 0;
        laps += 1;
        bestLapBpm = Math.max(bestLapBpm, lapBpm);
        lapBpm = now;
        drawLaps();
      }
      lapBpm = Math.min(lapBpm, now);
      tab.setActive(note);
      const line = tab.querySelector('.tab-num.is-active')?.closest('svg');
      if (line && line !== activeLine) { activeLine = line; line.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }
    },
    onTempo: (next) => { bpm = next; bpmEl.textContent = String(bpm); },
  });
  metro.set({
    bpm: plan.startBpm,
    beatsPerBar: 4,
    perBeat: plan.notesPerBeat,
    ramp: { everyBeats: plan.rampEveryLaps * lapBeats(plan.variant, plan.notesPerBeat), step: plan.rampStep },
  });
  drawRamp();
  drawLaps();

  function slowDown() {
    bpm = clampBpm(bpm - SLOW_DOWN_STEP);
    lapBpm = Math.min(lapBpm, bpm);
    metro.set({ bpm });
    metro.stopRamp();
    bpmEl.textContent = String(bpm);
    drawRamp();
  }

  const clock = createCountdown({
    ms: roundMs,
    onTick: (value) => {
      if (roundMs) top.set(formatClock(value / 1000), 1 - value / roundMs);
      else top.set(formatClock(Math.floor(value / 1000)), null);
    },
    onDone: () => finish(),
  });
  top.set(roundMs ? formatClock(duration) : formatClock(0), 0);

  function setPaused(reason, on) {
    if (state !== 'running') return;
    if (on) pauses.add(reason); else pauses.delete(reason);
    const userPaused = pauses.has('user');
    pausedEl.hidden = !userPaused;
    pauseLabel.textContent = userPaused ? 'Seguir' : 'Pausa';
    render(pauseIcon, icon(userPaused ? 'play' : 'pause'));
    if (pauses.size) { clock.pause(); metro.stop(); } else if (!metro.running) { clock.start(); metro.start(); }
  }
  const offSheet = onSheetChange((open) => setPaused('sheet', open));
  const onVisibility = () => { if (document.visibilityState === 'hidden') setPaused('user', true); };
  document.addEventListener('visibilitychange', onVisibility);

  function stopAll() {
    metro.stop();
    clock.pause();
    releaseScreen();
    offSheet();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  function save(finished) {
    if (saved) return false;
    const seconds = clock.elapsed / 1000;
    if (seconds < 1) return false;
    saved = true;
    saveRound({ exercise, level, tuning: tuningId, seconds, items: laps, done: finished });
    const rec = exercise.record({ plan, value: bestLapBpm });
    return rec ? saveRecord(rec.key, rec.value, rec.better) : false;
  }

  function finish() {
    if (state === 'done') return;
    state = 'done';
    stopAll();
    const isRecord = save(true);
    practiceSummary(view, {
      exercise, level, done: countText(exercise, laps), seconds: clock.elapsed / 1000, isRecord, nav, onRepeat,
      extra: `${UI_TEXTS.chordPractice.lapMax}: ${bestLapBpm ? `${bestLapBpm} BPM` : '—'}`,
    });
  }

  async function exit() {
    if (clock.elapsed > 1000) {
      const ok = await confirmSheet({ title: UI_TEXTS.round.exitTitle, text: UI_TEXTS.round.exitText, confirmLabel: 'Salir' });
      if (!ok) return;
    }
    nav.back();
  }

  keepScreenOn();
  clock.start();
  metro.start();

  return () => {
    if (state !== 'done') {
      state = 'done';
      stopAll();
      save(false);
    }
  };
}
