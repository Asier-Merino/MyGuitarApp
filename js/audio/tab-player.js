// Reproductor de tablatura (BUILD_PLAN 6.7): programa todas las notas sobre el reloj del
// audio con el tempo y la velocidad elegidos (50 %, 75 % o 100 %: cambia el tempo, no la
// altura, porque la síntesis se programa con otro tempo) y avisa de la nota que suena para
// moverla con el cursor. Cada técnica suena como se describe en js/core/tab.js y synth.js.

import { tabTimeline, pitchCurve, eventTimes } from '../core/tab.js';
import { playPluck, playHarmonic, playDeadNote, audioNow } from './synth.js';

const GHOST_GAIN = 0.3;
const LEAD_S = 0.08;

/**
 * Toca una tablatura. onStep(eventIndex) cuando empieza cada evento; onEnd() al terminar.
 * Devuelve la función que la para (o null si no hay sonido).
 */
export function playTab(tab, { bpm, speed = 1, tuning, onStep, onEnd }) {
  const now = audioNow();
  if (now === null) return null;
  const t0 = now + LEAD_S;
  const stops = [];
  const timers = [];
  for (const p of tabTimeline(tab, { bpm, speed, tuning })) {
    const when = t0 + p.start;
    let stop = null;
    if (p.dead) stop = playDeadNote({ when });
    else if (p.harmonic) stop = playHarmonic({ midi: p.midi, when, dur: p.dur, letRing: !p.palmMute });
    else {
      stop = playPluck({
        midi: p.midi,
        when,
        dur: p.dur,
        curve: pitchCurve(p),
        gain: p.ghost ? GHOST_GAIN : 1,
        palmMute: p.palmMute,
        letRing: p.letRing,
        fadeOut: p.segments.at(-1).tech?.type === 'slide-out',
      });
    }
    if (stop) stops.push(stop);
  }
  const eighth = 60 / (bpm * speed) / 2;
  const times = eventTimes(tab);
  times.forEach((t, i) => timers.push(setTimeout(() => onStep?.(i), (LEAD_S + t * eighth) * 1000)));
  const total = times.at(-1) + tab.events.at(-1).dur;
  let done = false;
  timers.push(setTimeout(() => { done = true; onEnd?.(); }, (LEAD_S + total * eighth) * 1000 + 150));
  return () => {
    timers.forEach(clearTimeout);
    stops.forEach((s) => s());
    if (!done) { done = true; onEnd?.(); }
  };
}

/** Una sola nota de la tablatura (al tocar un número): con su técnica, a 80 BPM. */
export function playTabEvent(tab, index, { tuning }) {
  const single = { beatsPerBar: tab.beatsPerBar, events: [{ ...tab.events[index], notes: tab.events[index].notes.map((n) => {
    // Un ligado o deslizamiento sin la nota siguiente suena como la nota sola.
    const link = ['hammer', 'pull', 'slide'].includes(n.tech?.type);
    return link ? { string: n.string, fret: n.fret } : n;
  }) }], spans: (tab.spans ?? []).filter((s) => index >= s.from && index <= s.to).map((s) => ({ ...s, from: 0, to: 0 })) };
  return playTab(single, { bpm: 80, tuning });
}
