import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCountdown } from '../js/engine/countdown.js';

function clock() {
  let t = 0;
  let fn = null;
  return {
    now: () => t,
    setTimer: (f) => { fn = f; return 1; },
    clearTimer: () => { fn = null; },
    advance(ms) { for (let i = 0; i < ms; i += 100) { t += 100; fn?.(); } },
  };
}

test('cuenta atrás: termina a su hora y la pausa no cuenta', () => {
  const c = clock();
  let done = 0;
  const ticks = [];
  const cd = createCountdown({ ms: 1000, onTick: (r) => ticks.push(r), onDone: () => { done += 1; }, ...c });
  cd.start();
  c.advance(400);
  cd.pause();
  c.advance(5000); // en pausa no avanza
  assert.equal(cd.remaining, 600);
  assert.equal(done, 0);
  cd.start();
  c.advance(600);
  assert.equal(done, 1);
  assert.equal(cd.finished, true);
  c.advance(1000);
  assert.equal(done, 1, 'onDone solo una vez');
  assert.equal(ticks[0], 1000);
});

test('cancel para sin llamar a onDone; cronómetro sin fin con ms = null', () => {
  const c = clock();
  let done = false;
  const cd = createCountdown({ ms: 500, onDone: () => { done = true; }, ...c });
  cd.start();
  cd.cancel();
  c.advance(1000);
  assert.equal(done, false);

  const up = createCountdown({ ms: null, ...c });
  up.start();
  c.advance(3000);
  assert.equal(up.elapsed, 3000);
  assert.equal(up.remaining, null);
  up.pause();
  c.advance(1000);
  assert.equal(up.elapsed, 3000);
});
