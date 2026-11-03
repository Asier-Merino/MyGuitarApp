// Diagrama de acorde vertical (BUILD_PLAN 1B y 6.6.12), con el mismo aspecto que el mástil:
// cuerdas de la 6ª (izquierda) a la 1ª, cejuela gruesa, trastes finos, números de los dedos,
// cuerdas al aire (o), cuerdas que no se tocan (×) y cejilla.
// Tocar un punto hace sonar esa nota; tocar el resto del diagrama rasguea el acorde.
//
// ChordDiagram(chord, { size: 'large' | 'small' | 'mini', tuning, playOnTap, colorByFunction,
//                       hiddenString, marks })
//   hiddenString: cuerda cuyo punto se sustituye por un «?» ("¿Qué nota falta?").
//   marks: { [cuerda]: 'correct' | 'wrong' } para marcar cuerdas al corregir (con ✓ o ✗).
// ChordEditor({ onChange }): diagrama vacío para construir un acorde tocando ("Constrúyelo").

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

/** Geometría y cuadrícula vacía (cuerdas, trastes y cejuela). */
function grid(S, base, rows, { role, label, tabindex, size }) {
  const top = S.row * 0.85;               // espacio para o / ×
  const left = base > 1 ? S.spacing * 1.3 : S.spacing * 0.6; // espacio para "5fr"
  const width = left + S.spacing * 5 + S.spacing * 0.6;
  const height = top + rows * S.row + S.row * 0.25;
  const g = {
    top, left, width, height, rows, base,
    x: (string) => left + (6 - string) * S.spacing,
    yWire: (n) => top + n * S.row,
    yFret: (fret) => top + (fret - base + 0.5) * S.row,
  };
  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: `chord-diagram chord-diagram--${size}`,
    role,
    tabindex,
    'aria-label': label,
    style: size === 'large' ? `max-width:${Math.round(width * 1.15)}px` : undefined,
  });
  svg.append(el('rect', { x: left, y: top, width: S.spacing * 5, height: rows * S.row, class: 'fb-board' }));
  for (let n = 1; n <= rows; n++) {
    svg.append(el('line', { x1: left, y1: g.yWire(n), x2: left + S.spacing * 5, y2: g.yWire(n), class: 'fb-fret' }));
  }
  if (base === 1) {
    svg.append(el('rect', { x: left - 1, y: top - S.row * 0.09, width: S.spacing * 5 + 2, height: S.row * 0.13, class: 'fb-nut' }));
  } else {
    svg.append(el('line', { x1: left, y1: top, x2: left + S.spacing * 5, y2: top, class: 'fb-fret' }));
    svg.append(el('text', { x: left - S.spacing * 0.75, y: g.yFret(base), class: 'cd-basefret' }, `${base}fr`));
  }
  const scale = S.spacing / 50;
  for (const string of [6, 5, 4, 3, 2, 1]) {
    svg.append(el('line', {
      x1: g.x(string), y1: top, x2: g.x(string), y2: g.yWire(rows), class: 'fb-string',
      'stroke-width': Math.max(0.8, (1.5 + (string - 1) * 0.4) * scale * 1.1).toFixed(2),
    }));
  }
  return { svg, g };
}

/** o (al aire) o × (no se toca) encima de la cejuela. */
function openMark(svg, S, g, string, fret, cls = '') {
  const cy = g.top - S.row * 0.45;
  const x = g.x(string);
  if (fret === null) {
    const d = S.r * 0.6;
    svg.append(el('path', { d: `M${x - d} ${cy - d}L${x + d} ${cy + d}M${x + d} ${cy - d}L${x - d} ${cy + d}`, class: `cd-muted ${cls}` }));
  } else if (fret === 0) {
    svg.append(el('circle', { cx: x, cy, r: S.r * 0.6, class: `cd-open ${cls}` }));
  }
}

/** Marca ✓ / ✗ de una cuerda al corregir, debajo del diagrama (no depende solo del color). */
function stringMark(svg, S, g, string, mark) {
  svg.append(el('text', { x: g.x(string), y: g.height - 2, class: `cd-mark cd-mark--${mark}` }, mark === 'correct' ? '✓' : '✗'));
}

export function ChordDiagram(chord, {
  size = 'large', tuning = STANDARD_TUNING, playOnTap = true, colorByFunction = false, hiddenString = null, marks = null,
} = {}) {
  const S = SIZES[size] ?? SIZES.large;
  const { base, rows } = diagramWindow(chord.frets);
  const markRows = marks ? 0.5 : 0;
  const { svg, g } = grid(S, base, rows + markRows, {
    size,
    role: playOnTap ? 'button' : 'img',
    tabindex: playOnTap ? '0' : undefined,
    label: playOnTap ? 'Diagrama del acorde: tócalo para oírlo rasgueado' : 'Diagrama del acorde',
  });

  const notes = shapeNotes(chord.frets, tuning);
  const barre = chord.barre;
  const inBarre = (string, fret) => barre && fret === barre.fret && string <= barre.from && string >= barre.to;

  // Con colores de función, también la o de las cuerdas al aire lleva el color de su nota.
  chord.frets.forEach((fret, i) => {
    const string = 6 - i;
    const fn = colorByFunction && fret === 0 ? `fb-dot--${noteFunction(chord.root, mod12(tuning[string]))} cd-open--fn` : '';
    openMark(svg, S, g, string, fret, fn);
  });

  // Cejilla: una barra con el dedo 1 (si la cuerda escondida está debajo, la barra se corta).
  if (barre && !(hiddenString && inBarre(hiddenString, chord.frets[6 - hiddenString]))) {
    const y = g.yFret(barre.fret);
    svg.append(el('rect', {
      x: g.x(barre.from) - S.r, y: y - S.r, width: g.x(barre.to) - g.x(barre.from) + 2 * S.r, height: 2 * S.r, rx: S.r,
      class: "cd-dot fb-dot--neutral",
    }));
    if (S.fingers) svg.append(el('text', { x: (g.x(barre.from) + g.x(barre.to)) / 2, y: y + 1, class: 'cd-finger' }, '1'));
  }

  const dots = new Map();
  chord.frets.forEach((fret, i) => {
    const string = 6 - i;
    if (fret === null || fret === 0) return;
    const hidden = string === hiddenString;
    const barred = inBarre(string, fret) && !(hiddenString && inBarre(hiddenString, chord.frets[6 - hiddenString]));
    if (barred && !colorByFunction && !marks) return;
    const pc = mod12(notes.find((n) => n.string === string).midi);
    let color = colorByFunction ? noteFunction(chord.root, pc) : 'neutral';
    if (marks?.[string]) color = marks[string];
    const dot = el('g', { class: `cd-dot fb-dot--${hidden ? 'amber' : color}` });
    dot.append(el('circle', { cx: g.x(string), cy: g.yFret(fret), r: S.r }));
    if (hidden) dot.append(el('text', { x: g.x(string), y: g.yFret(fret) + 1, class: 'cd-finger' }, '?'));
    else if (S.fingers && !barred) dot.append(el('text', { x: g.x(string), y: g.yFret(fret) + 1, class: 'cd-finger' }, String(chord.fingers[i])));
    else if (S.fingers && barred) dot.append(el('text', { x: g.x(string), y: g.yFret(fret) + 1, class: 'cd-finger' }, '1'));
    dots.set(string, dot);
    svg.append(dot);
  });
  if (marks) for (const [string, mark] of Object.entries(marks)) stringMark(svg, S, g, Number(string), mark);

  if (playOnTap) {
    const midis = notes.map((n) => n.midi);
    const play = (e) => {
      const target = e.target.closest?.('.cd-dot');
      const string = target ? [...dots].find(([, d]) => d === target)?.[0] : undefined;
      const note = string && string !== hiddenString ? notes.find((n) => n.string === string) : null;
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

/** Trastes que se pueden marcar en el editor (los acordes abiertos de la biblioteca caben en 1–4). */
export const EDITOR_ROWS = 4;

/**
 * Diagrama vacío para construir un acorde ("Constrúyelo"): tocar una casilla pone el punto
 * en ese traste (otra vez, lo quita); tocar encima de la cejuela cambia entre al aire (o) y
 * no se toca (×). Empieza con las 6 cuerdas al aire. Cada cuerda tiene su zona táctil de
 * 44 × 54 px. onChange(frets) con los trastes de la 6ª a la 1ª (null = no se toca).
 * Devuelve el <svg> con value(), lock() y showMarks(marks).
 */
export function ChordEditor({ onChange } = {}) {
  const S = SIZES.large;
  const frets = [0, 0, 0, 0, 0, 0];
  let locked = false;
  let marks = null;
  const wrapper = document.createElement('div');
  wrapper.className = 'chord-editor';

  function draw() {
    const { svg, g } = grid(S, 1, EDITOR_ROWS + (marks ? 0.5 : 0), { size: 'large', role: 'group', label: 'Diagrama vacío: toca las casillas para construir el acorde' });
    frets.forEach((fret, i) => openMark(svg, S, g, 6 - i, fret));
    frets.forEach((fret, i) => {
      const string = 6 - i;
      if (!fret) return;
      const dot = el('g', { class: `cd-dot fb-dot--${marks?.[string] ?? 'amber'}` });
      dot.append(el('circle', { cx: g.x(string), cy: g.yFret(fret), r: S.r }));
      svg.append(dot);
    });
    if (marks) for (const [string, mark] of Object.entries(marks)) stringMark(svg, S, g, Number(string), mark);
    // Zonas táctiles: encima de la cejuela (o / ×) y cada casilla.
    for (const string of [6, 5, 4, 3, 2, 1]) {
      const i = 6 - string;
      const x = g.x(string) - S.spacing / 2;
      const hit = (y, height, fret, name) => {
        const r = el('rect', { x, y, width: S.spacing, height, class: 'cd-hit', role: 'button', tabindex: locked ? '-1' : '0', 'aria-label': name });
        const act = () => {
          if (locked) return;
          if (fret === 'top') frets[i] = frets[i] === 0 ? null : 0;
          else frets[i] = frets[i] === fret ? 0 : fret;
          if (frets[i] > 0) playNote(STANDARD_TUNING[string] + frets[i]);
          else if (frets[i] === 0) playNote(STANDARD_TUNING[string]);
          draw();
          onChange?.([...frets]);
          wrapper.querySelector(`[data-key="${string}:${fret}"]`)?.focus({ preventScroll: true });
        };
        r.dataset.key = `${string}:${fret}`;
        r.addEventListener('click', act);
        r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
        svg.append(r);
      };
      hit(0, g.top, 'top', `${string}ª cuerda: al aire o sin tocar`);
      for (let f = 1; f <= EDITOR_ROWS; f++) hit(g.yWire(f - 1), S.row, f, `${string}ª cuerda, traste ${f}`);
    }
    wrapper.replaceChildren(svg);
  }
  draw();
  wrapper.value = () => [...frets];
  wrapper.lock = () => { locked = true; draw(); };
  wrapper.showMarks = (m) => { marks = m; draw(); };
  return wrapper;
}
