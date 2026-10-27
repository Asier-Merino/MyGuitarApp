import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/core/random.js';

test('misma semilla, misma secuencia', () => {
  const a = createRng(42);
  const b = createRng(42);
  const seqA = Array.from({ length: 20 }, () => a.next());
  const seqB = Array.from({ length: 20 }, () => b.next());
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, Array.from({ length: 20 }, createRng(43).next));
});

test('next en [0, 1) e int en el rango incluido', () => {
  const rng = createRng(1);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const x = rng.next();
    assert.ok(x >= 0 && x < 1);
    const n = rng.int(3, 7);
    assert.ok(Number.isInteger(n) && n >= 3 && n <= 7);
    seen.add(n);
  }
  assert.deepEqual([...seen].sort(), [3, 4, 5, 6, 7]);
  assert.throws(() => rng.int(5, 1));
});

test('sin semilla funciona', () => {
  const rng = createRng();
  const x = rng.next();
  assert.ok(x >= 0 && x < 1);
});

test('pick y sample', () => {
  const rng = createRng(7);
  const items = ['a', 'b', 'c'];
  for (let i = 0; i < 50; i++) assert.ok(items.includes(rng.pick(items)));
  assert.throws(() => rng.pick([]));
  const s = rng.sample([1, 2, 3, 4, 5], 3);
  assert.equal(s.length, 3);
  assert.equal(new Set(s).size, 3);
});

test('shuffle es una permutación y no modifica el original', () => {
  const rng = createRng(3);
  const original = Array.from({ length: 12 }, (_, i) => i);
  const copy = [...original];
  const shuffled = rng.shuffle(original);
  assert.deepEqual(original, copy);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), original);
  assert.notDeepEqual(shuffled, original);
});

test('weightedPick respeta los pesos', () => {
  const rng = createRng(99);
  const counts = { a: 0, b: 0, c: 0 };
  for (let i = 0; i < 10000; i++) counts[rng.weightedPick(['a', 'b', 'c'], [1, 3, 0])] += 1;
  assert.equal(counts.c, 0);
  assert.ok(counts.b / counts.a > 2.5 && counts.b / counts.a < 3.5);
  // Pesos como función
  assert.equal(rng.weightedPick([1, 2, 3], (x) => (x === 2 ? 1 : 0)), 2);
  assert.throws(() => rng.weightedIndex([0, 0]));
  assert.throws(() => rng.weightedPick([1, 2], [1]));
});
