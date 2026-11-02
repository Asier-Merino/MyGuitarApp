import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BPM_MIN, BPM_MAX, clampBpm, secondsPerBeat, nextPulse, pulseKind, addTap, normalizeMetronome,
  BEATS_PER_BAR_OPTIONS, subdivisionPerBeat, TAP_RESET_MS,
} from '../js/core/rhythm.js';

test('tempo entre 30 y 240 BPM, entero', () => {
  assert.equal(BPM_MIN, 30);
  assert.equal(BPM_MAX, 240);
  assert.equal(clampBpm(10), 30);
  assert.equal(clampBpm(300), 240);
  assert.equal(clampBpm(80.4), 80);
  assert.equal(clampBpm('nada'), 80);
});

test('"a 60 BPM suena un clic por segundo, y a 120, dos" (ficha del metrónomo)', () => {
  assert.equal(secondsPerBeat(60), 1);
  assert.equal(secondsPerBeat(120), 0.5);
});

test('compás de 2 a 7 tiempos y subdivisiones', () => {
  assert.deepEqual(BEATS_PER_BAR_OPTIONS, [2, 3, 4, 5, 6, 7]);
  assert.equal(subdivisionPerBeat('quarter'), 1);
  assert.equal(subdivisionPerBeat('eighth'), 2);
  assert.equal(subdivisionPerBeat('triplet'), 3);
});

test('pulsos: acento en el primer tiempo y clics suaves entre tiempos', () => {
  // 3 tiempos en corcheas: 1 y 2 y 3 y | 1 …
  let p = { beat: 0, sub: 0 };
  const kinds = [pulseKind(p)];
  for (let i = 0; i < 6; i++) {
    p = nextPulse(p, { beatsPerBar: 3, perBeat: 2 });
    kinds.push(pulseKind(p));
  }
  assert.deepEqual(kinds, ['accent', 'sub', 'beat', 'sub', 'beat', 'sub', 'accent']);
  // Si se reduce el compás mientras suena, vuelve al primer tiempo.
  assert.deepEqual(nextPulse({ beat: 5, sub: 0 }, { beatsPerBar: 4, perBeat: 1 }), { beat: 0, sub: 0 });
  // Si se pasa de tresillos a negras, la subdivisión no se queda colgada.
  assert.deepEqual(nextPulse({ beat: 1, sub: 2 }, { beatsPerBar: 4, perBeat: 1 }), { beat: 2, sub: 0 });
});

test('marcar el tempo: media de los últimos 4 intervalos; más de 2 s empieza de cero', () => {
  let state = { taps: [] };
  state = addTap(state.taps, 1000);
  assert.equal(state.bpm, null);
  state = addTap(state.taps, 1500); // 0,5 s → 120 BPM
  assert.equal(state.bpm, 120);
  for (const t of [2000, 2500, 3000, 3500]) state = addTap(state.taps, t);
  assert.equal(state.taps.length, 5);
  assert.equal(state.bpm, 120);
  state = addTap(state.taps, 3500 + TAP_RESET_MS + 1); // pausa larga: empieza de cero
  assert.deepEqual(state, { taps: [3500 + TAP_RESET_MS + 1], bpm: null });
  // Toques muy lentos o muy rápidos quedan dentro del rango.
  assert.equal(addTap([0], 1990).bpm, 30);
  assert.equal(addTap([0], 100).bpm, 240);
});

test('ajustes del metrónomo: valores por defecto y validación', () => {
  assert.deepEqual(normalizeMetronome(), { bpm: 80, beatsPerBar: 4, subdivision: 'quarter' });
  assert.deepEqual(normalizeMetronome({ bpm: 500, beatsPerBar: 9, subdivision: 'x' }), { bpm: 240, beatsPerBar: 4, subdivision: 'quarter' });
  assert.deepEqual(normalizeMetronome({ bpm: 95, beatsPerBar: 3, subdivision: 'triplet' }), { bpm: 95, beatsPerBar: 3, subdivision: 'triplet' });
});
