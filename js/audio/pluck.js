// Síntesis de cuerda pulsada Karplus-Strong (sin Web Audio: solo calcula las muestras).
// Para que la nota esté bien afinada (se usa para afinar de oído), la parte fraccionaria
// del periodo se corrige con un filtro paso todo (Jaffe y Smith).

import { createRng } from '../core/random.js';

/**
 * Devuelve un Float32Array con la nota.
 * opts: seconds (duración), decay (pérdida por vuelta, ≈0,996), brightness (0–1, color del ataque), seed.
 */
export function renderPluck(freq, sampleRate, { seconds = 2, decay = 0.996, brightness = 0.5, seed = 1 } = {}) {
  const length = Math.round(seconds * sampleRate);
  const out = new Float32Array(length);
  const period = sampleRate / freq;

  // Retardo total del lazo = N (línea) + 0,5 (promedio) + d (paso todo) = periodo.
  let n = Math.floor(period - 0.5);
  let d = period - 0.5 - n;
  if (d < 0.1) { n -= 1; d += 1; } // el paso todo es más estable con d en [0,1; 1,1)
  const c = (1 - d) / (1 + d);

  // Excitación: ruido suavizado (menos brillo = ataque más suave).
  const rng = createRng(seed);
  const line = new Float32Array(n);
  let smooth = 0;
  for (let i = 0; i < n; i++) {
    const noise = rng.next() * 2 - 1;
    smooth += (noise - smooth) * (0.2 + 0.8 * brightness);
    line[i] = smooth;
  }
  // Sin componente continua, para que no haya un "golpe" al empezar.
  const mean = line.reduce((s, v) => s + v, 0) / n;
  for (let i = 0; i < n; i++) line[i] -= mean;

  let idx = 0;
  let prev = 0;
  let apIn = 0;
  let apOut = 0;
  for (let i = 0; i < length; i++) {
    const current = line[idx];
    out[i] = current;
    const avg = 0.5 * (current + prev) * decay;
    const ap = c * avg + apIn - c * apOut;
    apIn = avg;
    apOut = ap;
    line[idx] = ap;
    prev = current;
    idx = idx + 1 === n ? 0 : idx + 1;
  }

  // Volumen normalizado y final suave (50 ms) para que no chasquee al cortar.
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? 0.8 / peak : 0;
  const fade = Math.min(length, Math.round(0.05 * sampleRate));
  for (let i = 0; i < length; i++) {
    const tail = i >= length - fade ? (length - 1 - i) / fade : 1;
    out[i] *= gain * tail;
  }
  return out;
}
