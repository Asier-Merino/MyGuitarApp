// Tablatura (BUILD_PLAN 6.7): símbolos, texto plano, colocación, adornos y sonido de cada técnica.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tabFromNotes, validateTab, plainText, plainNote, layoutTab, tabTimeline, pitchCurve, soundingMidi,
  NATURAL_HARMONICS, BEND_AMOUNTS, bendText, TECH_TYPES, countLabel, eventTimes,
} from '../js/core/tab.js';
import { STANDARD_TUNING } from '../js/core/fretboard-model.js';

const one = (notes, opts) => tabFromNotes(notes, opts);
const kinds = (tab) => layoutTab(tab).lines.flatMap((l) => l.decorations.map((d) => d.kind));

/** Un ejemplo de cada símbolo de la tabla 6.7, con su forma en texto plano. */
const EXAMPLES = [
  ['h', one([{ string: 3, fret: 5, dur: 1, tech: { type: 'hammer' } }, { string: 3, fret: 7, dur: 1 }]), '5h7', 'link'],
  ['p', one([{ string: 3, fret: 7, dur: 1, tech: { type: 'pull' } }, { string: 3, fret: 5, dur: 1 }]), '7p5', 'link'],
  ['/', one([{ string: 3, fret: 5, dur: 1, tech: { type: 'slide' } }, { string: 3, fret: 7, dur: 1 }]), '5/7', 'link'],
  ['\\', one([{ string: 3, fret: 7, dur: 1, tech: { type: 'slide' } }, { string: 3, fret: 5, dur: 1 }]), '7\\5', 'link'],
  ['/7', one([{ string: 3, fret: 7, dur: 2, tech: { type: 'slide-in', from: 'below' } }]), '/7', 'slide-in'],
  ['7\\', one([{ string: 3, fret: 7, dur: 2, tech: { type: 'slide-out', to: 'down' } }]), '7\\', 'slide-out'],
  ['b', one([{ string: 3, fret: 7, dur: 2, tech: { type: 'bend', amount: 1 } }]), '7b9', 'bend'],
  ['r', one([{ string: 3, fret: 7, dur: 2, tech: { type: 'bend', amount: 1, release: true } }]), '7b9r7', 'bend'],
  ['pb', one([{ string: 3, fret: 7, dur: 2, tech: { type: 'prebend', amount: 1, release: true } }]), '7pb9r7', 'bend'],
  ['~', one([{ string: 2, fret: 7, dur: 2, tech: { type: 'vibrato' } }]), '7~', 'vibrato'],
  ['x', one([{ string: 4, fret: 0, dur: 1, tech: { type: 'dead' } }]), 'x', null],
  ['( )', one([{ string: 3, fret: 7, dur: 1, tech: { type: 'ghost' } }]), '(7)', null],
  ['PM', one([{ string: 6, fret: 0, dur: 1 }, { string: 6, fret: 0, dur: 1 }], { spans: [{ type: 'pm', from: 0, to: 1 }] }), 'PM: 0 0', 'span'],
  ['<12>', one([{ string: 3, fret: 12, dur: 2, tech: { type: 'harmonic' } }]), '<12>', null],
  ['AH', one([{ string: 3, fret: 7, dur: 2, tech: { type: 'ah' } }]), '7 AH', 'label'],
  ['PH', one([{ string: 3, fret: 5, dur: 2, tech: { type: 'ph' } }]), '5 PH', 'label'],
  ['t', one([{ string: 1, fret: 12, dur: 1, tech: { type: 'tap' } }]), '12t', 'label'],
  ['tr', one([{ string: 3, fret: 5, dur: 4, tech: { type: 'trill', to: 7 } }]), '5tr7', 'trill'],
  ['let ring', one([{ string: 4, fret: 0, dur: 1 }, { string: 3, fret: 2, dur: 1 }], { spans: [{ type: 'letring', from: 0, to: 1 }] }), 'let ring: 0 2', 'span'],
];

test('cada símbolo de la tabla 6.7 se valida, se dibuja sin errores y da su forma en texto plano', () => {
  for (const [symbol, tab, text, kind] of EXAMPLES) {
    assert.deepEqual(validateTab(tab), [], symbol);
    assert.equal(plainText(tab), text, symbol);
    const { lines } = layoutTab(tab);
    assert.ok(lines.length >= 1, symbol);
    if (kind) assert.ok(kinds(tab).includes(kind), `${symbol}: falta el adorno ${kind}`);
  }
  // Todas las técnicas tienen un ejemplo.
  const used = new Set(EXAMPLES.flatMap(([, tab]) => tab.events.flatMap((e) => e.notes.map((n) => n.tech?.type)).filter(Boolean)));
  assert.deepEqual([...used].sort(), [...TECH_TYPES].sort());
});

test('ligados y deslizamientos: arco con h o p, diagonal en el deslizamiento', () => {
  const link = (i) => layoutTab(EXAMPLES[i][1]).lines[0].decorations[0];
  assert.equal(link(0).label, 'h');
  assert.equal(link(1).label, 'p');
  assert.equal(link(2).label, null);
  assert.equal(link(2).up, true);
  assert.equal(link(3).up, false);
  assert.ok(link(0).x2 > link(0).x1);
});

test('reglas de las técnicas (5.5): ligado ascendente sube, descendente baja, deslizamiento en la misma cuerda', () => {
  const bad = (notes) => validateTab(one(notes)).length > 0;
  assert.ok(bad([{ string: 3, fret: 7, dur: 1, tech: { type: 'hammer' } }, { string: 3, fret: 5, dur: 1 }]));
  assert.ok(bad([{ string: 3, fret: 5, dur: 1, tech: { type: 'pull' } }, { string: 3, fret: 7, dur: 1 }]));
  assert.ok(bad([{ string: 3, fret: 5, dur: 1, tech: { type: 'slide' } }, { string: 2, fret: 7, dur: 1 }]));
  assert.ok(bad([{ string: 3, fret: 5, dur: 1, tech: { type: 'hammer' } }]));
  assert.ok(bad([{ string: 3, fret: 7, dur: 1, tech: { type: 'bend', amount: 2 } }]));
  assert.ok(bad([{ string: 3, fret: 3, dur: 1, tech: { type: 'harmonic' } }]));
});

test('estiramientos: ½, 1 y 1½ tonos llegan a 1, 2 y 3 trastes más', () => {
  assert.deepEqual(BEND_AMOUNTS.map(bendText), ['½', '1', '1½']);
  assert.equal(plainNote({ string: 3, fret: 7, tech: { type: 'bend', amount: 0.5 } }), '7b8');
  assert.equal(plainNote({ string: 3, fret: 7, tech: { type: 'bend', amount: 1.5 } }), '7b10');
});

test('armónicos naturales: el traste divide la cuerda en n partes y suena 12·log2(n) semitonos más agudo', () => {
  const parts = { 12: 2, 7: 3, 19: 3, 5: 4, 24: 4 };
  for (const [fret, n] of Object.entries(parts)) {
    assert.equal(NATURAL_HARMONICS[fret], Math.round(12 * Math.log2(n)), `traste ${fret}`);
    // El traste está donde la cuerda vibrante mide 1/n (o (n−1)/n): 12·log2(n/(n−1)) o 12·log2(n).
    const at = 12 * Math.log2(n);
    const near = [at, 12 * Math.log2(n / (n - 1))].some((f) => Math.abs(f - Number(fret)) < 0.1);
    assert.ok(near, `traste ${fret}`);
  }
  assert.equal(soundingMidi({ string: 3, fret: 12, tech: { type: 'harmonic' } }, STANDARD_TUNING), 55 + 12);
  assert.equal(soundingMidi({ string: 3, fret: 7, tech: { type: 'ah' } }, STANDARD_TUNING), 55 + 7 + 12);
  assert.equal(soundingMidi({ string: 3, fret: 7, tech: { type: 'dead' } }, STANDARD_TUNING), null);
});

test('ritmo: separación proporcional a la duración, barras de compás y conteo "1 y 2 y"', () => {
  const tab = one(Array.from({ length: 8 }, (_, i) => ({ string: 1, fret: i, dur: 1 })));
  const [line] = layoutTab(tab, { maxWidth: 600 }).lines;
  assert.deepEqual(line.counts.map((c) => c.text), ['1', 'y', '2', 'y', '3', 'y', '4', 'y']);
  const xs = line.columns.map((c) => c.x);
  const gaps = xs.slice(1).map((x, i) => x - xs[i]);
  assert.ok(gaps.every((g) => g === gaps[0]));
  // Una negra ocupa el doble que una corchea.
  const mixed = layoutTab(one([{ string: 1, fret: 0, dur: 2 }, { string: 1, fret: 1, dur: 1 }, { string: 1, fret: 2, dur: 1 }]), { maxWidth: 600 }).lines[0];
  const [a, b, c] = mixed.columns.map((col) => col.x);
  assert.equal(b - a, 2 * (c - b));
  assert.equal(countLabel(0), '1');
  assert.equal(countLabel(3), 'y');
  assert.deepEqual(eventTimes(one([{ string: 1, fret: 0, dur: 2 }, { string: 1, fret: 0, dur: 1 }])), [0, 2]);
});

test('si no cabe, se parte en varias líneas por compases (y por tiempos si un compás no cabe)', () => {
  const bars = one(Array.from({ length: 16 }, (_, i) => ({ string: 2, fret: i % 5, dur: 1 })));
  const { lines } = layoutTab(bars, { maxWidth: 320 });
  assert.equal(lines.length, 2);
  for (const l of lines) assert.ok(l.width <= 320, l.width);
  assert.equal(lines.flatMap((l) => l.columns).length, 16);
  const sixteenths = one(Array.from({ length: 16 }, (_, i) => ({ string: 2, fret: i % 4, dur: 0.5 })));
  const split = layoutTab(sixteenths, { maxWidth: 300 }).lines;
  assert.ok(split.length >= 2);
  for (const l of split) assert.ok(l.width <= 300, l.width);
});

test('sonido: los ligados no se vuelven a pulsar y la curva llega a la nota siguiente', () => {
  const tl = tabTimeline(EXAMPLES[0][1], { bpm: 60, tuning: STANDARD_TUNING });
  assert.equal(tl.length, 1); // 5h7: una sola pulsación
  assert.equal(tl[0].midi, 55 + 5);
  const curve = pitchCurve(tl[0]);
  assert.equal(curve[0], 0);
  assert.equal(curve.at(-1), 2); // del traste 5 al 7
  // Deslizamiento: llega poco a poco (valores intermedios).
  const slide = pitchCurve(tabTimeline(EXAMPLES[2][1], { bpm: 60, tuning: STANDARD_TUNING })[0]);
  assert.ok([...slide].some((v) => v > 0.2 && v < 1.8));
  assert.equal(slide.at(-1), 2);
});

test('sonido: el estiramiento sube los semitonos de su cantidad y al soltarlo vuelve', () => {
  const at = (i) => pitchCurve(tabTimeline(EXAMPLES[i][1], { bpm: 60, tuning: STANDARD_TUNING })[0]);
  const bend = at(6);
  assert.equal(bend[0], 0);
  assert.ok(Math.abs(bend.at(-1) - 2) < 1e-6);
  const release = at(7);
  assert.ok(Math.max(...release) > 1.99);
  assert.ok(Math.abs(release.at(-1)) < 1e-6);
  const pre = at(8);
  assert.equal(pre[0], 2); // ya estirada antes de pulsar
  assert.ok(Math.abs(pre.at(-1)) < 1e-6);
  // Vibrato: oscila sin bajar de la nota y sin pasar de medio tono.
  const vib = at(9);
  assert.ok(Math.min(...vib) >= 0 && Math.max(...vib) <= 0.5 + 1e-6 && Math.max(...vib) > 0.3);
  // Trino: alterna entre su nota y la del trino (2 semitonos).
  const trill = at(17);
  assert.ok(trill.includes(0) && trill.includes(2));
});

test('velocidad 50 % · 75 % · 100 %: cambia el tiempo, no la altura', () => {
  const tab = EXAMPLES[0][1];
  const full = tabTimeline(tab, { bpm: 80, tuning: STANDARD_TUNING })[0];
  const half = tabTimeline(tab, { bpm: 80, speed: 0.5, tuning: STANDARD_TUNING })[0];
  assert.equal(half.midi, full.midi);
  assert.ok(Math.abs(half.dur - 2 * full.dur) < 1e-9);
  const pm = tabTimeline(EXAMPLES[12][1], { bpm: 80, tuning: STANDARD_TUNING });
  assert.ok(pm.every((p) => p.palmMute));
  const ring = tabTimeline(EXAMPLES[18][1], { bpm: 80, tuning: STANDARD_TUNING });
  assert.ok(ring.every((p) => p.letRing));
});
