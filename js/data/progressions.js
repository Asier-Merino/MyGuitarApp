// Progresiones de acordes predefinidas (BUILD_PLAN 5.7). Solo se escriben los grados y la
// tonalidad: los acordes se calculan con la teoría (js/core/progressions.js) y se buscan en
// la biblioteca de acordes abiertos (5.1).
// key: pitch class de la tonalidad mayor (0 = Do). degrees: números romanos de la tonalidad.

const p = (degrees, key) => Object.freeze({ degrees: Object.freeze(degrees), key });

export const PRESET_PROGRESSIONS = Object.freeze([
  // I–IV–V: Sol–Do–Re, Re–Sol–La, La–Re–Mi y (con el Fa) Do–Fa–Sol.
  p(['I', 'IV', 'V'], 7),
  p(['I', 'IV', 'V'], 2),
  p(['I', 'IV', 'V'], 9),
  p(['I', 'IV', 'V'], 0),
  // I–V–vi–IV: Sol–Re–Mim–Do y (con el Fa) Do–Sol–Lam–Fa.
  p(['I', 'V', 'vi', 'IV'], 7),
  p(['I', 'V', 'vi', 'IV'], 0),
  // I–vi–IV–V: Sol–Mim–Do–Re.
  p(['I', 'vi', 'IV', 'V'], 7),
  // vi–IV–I–V: Mim–Do–Sol–Re.
  p(['vi', 'IV', 'I', 'V'], 7),
]);

/** "Mis progresiones" (6.6.11): de 3 a 5 acordes. */
export const CUSTOM_PROGRESSION_SIZES = Object.freeze([3, 4, 5]);
export const CUSTOM_NAME_MAX = 30;

/**
 * Progresiones por grados de Escala y tonalidad (Fase 5): las de 5.7 y ii–V–I. Solo los
 * grados: los acordes se calculan en cada tonalidad (js/core/progressions.js, keyProgression).
 */
export const KEY_PROGRESSIONS = Object.freeze([
  ['I', 'IV', 'V'],
  ['I', 'V', 'vi', 'IV'],
  ['I', 'vi', 'IV', 'V'],
  ['vi', 'IV', 'I', 'V'],
  ['ii', 'V', 'I'],
].map((degrees) => Object.freeze({ id: degrees.join('-'), degrees: Object.freeze(degrees) })));

export const getKeyProgression = (id) => KEY_PROGRESSIONS.find((p) => p.id === id) ?? null;
