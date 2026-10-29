// Preparación del ejercicio (BUILD_PLAN 6.6.6 y 7.6): frase, nivel, afinación (si la admite)
// y Empezar. Recuerda el último nivel y la última afinación de cada ejercicio.
// En la Fase 1A los ejercicios aún no existen: Empezar está desactivado.

import { h, button, segmented } from '../ui/components.js';
import { renderScreen } from './screen.js';
import { tuningRow, openTuningPicker } from '../ui/tuning-picker.js';
import { getPlannedExercise, LEVELS, LEVEL_IDS } from '../data/modules.js';
import { allowedTunings, getTuning, DEFAULT_TUNING_ID } from '../data/tunings.js';
import { store, settings } from '../state.js';

/** Nivel y afinación con los que se prepara un ejercicio (último usado o valores iniciales). */
export function exerciseSetup(exercise) {
  const saved = store.data.setups[exercise.id] ?? {};
  const allowed = allowedTunings(exercise.tunings);
  const isAllowed = (id) => allowed.some((t) => t.id === id);
  const level = LEVEL_IDS.includes(saved.level) ? saved.level : LEVEL_IDS[0];
  let tuning = DEFAULT_TUNING_ID;
  if (isAllowed(saved.tuning)) tuning = saved.tuning;
  else if (isAllowed(settings.get('defaultTuning'))) tuning = settings.get('defaultTuning');
  return { level, tuning, allowed };
}

function saveSetup(exercise, patch) {
  store.update((d) => { d.setups[exercise.id] = { ...d.setups[exercise.id], ...patch }; });
}

export function renderSetup(view, params, nav) {
  const exercise = getPlannedExercise(params.section, params.module, params.exercise);

  const draw = () => {
    const { level, tuning, allowed } = exerciseSetup(exercise);
    renderScreen(view, {
      title: exercise.title,
      nav,
      help: 'setup',
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
        h('div', { class: 'setup__start' },
          button({ label: 'Empezar', variant: 'primary', block: true, disabled: true }),
          h('p', { class: 'setup__note' }, `Este ejercicio llega en la Fase ${exercise.phase}.`),
        ),
      ],
    });
  };
  draw();
}
