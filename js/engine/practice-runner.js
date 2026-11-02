// Motor de Práctica (BUILD_PLAN 6.6.8 y 7.3): manos libres. Consigna enorme con doble
// notación que la voz dice al aparecer, cuenta atrás en barra y en segundos, guía de ritmo
// por cuerdas y, al acabarse el tiempo, las posiciones durante 3 s antes de pasar sola a la
// siguiente. Pausa y "Ver posiciones" abajo; el "?" solo en pausa. Duración de la ronda
// (con el tiempo restante en la cabecera) o un número fijo de consignas. Metrónomo opcional.
// Pantalla encendida mientras dura. Sin autoevaluación: el resumen solo dice qué se ha hecho.
// Cada consigna puede traer sus marcas (item.markers), una leyenda (item.legend) y lo que
// suena al enseñar la solución (item.revealSound, p. ej. un punto y su unísono).

import { h, render, button, iconButton, screenHeader, badge } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { openExerciseHelp, onSheetChange, confirmSheet } from '../ui/help-sheet.js';
import { celebrate } from '../ui/confetti.js';
import { createCountdown } from './countdown.js';
import { saveRound, saveRecord } from './rounds.js';
import { speak, stopSpeech } from './speech.js';
import { keepScreenOn, releaseScreen } from './wake-lock.js';
import { exerciseCtx, tuningTag, levelTitle } from './quiz-runner.js';
import { createRng } from '../core/random.js';
import { UNLIMITED, formatClock } from '../core/session.js';
import { formatElapsed } from '../core/history.js';
import { getTuning } from '../data/tunings.js';
import { UI_TEXTS } from '../data/concepts.js';
import { settings } from '../state.js';
import { createMetronome } from '../audio/metronome.js';
import { playSequence } from '../audio/synth.js';

/** Tiempo que se ven las posiciones al acabarse la cuenta atrás. */
export const REVEAL_MS = 3000;

export function runPractice(view, { exercise, level, tuningId, duration, options = {}, nav, onRepeat }) {
  const params = exercise.levels[level];
  const tuning = getTuning(tuningId);
  const rng = createRng();
  const timed = Boolean(exercise.duration);
  const unlimited = timed && duration === UNLIMITED;
  const roundMs = timed && !unlimited ? duration * 1000 : null;
  const total = timed ? null : exercise.roundLength;
  const ctx = exerciseCtx(tuning);
  const pauses = new Set();
  const recentKeys = [];
  const round = {}; // estado que comparten las consignas de una ronda (p. ej. la cuerda al azar)
  let stopRevealSound = null;
  let item = null;
  let shown = 0;
  let phase = 'prompt'; // prompt | reveal
  let state = 'running'; // running | done
  let saved = false;
  let itemClock = null;
  let revealClock = null;
  let positionsOpen = false;

  const metro = options.metronome?.on ? createMetronome() : null;
  metro?.set({ bpm: options.metronome.bpm, beatsPerBar: 4, subdivision: 'quarter' });

  /* ----- Pantalla ----- */
  const fill = h('div', { class: 'quiz-progress__fill' });
  const count = h('span', { class: 'quiz-progress__count' });
  const voiceBtn = h('button', { type: 'button', class: 'icon-btn icon-btn--amber' });
  const drawVoice = () => {
    const on = settings.get('voice');
    voiceBtn.setAttribute('aria-label', on ? 'Silenciar la voz' : 'Activar la voz');
    voiceBtn.setAttribute('aria-pressed', String(!on));
    render(voiceBtn, icon(on ? 'volume' : 'volumeOff'));
  };
  voiceBtn.addEventListener('click', () => {
    const on = !settings.get('voice');
    settings.set('voice', on);
    if (on) speakItem(); else stopSpeech();
    drawVoice();
  });
  drawVoice();

  const header = h('header', { class: 'screen-header quiz-header' },
    h('div', { class: 'screen-header__bar' },
      iconButton({ iconName: 'close', label: unlimited ? 'Terminar la ronda' : 'Salir de la ronda', onClick: () => exit() }),
      h('div', { class: 'quiz-progress' }, h('div', { class: 'quiz-progress__track' }, fill), count),
      voiceBtn,
    ));
  const stage = h('div', { class: 'practice__stage', 'aria-live': 'assertive' });
  const secs = h('span', { class: 'practice__secs' });
  const timeFill = h('div', { class: 'quiz-timer__fill' });
  const countdownEl = h('div', { class: 'practice__countdown' }, h('div', { class: 'quiz-timer practice__bar', 'aria-hidden': 'true' }, timeFill), secs);
  const guideEl = h('div', { class: 'practice__guide', 'aria-hidden': 'true' });
  const positionsEl = h('div', { class: 'practice__positions' });
  const pausedEl = h('div', { class: 'practice__paused', hidden: true },
    h('p', { class: 'practice__paused-title' }, UI_TEXTS.round.paused),
    h('p', { class: 'practice__paused-hint' }, UI_TEXTS.round.pausedHint),
    button({ label: 'Ayuda', iconName: 'help', onClick: () => openExerciseHelp(exercise) }));
  const pauseLabel = h('span', {}, 'Pausa');
  const pauseIcon = h('span', { class: 'practice__btn-icon' }, icon('pause'));
  const pauseBtn = h('button', { type: 'button', class: 'btn btn--grey practice__btn', onClick: () => setPaused('user', !pauses.has('user')) }, pauseIcon, pauseLabel);
  const showBtn = h('button', { type: 'button', class: 'btn btn--grey practice__btn', 'aria-pressed': 'false', onClick: () => togglePositions() },
    icon('eye'), h('span', {}, 'Ver posiciones'));

  const screenEl = h('div', { class: 'screen practice' },
    tuningTag(tuning),
    stage, countdownEl, guideEl, positionsEl, pausedEl,
    h('div', { class: 'practice__actions' }, pauseBtn, showBtn));
  render(view, header, screenEl);

  /* ----- Reloj de la ronda (cabecera) ----- */
  const roundClock = createCountdown({
    ms: roundMs,
    onTick: (value) => {
      if (timed) {
        // Restante (redondeado hacia arriba) o, con "Sin límite", transcurrido (hacia abajo).
        count.textContent = formatClock(unlimited ? Math.floor(value / 1000) : value / 1000);
        if (!unlimited) fill.style.width = `${(1 - value / roundMs) * 100}%`;
      }
    },
    onDone: () => finish(),
  });
  if (!timed) count.textContent = `0/${total}`;

  /* ----- Pausa ----- */
  const isPaused = () => pauses.size > 0;
  function setPaused(reason, on) {
    if (state === 'done') return;
    if (on) pauses.add(reason); else pauses.delete(reason);
    const userPaused = pauses.has('user');
    pausedEl.hidden = !userPaused;
    pauseLabel.textContent = userPaused ? 'Seguir' : 'Pausa';
    render(pauseIcon, icon(userPaused ? 'play' : 'pause'));
    if (isPaused()) {
      roundClock.pause();
      itemClock?.pause();
      revealClock?.pause();
      metro?.stop();
      stopSpeech();
    } else {
      roundClock.start();
      if (phase === 'prompt') itemClock?.start(); else revealClock?.start();
      metro?.start();
    }
  }
  const offSheet = onSheetChange((open) => setPaused('sheet', open));
  // Al cambiar de app, la ronda queda en pausa hasta que se pulse "Seguir".
  const onVisibility = () => { if (document.visibilityState === 'hidden') setPaused('user', true); };
  document.addEventListener('visibilitychange', onVisibility);

  /* ----- Consignas ----- */
  function speakItem() {
    if (!item || !settings.get('voice') || isPaused()) return;
    speak(exercise.speech(item, { notation: settings.get('notation'), accidentals: settings.get('accidentals') }), { notation: settings.get('notation') });
  }

  function drawPositions() {
    render(positionsEl, positionsOpen && [
      ctx.fretboard({
        dense: true,
        fromFret: item.fromFret ?? 0,
        toFret: item.toFret ?? 12,
        markers: item.markers ?? item.positions.map((p) => ({ ...p, pc: item.pc, color: 'amber' })),
      }),
      item.legend && h('p', { class: 'practice__legend' }, item.legend),
    ]);
    // Con las posiciones a la vista, la consigna se encoge para que el mástil quepa en la pantalla.
    screenEl.classList.toggle('is-revealing', positionsOpen);
    showBtn.setAttribute('aria-pressed', String(positionsOpen));
    showBtn.querySelector('span').textContent = positionsOpen ? 'Ocultar posiciones' : 'Ver posiciones';
  }
  function togglePositions() {
    positionsOpen = !positionsOpen;
    drawPositions();
  }

  function drawGuide(fraction) {
    const steps = item.guide ?? [];
    const lit = Math.min(steps.length - 1, Math.floor(fraction * steps.length));
    [...guideEl.children].forEach((el, i) => el.classList.toggle('is-on', i === lit));
  }

  function nextItem() {
    if (state === 'done') return;
    if (!timed && shown >= total) { finish(); return; }
    phase = 'prompt';
    stopRevealSound?.();
    item = exercise.generate(params, rng, { recentKeys: recentKeys.slice(-2), tuning: tuning.midi, tuningId, options, round });
    recentKeys.push(item.key);
    shown += 1;
    if (!timed) {
      count.textContent = `${shown}/${total}`;
      fill.style.width = `${((shown - 1) / total) * 100}%`;
    }
    render(stage);
    exercise.render(item, stage, ctx);
    render(guideEl, (item.guide ?? []).map((s) => h('span', { class: 'guide-dot' }, String(s))));
    positionsOpen = false;
    drawPositions();
    countdownEl.hidden = false;
    const ms = item.seconds * 1000;
    itemClock = createCountdown({
      ms,
      onTick: (left) => {
        timeFill.style.width = `${(left / ms) * 100}%`;
        secs.textContent = `${Math.ceil(left / 1000)} s`;
        if (item.guide) drawGuide(1 - left / ms);
      },
      onDone: () => reveal(),
    });
    if (!isPaused()) itemClock.start();
    speakItem();
  }

  function reveal() {
    phase = 'reveal';
    secs.textContent = '0 s';
    timeFill.style.width = '0%';
    [...guideEl.children].forEach((el) => el.classList.remove('is-on'));
    positionsOpen = true;
    drawPositions();
    if (item.revealSound?.length) stopRevealSound = playSequence(item.revealSound, { gap: 0.8 });
    if (!timed) fill.style.width = `${(shown / total) * 100}%`;
    revealClock = createCountdown({ ms: REVEAL_MS, onDone: () => nextItem() });
    if (!isPaused()) revealClock.start();
  }

  /* ----- Final, registro y salida ----- */
  function stopAll() {
    itemClock?.cancel();
    revealClock?.cancel();
    roundClock.pause();
    metro?.stop();
    stopRevealSound?.();
    stopSpeech();
    releaseScreen();
    offSheet();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  function save(done) {
    if (saved || !shown) return false;
    saved = true;
    const seconds = roundClock.elapsed / 1000;
    saveRound({ exercise, level, tuning: tuningId, seconds, items: shown, done });
    const rec = done && exercise.record?.({ items: shown, level, tuningId, seconds });
    return rec ? saveRecord(rec.key, rec.value, rec.better) : false;
  }

  function finish() {
    if (state === 'done') return;
    state = 'done';
    stopAll();
    showSummary(save(true));
  }

  async function exit() {
    if (unlimited) {
      const ok = await confirmSheet({ title: UI_TEXTS.round.finishTitle, text: UI_TEXTS.round.finishText, confirmLabel: 'Terminar' });
      if (ok) finish();
      return;
    }
    if (shown > 0) {
      const ok = await confirmSheet({ title: UI_TEXTS.round.exitTitle, text: UI_TEXTS.round.exitText, confirmLabel: 'Salir' });
      if (!ok) return;
    }
    nav.back();
  }

  function showSummary(isRecord) {
    const [one, many] = exercise.itemNoun;
    render(view,
      screenHeader({ title: 'Resumen', onBack: nav.back, closeIcon: true }),
      h('div', { class: 'screen summary' },
        h('p', { class: 'summary__meta' }, `${exercise.title} · ${levelTitle(level)}`),
        h('p', { class: 'summary__done' }, `${shown} ${shown === 1 ? one : many} · ${formatElapsed(roundClock.elapsed / 1000)}`),
        isRecord && h('p', { class: 'summary__record' }, badge(UI_TEXTS.round.newRecord, 'amber')),
        h('div', { class: 'summary__actions' },
          button({ label: 'Repetir', iconName: 'repeat', variant: 'primary', block: true, onClick: () => onRepeat() }),
          button({ label: 'Salir', block: true, onClick: () => nav.back() })),
      ));
    if (isRecord) celebrate();
  }

  keepScreenOn();
  roundClock.start();
  metro?.start();
  nextItem();

  return () => {
    if (state !== 'done') {
      stopAll();
      save(false);
    }
  };
}
