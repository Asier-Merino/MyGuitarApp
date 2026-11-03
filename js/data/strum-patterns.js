// Patrones de rasgueo (BUILD_PLAN 5.6). El compás de 4/4 se divide en 8 casillas de corchea
// (1 y 2 y 3 y 4 y). Cada casilla: 'D' (↓, golpe abajo), 'U' (↑, golpe arriba) o '-' (·, la
// mano se mueve sin golpear). Regla del péndulo: abajo en los tiempos (casillas pares) y
// arriba en los "y" (impares), golpee o no.
// accents: casillas que suenan más fuertes · swing: corcheas en proporción 2:1 (la del "y" llega tarde).
// Los dos últimos de Avanzado (acento y swing) los aprobó el usuario al empezar la Fase 3.

const sp = (id, level, cells, title, extra = {}) => Object.freeze({ id, level, cells, title, accents: Object.freeze(extra.accents ?? []), swing: Boolean(extra.swing) });

export const STRUM_PATTERNS = Object.freeze([
  sp('negras', 'basico', 'D-D-D-D-', 'Negras, todo abajo'),
  sp('abajo-arriba', 'basico', 'D-DUD-DU', 'Abajo, abajo-arriba'),
  sp('pop', 'intermedio', 'D-DU-UDU', 'El patrón pop más típico'),
  sp('corcheas', 'intermedio', 'DUDUDUDU', 'Corcheas seguidas'),
  sp('huecos', 'avanzado', 'D--U-UDU', 'Con más huecos'),
  sp('pop-acento', 'avanzado', 'D-DU-UDU', 'Pop con acento en 2 y 4', { accents: [2, 6] }),
  sp('swing', 'avanzado', 'D-DUD-DU', 'Abajo, abajo-arriba con swing', { swing: true }),
]);

export const STRUM_CELLS = 8;

/** Símbolo de cada casilla en pantalla. */
export const STRUM_SYMBOLS = Object.freeze({ D: '↓', U: '↑', '-': '·' });

/** Conteo de cada casilla. */
export const STRUM_COUNT = Object.freeze(['1', 'y', '2', 'y', '3', 'y', '4', 'y']);

/** Tempo de cada nivel (tabla de la Fase 3): Básico 60–70, Intermedio 70–90, Avanzado 90–110. */
export const STRUM_TEMPO = Object.freeze({
  basico: Object.freeze({ min: 60, max: 70 }),
  intermedio: Object.freeze({ min: 70, max: 90 }),
  avanzado: Object.freeze({ min: 90, max: 110 }),
});

export const getStrumPattern = (id) => STRUM_PATTERNS.find((x) => x.id === id) ?? null;

export const levelPatterns = (level) => STRUM_PATTERNS.filter((x) => x.level === level);
