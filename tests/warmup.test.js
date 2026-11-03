// Calentamiento cromático (Fase 3): un dedo por traste, ida y vuelta en espejo, araña y subida de tempo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  warmupOutward, warmupLap, WARMUP_LEVELS, WARMUP_VARIANTS, lapBeats, warmupBpm, warmupRecordKey, RAMP_STEP, SLOW_DOWN_STEP,
} from '../js/core/warmup.js';
import { rampedBpm } from '../js/core/rhythm.js';

const fmt = (notes) => notes.map((n) => `${n.string}:${n.fret}`).join(' ');

test('un dedo por traste: traste = posición + dedo − 1, en las dos posiciones', () => {
  for (const v of WARMUP_VARIANTS) {
    for (const pos of [1, 5]) {
      for (const n of warmupLap(v.id, pos)) {
        assert.equal(n.fret, pos + n.finger - 1, `${v.id}@${pos}`);
        assert.ok(n.finger >= 1 && n.finger <= 4);
      }
    }
  }
  assert.throws(() => warmupOutward('1234', 3));
  assert.throws(() => warmupOutward('nada', 1));
});

test('la ida va de la 6ª cuerda a la 1ª con los 4 dedos en cada cuerda, en el orden de la variante', () => {
  const out = warmupOutward('1234', 1);
  assert.equal(out.length, 24);
  assert.deepEqual([...new Set(out.map((n) => n.string))], [6, 5, 4, 3, 2, 1]);
  assert.equal(fmt(out.slice(0, 4)), '6:1 6:2 6:3 6:4');
  assert.deepEqual(warmupOutward('4321', 5).slice(0, 4).map((n) => n.finger), [4, 3, 2, 1]);
  assert.deepEqual(warmupOutward('1324', 5).slice(0, 4).map((n) => n.fret), [5, 7, 6, 8]);
});

test('vuelta en espejo: de la 1ª a la 6ª con los dedos al revés (1-2-3-4 vuelve en 4-3-2-1)', () => {
  const lap = warmupLap('1234', 1);
  assert.equal(lap.length, 48);
  const back = lap.slice(24);
  assert.deepEqual([...new Set(back.map((n) => n.string))], [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(back.slice(0, 4).map((n) => n.finger), [4, 3, 2, 1]);
  assert.deepEqual(warmupLap('1324', 1).slice(24, 28).map((n) => n.finger), [4, 2, 3, 1]);
  assert.deepEqual(warmupLap('4321', 1).slice(24, 28).map((n) => n.finger), [1, 2, 3, 4]);
});

test('araña: dedos 1 y 3 en una cuerda y 2 y 4 en la de al lado, de dos en dos cuerdas', () => {
  const out = warmupOutward('spider', 1);
  assert.equal(fmt(out.slice(0, 4)), '6:1 5:2 6:3 5:4');
  assert.equal(fmt(out.slice(-4)), '2:1 1:2 2:3 1:4');
  assert.equal(out.length, 20); // 5 parejas
  for (let i = 0; i < out.length; i += 4) {
    const [a, b, c, d] = out.slice(i, i + 4);
    assert.equal(a.string, c.string);
    assert.equal(b.string, d.string);
    assert.equal(a.string - b.string, 1); // cuerdas vecinas
  }
  const back = warmupLap('spider', 1).slice(20, 24);
  assert.equal(fmt(back), '1:4 2:3 1:2 2:1');
});

test('niveles: notas por tiempo, variantes y tempo inicial de la tabla', () => {
  const { basico, intermedio, avanzado } = WARMUP_LEVELS;
  assert.deepEqual([basico.notesPerBeat, intermedio.notesPerBeat, avanzado.notesPerBeat], [1, 2, 4]);
  assert.deepEqual([basico.startBpm, intermedio.startBpm, avanzado.startBpm], [60, 70, 80]);
  assert.deepEqual(basico.variants, ['1234']);
  assert.deepEqual(intermedio.variants, ['1234', '4321', '1324']);
  assert.deepEqual(avanzado.variants, ['1234', '4321', '1324', 'spider']);
});

test('subida de tempo: +4 BPM cada vuelta en Básico y cada 2 vueltas en el resto; "Bajar" resta 8', () => {
  assert.equal(RAMP_STEP, 4);
  assert.equal(SLOW_DOWN_STEP, 8);
  // Básico: negras, 48 notas → una vuelta dura 48 tiempos (48 s a 60 BPM).
  assert.equal(lapBeats('1234', 1), 48);
  assert.equal(warmupBpm('basico', '1234', 47), 60);
  assert.equal(warmupBpm('basico', '1234', 48), 64);
  assert.equal(warmupBpm('basico', '1234', 96), 68);
  // Intermedio: corcheas, 2 vueltas = 48 tiempos.
  assert.equal(warmupBpm('intermedio', '1234', 47), 70);
  assert.equal(warmupBpm('intermedio', '1234', 48), 74);
  // Avanzado con la araña: 40 notas en semicorcheas = 10 tiempos por vuelta, 20 cada 2.
  assert.equal(lapBeats('spider', 4), 10);
  assert.equal(warmupBpm('avanzado', 'spider', 20), 84);
  // Nunca pasa de 240.
  assert.equal(rampedBpm(236, 1000, { everyBeats: 1, step: 4 }), 240);
});

test('récord de tempo por variante y nivel', () => {
  assert.notEqual(warmupRecordKey('1234', 'basico'), warmupRecordKey('1234', 'avanzado'));
  assert.notEqual(warmupRecordKey('1234', 'avanzado'), warmupRecordKey('spider', 'avanzado'));
});
