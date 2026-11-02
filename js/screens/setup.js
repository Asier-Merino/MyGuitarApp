// Preparación del ejercicio (BUILD_PLAN 6.6.6 y 7.6): frase, nivel, afinación (si la admite),
// duración (si va por tiempo), opciones propias y Empezar. Recuerda lo último usado en cada
// ejercicio. Con "Preguntar antes de cada ejercicio", Empezar abre antes el panel de afinaciones.
// Los ejercicios que aún no están construidos muestran Empezar desactivado y su fase.

import { h, button, segmented, toggle, settingRow, iconButton } from '../ui/components.js';
import { renderScreen } from './screen.js';
import { tuningRow, openTuningPicker } from '../ui/tuning-picker.js';
import { openExerciseHelp } from '../ui/help-sheet.js';
import { LEVELS } from '../data/modules.js';
import { getTuning } from '../data/tunings.js';
import { findExercise, isPlayable, exercisePath } from '../engine/exercise-registry.js';
import { exerciseSetup, saveSetup, setPendingRound } from '../engine/rounds.js';
import { primeSpeech } from '../engine/speech.js';
import { durationOptions } from '../core/session.js';
import { clampBpm } from '../core/rhythm.js';
import { getAudio } from '../audio/context.js';
import { settings } from '../state.js';

const TEMPO_STEP = 5;

/** Fila "Metrónomo": interruptor y, si está activado, el tempo con − y +. */
function metronomeOption(opt, value, onChange) {
  return h('div', { class: 'card setup__option' },
    settingRow({ label: opt.label, control: toggle({ label: opt.label, checked: value.on, onChange: (on) => onChange({ ...value, on }) }) }),
    value.on && settingRow({
      label: 'Tempo',
      control: h('div', { class: 'stepper' },
        iconButton({ iconName: 'minus', label: 'Bajar el tempo', onClick: () => onChange({ ...value, bpm: clampBpm(value.bpm - TEMPO_STEP) }) }),
        h('span', { class: 'stepper__value' }, `${value.bpm} BPM`),
        iconButton({ iconName: 'plus', label: 'Subir el tempo', onClick: () => onChange({ ...value, bpm: clampBpm(value.bpm + TEMPO_STEP) }) })),
    }));
}

export function renderSetup(view, params, nav) {
  const exercise = findExercise(params);
  const playable = isPlayable(exercise);

  const start = (setup, tuningId = setup.tuning) => {
    // Dentro del toque: desbloquea el audio y la voz (iOS).
    primeSpeech();
    if (settings.get('sound')) getAudio();
    setPendingRound({
      exerciseId: exercise.id,
      level: setup.level,
      tuning: tuningId,
      duration: setup.duration,
      options: setup.options,
    });
    nav.replace(`${exercisePath(exercise)}/jugar`);
  };

  const draw = () => {
    const setup = exerciseSetup(exercise);
    const { level, tuning, allowed, duration, options } = setup;
    const onStart = () => {
      if (settings.get('askTuning') && allowed.length > 1) {
        openTuningPicker({
          allowed,
          value: tuning,
          always: true,
          title: 'Afinación para esta ronda',
          onSelect: (id) => { saveSetup(exercise, { tuning: id }); start(setup, id); },
        });
      } else {
        start(setup);
      }
    };
    renderScreen(view, {
      title: exercise.title,
      nav,
      help: playable ? () => openExerciseHelp(exercise) : 'setup',
      className: 'setup',
      content: [
        h('p', { class: 'lead' }, exercise.description),
        h('h2', { class: 'section-title' }, 'Nivel'),
        segmented({
          label: 'Nivel',
          large: true,
          value: level,
          options: LEVELS.map((l) => ({ value: l.id, label: l.title })),
          onChange: (v) => { saveSetup(exercise, { level: v }); draw(); },
        }),
        allowed.length > 1 && [
          h('h2', { class: 'section-title' }, 'Afinación'),
          h('div', { class: 'list' }, tuningRow({
            tuning: getTuning(tuning),
            onClick: () => openTuningPicker({
              allowed,
              value: tuning,
              onSelect: (id) => { saveSetup(exercise, { tuning: id }); draw(); },
            }),
          })),
        ],
        playable && exercise.duration && [
          h('h2', { class: 'section-title' }, 'Duración'),
          segmented({
            label: 'Duración',
            value: duration,
            options: durationOptions({ unlimited: exercise.duration.unlimited }).map((o) => ({ value: o.value, label: o.label })),
            onChange: (v) => { saveSetup(exercise, { duration: v }); draw(); },
          }),
        ],
        playable && (exercise.options ?? []).map((opt) => opt.type === 'metronome' && metronomeOption(opt, options[opt.id], (v) => {
          saveSetup(exercise, { options: { ...options, [opt.id]: v } });
          draw();
        })),
        h('div', { class: 'setup__start' },
          button({ label: 'Empezar', variant: 'primary', block: true, disabled: !playable, onClick: playable ? onStart : undefined }),
          !playable && h('p', { class: 'setup__note' }, `Este ejercicio llega en la Fase ${exercise.phase}.`),
        ),
      ],
    });
  };
  draw();
}
