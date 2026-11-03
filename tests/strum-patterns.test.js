// Patrones de rasgueo de BUILD_PLAN 5.6 y regla del péndulo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STRUM_PATTERNS, STRUM_CELLS, STRUM_TEMPO, STRUM_SYMBOLS, STRUM_COUNT, levelPatterns, getStrumPattern,
} from '../js/data/strum-patterns.js';
import { eighthOffset, eighthTime } from '../js/core/rhythm.js';
import { LEVEL_IDS } from '../js/data/modules.js';

const arrows = (p) => [...p.cells].map((c) => STRUM_SYMBOLS[c]).join(' ');

test('8 casillas con D, U o -; D solo en posiciones pares y U solo en impares (péndulo)', () => {
  for (const p of STRUM_PATTERNS) {
    assert.equal(p.cells.length, STRUM_CELLS, p.id);
    [...p.cells].forEach((c, i) => {
      assert.ok(['D', 'U', '-'].includes(c), `${p.id}: ${c}`);
      if (c === 'D') assert.equal(i % 2, 0, `${p.id}: ↓ en la casilla ${i}`);
      if (c === 'U') assert.equal(i % 2, 1, `${p.id}: ↑ en la casilla ${i}`);
    });
    for (const a of p.accents) assert.notEqual(p.cells[a], '-', `${p.id}: acento en un hueco`);
    assert.ok(LEVEL_IDS.includes(p.level), p.id);
  }
  assert.equal(new Set(STRUM_PATTERNS.map((p) => p.id)).size, STRUM_PATTERNS.length);
});

test('los patrones de la tabla 5.6, por nivel', () => {
  assert.deepEqual(levelPatterns('basico').map(arrows), ['↓ · ↓ · ↓ · ↓ ·', '↓ · ↓ ↑ ↓ · ↓ ↑']);
  assert.deepEqual(levelPatterns('intermedio').map(arrows), ['↓ · ↓ ↑ · ↑ ↓ ↑', '↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑']);
  assert.deepEqual(levelPatterns('avanzado').map(arrows), ['↓ · · ↑ · ↑ ↓ ↑', '↓ · ↓ ↑ · ↑ ↓ ↑', '↓ · ↓ ↑ ↓ · ↓ ↑']);
  // Avanzado (aprobados por el usuario): el pop con acento en los tiempos 2 y 4, y el de swing.
  const accent = getStrumPattern('pop-acento');
  assert.deepEqual(accent.accents.map((i) => STRUM_COUNT[i]), ['2', '4']);
  assert.equal(getStrumPattern('swing').swing, true);
  assert.equal(getStrumPattern('nada'), null);
});

test('tempo de cada nivel: 60–70, 70–90 y 90–110 BPM', () => {
  assert.deepEqual(LEVEL_IDS.map((l) => [STRUM_TEMPO[l].min, STRUM_TEMPO[l].max]), [[60, 70], [70, 90], [90, 110]]);
});

test('conteo y momento de cada casilla: el "y" a mitad de tiempo, o a 2/3 con swing (2:1)', () => {
  assert.deepEqual(STRUM_COUNT, ['1', 'y', '2', 'y', '3', 'y', '4', 'y']);
  assert.deepEqual([0, 1, 2, 3].map((i) => eighthTime(i)), [0, 0.5, 1, 1.5]);
  assert.equal(eighthOffset(0, { swing: true }), 0);
  const long = eighthOffset(1, { swing: true });
  assert.ok(Math.abs(long / (1 - long) - 2) < 1e-9); // la corchea larga dura el doble que la corta
});
