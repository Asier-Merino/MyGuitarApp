// Generador aleatorio con semilla opcional (mulberry32), para poder repetir resultados en tests.

export function createRng(seed) {
  let state = (seed === undefined ? Math.floor(Math.random() * 2 ** 32) : Number(seed)) >>> 0;

  /** Número en [0, 1). */
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Entero entre min y max, ambos incluidos. */
  function int(min, max) {
    if (max < min) throw new RangeError('max debe ser >= min');
    return min + Math.floor(next() * (max - min + 1));
  }

  function pick(items) {
    if (!items.length) throw new Error('No se puede elegir de una lista vacía');
    return items[int(0, items.length - 1)];
  }

  /** Copia barajada (Fisher–Yates); no modifica el original. */
  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** `count` elementos distintos al azar. */
  function sample(items, count) {
    return shuffle(items).slice(0, count);
  }

  /** Índice elegido con probabilidad proporcional a su peso (pesos >= 0). */
  function weightedIndex(weights) {
    const total = weights.reduce((sum, w) => sum + (w > 0 ? w : 0), 0);
    if (!(total > 0)) throw new Error('Hace falta al menos un peso positivo');
    let r = next() * total;
    for (let i = 0; i < weights.length; i++) {
      if (weights[i] > 0) {
        r -= weights[i];
        if (r < 0) return i;
      }
    }
    // Por redondeo: último con peso positivo.
    for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i;
    return -1;
  }

  /** Elige de `items`; `weights` es un array o una función item => peso. */
  function weightedPick(items, weights) {
    const list = typeof weights === 'function' ? items.map(weights) : weights;
    if (list.length !== items.length) throw new Error('items y weights deben tener la misma longitud');
    return items[weightedIndex(list)];
  }

  return { next, int, pick, shuffle, sample, weightedIndex, weightedPick };
}
