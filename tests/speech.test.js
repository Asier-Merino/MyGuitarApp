import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speechLang, pickVoice, speak, speechSupported } from '../js/engine/speech.js';
import { spokenName, spell } from '../js/core/notation.js';

test('idioma de la voz según la notación principal', () => {
  assert.equal(speechLang('es'), 'es-ES');
  assert.equal(speechLang('en'), 'en-US');
});

test('elige la voz del idioma exacto, mejor local; si no, otra del mismo idioma', () => {
  const voices = [
    { name: 'US', lang: 'en-US', localService: false },
    { name: 'MX', lang: 'es-MX', localService: true },
    { name: 'ES remota', lang: 'es-ES', localService: false },
    { name: 'ES local', lang: 'es_ES', localService: true },
  ];
  assert.equal(pickVoice(voices, 'es-ES').name, 'ES local');
  assert.equal(pickVoice(voices.slice(0, 2), 'es-ES').name, 'MX');
  assert.equal(pickVoice(voices, 'en-US').name, 'US');
  assert.equal(pickVoice([], 'es-ES'), null);
});

test('nombres hablados: "Fa sostenido", "Si bemol", "F sharp"', () => {
  assert.equal(spokenName(spell(6, 'sharp'), 'es'), 'Fa sostenido');
  assert.equal(spokenName(spell(10, 'flat'), 'es'), 'Si bemol');
  assert.equal(spokenName(spell(6, 'sharp'), 'en'), 'F sharp');
  assert.equal(spokenName(spell(7), 'es'), 'Sol');
});

test('sin voz en el navegador, no falla', () => {
  assert.equal(speechSupported(), false);
  assert.equal(speak('Sol'), false);
});
