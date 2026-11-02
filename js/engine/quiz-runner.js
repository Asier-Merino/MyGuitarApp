// Motor de Teoría (BUILD_PLAN 6.6.7 y 7.2): ronda de N preguntas.
// Al acertar: ✓ verde, "Correcto ✓" y altavoz; pasa sola a los 2 s (si se pulsa el altavoz,
// se cancela y aparece Continuar). Al fallar: correcta ✓ y elegida ✗, panel con la
// corrección, altavoz, "¿Por qué?" y Continuar; no avanza solo. Nunca suena nada solo.
// Temporizador según el nivel. El "?" (o cualquier panel) pausa la ronda. Las preguntas se
// eligen con peso (7.4) y se guardan las estadísticas; al terminar o al salir, la ronda va
// al registro de sesiones.

import { h, render, button, iconButton, screenHeader, statTile, badge } from '../ui/components.js';
import { NoteLabel } from '../ui/note-label.js';
import { richText, TuningName } from '../ui/term.js';
import { Fretboard } from '../ui/fretboard.js';
import { openExerciseHelp, openWhySheet, onSheetChange, confirmSheet } from '../ui/help-sheet.js';
import { celebrate } from '../ui/confetti.js';
import { createCountdown } from './countdown.js';
import { recordStats, saveRound, saveRecord } from './rounds.js';
import { createRng } from '../core/random.js';
import { scoreBand, averageSeconds, formatSecondsDecimal } from '../core/session.js';
import { currentStreak } from '../core/history.js';
import { fillTemplate } from '../core/glossary.js';
import { getTuning, DEFAULT_TUNING_ID } from '../data/tunings.js';
import { LEVELS } from '../data/modules.js';
import { UI_TEXTS } from '../data/concepts.js';
import { store } from '../state.js';
import { playSequence } from '../audio/synth.js';

const AUTO_ADVANCE_MS = 2000;

export const levelTitle = (id) => LEVELS.find((l) => l.id === id)?.title ?? id;
export const streakText = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

/** Etiqueta "Afinación: …" si no es la estándar (6.6.8 y 7.6). */
export function tuningTag(tuning) {
  if (tuning.id === DEFAULT_TUNING_ID) return null;
  return h('p', { class: 'tuning-tag' }, 'Afinación: ', TuningName(tuning));
}

/** Herramientas de dibujo que reciben los ejercicios en render(item, container, ctx). */
export function exerciseCtx(tuning, extra = {}) {
  return {
    fretboard: (opts) => Fretboard({ tuning: tuning.midi, ...opts }),
    noteLabel: (pc, opts) => NoteLabel(pc, opts),
    text: (text, className) => h('p', { class: className }, text),
    ...extra,
  };
}

/**
 * Juega una ronda en `view`. onRepeat(): vuelve a empezar con la misma preparación.
 * Devuelve la función de limpieza (al salir de la pantalla).
 */
export function runQuiz(view, { exercise, level, tuningId, nav, onRepeat }) {
  const params = exercise.levels[level];
  const tuning = getTuning(tuningId);
  const rng = createRng();
  const total = exercise.roundLength;
  const results = []; // { item, answer, result, ms }
  const pauses = new Set();
  let index = 0;
  let item = null;
  let itemView = null;
  let state = 'asking'; // asking | answered | done
  let saved = false;
  let qClock = null;
  let advanceTimer = null;
  let stopSound = null;
  let answerBtns = [];
  const roundClock = createCountdown({ ms: null });

  const playItemSound = (it) => {
    stopSound?.();
    const sound = exercise.sound?.(it);
    if (sound?.midi?.length) stopSound = playSequence(sound.midi, { gap: 0.7 });
  };
  const speakerButton = (it, onPress) => iconButton({
    iconName: 'volume',
    label: 'Escuchar la respuesta',
    className: 'icon-btn--amber speaker-btn',
    onClick: (e) => { e.stopPropagation(); onPress?.(); playItemSound(it); },
  });

  const ctx = exerciseCtx(tuning, {
    answerButtons(options) {
      answerBtns = options.map((o) => {
        const btn = h('button', { type: 'button', class: 'btn btn--grey answer', onClick: () => answer(o.value) },
          o.pc != null ? NoteLabel(o.pc) : o.label,
          h('span', { class: 'answer__mark', 'aria-hidden': 'true' }),
          h('span', { class: 'sr-only answer__sr' }));
        return { btn, value: o.value };
      });
      render(answersEl, answerBtns.map((a) => a.btn));
    },
  });

  /* ----- Pantalla ----- */
  const fill = h('div', { class: 'quiz-progress__fill' });
  const count = h('span', { class: 'quiz-progress__count' });
  const progress = h('div', { class: 'quiz-progress', role: 'progressbar', 'aria-label': 'Progreso de la ronda', 'aria-valuemin': '0', 'aria-valuemax': String(total) },
    h('div', { class: 'quiz-progress__track' }, fill), count);
  const timeFill = h('div', { class: 'quiz-timer__fill' });
  const header = h('header', { class: 'screen-header quiz-header' },
    h('div', { class: 'screen-header__bar' },
      iconButton({ iconName: 'close', label: 'Salir de la ronda', onClick: () => exit() }),
      progress,
      iconButton({ iconName: 'help', label: 'Ayuda', onClick: () => openExerciseHelp(exercise) }),
    ),
    params.timeLimit ? h('div', { class: 'quiz-timer', 'aria-hidden': 'true' }, timeFill) : null,
  );
  const stage = h('div', { class: 'quiz__stage' });
  const answersEl = h('div', { class: 'quiz__answers' });
  const feedbackEl = h('div', { class: 'quiz__feedback', 'aria-live': 'polite' });
  render(view, header, h('div', { class: 'screen quiz' },
    tuningTag(tuning),
    h('h2', { class: 'quiz__prompt' }, exercise.prompt),
    stage, answersEl, feedbackEl));

  const setProgress = (done) => {
    fill.style.width = `${(done / total) * 100}%`;
    count.textContent = `${Math.min(index, total)}/${total}`;
    progress.setAttribute('aria-valuenow', String(done));
  };

  /* ----- Pausa: panel abierto o app en segundo plano ----- */
  const isPaused = () => pauses.size > 0;
  function setPaused(reason, on) {
    if (on) pauses.add(reason); else pauses.delete(reason);
    if (state === 'done') return;
    if (isPaused()) {
      roundClock.pause();
      qClock?.pause();
      advanceTimer?.pause();
    } else {
      roundClock.start();
      if (state === 'asking') qClock?.start();
      advanceTimer?.start();
    }
  }
  const offSheet = onSheetChange((open) => setPaused('sheet', open));
  const onVisibility = () => setPaused('hidden', document.visibilityState === 'hidden');
  document.addEventListener('visibilitychange', onVisibility);

  /* ----- Preguntas ----- */
  function nextQuestion() {
    state = 'asking';
    index += 1;
    item = exercise.generate(params, rng, {
      stats: store.data.stats, previousKey: item?.key ?? null, tuning: tuning.midi, tuningId, now: Date.now(),
    });
    setProgress(index - 1);
    render(stage);
    render(answersEl);
    render(feedbackEl);
    itemView = exercise.render(item, stage, ctx);
    timeFill.style.width = '100%';
    qClock = createCountdown({
      ms: params.timeLimit ? params.timeLimit * 1000 : null,
      onTick: (left) => { if (params.timeLimit) timeFill.style.width = `${(left / (params.timeLimit * 1000)) * 100}%`; },
      onDone: () => answer(null),
    });
    if (!isPaused()) qClock.start();
  }

  function markAnswers(chosen) {
    for (const { btn, value } of answerBtns) {
      btn.disabled = true;
      const mark = btn.querySelector('.answer__mark');
      const sr = btn.querySelector('.answer__sr');
      if (value === item.answer) {
        btn.classList.add('answer--correct');
        mark.textContent = '✓';
        sr.textContent = ', correcta';
      } else if (value === chosen) {
        btn.classList.add('answer--wrong');
        mark.textContent = '✗';
        sr.textContent = ', tu respuesta';
      }
    }
  }

  function continueButton() {
    return button({ label: 'Continuar', variant: 'primary', block: true, className: 'quiz__continue', onClick: () => next() });
  }

  function answer(value) {
    if (state !== 'asking') return;
    state = 'answered';
    const ms = qClock.elapsed;
    qClock.cancel();
    const result = exercise.check(item, value);
    recordStats(exercise.statKeys(item), { correct: result.correct, ms });
    results.push({ item, answer: value, result, ms });
    setProgress(index);
    markAnswers(value);
    itemView?.reveal?.(result);
    const current = item;
    if (result.correct) {
      const slot = h('div');
      render(feedbackEl, h('div', { class: 'quiz__result' },
        h('span', { class: 'quiz__verdict' }, 'Correcto ✓'),
        speakerButton(current, () => {
          advanceTimer?.cancel();
          advanceTimer = null;
          if (!slot.childElementCount) slot.append(continueButton());
        })), slot);
      advanceTimer = createCountdown({ ms: AUTO_ADVANCE_MS, onDone: () => next() });
      if (!isPaused()) advanceTimer.start();
    } else {
      const panel = h('div', { class: 'quiz-panel' },
        richText(result.feedback, { className: 'quiz-panel__text' }),
        h('div', { class: 'quiz-panel__row' },
          speakerButton(current),
          h('button', {
            type: 'button',
            class: 'link-btn',
            onClick: () => openWhySheet({ why: result.why, figure: exercise.review?.(current, ctx), concepts: exercise.concepts }),
          }, '¿Por qué?')),
        continueButton());
      render(feedbackEl, panel);
      panel.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function next() {
    if (state !== 'answered') return;
    advanceTimer?.cancel();
    advanceTimer = null;
    stopSound?.();
    if (index >= total) finish();
    else nextQuestion();
  }

  /* ----- Final, registro y salida ----- */
  const correctCount = () => results.filter((r) => r.result.correct).length;

  /** Guarda la ronda. Al terminarla entera, actualiza el récord si el ejercicio lo declara. */
  function save(done) {
    if (saved || !results.length) return false;
    saved = true;
    const seconds = roundClock.elapsed / 1000;
    saveRound({ exercise, level, tuning: tuningId, seconds, correct: correctCount(), answered: results.length, done });
    const rec = done && exercise.record?.({ results, level, tuningId, seconds });
    return rec ? saveRecord(rec.key, rec.value, rec.better) : false;
  }

  function stopAll() {
    qClock?.cancel();
    advanceTimer?.cancel();
    roundClock.pause();
    stopSound?.();
    offSheet();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  function finish() {
    state = 'done';
    stopAll();
    showSummary(save(true));
  }

  async function exit() {
    if (state !== 'done' && results.length > 0) {
      const ok = await confirmSheet({ title: UI_TEXTS.round.exitTitle, text: UI_TEXTS.round.exitText, confirmLabel: 'Salir' });
      if (!ok) return;
    }
    nav.back();
  }

  function missRow(r) {
    const text = fillTemplate(r.answer === null ? UI_TEXTS.round.missTimeout : UI_TEXTS.round.missChosen, {
      correct: exercise.answerMarkup(r.item.answer),
      chosen: r.answer === null ? '' : exercise.answerMarkup(r.answer),
    });
    return h('div', { class: 'miss' },
      h('button', {
        type: 'button',
        class: 'miss__main',
        onClick: () => openWhySheet({ feedback: r.result.feedback, why: r.result.why, figure: exercise.review?.(r.item, ctx), concepts: exercise.concepts }),
      },
      richText(r.result.label, { tag: 'span', className: 'miss__label' }),
      richText(text, { tag: 'span', className: 'miss__answer' })),
      speakerButton(r.item));
  }

  function showSummary(isRecord) {
    const correct = correctCount();
    const band = scoreBand(correct, results.length);
    const avg = averageSeconds(results.filter((r) => r.answer !== null).map((r) => r.ms));
    const misses = results.filter((r) => !r.result.correct);
    render(view,
      screenHeader({ title: 'Resumen', onBack: nav.back, onHelp: () => openExerciseHelp(exercise), closeIcon: true }),
      h('div', { class: 'screen summary' },
        h('p', { class: 'summary__meta' }, `${exercise.title} · ${levelTitle(level)}`),
        h('p', { class: 'summary__score' }, `${correct}/${results.length}`),
        UI_TEXTS.scoreBands[band] && h('p', { class: 'summary__phrase' }, UI_TEXTS.scoreBands[band]),
        isRecord && h('p', { class: 'summary__record' }, badge(UI_TEXTS.round.newRecord, 'amber')),
        h('div', { class: 'stats' },
          statTile('Tiempo medio', avg === null ? '—' : formatSecondsDecimal(avg)),
          statTile('Racha', streakText(currentStreak(store.data.history)))),
        misses.length > 0 && [
          h('h2', { class: 'section-title' }, 'Fallos'),
          h('div', { class: 'list misses' }, misses.map(missRow)),
        ],
        h('div', { class: 'summary__actions' },
          button({ label: 'Repetir', iconName: 'repeat', variant: 'primary', block: true, onClick: () => onRepeat() }),
          button({ label: 'Otro ejercicio', block: true, onClick: () => nav.back() })),
      ));
    if (band === 'perfect' || isRecord) celebrate();
  }

  roundClock.start();
  nextQuestion();

  return () => {
    if (state !== 'done') {
      stopAll();
      save(false);
    }
    stopSound?.();
  };
}

