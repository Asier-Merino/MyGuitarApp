// Reproductor de patrones de rasgueo (BUILD_PLAN 5.6 y Fase 3): toca un patrón de 8 casillas
// con un acorde, sobre el reloj del audio y con el planificador con lookahead. Los golpes
// abajo suenan de la cuerda grave a la aguda; los de arriba, solo en las cuerdas agudas.
// Los acentos suenan más fuertes y el swing retrasa cada "y" (proporción 2:1).

import { createScheduler } from './scheduler.js';
import { getAudio } from './context.js';
import { createStrummer } from './synth.js';
import { click } from './metronome.js';
import { eighthTime, secondsPerBeat } from '../core/rhythm.js';
import { STRUM_CELLS } from '../data/strum-patterns.js';
import { settings } from '../state.js';

/**
 * Toca `bars` compases del patrón con el acorde (MIDI de grave a agudo). Con `clicks`, suena
 * también el clic del metrónomo en cada tiempo. onCell(index) se llama al sonar cada casilla
 * (también las vacías); onEnd() al terminar. Devuelve la función que lo para (o null).
 */
export function playStrumPattern({ pattern, midis, bpm, bars = 2, clicks = true, onCell, onEnd }) {
  const audio = getAudio();
  if (!audio) return null;
  const { ctx, master } = audio;
  const strummer = createStrummer();
  const timers = new Set();
  const spb = secondsPerBeat(bpm);
  let cell = 0;
  let barStart = null;
  let stopped = false;
  const total = bars * STRUM_CELLS;

  const later = (time, fn) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, Math.max(0, (time - ctx.currentTime) * 1000));
    timers.add(id);
  };

  const scheduler = createScheduler({
    now: () => ctx.currentTime,
    onEvent: (time) => {
      if (cell >= total) {
        later(time, () => { if (!stopped) { stopped = true; strummer.stop(); onEnd?.(); } });
        return null;
      }
      const i = cell % STRUM_CELLS;
      if (i === 0) barStart = time;
      const c = pattern.cells[i];
      if (c !== '-') strummer.hit(midis, c === 'D' ? 'down' : 'up', { when: time, accent: pattern.accents.includes(i) });
      if (clicks && i % 2 === 0 && settings.get('sound')) click(ctx, master, time, i === 0 ? 'accent' : 'beat');
      const index = i;
      later(time, () => onCell?.(index));
      cell += 1;
      const next = cell % STRUM_CELLS;
      return next === 0 ? barStart + 4 * spb : barStart + eighthTime(next, { swing: pattern.swing }) * spb;
    },
  });
  scheduler.start(ctx.currentTime + 0.08);
  return () => {
    if (stopped) return;
    stopped = true;
    scheduler.stop();
    timers.forEach(clearTimeout);
    strummer.stop();
    onEnd?.();
  };
}
