// Piezas comunes de los ejercicios de Oído (BUILD_PLAN 8, Fase 4), sin DOM: textos de
// semitonos y trastes, y la figura con dos notas en una misma cuerda.

import { pairOnOneString, pcOf } from '../../core/ear.js';
import { UI_TEXTS } from '../../data/concepts.js';

/** "1 semitono", "4 semitonos". */
export const semitonesText = (n) => `${n} ${n === 1 ? 'semitono' : 'semitonos'}`;
/** "1 traste", "4 trastes". */
export const fretsText = (n) => `${n} ${n === 1 ? 'traste' : 'trastes'}`;

/**
 * Las dos notas de una pareja en una misma cuerda, en un mástil pequeño: la primera con un
 * «1» en ámbar y la segunda con un «2» en gris, con su leyenda.
 */
export function pairFigure(first, second, ctx, tuning) {
  const { string, low, high } = pairOnOneString(first, second, tuning);
  const [a, b] = first <= second ? [low, high] : [high, low];
  return [
    ctx.fretboard({
      dense: true,
      fromFret: 0,
      toFret: Math.max(12, high.fret),
      markers: [
        { string, fret: a.fret, pc: pcOf(a.midi), text: '1', color: 'amber' },
        { string, fret: b.fret, pc: pcOf(b.midi), text: '2', color: 'neutral' },
      ],
    }),
    ctx.text(UI_TEXTS.ear.pairLegend, 'practice__legend'),
  ];
}
