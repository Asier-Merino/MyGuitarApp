// Indicador de pulsos (BUILD_PLAN 6.6.18 y 6.8): un punto por tiempo del compás; el primero,
// acentuado, en ámbar (y más grande, para no depender solo del color). Se ilumina el que suena.
// Lo usan el Metrónomo y el esquema de pulsos de las fichas (`diagram.type: 'beats'`).

import { h } from './components.js';
import { createMetronome } from '../audio/metronome.js';

/** Fila de puntos. Devuelve el elemento con light(beat) y clear(). */
export function BeatDots(beatsPerBar) {
  const dots = Array.from({ length: beatsPerBar }, (_, i) =>
    h('span', { class: ['beat-dot', i === 0 && 'beat-dot--accent'].filter(Boolean).join(' ') }));
  const el = h('div', { class: 'beat-dots', 'aria-hidden': 'true' }, dots);
  el.light = (beat) => dots.forEach((d, i) => d.classList.toggle('is-on', i === beat));
  el.clear = () => dots.forEach((d) => d.classList.remove('is-on'));
  return el;
}

/**
 * Esquema de pulsos interactivo: al pulsarlo suena el metrónomo y los puntos se iluminan
 * al ritmo; al pulsarlo otra vez (o al cerrar la ficha) se para.
 */
export function BeatsDiagram({ beatsPerBar, bpm }) {
  const dots = BeatDots(beatsPerBar);
  const status = h('span', { class: 'beats-diagram__hint' }, `${bpm} BPM · toca para oírlo`);
  const btn = h('button', { type: 'button', class: 'beats-diagram', 'aria-pressed': 'false', 'aria-label': `Pulso a ${bpm} BPM: tocar o parar` }, dots, status);
  const metronome = createMetronome({
    onPulse: ({ beat, kind }) => {
      if (!btn.isConnected) { metronome.stop(); return; }
      if (kind !== 'sub') dots.light(beat);
    },
    onStop: () => { dots.clear(); btn.setAttribute('aria-pressed', 'false'); },
  });
  metronome.set({ bpm, beatsPerBar, subdivision: 'quarter' });
  btn.addEventListener('click', () => {
    if (metronome.running) { metronome.stop(); return; }
    if (metronome.start()) btn.setAttribute('aria-pressed', 'true');
  });
  return btn;
}
