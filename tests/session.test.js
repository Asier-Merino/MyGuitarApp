import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DURATION_OPTIONS, durationOptions, normalizeDuration, UNLIMITED, historyEntry, updateRecord,
  scoreBand, averageSeconds, formatSecondsDecimal, formatClock,
} from '../js/core/session.js';
import { currentStreak, formatElapsed, practiceTotals } from '../js/core/history.js';

test('duración: 30 s · 1 min · 2 min 30 · 5 min · 10 min, y "Sin límite" solo si se activa', () => {
  assert.deepEqual(DURATION_OPTIONS.map((o) => o.value), [30, 60, 150, 300, 600]);
  assert.deepEqual(DURATION_OPTIONS.map((o) => o.label), ['30 s', '1 min', '2 min 30', '5 min', '10 min']);
  assert.ok(!durationOptions().some((o) => o.value === UNLIMITED));
  assert.equal(durationOptions({ unlimited: true }).at(-1).label, 'Sin límite');
  assert.equal(normalizeDuration(150), 150);
  assert.equal(normalizeDuration(UNLIMITED), 60);
  assert.equal(normalizeDuration(UNLIMITED, { unlimited: true }), UNLIMITED);
  assert.equal(normalizeDuration(42, { fallback: 300 }), 300);
});

test('registro de sesiones: Teoría con aciertos, Práctica con consignas', () => {
  const date = new Date(2026, 10, 2, 18);
  const t = historyEntry({ exercise: { id: 'x', section: 'teoria' }, level: 'basico', tuning: 'standard', seconds: 61.6, date, correct: 8, answered: 10 });
  assert.deepEqual(t, { date: date.toISOString(), ex: 'x', section: 'teoria', level: 'basico', tuning: 'standard', seconds: 62, done: true, ok: 8, total: 10 });
  const p = historyEntry({ exercise: { id: 'y', section: 'practica' }, level: 'avanzado', tuning: 'open-g', seconds: 240, date, items: 12, done: false });
  assert.equal(p.items, 12);
  assert.equal(p.done, false);
  assert.ok(!('ok' in p));
  assert.deepEqual(practiceTotals([t, p]), { days: 1, seconds: 302 });
});

test('récords: la primera marca se guarda sin celebrarse; solo se celebra al mejorarla', () => {
  let r = updateRecord(undefined, 10);
  assert.equal(r.record.value, 10);
  assert.equal(r.isNew, false);
  r = updateRecord(r.record, 9);
  assert.equal(r.record.value, 10);
  assert.equal(r.isNew, false);
  r = updateRecord(r.record, 12);
  assert.deepEqual([r.record.value, r.isNew], [12, true]);
  const time = updateRecord({ value: 30 }, 25, { better: 'lower' });
  assert.deepEqual([time.record.value, time.isNew], [25, true]);
  assert.equal(updateRecord({ value: 30 }, NaN).isNew, false);
});

test('frase del resumen según el porcentaje', () => {
  assert.equal(scoreBand(10, 10), 'perfect');
  assert.equal(scoreBand(8, 10), 'great');
  assert.equal(scoreBand(5, 10), 'good');
  assert.equal(scoreBand(4, 10), 'keepGoing');
  assert.equal(scoreBand(0, 0), 'none');
});

test('tiempos: medio, con coma decimal, reloj y duración de la ronda', () => {
  assert.equal(averageSeconds([3000, 4000]), 3.5);
  assert.equal(averageSeconds([]), null);
  assert.equal(formatSecondsDecimal(3.44), '3,4 s');
  assert.equal(formatClock(65), '1:05');
  assert.equal(formatClock(29.2), '0:30');
  assert.equal(formatClock(600), '10:00');
  assert.equal(formatElapsed(150), '2 min 30 s');
  assert.equal(formatElapsed(240), '4 min');
  assert.equal(formatElapsed(45), '45 s');
  assert.equal(formatElapsed(3900), '1 h 5 min');
});

test('racha: días seguidos hasta hoy, o hasta ayer si hoy aún no se ha practicado', () => {
  const at = (d, h = 10) => ({ date: new Date(2026, 10, d, h).toISOString(), seconds: 60 });
  const today = new Date(2026, 10, 10, 20);
  assert.equal(currentStreak([], today), 0);
  assert.equal(currentStreak([at(10), at(9), at(8), at(6)], today), 3);
  assert.equal(currentStreak([at(9), at(8)], today), 2); // hoy aún no: cuenta hasta ayer
  assert.equal(currentStreak([at(8)], today), 0); // ayer no: racha perdida
  assert.equal(currentStreak([at(10, 1), at(10, 23)], today), 1);
  // Cruce de mes.
  const firstDay = new Date(2026, 11, 1, 9);
  assert.equal(currentStreak([{ date: new Date(2026, 11, 1).toISOString() }, at(30)], firstDay), 2);
});
