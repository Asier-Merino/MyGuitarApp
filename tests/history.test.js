import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practiceTotals, formatDuration, dayKey } from '../js/core/history.js';

test('sin historial: cero días y cero segundos', () => {
  assert.deepEqual(practiceTotals([]), { days: 0, seconds: 0 });
  assert.deepEqual(practiceTotals(), { days: 0, seconds: 0 });
});

test('cuenta días distintos y suma el tiempo, ignorando entradas mal formadas', () => {
  const h = [
    { date: new Date(2026, 9, 27, 10).toISOString(), seconds: 120 },
    { date: new Date(2026, 9, 27, 22).toISOString(), seconds: 60 },
    { date: new Date(2026, 9, 29, 9).getTime(), seconds: 30 },
    { date: 'nada', seconds: 999 },
    null,
    { date: new Date(2026, 9, 30).toISOString(), seconds: -5 },
  ];
  assert.deepEqual(practiceTotals(h), { days: 3, seconds: 210 });
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('formatDuration', () => {
  assert.equal(formatDuration(45), '45 s');
  assert.equal(formatDuration(12 * 60), '12 min');
  assert.equal(formatDuration(6 * 3600 + 40 * 60), '6 h 40 min');
  assert.equal(formatDuration(2 * 3600), '2 h');
});
