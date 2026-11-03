// Progresiones de acordes (BUILD_PLAN 5.7 y 6.6.11), sin DOM: las predefinidas se calculan
// por grados con la teoría y se buscan en la biblioteca; "Mis progresiones" se validan aquí.

import { diatonicChords } from './theory.js';
import { CHORDS, getChord } from '../data/chords.js';
import { LEVEL_IDS } from '../data/modules.js';
import { PRESET_PROGRESSIONS, CUSTOM_PROGRESSION_SIZES, CUSTOM_NAME_MAX } from '../data/progressions.js';

const levelIndex = (chord) => LEVEL_IDS.indexOf(chord.level);

/**
 * Acorde abierto de la biblioteca con esa fundamental y calidad. Si hay dos formas (Fa mini y
 * Fa con cejilla), se usa la de nivel más bajo. Devuelve null si no hay ninguno.
 */
export function libraryChord(root, quality) {
  const found = CHORDS.filter((c) => c.root === root && c.quality === quality);
  return found.sort((a, b) => levelIndex(a) - levelIndex(b))[0] ?? null;
}

/** Fundamental y calidad del acorde de un grado (I, ii, … vii°) en una tonalidad mayor. */
export function degreeChord(key, roman) {
  const d = diatonicChords(key).find((x) => x.roman === roman);
  if (!d) throw new Error(`Grado desconocido: ${roman}`);
  return { root: d.root, quality: d.quality };
}

const presetId = (degrees, key) => `${degrees.join('-')}@${key}`;

/** Una progresión predefinida con sus acordes calculados. Lanza un error si falta alguno. */
export function resolvePreset({ degrees, key }) {
  const chords = degrees.map((roman) => {
    const { root, quality } = degreeChord(key, roman);
    const chord = libraryChord(root, quality);
    if (!chord) throw new Error(`${presetId(degrees, key)}: no hay acorde abierto para ${roman}`);
    return chord;
  });
  // Nivel de la progresión: el del acorde más difícil (Do–Fa–Sol es de Intermedio por el Fa).
  const level = LEVEL_IDS[Math.max(...chords.map(levelIndex))];
  return Object.freeze({ id: `preset:${presetId(degrees, key)}`, kind: 'preset', degrees, key, chords, level });
}

export const PRESETS = Object.freeze(PRESET_PROGRESSIONS.map(resolvePreset));

/* ----- Mis progresiones ----- */

/** Nombre limpio (sin espacios de más y como mucho 30 caracteres). */
export const cleanName = (name) => String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, CUSTOM_NAME_MAX);

/** true si una progresión guardada es válida: nombre, de 3 a 5 acordes y todos de la biblioteca. */
export function isValidCustom(prog) {
  return Boolean(prog) && typeof prog.id === 'string' && prog.id.length > 0
    && cleanName(prog.name).length > 0
    && Array.isArray(prog.chords) && CUSTOM_PROGRESSION_SIZES.includes(prog.chords.length)
    && prog.chords.every((id) => getChord(id));
}

/** Las progresiones guardadas que son válidas, con sus acordes. */
export function customProgressions(saved = []) {
  return saved.filter(isValidCustom).map((prog) => Object.freeze({
    id: `custom:${prog.id}`,
    kind: 'custom',
    customId: prog.id,
    name: cleanName(prog.name),
    chords: prog.chords.map(getChord),
  }));
}

/** Id nuevo para una progresión guardada, distinto de los que ya hay. */
export function newCustomId(saved = [], now = Date.now()) {
  let n = now;
  const used = new Set(saved.map((x) => x.id));
  while (used.has(`p${n.toString(36)}`)) n += 1;
  return `p${n.toString(36)}`;
}

/**
 * La progresión elegida en la preparación ('preset:…' o 'custom:…'). Si ya no existe (por
 * ejemplo, se borró), la primera predefinida.
 */
export function resolveProgressionChoice(value, saved = []) {
  return [...PRESETS, ...customProgressions(saved)].find((x) => x.id === value) ?? PRESETS[0];
}
