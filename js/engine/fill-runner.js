// Motor de "Rellena el mástil" (BUILD_PLAN 8, Fase 2): un puzle por ronda. Una o dos cuerdas
// vacías del traste 0 al 12; se toca una casilla y se elige su nota en un teclado de 12
// botones con doble notación (sin arrastrar). Acierto en verde ✓; fallo en rojo ✗ con la
// nota correcta, el altavoz y "¿Por qué?", sin parar el puzle. Se cronometra; en Avanzado,
// con contrarreloj. El "?" (o cualquier panel) pausa. Al terminar, el resumen de Teoría.

import { h, render, iconButton, statTile } from '../ui/components.js';
import { NoteLabel } from '../ui/note-label.js';
import { Fretboard } from '../ui/fretboard.js';
import { richText } from '../ui/term.js';
import { openExerciseHelp, openWhySheet, onSheetChange, confirmSheet } from '../ui/help-sheet.js';
import { createCountdown } from './countdown.js';
import { recordStats, saveRound, saveRecord } from './rounds.js';
import { exerciseCtx, tuningTag, renderQuizSummary, streakText } from './quiz-runner.js';
import { createRng } from '../core/random.js';
import { formatClock, formatSecondsDecimal } from '../core/session.js';
import { currentStreak } from '../core/history.js';
import { getTuning } from '../data/tunings.js';
import { UI_TEXTS } from '../data/concepts.js';
import { store } from '../state.js';
import { playSequence } from '../audio/synth.js';

/** Teclado: las 12 notas, de {{C}} a {{B}}. */
const KEYBOARD = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

export function runFill(view, { exercise, level, tuningId, nav, onRepeat }) {
  const params = exercise.levels[level];
  const tuning = getTuning(tuningId);
  const rng = createRng();
  const puzzle = exercise.generate(params, rng, { tuning: tuning.midi, tuningId });
  const toFill = puzzle.cells.filter((c) => !c.given);
  const results = []; // { item: casilla, answer, result, ms }
  const answers = new Map(); // casilla → { answer, correct }
  const pauses = new Set();
  const ctx = exerciseCtx(tuning, { fretboard: (opts) => Fretboard({ tuning: tuning.midi, compact: true, ...opts }) });
  let selected = null;
  let state = 'playing'; // playing | done
  let saved = false;
  let stopSound = null;
  let stopSummarySound = null;
  let cellClock = createCountdown({ ms: null });

  const play = (cell) => {
    stopSound?.();
    stopSound = playSequence(exercise.sound(cell).midi, { gap: 0.7 });
  };

  /* ----- Pantalla ----- */
  const fill = h('div', { class: 'quiz-progress__fill' });
  const count = h('span', { class: 'quiz-progress__count' });
  const progress = h('div', { class: 'quiz-progress', role: 'progressbar', 'aria-label': 'Casillas rellenas', 'aria-valuemin': '0', 'aria-valuemax': String(toFill.length) },
    h('div', { class: 'quiz-progress__track' }, fill), count);
  const timeFill = h('div', { class: 'quiz-timer__fill' });
  const clockEl = h('p', { class: 'fill__clock', 'aria-hidden': 'true' });
  const header = h('header', { class: 'screen-header quiz-header' },
    h('div', { class: 'screen-header__bar' },
      iconButton({ iconName: 'close', label: 'Salir de la ronda', onClick: () => exit() }),
      progress,
      iconButton({ iconName: 'help', label: 'Ayuda', onClick: () => openExerciseHelp(exercise) }),
    ),
    puzzle.timeLimit ? h('div', { class: 'quiz-timer', 'aria-hidden': 'true' }, timeFill) : null,
  );
  const board = ctx.fretboard({ fromFret: 0, toFret: 12, markers: [], onTap: (string, fret) => tap(string, fret) });
  const statusEl = h('div', { class: 'fill__status', 'aria-live': 'polite' });
  const keys = KEYBOARD.map((pc) => h('button', { type: 'button', class: 'btn btn--grey fill__key', onClick: () => choose(pc) }, NoteLabel(pc)));
  const keyboard = h('div', { class: 'fill__keyboard', role: 'group', 'aria-label': 'Teclado de notas' }, keys);
  render(view, header, h('div', { class: 'screen quiz fill' },
    tuningTag(tuning),
    richText(exercise.prompt(puzzle), { tag: 'h2', className: 'quiz__prompt' }),
    clockEl,
    board,
    h('div', { class: 'fill__dock' }, statusEl, keyboard)));

  /* ----- Dibujo ----- */
  const done = () => answers.size;
  function drawProgress() {
    fill.style.width = `${(done() / toFill.length) * 100}%`;
    count.textContent = `${done()}/${toFill.length}`;
    progress.setAttribute('aria-valuenow', String(done()));
  }
  function markers() {
    return puzzle.cells.map((cell) => {
      const base = { string: cell.string, fret: cell.fret };
      if (cell.given) return { ...base, pc: cell.pc, color: 'neutral' };
      const a = answers.get(cell);
      if (a) return { ...base, pc: cell.pc, state: a.correct ? 'correct' : 'wrong' };
      if (cell === selected) return { ...base, text: '?', color: 'amber' };
      return { ...base, text: '', color: 'neutral', hollow: true };
    });
  }
  function draw() {
    board.setMarkers(markers());
    keys.forEach((k) => { k.disabled = !selected || state === 'done'; });
    drawProgress();
  }

  /** Selecciona la siguiente casilla vacía (en orden de cuerda y traste) a partir de `from`. */
  function selectNext(from) {
    const empty = toFill.filter((c) => !answers.has(c));
    if (!empty.length) { selected = null; return; }
    const start = from ? toFill.indexOf(from) : -1;
    selected = empty.find((c) => toFill.indexOf(c) > start) ?? empty[0];
    cellClock = createCountdown({ ms: null });
    if (!isPaused()) cellClock.start();
  }

  /* ----- Toques ----- */
  function tap(string, fret) {
    if (state === 'done') return;
    const cell = puzzle.cells.find((c) => c.string === string && c.fret === fret);
    if (!cell) return;
    if (cell.given || answers.has(cell)) { play(cell); return; }
    selected = cell;
    cellClock = createCountdown({ ms: null });
    if (!isPaused()) cellClock.start();
    draw();
  }

  function choose(pc) {
    if (state === 'done' || !selected) return;
    const cell = selected;
    const ms = cellClock.elapsed;
    cellClock.cancel();
    const result = exercise.check(cell, pc);
    recordStats(exercise.statKeys(cell), { correct: result.correct, ms });
    answers.set(cell, { answer: pc, correct: result.correct });
    results.push({ item: cell, answer: pc, result, ms });
    showStatus(cell, result);
    selectNext(cell);
    draw();
    if (done() === toFill.length) finish();
  }

  function showStatus(cell, result) {
    const speaker = iconButton({
      iconName: 'volume',
      label: 'Escuchar la respuesta',
      className: 'icon-btn--amber speaker-btn',
      onClick: () => play(cell),
    });
    if (result.correct) {
      render(statusEl, h('div', { class: 'quiz__result' }, h('span', { class: 'quiz__verdict' }, 'Correcto ✓'), speaker));
      return;
    }
    render(statusEl, h('div', { class: 'quiz-panel fill__panel' },
      h('p', { class: 'quiz-panel__text' }, h('span', { 'aria-hidden': 'true' }, '✗ '), richText(result.feedback, { tag: 'span' })),
      h('div', { class: 'quiz-panel__row' },
        speaker,
        h('button', {
          type: 'button',
          class: 'link-btn',
          onClick: () => openWhySheet({ why: result.why, figure: exercise.review(cell, ctx), concepts: exercise.concepts }),
        }, '¿Por qué?'))));
  }

  /* ----- Reloj: cronómetro, o contrarreloj en Avanzado ----- */
  const limitMs = puzzle.timeLimit ? puzzle.timeLimit * 1000 : null;
  const roundClock = createCountdown({
    ms: limitMs,
    onTick: (value) => {
      if (limitMs) {
        timeFill.style.width = `${(value / limitMs) * 100}%`;
        clockEl.textContent = formatClock(value / 1000);
      } else {
        clockEl.textContent = formatClock(Math.floor(value / 1000));
      }
    },
    onDone: () => timeUp(),
  });

  const isPaused = () => pauses.size > 0;
  function setPaused(reason, on) {
    if (on) pauses.add(reason); else pauses.delete(reason);
    if (state === 'done') return;
    if (isPaused()) { roundClock.pause(); cellClock.pause(); } else { roundClock.start(); cellClock.start(); }
  }
  const offSheet = onSheetChange((open) => setPaused('sheet', open));
  const onVisibility = () => setPaused('hidden', document.visibilityState === 'hidden');
  document.addEventListener('visibilitychange', onVisibility);

  /** Se acabó el tiempo: las casillas vacías cuentan como fallo, con su corrección. */
  function timeUp() {
    for (const cell of toFill.filter((c) => !answers.has(c))) {
      const result = exercise.check(cell, null);
      recordStats(exercise.statKeys(cell), { correct: false, ms: 0 });
      answers.set(cell, { answer: null, correct: false });
      results.push({ item: cell, answer: null, result, ms: 0 });
    }
    finish();
  }

  /* ----- Final, registro y salida ----- */
  const correctCount = () => results.filter((r) => r.result.correct).length;

  function save(complete) {
    if (saved || !results.length) return false;
    saved = true;
    const seconds = roundClock.elapsed / 1000;
    saveRound({ exercise, level, tuning: tuningId, seconds, correct: correctCount(), answered: results.length, done: complete });
    const rec = complete && exercise.record?.({ puzzle, results, level, tuningId, seconds });
    return rec ? saveRecord(rec.key, rec.value, rec.better) : false;
  }

  function stopAll() {
    roundClock.pause();
    cellClock.cancel();
    stopSound?.();
    offSheet();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  function finish() {
    if (state === 'done') return;
    state = 'done';
    stopAll();
    const seconds = roundClock.elapsed / 1000;
    const isRecord = save(true);
    stopSummarySound = renderQuizSummary(view, {
      exercise, level, results, isRecord, ctx, nav, onRepeat,
      tiles: [
        statTile(UI_TEXTS.round.fillTime, formatSecondsDecimal(seconds)),
        statTile('Racha', streakText(currentStreak(store.data.history))),
      ],
    });
  }

  async function exit() {
    if (state !== 'done' && results.length > 0) {
      const ok = await confirmSheet({ title: UI_TEXTS.round.exitTitle, text: UI_TEXTS.round.exitText, confirmLabel: 'Salir' });
      if (!ok) return;
    }
    nav.back();
  }

  selectNext(null);
  draw();
  roundClock.start();

  return () => {
    if (state !== 'done') {
      stopAll();
      save(false);
    }
    stopSummarySound?.();
  };
}
