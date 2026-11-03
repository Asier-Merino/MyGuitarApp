// Módulo Oído (BUILD_PLAN 8, Fase 4), sin DOM: notas e intervalos que suenan en cada
// pregunta, calculados por MIDI con la teoría, y el plan de lo que suena (qué nota, cuándo
// y con qué volumen). El audio solo programa ese plan (audio/synth.js, playEvents).

import { mod12, intervalInfo } from './theory.js';
import { midiAt, STRINGS } from './fretboard-model.js';

/**
 * Registro de la guitarra en afinación estándar, del traste 0 al 12: de la 6ª cuerda al aire
 * (Mi grave, MIDI 40) a la 1ª en el traste 12 (Mi aguda, MIDI 76). Las notas de las preguntas
 * de oído caen siempre aquí, para que suenen como una guitarra.
 */
export const EAR_RANGE = Object.freeze({ low: 40, high: 76 });

/** Separación entre las dos notas de una pareja (segundos) y lo que dura la última. */
export const MELODIC_GAP = 0.9;
export const NOTE_TAIL = 1.4;
/** Rasgueo lento (Básico): segundos entre cuerda y cuerda. El normal es de 25 ms. */
export const SLOW_STRUM_SPACING = 0.08;
export const STRUM_SPACING = 0.025;
/** Arpegio: segundos entre notas. */
export const ARPEGGIO_GAP = 0.3;
/** En "arpegiado y después rasgueado": pausa entre el arpegio y el rasgueo. */
export const ARPEGGIO_TO_STRUM = 0.7;
/** Volumen de cada cuerda en un acorde (para que seis a la vez no saturen). */
export const CHORD_GAIN = 0.45;
export const ARPEGGIO_GAIN = 0.8;

/**
 * Plan de sonido: { events: [{ midi, at (s desde el inicio), gain }], seconds (lo que dura) }.
 * Los acordes se tocan de la cuerda grave a la aguda (rasgueo hacia abajo).
 */
export function chordSound(midis, mode) {
  if (!midis.length) throw new Error('Un acorde necesita notas');
  const events = [];
  const strumAt = (start, spacing) => midis.forEach((midi, i) => events.push({ midi, at: start + i * spacing, gain: CHORD_GAIN }));
  const arpeggioAt = (start) => midis.forEach((midi, i) => events.push({ midi, at: start + i * ARPEGGIO_GAP, gain: ARPEGGIO_GAIN }));
  if (mode === 'strum-slow') strumAt(0, SLOW_STRUM_SPACING);
  else if (mode === 'strum') strumAt(0, STRUM_SPACING);
  else if (mode === 'arpeggio') arpeggioAt(0);
  else if (mode === 'arpeggio-strum') {
    arpeggioAt(0);
    strumAt((midis.length - 1) * ARPEGGIO_GAP + ARPEGGIO_TO_STRUM, STRUM_SPACING);
  } else throw new Error(`Forma de tocar el acorde desconocida: ${mode}`);
  return { events, seconds: Math.max(...events.map((e) => e.at)) + NOTE_TAIL };
}

/** Plan de sonido de unas notas una detrás de otra (intervalo melódico, o una sola nota). */
export function melodicSound(midis) {
  const events = midis.map((midi, i) => ({ midi, at: i * MELODIC_GAP, gain: 1 }));
  return { events, seconds: (midis.length - 1) * MELODIC_GAP + NOTE_TAIL };
}

/**
 * Elige la respuesta sin que la misma salga 3 veces seguidas: si las dos últimas respuestas
 * de la ronda (`recent`) son iguales, esa queda fuera de los candidatos (si hay otros).
 */
export function withoutStreak(candidates, recent = [], keyOf = (x) => x) {
  if (recent.length < 2) return candidates;
  const [a, b] = recent.slice(-2);
  if (a !== b) return candidates;
  const rest = candidates.filter((c) => keyOf(c) !== a);
  return rest.length ? rest : candidates;
}

/** Notas MIDI de partida posibles para un salto de `semitones` hacia arriba o hacia abajo. */
export function startNotes(semitones, direction) {
  const list = [];
  for (let midi = EAR_RANGE.low; midi <= EAR_RANGE.high; midi++) {
    const other = direction === 'down' ? midi - semitones : midi + semitones;
    if (other >= EAR_RANGE.low && other <= EAR_RANGE.high) list.push(midi);
  }
  return list;
}

/**
 * Pareja de notas: { first, second, semitones, direction: 'up' | 'down' }. La segunda está
 * `semitones` más aguda ('up') o más grave ('down') que la primera, y las dos en EAR_RANGE.
 */
export function notePair(semitones, direction, rng) {
  if (!Number.isInteger(semitones) || semitones < 1 || semitones > 12) throw new RangeError(`Salto no válido: ${semitones}`);
  const first = rng.pick(startNotes(semitones, direction));
  const second = direction === 'down' ? first - semitones : first + semitones;
  return { first, second, semitones, direction };
}

/** Nombre del intervalo de la tabla 4.3 ("3ª mayor"). */
export const intervalName = (semitones) => intervalInfo(semitones).name;

/** Nombre corto, para los botones: sin el paréntesis («Tritono»). */
export const intervalShortName = (semitones) => intervalName(semitones).replace(/ \(.*\)$/, '');

/**
 * Dónde se tocan las dos notas de una pareja en una misma cuerda (para enseñarla en el
 * mástil): la cuerda más aguda en la que cabe la más grave, sin pasar del traste 16.
 * Devuelve { string, low: { fret, midi }, high: { fret, midi } } con el MIDI comprobado.
 */
export function pairOnOneString(a, b, tuning) {
  const lowMidi = Math.min(a, b);
  const highMidi = Math.max(a, b);
  const string = [...STRINGS].find((s) => tuning[s] <= lowMidi && highMidi - tuning[s] <= 16);
  if (!string) throw new RangeError(`La pareja ${a}–${b} no cabe en una cuerda`);
  const low = { fret: lowMidi - tuning[string], midi: lowMidi };
  const high = { fret: highMidi - tuning[string], midi: highMidi };
  if (midiAt(string, low.fret, tuning) !== lowMidi || midiAt(string, high.fret, tuning) !== highMidi) throw new Error('Pareja mal colocada');
  return { string, low, high };
}

/**
 * Todas las posiciones (cuerda, traste) en las que suena un MIDI exacto en un rango de
 * trastes, de la 6ª cuerda a la 1ª: son la misma nota exacta (unísonos).
 */
export function positionsOfMidi(midi, { fromFret = 0, toFret = 12, tuning }) {
  return [6, 5, 4, 3, 2, 1]
    .map((string) => ({ string, fret: midi - tuning[string] }))
    .filter((p) => p.fret >= fromFret && p.fret <= toFret);
}

/** Pitch class de un MIDI (para la etiqueta de los puntos). */
export const pcOf = (midi) => mod12(midi);
