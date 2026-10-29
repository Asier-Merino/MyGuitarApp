// Las 7 afinaciones de la app (BUILD_PLAN 4.2), validadas por el usuario.
// midi: nota MIDI de cada cuerda al aire (1 = Mi aguda … 6 = Mi grave).
// Los nombres de las notas y la línea de cambios se calculan; aquí solo hay MIDI.
//
// name: el nombre se compone con la nota `root` (que se muestra con NoteLabel) y `suffix`,
// o es un texto fijo (`text`) cuando no lleva nota ("Medio tono abajo", "Drop D").
// accidentals: cómo se escriben habitualmente sus notas (la de medio tono abajo, con bemoles).
// concept: ficha de concepts.js que la explica.

import { noteName } from '../core/notation.js';

export const TUNING_GROUPS = Object.freeze([
  { id: 'standard', title: 'Estándar y bajadas' },
  { id: 'drop', title: 'Drop' },
  { id: 'open', title: 'Slide (abiertas)' },
].map(Object.freeze));

const t = (id, group, name, [s6, s5, s4, s3, s2, s1], { accidentals = 'sharp', concept }) => Object.freeze({
  id,
  group,
  name: Object.freeze(name),
  midi: Object.freeze({ 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6 }),
  accidentals,
  concept,
});

export const TUNINGS = Object.freeze([
  t('standard', 'standard', { root: 4, suffix: 'estándar' }, [40, 45, 50, 55, 59, 64], { concept: 'standard-tuning' }),
  t('half-down', 'standard', { text: 'Medio tono abajo' }, [39, 44, 49, 54, 58, 63], { accidentals: 'flat', concept: 'lowered-tuning' }),
  t('d-standard', 'standard', { root: 2, suffix: 'estándar' }, [38, 43, 48, 53, 57, 62], { concept: 'lowered-tuning' }),
  t('drop-d', 'drop', { text: 'Drop D' }, [38, 45, 50, 55, 59, 64], { concept: 'drop-tuning' }),
  t('open-g', 'open', { root: 7, suffix: 'abierto' }, [38, 43, 50, 55, 59, 62], { concept: 'open-tuning' }),
  t('open-d', 'open', { root: 2, suffix: 'abierto' }, [38, 45, 50, 54, 57, 62], { concept: 'open-tuning' }),
  t('open-e', 'open', { root: 4, suffix: 'abierto' }, [40, 47, 52, 56, 59, 64], { concept: 'open-tuning' }),
]);

export const DEFAULT_TUNING_ID = 'standard';

export const TUNING_IDS = Object.freeze(TUNINGS.map((x) => x.id));

export function getTuning(id) {
  return TUNINGS.find((x) => x.id === id) ?? null;
}

export const STANDARD = getTuning('standard');

/** Nombre como texto plano (para títulos, voz y lectores de pantalla). */
export function tuningNameText(tuning, { notation = 'es', accidentals = 'sharp' } = {}) {
  const { name } = tuning;
  if (name.text) return name.text;
  return `${noteName(name.root, { notation, accidentals })} ${name.suffix}`;
}

/** Afinaciones que admite un ejercicio: 'standard' | 'any' | lista de ids (BUILD_PLAN 7.6). */
export function allowedTunings(spec = 'standard') {
  if (spec === 'any') return TUNINGS;
  if (Array.isArray(spec)) return TUNINGS.filter((x) => spec.includes(x.id));
  return [STANDARD];
}
