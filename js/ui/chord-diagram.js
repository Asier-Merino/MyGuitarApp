// Diagrama de acorde vertical (BUILD_PLAN 1B y 6.6.12), con el mismo aspecto que el mástil:
// cuerdas de la 6ª (izquierda) a la 1ª, cejuela gruesa, trastes finos, números de los dedos,
// cuerdas al aire (o), cuerdas que no se tocan (×) y cejilla.
// Tocar un punto hace sonar esa nota; tocar el resto del diagrama rasguea el acorde.
//
// ChordDiagram(chord, { size: 'large' | 'small' | 'mini', tuning, playOnTap, colorByFunction })

import { shapeNotes, STANDARD_TUNING } from '../core/fretboard-model.js';
import { mod12, noteFunction } from '../core/theory.js';
import { playNote, strum } from '../audio/synth.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const SIZES = Object.freeze({
  large: { spacing: 44, row: 54, r: 16, fingers: true },
  small: { spacing: 26, row: 32, r: 10, fingers: true },
  mini: { spacing: 14, row: 17, r: 5.5, fingers: false },
});

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Trastes que se ven: desde la cejuela (1–4) o, si el acorde va más arriba, desde su primer traste. */
export function diagramWindow(frets, minRows = 4) {
  const pressed = frets.filter((f) => f !== null && f > 0);
  const max = pressed.length ? Math.max(...pressed) : 0;
  const min = pressed.length ? Math.min(...pressed) : 1;
  const base = max <= minRows ? 1 : min;
  return { base, rows: Math.max(minRows, max - base + 1) };
}

export function ChordDiagram(chord, { size = 'large', tuning = STANDARD_TUNING, playOnTap = true, colorByFunction = false } = {}) {
  const S = SIZES[size] ?? SIZES.large;
  const { base, rows } = diagramWindow(chord.frets);
  const top = S.row * 0.8;               // espacio para o / ×
  const left = base > 1 ? S.spacing * 1.3 : S.spacing * 0.6; // espacio para "5fr"
  const width = left + S.spacing * 5 + S.spacing * 0.6;
  const height = top + rows * S.row + S.row * 0.25;
  const x = (string) => left + (6 - string) * S.spacing;
  const yWire = (n) => top + n * S.row; // n = 0 cejuela / borde superior
  const yFret = (fret) => top + (fret - base + 0.5) * S.row;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: `chord-diagram chord-diagram--${size}`,
    role: playOnTap ? 'button' : 'img',
    tabindex: playOnTap ? '0' : undefined,
    'aria-label': playOnTap ? 'Diagrama del acorde: tócalo para oírlo rasgueado' : 'Diagrama del acorde',
    style: size === 'large' ? `max-width:${Math.round(width * 1.15)}px` : undefined,
  });

  svg.append(el('rect', { x: left, y: top, width: S.spacing * 5, height: rows * S.row, class: 'fb-board' }));
  for (let n = 1; n <= rows; n++) {
    svg.append(el('line', { x1: left, y1: yWire(n), x2: left + S.spacing * 5, y2: yWire(n), class: 'fb-fret' }));
  }
  if (base === 1) {
    svg.append(el('rect', { x: left - 1, y: top - S.row * 0.09, width: S.spacing * 5 + 2, height: S.row * 0.13, class: 'fb-nut' }));
  } else {
    svg.append(el('line', { x1: left, y1: top, x2: left + S.spacing * 5, y2: top, class: 'fb-fret' }));
    svg.append(el('text', { x: left - S.spacing * 0.75, y: yFret(base), class: 'cd-basefret' }, `${base}fr`));
  }
  const scale = S.spacing / 50;
  for (const string of [6, 5, 4, 3, 2, 1]) {
    svg.append(el('line', {
      x1: x(string), y1: top, x2: x(string), y2: yWire(rows), class: 'fb-string',
      'stroke-width': Math.max(0.8, (1.5 + (string - 1) * 0.4) * scale * 1.1).toFixed(2),
    }));
  }

  const notes = shapeNotes(chord.frets, tuning);
  const barre = chord.barre;
  const inBarre = (string, fret) => barre && fret === barre.fret && string <= barre.from && string >= barre.to;

  // Al aire (o) y sin tocar (×), encima de la cejuela.
  chord.frets.forEach((fret, i) => {
    const string = 6 - i;
    const cy = top - S.row * 0.42;
    if (fret === null) {
      const d = S.r * 0.6;
      svg.append(el('path', { d: `M${x(string) - d} ${cy - d}L${x(string) + d} ${cy + d}M${x(string) + d} ${cy - d}L${x(string) - d} ${cy + d}`, class: 'cd-muted' }));
    } else if (fret === 0) {
      svg.append(el('circle', { cx: x(string), cy, r: S.r * 0.6, class: 'cd-open' }));
    }
  });

  // Cejilla: una barra con el dedo 1.
  if (barre) {
    const y = yFret(barre.fret);
    svg.append(el('rect', {
      x: x(barre.from) - S.r, y: y - S.r, width: x(barre.to) - x(barre.from) + 2 * S.r, height: 2 * S.r, rx: S.r,
      class: 'cd-dot fb-dot--neutral',
    }));
    if (S.fingers) svg.append(el('text', { x: (x(barre.from) + x(barre.to)) / 2, y: y + 1, class: 'cd-finger' }, '1'));
  }

  const dots = new Map();
  chord.frets.forEach((fret, i) => {
    const string = 6 - i;
    if (fret === null || fret === 0 || inBarre(string, fret)) return;
    const pc = mod12(notes.find((n) => n.string === string).midi);
    const color = colorByFunction ? noteFunction(chord.root, pc) : 'neutral';
    const g = el('g', { class: `cd-dot fb-dot--${color}` });
    g.append(el('circle', { cx: x(string), cy: yFret(fret), r: S.r }));
    if (S.fingers) g.append(el('text', { x: x(string), y: yFret(fret) + 1, class: 'cd-finger' }, String(chord.fingers[i])));
    dots.set(string, g);
    svg.append(g);
  });

  if (playOnTap) {
    const midis = notes.map((n) => n.midi);
    const play = (e) => {
      const target = e.target.closest?.('.cd-dot');
      const string = target ? [...dots].find(([, g]) => g === target)?.[0] : undefined;
      const note = string ? notes.find((n) => n.string === string) : null;
      if (note) playNote(note.midi);
      else strum(midis, 'down');
    };
    svg.addEventListener('click', play);
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strum(midis, 'down'); }
    });
  }
  return svg;
}
