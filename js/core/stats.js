// Estadísticas por clave ('note:s5f3'…) y pesos de repetición (BUILD_PLAN 7.2 y 7.4), sin DOM.
//
// Cada clave guarda, de forma compacta:
//   n: veces vista · w: fallos · ms: suma de los tiempos de respuesta (ms)
//   r: últimos resultados, del más antiguo al más reciente ('1' acierto, '0' fallo)
//   t: última vez vista (ms desde 1970)

/** Resultados recientes que cuentan para la tasa de fallo. */
export const RECENT_RESULTS = 10;
/** Una clave "no vista recientemente" lleva más de 7 días sin salir. */
export const RECENT_MS = 7 * 24 * 3600 * 1000;
/** Peso de una clave nunca vista (7.4). */
export const UNSEEN_WEIGHT = 1.5;

/** Devuelve la entrada actualizada de una clave tras una respuesta. */
export function recordResult(entry, { correct, ms = 0, now = Date.now() }) {
  const prev = entry && typeof entry === 'object' ? entry : {};
  const r = `${prev.r ?? ''}${correct ? '1' : '0'}`.slice(-RECENT_RESULTS);
  return {
    n: (prev.n ?? 0) + 1,
    w: (prev.w ?? 0) + (correct ? 0 : 1),
    ms: (prev.ms ?? 0) + (Number.isFinite(ms) && ms > 0 ? Math.round(ms) : 0),
    r,
    t: now,
  };
}

/** Tasa de fallo con los resultados recientes (0–1), o null si nunca se ha visto. */
export function failRate(entry) {
  const r = entry?.r;
  if (!r) return null;
  return [...r].filter((c) => c === '0').length / r.length;
}

/** peso = 1 + 3 × tasaDeFallo + 0,5 × (no vista recientemente ? 1 : 0); nunca vista: 1,5 (7.4). */
export function weightOf(entry, now = Date.now()) {
  const rate = failRate(entry);
  if (rate === null) return UNSEEN_WEIGHT;
  const stale = !Number.isFinite(entry.t) || now - entry.t > RECENT_MS ? 1 : 0;
  return 1 + 3 * rate + 0.5 * stale;
}

/**
 * Elige un candidato con peso según sus estadísticas, sin repetir `avoidKey`
 * (la pregunta anterior) si hay alternativas.
 */
export function pickWeighted(candidates, { keyOf, stats = {}, rng, avoidKey = null, now = Date.now() }) {
  if (!candidates.length) throw new Error('No hay candidatos');
  const pool = candidates.length > 1 ? candidates.filter((c) => keyOf(c) !== avoidKey) : candidates;
  const list = pool.length ? pool : candidates;
  return rng.weightedPick(list, (c) => weightOf(stats[keyOf(c)], now));
}
