import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScheduler, LOOKAHEAD_S, INTERVAL_MS } from '../js/audio/scheduler.js';

function fakeClock() {
  let t = 0;
  let fn = null;
  return {
    now: () => t,
    setTimer: (f, ms) => { fn = f; assert.equal(ms, INTERVAL_MS); return 1; },
    clearTimer: () => { fn = null; },
    advance(seconds, step = INTERVAL_MS / 1000) {
      for (let x = 0; x < seconds - 1e-9; x += step) { t += step; fn?.(); }
    },
    get active() { return fn !== null; },
  };
}

test('programa cada sonido una sola vez, con 100 ms de antelación y a su hora exacta', () => {
  const clock = fakeClock();
  const times = [];
  const s = createScheduler({ ...clock, onEvent: (time) => { times.push(time); return time + 0.5; } });
  assert.equal(LOOKAHEAD_S, 0.1);
  assert.equal(INTERVAL_MS, 25);
  s.start(0.05);
  clock.advance(2);
  // 120 BPM durante 2 s: 0,05 0,55 1,05 1,55 2,05 (este último entra por el lookahead).
  assert.deepEqual(times.map((t) => Number(t.toFixed(3))), [0.05, 0.55, 1.05, 1.55, 2.05]);
  assert.ok(times.every((t, i) => i === 0 || Math.abs(t - times[i - 1] - 0.5) < 1e-9), 'pulso regular');
  s.stop();
  clock.advance(1);
  assert.equal(times.length, 5);
  assert.equal(s.running, false);
  assert.equal(clock.active, false);
});

test('al volver de segundo plano no suelta de golpe los clics perdidos', () => {
  const clock = fakeClock();
  const times = [];
  const s = createScheduler({ ...clock, onEvent: (time) => { times.push(time); return time + 0.5; } });
  s.start(0.05);
  clock.advance(0.5);
  const before = times.length;
  // 10 s sin que se ejecute el temporizador (pantalla bloqueada).
  clock.advance(10, 10);
  assert.ok(times.length - before <= 1, `${times.length - before} clics de golpe`);
  clock.advance(1);
  const last = times.slice(-2);
  assert.equal(Number((last[1] - last[0]).toFixed(3)), 0.5);
});

test('onEvent puede pararlo devolviendo null', () => {
  const clock = fakeClock();
  let n = 0;
  const s = createScheduler({ ...clock, onEvent: (time) => (++n < 3 ? time + 0.1 : null) });
  s.start(0);
  clock.advance(1);
  assert.equal(n, 3);
  assert.equal(s.running, false);
});
