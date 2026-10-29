// Ajustes persistentes (BUILD_PLAN 6.5). Sin DOM: se guardan a través del almacén.

import { TUNING_IDS, DEFAULT_TUNING_ID } from './data/tunings.js';

export const SETTINGS_SCHEMA = Object.freeze({
  notation: { default: 'es', values: ['es', 'en'] },
  accidentals: { default: 'sharp', values: ['sharp', 'flat'] },
  // 'system' = Automático (sigue al sistema). Oscuro por defecto (BUILD_PLAN 6.1).
  theme: { default: 'dark', values: ['dark', 'light', 'system'] },
  fretboardOrientation: { default: 'auto', values: ['auto', 'vertical', 'horizontal'] },
  fretboardLabels: { default: 'notes', values: ['notes', 'intervals'] },
  sound: { default: true, type: 'boolean' },
  volume: { default: 0.8, type: 'number', min: 0, max: 1 },
  voice: { default: true, type: 'boolean' },
  defaultTuning: { default: DEFAULT_TUNING_ID, values: TUNING_IDS },
  askTuning: { default: false, type: 'boolean' },
});

export function isValidSetting(key, value) {
  const spec = SETTINGS_SCHEMA[key];
  if (!spec) return false;
  if (spec.values) return spec.values.includes(value);
  if (spec.type === 'boolean') return typeof value === 'boolean';
  if (spec.type === 'number') {
    return typeof value === 'number' && Number.isFinite(value) && value >= spec.min && value <= spec.max;
  }
  return false;
}

export function defaultSettings() {
  return Object.fromEntries(Object.entries(SETTINGS_SCHEMA).map(([k, spec]) => [k, spec.default]));
}

/** Completa con valores por defecto y descarta valores no válidos o desconocidos. */
export function normalizeSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(
    Object.entries(SETTINGS_SCHEMA).map(([k, spec]) => [k, isValidSetting(k, source[k]) ? source[k] : spec.default]),
  );
}

export function createSettings(store) {
  let current = normalizeSettings(store.data.settings);
  const listeners = new Set();
  const notify = (key) => listeners.forEach((fn) => fn(current, key));

  return {
    get: (key) => current[key],
    all: () => ({ ...current }),

    set(key, value) {
      if (!isValidSetting(key, value)) throw new Error(`Valor no válido para ${key}: ${value}`);
      if (current[key] === value) return;
      current = { ...current, [key]: value };
      store.update((d) => { d.settings = { ...current }; });
      notify(key);
    },

    /** Vuelve a leer los ajustes del almacén (p. ej. tras importar). */
    reload() {
      current = normalizeSettings(store.data.settings);
      notify(null);
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
