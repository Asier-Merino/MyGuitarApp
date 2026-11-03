// Voz y audio en el iPhone (arreglo de la v0.3.2): la voz se desbloquea una sola vez por
// sesión, y cada locución, al acabar o al cortarla, devuelve el sonido a la app.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Voz del sistema simulada: guarda lo que se dice y deja disparar el final de cada locución.
const spoken = [];
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
globalThis.speechSynthesis = {
  speak: (u) => spoken.push(u),
  cancel: () => {},
  getVoices: () => [],
  addEventListener: () => {},
};
const { primeSpeech, speak } = await import('../js/engine/speech.js');

test('la voz se desbloquea una sola vez por sesión (no en cada ronda)', () => {
  primeSpeech();
  primeSpeech();
  primeSpeech();
  assert.equal(spoken.filter((u) => u.text === ' ').length, 1);
});

test('cada locución avisa al terminar o fallar, para devolver el sonido a la app', () => {
  assert.equal(speak('Sol'), true);
  const u = spoken.at(-1);
  assert.equal(u.text, 'Sol');
  assert.equal(typeof u.onend, 'function');
  assert.equal(typeof u.onerror, 'function');
  // Sin contexto de audio (en Node) no falla.
  u.onend();
  u.onerror();
});
