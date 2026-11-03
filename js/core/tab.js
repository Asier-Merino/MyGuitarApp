// Tablatura (BUILD_PLAN 6.7), sin DOM: datos, forma en texto plano, colocación en líneas
// (con su ritmo, barras de compás y conteo), adornos de cada técnica, línea de tiempo para
// sonar y curva de altura de cada nota (ligados, deslizamientos, estiramientos, vibrato…).
// Lo dibuja js/ui/tab.js y lo hace sonar js/audio/tab-player.js.
//
// Una tablatura: { beatsPerBar = 4, events: [{ notes: [{ string, fret, tech? }], dur }], spans? }
//   dur: duración en corcheas (1 = corchea, 2 = negra, 0,5 = semicorchea).
//   Varias notas en el mismo evento suenan a la vez (la misma columna).
//   spans: [{ type: 'pm' | 'letring', from, to }] índices de evento (incluidos).
// tech de una nota (opcional):
//   { type: 'hammer' | 'pull' | 'slide' }  ligado o deslizamiento hasta la nota siguiente de
//                                          esa cuerda (en el evento siguiente)
//   { type: 'slide-in', from: 'below' | 'above' } entrar deslizando (/7 o \7)
//   { type: 'slide-out', to: 'down' | 'up' }     salir deslizando (7\ o 7/)
//   { type: 'bend', amount, release? }      estiramiento de ½, 1 o 1½ tonos (y soltarlo)
//   { type: 'prebend', amount, release? }   estiramiento previo (y soltarlo)
//   { type: 'vibrato' } · { type: 'dead' } (x) · { type: 'ghost' } ( )
//   { type: 'harmonic' } armónico natural <12> · { type: 'ah' } / { type: 'ph' } armónico
//   artificial / pellizcado · { type: 'tap' } · { type: 'trill', to } trino hasta ese traste

export const LINK_TECHS = Object.freeze(['hammer', 'pull', 'slide']);
export const TECH_TYPES = Object.freeze([
  'hammer', 'pull', 'slide', 'slide-in', 'slide-out', 'bend', 'prebend', 'vibrato',
  'dead', 'ghost', 'harmonic', 'ah', 'ph', 'tap', 'trill',
]);
export const SPAN_TYPES = Object.freeze(['pm', 'letring']);

/** Cantidades de estiramiento, en tonos (1 tono = 2 trastes; en inglés, 1 = *full*). */
export const BEND_AMOUNTS = Object.freeze([0.5, 1, 1.5]);
export const bendText = (amount) => ({ 0.5: '½', 1: '1', 1.5: '1½' })[amount];

/**
 * Armónicos naturales: traste → semitonos sobre la cuerda al aire. En el traste 12 la cuerda
 * se divide en 2 (suena una octava), en el 7 y el 19 en 3 (octava y quinta) y en el 5 y el 24
 * en 4 (dos octavas). tests/tab.test.js lo comprueba con 12·log2(n).
 */
export const NATURAL_HARMONICS = Object.freeze({ 5: 24, 7: 19, 12: 12, 19: 19, 24: 24 });
/** Armónico artificial: se pisa la nota y se roza 12 trastes más allá: suena una octava más aguda. */
export const ARTIFICIAL_HARMONIC_SEMITONES = 12;
/**
 * Armónico pellizcado: suena un armónico agudo que depende del punto en que se pulsa; la app
 * lo imita una octava y una quinta por encima (aproximación, se avisa en la ficha).
 */
export const PINCH_HARMONIC_SEMITONES = 19;

/** Tablatura a partir de una lista de notas de una en una (formato de los licks, 5.5). */
export function tabFromNotes(notes, { beatsPerBar = 4, spans = [] } = {}) {
  return {
    beatsPerBar,
    events: notes.map(({ dur, ...note }) => ({ notes: [note], dur })),
    spans,
  };
}

/* ----- Validación ----- */

const nextOnString = (tab, eventIndex, string) => tab.events[eventIndex + 1]?.notes.find((n) => n.string === string) ?? null;

/** Errores de una tablatura (lista vacía si está bien). */
export function validateTab(tab) {
  const errors = [];
  const bad = (msg) => errors.push(msg);
  if (!Array.isArray(tab?.events) || !tab.events.length) return ['sin eventos'];
  tab.events.forEach((ev, i) => {
    if (!(ev.dur > 0)) bad(`evento ${i}: duración`);
    if (!ev.notes?.length) bad(`evento ${i}: sin notas`);
    for (const n of ev.notes ?? []) {
      if (!Number.isInteger(n.string) || n.string < 1 || n.string > 6) bad(`evento ${i}: cuerda ${n.string}`);
      const t = n.tech;
      if (t?.type === 'dead') continue;
      if (!Number.isInteger(n.fret) || n.fret < 0 || n.fret > 24) bad(`evento ${i}: traste ${n.fret}`);
      if (!t) continue;
      if (!TECH_TYPES.includes(t.type)) { bad(`evento ${i}: técnica ${t.type}`); continue; }
      if (LINK_TECHS.includes(t.type)) {
        const next = nextOnString(tab, i, n.string);
        if (!next) bad(`evento ${i}: ${t.type} sin nota siguiente en la cuerda ${n.string}`);
        else if (t.type === 'hammer' && !(next.fret > n.fret)) bad(`evento ${i}: el ligado ascendente sube de traste`);
        else if (t.type === 'pull' && !(next.fret < n.fret)) bad(`evento ${i}: el ligado descendente baja de traste`);
        else if (t.type === 'slide' && next.fret === n.fret) bad(`evento ${i}: el deslizamiento cambia de traste`);
      }
      if ((t.type === 'bend' || t.type === 'prebend') && !BEND_AMOUNTS.includes(t.amount)) bad(`evento ${i}: estiramiento de ${t.amount}`);
      if (t.type === 'harmonic' && NATURAL_HARMONICS[n.fret] === undefined) bad(`evento ${i}: armónico natural en el traste ${n.fret}`);
      if (t.type === 'trill' && (!Number.isInteger(t.to) || t.to === n.fret)) bad(`evento ${i}: trino`);
      if (t.type === 'slide-in' && !['below', 'above'].includes(t.from)) bad(`evento ${i}: entrada`);
      if (t.type === 'slide-out' && !['down', 'up'].includes(t.to)) bad(`evento ${i}: salida`);
    }
  });
  for (const s of tab.spans ?? []) {
    if (!SPAN_TYPES.includes(s.type) || !(s.from >= 0 && s.to >= s.from && s.to < tab.events.length)) bad(`tramo ${s.type}`);
  }
  return errors;
}

/* ----- Texto ----- */

/** Lo que se escribe sobre la línea de la cuerda: '7', 'x', '(7)', '<12>'. */
export function noteText(note) {
  switch (note.tech?.type) {
    case 'dead': return 'x';
    case 'ghost': return `(${note.fret})`;
    case 'harmonic': return `<${note.fret}>`;
    default: return String(note.fret);
  }
}

/** Traste al que llega un estiramiento de `amount` tonos. */
export const bendTarget = (fret, amount) => fret + Math.round(amount * 2);

/** Una nota en texto plano, sin el enlace a la siguiente: '7b9r7', '/7', '7~', '5tr7', '7 AH'. */
export function plainNote(note) {
  const t = note.tech;
  const f = note.fret;
  switch (t?.type) {
    case 'bend': return `${f}b${bendTarget(f, t.amount)}${t.release ? `r${f}` : ''}`;
    case 'prebend': return `${f}pb${bendTarget(f, t.amount)}${t.release ? `r${f}` : ''}`;
    case 'vibrato': return `${f}~`;
    case 'slide-in': return `${t.from === 'below' ? '/' : '\\'}${f}`;
    case 'slide-out': return `${f}${t.to === 'down' ? '\\' : '/'}`;
    case 'tap': return `${f}t`;
    case 'trill': return `${f}tr${t.to}`;
    case 'ah': return `${f} AH`;
    case 'ph': return `${f} PH`;
    default: return noteText(note);
  }
}

/** Símbolo de un ligado o deslizamiento entre dos trastes: 'h', 'p', '/' o '\'. */
export function linkSymbol(type, fromFret, toFret) {
  if (type === 'hammer') return 'h';
  if (type === 'pull') return 'p';
  return toFret > fromFret ? '/' : '\\';
}

/**
 * Forma en texto plano de una tablatura de una sola cuerda (ejemplos del glosario):
 * '5h7', '7b9r7', '5/7'. Las notas sin enlace se separan con un espacio.
 */
export function plainText(tab) {
  let out = plainPieces(tab).join(' ');
  for (const s of tab.spans ?? []) out = `${s.type === 'pm' ? 'PM' : 'let ring'}: ${out}`;
  return out;
}

/** Piezas del texto plano: cada nota, o cada grupo de notas ligadas ('5h7', '7b9r7', '/7'). */
export function plainPieces(tab) {
  const pieces = [];
  tab.events.forEach((ev, i) => {
    const note = ev.notes[0];
    const prev = tab.events[i - 1]?.notes.find((n) => n.string === note.string);
    if (prev && LINK_TECHS.includes(prev.tech?.type)) pieces[pieces.length - 1] += linkSymbol(prev.tech.type, prev.fret, note.fret) + plainNote(note);
    else pieces.push(plainNote(note));
  });
  return pieces;
}

/* ----- Colocación en líneas ----- */

/** Instante de cada evento (en corcheas desde el principio). */
export function eventTimes(tab) {
  let t = 0;
  return tab.events.map((ev) => { const start = t; t += ev.dur; return start; });
}

export const TAB_LAYOUT = Object.freeze({ unit: 34, minCol: 22, gap: 14 });

/** Conteo de una corchea del compás: '1', 'y', '2', 'y'… */
export function countLabel(eighthInBar) {
  return eighthInBar % 2 === 0 ? String(eighthInBar / 2 + 1) : 'y';
}

/**
 * Coloca la tablatura en líneas de `maxWidth` como mucho. Se parte por compases y, si un
 * compás no cabe entero, por tiempos. Devuelve { lines: [{ width, columns, bars, counts,
 * decorations }] }:
 *   columns: [{ event, x, start }] · bars: x de las barras de compás (también al final)
 *   counts: [{ x, text }] · decorations: adornos de las técnicas (ver `decorate`)
 */
export function layoutTab(tab, { maxWidth = 320, unit = TAB_LAYOUT.unit, minCol = TAB_LAYOUT.minCol, gap = TAB_LAYOUT.gap } = {}) {
  const beatsPerBar = tab.beatsPerBar ?? 4;
  const barEighths = beatsPerBar * 2;
  const times = eventTimes(tab);
  const widths = tab.events.map((ev) => Math.max(minCol, ev.dur * unit));

  // Grupos que no se pueden partir: tiempos (dos corcheas). Un evento va en el tiempo en que empieza.
  const beatOf = (i) => Math.floor(times[i] / 2 + 1e-9);
  const beats = [];
  tab.events.forEach((_, i) => {
    const b = beatOf(i);
    const last = beats.at(-1);
    if (last && last.beat === b) last.events.push(i);
    else beats.push({ beat: b, events: [i] });
  });
  const groupWidth = (g) => g.events.reduce((s, i) => s + widths[i], 0);
  // Compases: tiempos del mismo compás juntos.
  const bars = [];
  for (const g of beats) {
    const bar = Math.floor(g.beat / beatsPerBar);
    const last = bars.at(-1);
    if (last && last.bar === bar) last.beats.push(g);
    else bars.push({ bar, beats: [g] });
  }

  const room = maxWidth - 2 * gap;
  const lineGroups = []; // cada línea: lista de tiempos
  let current = [];
  let used = 0;
  for (const bar of bars) {
    const w = bar.beats.reduce((s, g) => s + groupWidth(g), 0);
    if (current.length && used + w > room) { lineGroups.push(current); current = []; used = 0; }
    if (w <= room) { current.push(...bar.beats); used += w; continue; }
    // El compás no cabe ni solo: se parte en trozos iguales de tiempos enteros.
    if (current.length) { lineGroups.push(current); current = []; used = 0; }
    const chunks = Math.ceil(w / room);
    const per = Math.ceil(bar.beats.length / chunks);
    for (let i = 0; i < bar.beats.length; i += per) lineGroups.push(bar.beats.slice(i, i + per));
  }
  if (current.length) lineGroups.push(current);

  const linkOf = new Map(); // `${event}:${string}` → { line, x }
  const lines = lineGroups.map((groups, lineIndex) => {
    const columns = [];
    const barXs = [];
    const counts = [];
    let x = gap;
    for (const g of groups) {
      for (const i of g.events) {
        const start = times[i];
        const inBar = start % barEighths;
        if (Math.abs(inBar) < 1e-9 && columns.length) barXs.push(x - gap / 2 + 2);
        const cx = x + minCol / 2;
        columns.push({ event: i, x: cx, start });
        if (Math.abs(start - Math.round(start)) < 1e-9) counts.push({ x: cx, text: countLabel(Math.round(inBar)) });
        for (const n of tab.events[i].notes) linkOf.set(`${i}:${n.string}`, { line: lineIndex, x: cx });
        x += widths[i];
      }
    }
    const width = x + gap;
    // Barra al final de la línea solo si ahí termina un compás (o la tablatura).
    const lastEvent = groups.at(-1).events.at(-1);
    const end = times[lastEvent] + tab.events[lastEvent].dur;
    if (Math.abs(end % barEighths) < 1e-9 || lastEvent === tab.events.length - 1) barXs.push(width - 1);
    return { width, columns, bars: barXs, counts, decorations: [] };
  });
  // Barra al principio de cada línea que empieza un compás (como en una partitura).
  lines.forEach((line) => { line.bars.unshift(1); });

  decorate(tab, lines, linkOf);
  return { lines };
}

/**
 * Adornos de las técnicas (BUILD_PLAN 6.7, representación gráfica):
 *   { kind: 'link', tech, label, string, x1, x2 } ligado (arco con h o p) o deslizamiento (diagonal)
 *   { kind: 'bend', string, x, amount, label, release, pre } flecha curva (o vertical si es previo)
 *   { kind: 'vibrato', string, x } línea ondulada · { kind: 'slide-in' | 'slide-out', string, x, up }
 *   { kind: 'label', string, x, text } texto pequeño sobre la nota (AH, PH, t, tr)
 *   { kind: 'trill', string, x, to } · { kind: 'span', label, x1, x2 } PM o let ring con línea discontinua
 * Si el enlace salta de línea, el adorno llega hasta el final de la línea.
 */
function decorate(tab, lines, linkOf) {
  tab.events.forEach((ev, i) => {
    for (const n of ev.notes) {
      const here = linkOf.get(`${i}:${n.string}`);
      const add = (d) => lines[here.line].decorations.push({ string: n.string, ...d });
      const t = n.tech;
      if (!t) continue;
      if (LINK_TECHS.includes(t.type)) {
        const next = nextOnString(tab, i, n.string);
        const there = linkOf.get(`${i + 1}:${n.string}`);
        const x2 = there.line === here.line ? there.x : lines[here.line].width - 4;
        add({ kind: 'link', tech: t.type, label: t.type === 'slide' ? null : linkSymbol(t.type), x1: here.x, x2, up: next.fret > n.fret });
      } else if (t.type === 'bend' || t.type === 'prebend') {
        add({ kind: 'bend', x: here.x, amount: t.amount, label: bendText(t.amount), release: Boolean(t.release), pre: t.type === 'prebend' });
      } else if (t.type === 'vibrato') {
        add({ kind: 'vibrato', x: here.x });
      } else if (t.type === 'slide-in') {
        add({ kind: 'slide-in', x: here.x, up: t.from === 'below' });
      } else if (t.type === 'slide-out') {
        add({ kind: 'slide-out', x: here.x, up: t.to === 'up' });
      } else if (t.type === 'ah' || t.type === 'ph') {
        add({ kind: 'label', x: here.x, text: t.type.toUpperCase() });
      } else if (t.type === 'tap') {
        add({ kind: 'label', x: here.x, text: 't' });
      } else if (t.type === 'trill') {
        add({ kind: 'trill', x: here.x, to: t.to });
      }
    }
  });
  for (const s of tab.spans ?? []) {
    const label = s.type === 'pm' ? 'PM' : 'let ring';
    const xs = new Map();
    for (let i = s.from; i <= s.to; i++) {
      for (const n of tab.events[i].notes) {
        const p = linkOf.get(`${i}:${n.string}`);
        const span = xs.get(p.line) ?? { x1: p.x, x2: p.x };
        span.x1 = Math.min(span.x1, p.x);
        span.x2 = Math.max(span.x2, p.x);
        xs.set(p.line, span);
      }
    }
    for (const [line, { x1, x2 }] of xs) lines[line].decorations.push({ kind: 'span', label, x1, x2: x2 + 12 });
  }
}

/* ----- Sonido: línea de tiempo y curva de altura ----- */

/** MIDI que suena: el de la cuerda y el traste, o el del armónico. null en una nota muerta. */
export function soundingMidi(note, tuning) {
  const t = note.tech?.type;
  if (t === 'dead') return null;
  if (t === 'harmonic') return tuning[note.string] + NATURAL_HARMONICS[note.fret];
  const midi = tuning[note.string] + note.fret;
  if (t === 'ah') return midi + ARTIFICIAL_HARMONIC_SEMITONES;
  if (t === 'ph') return midi + PINCH_HARMONIC_SEMITONES;
  return midi;
}

/**
 * Notas con su instante y duración en segundos, agrupadas en "pulsaciones": una pulsación
 * es una nota pulsada más las que le siguen ligadas o deslizadas en la misma cuerda (que no se
 * vuelven a pulsar). speed: 1, 0,75 o 0,5 (cambia el tempo, no la altura).
 * Devuelve [{ string, start, dur, midi, tech, ghost, palmMute, letRing, harmonic, dead, segments, events }]
 *   segments: [{ start, dur, offset, tech, linkToNext }] con offset en semitonos respecto a la nota pulsada.
 */
export function tabTimeline(tab, { bpm, speed = 1, tuning }) {
  const eighth = 60 / (bpm * speed) / 2;
  const times = eventTimes(tab);
  const inSpan = (type, i) => (tab.spans ?? []).some((s) => s.type === type && i >= s.from && i <= s.to);
  const plucks = [];
  const open = new Map(); // cuerda → pulsación que sigue ligada
  tab.events.forEach((ev, i) => {
    const start = times[i] * eighth;
    const dur = ev.dur * eighth;
    for (const n of ev.notes) {
      const chained = open.get(n.string);
      const linkToNext = LINK_TECHS.includes(n.tech?.type);
      if (chained) {
        chained.segments.push({ start, dur, offset: n.fret - chained.fret, tech: n.tech ?? null, linkToNext });
        chained.dur = start + dur - chained.start;
        chained.events.push(i);
      } else {
        const type = n.tech?.type;
        plucks.push({
          string: n.string,
          fret: n.fret,
          start,
          dur,
          midi: soundingMidi(n, tuning),
          tech: n.tech ?? null,
          dead: type === 'dead',
          ghost: type === 'ghost',
          harmonic: type === 'harmonic' || type === 'ah' || type === 'ph',
          palmMute: inSpan('pm', i),
          letRing: inSpan('letring', i),
          events: [i],
          segments: [{ start, dur, offset: 0, tech: n.tech ?? null, linkToNext }],
        });
      }
      if (linkToNext) open.set(n.string, chained ?? plucks.at(-1));
      else open.delete(n.string);
    }
  });
  return plucks;
}

/** Tiempo que tarda en subir un estiramiento (o en entrar deslizando). */
const BEND_RISE_S = 0.14;
const VIBRATO_HZ = 5.5;
const VIBRATO_DEPTH = 0.5; // semitonos: la cuerda se estira y se suelta, sin bajar de su nota
const TRILL_STEP_S = 0.07;
const SLIDE_RANGE = 3; // semitonos al entrar deslizando
const SLIDE_OUT_RANGE = 7;

/**
 * Curva de altura de una pulsación: semitonos respecto a la nota pulsada, `rate` valores por
 * segundo, desde su inicio hasta su final. Ligados: salto de altura en la nota siguiente.
 * Deslizamientos: rampa en el último tercio de la nota. Estiramientos: suben en 0,14 s (y
 * bajan al soltar, en la segunda mitad). Vibrato: oscilación de 5,5 Hz desde un cuarto de la nota.
 */
export function pitchCurve(pluck, rate = 200) {
  const total = Math.max(1 / rate, pluck.dur);
  const n = Math.max(2, Math.ceil(total * rate) + 1);
  const values = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const time = pluck.start + (k / (n - 1)) * total;
    values[k] = offsetAt(pluck, time);
  }
  return values;
}

function offsetAt(pluck, time) {
  const segs = pluck.segments;
  let i = segs.findIndex((s) => time < s.start + s.dur);
  if (i < 0) i = segs.length - 1;
  const s = segs[i];
  const local = Math.max(0, time - s.start);
  const p = s.dur > 0 ? local / s.dur : 1;
  let value = s.offset;
  const t = s.tech;
  // Deslizamiento hacia la nota siguiente: rampa en el último tercio.
  if (t?.type === 'slide' && segs[i + 1]) {
    const from = 2 / 3;
    if (p > from) value += (segs[i + 1].offset - s.offset) * ((p - from) / (1 - from));
  }
  if (t?.type === 'bend' || t?.type === 'prebend') {
    const full = t.amount * 2;
    let bent = t.type === 'prebend' ? full : full * Math.min(1, local / BEND_RISE_S);
    if (t.release && p > 0.5) bent = full * Math.max(0, 1 - (p - 0.5) / 0.3);
    value += bent;
  }
  if (t?.type === 'vibrato' && p > 0.25) {
    value += VIBRATO_DEPTH * 0.5 * (1 - Math.cos(2 * Math.PI * VIBRATO_HZ * (local - 0.25 * s.dur)));
  }
  if (t?.type === 'trill') {
    if (Math.floor(local / TRILL_STEP_S) % 2 === 1) value += t.to - pluck.fret;
  }
  if (t?.type === 'slide-in') {
    const sign = t.from === 'below' ? -1 : 1;
    value += sign * SLIDE_RANGE * Math.max(0, 1 - local / BEND_RISE_S);
  }
  if (t?.type === 'slide-out' && p > 0.5) {
    value += (t.to === 'down' ? -1 : 1) * SLIDE_OUT_RANGE * ((p - 0.5) / 0.5);
  }
  return value;
}
