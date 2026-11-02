import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordResult, failRate, weightOf, pickWeighted, RECENT_RESULTS, RECENT_MS, UNSEEN_WEIGHT } from '../js/core/stats.js';
import { createRng } from '../js/core/random.js';

const NOW = 1_800_000_000_000;

test('recordResult guarda acierto, tiempo y fecha', () => {
  let e = recordResult(undefined, { correct: true, ms: 2000, now: NOW });
  assert.deepEqual(e, { n: 1, w: 0, ms: 2000, r: '1', t: NOW });
  e = recordResult(e, { correct: false, ms: 1500.4, now: NOW + 1 });
  assert.deepEqual(e, { n: 2, w: 1, ms: 3500, r: '10', t: NOW + 1 });
  for (let i = 0; i < 20; i++) e = recordResult(e, { correct: true, now: NOW });
  assert.equal(e.r.length, RECENT_RESULTS);
  assert.equal(e.n, 22);
});

test('pesos (7.4): nunca vista 1,5; 1 + 3 × fallo + 0,5 si no se ve hace tiempo', () => {
  assert.equal(weightOf(undefined, NOW), UNSEEN_WEIGHT);
  assert.equal(UNSEEN_WEIGHT, 1.5);
  assert.equal(weightOf({ r: '1111', t: NOW }, NOW), 1);
  assert.equal(weightOf({ r: '1100', t: NOW }, NOW), 2.5);
  assert.equal(weightOf({ r: '0000', t: NOW }, NOW), 4);
  assert.equal(weightOf({ r: '1111', t: NOW - RECENT_MS - 1 }, NOW), 1.5);
  assert.equal(failRate({ r: '0110' }), 0.5);
  assert.equal(failRate({}), null);
});

test('pickWeighted: lo que más se falla sale más y no repite la anterior', () => {
  const rng = createRng(7);
  const stats = { a: { r: '0000000000', t: NOW }, b: { r: '1111111111', t: NOW } };
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 2000; i++) counts[pickWeighted(['a', 'b'], { keyOf: (x) => x, stats, rng, now: NOW })] += 1;
  assert.ok(counts.a > counts.b * 3, JSON.stringify(counts)); // pesos 4 y 1
  for (let i = 0; i < 50; i++) assert.equal(pickWeighted(['a', 'b'], { keyOf: (x) => x, stats, rng, avoidKey: 'a' }), 'b');
  // Con un solo candidato se permite repetir.
  assert.equal(pickWeighted(['a'], { keyOf: (x) => x, rng, avoidKey: 'a' }), 'a');
});
