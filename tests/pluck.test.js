// La cuerda sintetizada suena a la frecuencia correcta (se usa para afinar de oído).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPluck } from '../js/audio/pluck.js';
import { midiToFreq } from '../js/core/theory.js';
import { TUNINGS } from '../js/data/tunings.js';

/** Frecuencia medida por autocorrelación, con interpolación parabólica. */
function measure(samples, sampleRate, expected) {
  const start = Math.round(0.2 * sampleRate);
  const len = Math.round(0.4 * sampleRate);
  const p = sampleRate / expected;
  const corr = (lag) => {
    let s = 0;
    for (let i = start; i < start + len; i++) s += samples[i] * samples[i + lag];
    return s;
  };
  let best = 0;
  let bestLag = 0;
  for (let lag = Math.floor(p * 0.9); lag <= Math.ceil(p * 1.1); lag++) {
    const v = corr(lag);
    if (v > best) { best = v; bestLag = lag; }
  }
  const a = corr(bestLag - 1);
  const b = corr(bestLag);
  const c = corr(bestLag + 1);
  const shift = (a - c) / (2 * (a - 2 * b + c));
  return sampleRate / (bestLag + shift);
}

const cents = (f, ref) => 1200 * Math.log2(f / ref);

test('todas las cuerdas al aire de las 7 afinaciones, afinadas a menos de 2 cents', () => {
  const midis = new Set(TUNINGS.flatMap((t) => Object.values(t.midi)));
  for (const sampleRate of [44100, 48000]) {
    for (const midi of midis) {
      const f = midiToFreq(midi);
      const got = measure(renderPluck(f, sampleRate, { seconds: 0.8 }), sampleRate, f);
      assert.ok(Math.abs(cents(got, f)) < 2, `MIDI ${midi} a ${sampleRate} Hz: ${cents(got, f).toFixed(2)} cents`);
    }
  }
});

test('la nota decae, no satura y termina en silencio', () => {
  const s = renderPluck(110, 44100, { seconds: 2 });
  const rms = (from, to) => Math.sqrt(s.slice(from, to).reduce((acc, v) => acc + v * v, 0) / (to - from));
  assert.ok(rms(0, 4410) > rms(44100, 48510) * 2);
  assert.ok(s.every((v) => Math.abs(v) <= 0.8 + 1e-6));
  assert.equal(s[s.length - 1], 0);
});
