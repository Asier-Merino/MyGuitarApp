// Pantalla de un ejercicio en marcha. "Empezar" deja preparada la ronda (nivel, afinación,
// duración y opciones) y esta pantalla la juega con el motor de Teoría o de Práctica.
// Si se llega sin pasar por "Empezar" (p. ej. al recargar), vuelve a la preparación.

import { findExercise, exercisePath } from '../engine/exercise-registry.js';
import { takePendingRound } from '../engine/rounds.js';
import { runQuiz } from '../engine/quiz-runner.js';
import { runPractice } from '../engine/practice-runner.js';
import { runFill } from '../engine/fill-runner.js';
import { primeSpeech } from '../engine/speech.js';

export function renderPlay(view, params, nav) {
  const exercise = findExercise(params);
  const round = takePendingRound(exercise.id);
  if (!round) {
    queueMicrotask(() => nav.replace(exercisePath(exercise)));
    return null;
  }
  let cleanup = null;
  const start = () => {
    cleanup?.();
    let run = exercise.section === 'teoria' ? runQuiz : runPractice;
    if (exercise.runner === 'fill') run = runFill;
    cleanup = run(view, {
      exercise,
      level: round.level,
      tuningId: round.tuning,
      duration: round.duration,
      options: round.options,
      nav,
      onRepeat: () => { primeSpeech(); start(); window.scrollTo(0, 0); },
    });
  };
  start();
  return () => cleanup?.();
}
