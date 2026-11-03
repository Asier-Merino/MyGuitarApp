// Piezas comunes de los motores de Práctica de la Fase 3 (acordes, un minuto y calentamiento):
// cabecera con X, barra de tiempo y botón de la derecha, pausa con el "?" y resumen sin
// autoevaluación (BUILD_PLAN 6.6.8 y 6.6.10).

import { h, render, button, iconButton, screenHeader, badge } from '../ui/components.js';
import { openExerciseHelp } from '../ui/help-sheet.js';
import { celebrate } from '../ui/confetti.js';
import { levelTitle } from './quiz-runner.js';
import { formatElapsed } from '../core/history.js';
import { UI_TEXTS } from '../data/concepts.js';

/** Cabecera de una ronda: X, barra con el tiempo y un botón a la derecha (o hueco). */
export function roundHeader({ onExit, exitLabel = 'Salir de la ronda', right = null }) {
  const fill = h('div', { class: 'quiz-progress__fill' });
  const count = h('span', { class: 'quiz-progress__count' });
  const header = h('header', { class: 'screen-header quiz-header' },
    h('div', { class: 'screen-header__bar' },
      iconButton({ iconName: 'close', label: exitLabel, onClick: onExit }),
      h('div', { class: 'quiz-progress', role: 'timer', 'aria-label': 'Tiempo de la ronda' }, h('div', { class: 'quiz-progress__track' }, fill), count),
      right ?? h('span', { class: 'icon-btn-spacer' })));
  return {
    header,
    /** text: lo que se lee (p. ej. "0:45") · fraction: lo que va hecho, de 0 a 1 (o null si no hay barra). */
    set(text, fraction) {
      count.textContent = text;
      fill.style.width = fraction == null ? '0%' : `${Math.min(1, fraction) * 100}%`;
    },
  };
}

/** Aviso de pausa con la ayuda (en Práctica el "?" solo se abre en pausa, 6.8). */
export function pausedPanel(exercise) {
  return h('div', { class: 'practice__paused', hidden: true },
    h('p', { class: 'practice__paused-title' }, UI_TEXTS.round.paused),
    h('p', { class: 'practice__paused-hint' }, UI_TEXTS.round.pausedHint),
    button({ label: 'Ayuda', iconName: 'help', onClick: () => openExerciseHelp(exercise) }));
}

/**
 * Resumen de Práctica (6.6.10): ejercicio, nivel, qué se ha hecho, cuánto tiempo y el récord
 * si se ha batido. Sin autoevaluación. extra: un dato más (p. ej. el récord actual).
 */
export function practiceSummary(view, { exercise, level, done, seconds, isRecord, extra, nav, onRepeat }) {
  render(view,
    screenHeader({ title: 'Resumen', onBack: nav.back, closeIcon: true }),
    h('div', { class: 'screen summary' },
      h('p', { class: 'summary__meta' }, `${exercise.title} · ${levelTitle(level)}`),
      h('p', { class: 'summary__done' }, `${done} · ${formatElapsed(seconds)}`),
      extra && h('p', { class: 'summary__extra' }, extra),
      isRecord && h('p', { class: 'summary__record' }, badge(UI_TEXTS.round.newRecord, 'amber')),
      h('div', { class: 'summary__actions' },
        button({ label: 'Repetir', iconName: 'repeat', variant: 'primary', block: true, onClick: () => onRepeat() }),
        button({ label: 'Salir', block: true, onClick: () => nav.back() })),
    ));
  if (isRecord) celebrate();
}

/** "3 cambios", "1 vuelta". */
export const countText = (exercise, n) => `${n} ${n === 1 ? exercise.itemNoun[0] : exercise.itemNoun[1]}`;
