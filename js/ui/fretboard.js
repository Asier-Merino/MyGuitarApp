// Mástil en SVG (BUILD_PLAN 6.3). Vertical (cejuela arriba, 6ª cuerda a la izquierda) en el
// móvil en vertical y horizontal (1ª cuerda arriba, cejuela a la izquierda) en apaisado o
// en PC; se puede forzar en Ajustes. Cuerdas con grosor graduado, trastes finos, cejuela
// gruesa y marcas en 3, 5, 7, 9, 15 y doble en 12. Cada punto lleva siempre su etiqueta.
//
// Fretboard({ fromFret, toFret, orientation, tuning, markers, onTap, playOnTap,
//             showFretNumbers, showStringNumbers, accidentals, label })
// markers: [{ string, fret, pc?, text?, color?, root?, state?: 'correct'|'wrong', hollow?, midi? }]
//   color: 'neutral' | 'amber' | 'root' | 'third' | 'fifth' | 'seventh' | 'blue' | 'other'
//   (si falta y hay `root`, se calcula la función de la nota). Etiqueta: `text`, o la nota
//   (doble notación) o el intervalo respecto a `root`, según "Mostrar en los puntos".
// Devuelve un <div class="fretboard"> con el método setMarkers(markers).

import { settings } from '../state.js';
import { noteNames } from './note-label.js';
import { STANDARD_TUNING, FRET_INLAYS, midiAt } from '../core/fretboard-model.js';
import { mod12, interval, intervalInfo, noteFunction } from '../core/theory.js';
import { playNote } from '../audio/synth.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Geometría en unidades del dibujo (≈ píxeles a tamaño normal): las zonas táctiles miden
// un traste por una cuerda (58 × 50), por encima de los 44 × 44 px.
const CELL = 58;      // largo de cada traste
const SPACING = 50;   // separación entre cuerdas
const OPEN = 46;      // zona del traste 0, antes de la cejuela
const TOP = 6;        // borde cuando el dibujo no empieza en la cejuela
const END = 6;
const ACROSS = 6 * SPACING;
const NUM_MARGIN = 26; // números de traste / de cuerda
const PAD = 6;
const DOT_R = 19;

const across = (orientation, string) => (orientation === 'vertical' ? 6 - string : string - 1) * SPACING + SPACING / 2;

function svgEl(tag, attrs = {}, text) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
}

/** 'vertical' | 'horizontal' según la opción, el ajuste y la orientación de la pantalla. */
export function resolveOrientation(option) {
  const value = option ?? settings.get('fretboardOrientation');
  if (value === 'vertical' || value === 'horizontal') return value;
  return globalThis.matchMedia?.('(orientation: portrait)').matches ? 'vertical' : 'horizontal';
}

/** Posición a lo largo del mástil (centro de un traste, o de la zona al aire). */
function layout(fromFret, toFret) {
  const startsAtNut = fromFret === 0;
  const firstFretted = Math.max(1, fromFret);
  const cells = Math.max(0, toFret - firstFretted + 1);
  const start = startsAtNut ? OPEN : TOP;
  return {
    startsAtNut,
    firstFretted,
    start,
    length: start + cells * CELL + END,
    center: (fret) => (fret === 0 ? OPEN / 2 : start + (fret - firstFretted + 0.5) * CELL),
    wire: (fret) => start + (fret - firstFretted + 1) * CELL, // traste metálico al final de `fret`
  };
}

function markerLabel(marker, accidentals) {
  if (marker.text != null) return { main: String(marker.text) };
  if (marker.pc == null) return { main: '' };
  if (settings.get('fretboardLabels') === 'intervals' && marker.root != null) {
    const semis = interval(marker.root, marker.pc);
    return { main: semis === 0 ? 'R' : intervalInfo(semis).abbr };
  }
  const names = noteNames(marker.pc, { accidentals });
  return { main: names.primary, alt: names.secondary, spoken: names.spoken };
}

function markerColor(marker) {
  if (marker.state) return marker.state;
  if (marker.color) return marker.color;
  if (marker.root != null && marker.pc != null) return noteFunction(marker.root, marker.pc);
  return 'neutral';
}

export function Fretboard(options = {}) {
  const {
    fromFret = 0,
    toFret = 12,
    tuning = STANDARD_TUNING,
    onTap = null,
    playOnTap = false,
    showFretNumbers = true,
    showStringNumbers = false,
    accidentals,
    label = 'Mástil',
  } = options;
  let markers = options.markers ?? [];
  const wrapper = document.createElement('div');
  wrapper.className = 'fretboard';
  const mq = globalThis.matchMedia?.('(orientation: portrait)');
  let orientation = null;

  function playAt(string, fret, marker) {
    playNote(marker?.midi ?? midiAt(string, fret, tuning));
  }

  function draw() {
    orientation = resolveOrientation(options.orientation);
    const vertical = orientation === 'vertical';
    wrapper.dataset.orientation = orientation;
    const L = layout(fromFret, toFret);

    // Márgenes: números de traste a la izquierda (vertical) o debajo (horizontal);
    // números de cuerda arriba (vertical) o a la izquierda (horizontal).
    const before = showStringNumbers ? NUM_MARGIN : PAD; // antes del traste 0, a lo largo
    const side = showFretNumbers ? NUM_MARGIN : PAD;      // junto al mástil, a lo ancho
    const width = vertical ? side + ACROSS + PAD : before + L.length;
    const height = vertical ? before + L.length : PAD + ACROSS + side;
    // (along, acrossPos) → (x, y)
    const pt = vertical
      ? (a, c) => [side + c, before + a]
      : (a, c) => [before + a, PAD + c];

    const svg = svgEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'fretboard__svg',
      role: onTap || playOnTap ? 'group' : 'img',
      'aria-label': `${label}: trastes ${fromFret} a ${toFret}`,
      style: `max-width:${Math.round(width * 1.25)}px`,
    });

    const line = (a1, c1, a2, c2, cls, extra = {}) => {
      const [x1, y1] = pt(a1, c1);
      const [x2, y2] = pt(a2, c2);
      svg.append(svgEl('line', { x1, y1, x2, y2, class: cls, ...extra }));
    };
    const rect = (a, c, la, lc, cls, extra = {}) => {
      const [x1, y1] = pt(a, c);
      const [x2, y2] = pt(a + la, c + lc);
      svg.append(svgEl('rect', {
        x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), class: cls, ...extra,
      }));
    };
    const text = (a, c, value, cls) => {
      const [x, y] = pt(a, c);
      svg.append(svgEl('text', { x, y, class: cls }, value));
    };

    // Madera, marcas, trastes, cejuela y cuerdas.
    rect(L.start, 0, L.length - L.start - END, ACROSS, 'fb-board');
    for (const inlay of FRET_INLAYS) {
      if (inlay.fret < L.firstFretted || inlay.fret > toFret) continue;
      const positions = inlay.double ? [2 * SPACING, 4 * SPACING] : [3 * SPACING];
      for (const c of positions) {
        const [cx, cy] = pt(L.center(inlay.fret), c);
        svg.append(svgEl('circle', { cx, cy, r: 7, class: 'fb-inlay' }));
      }
    }
    if (!L.startsAtNut) line(L.start, 0, L.start, ACROSS, 'fb-fret');
    for (let f = L.firstFretted; f <= toFret; f++) line(L.wire(f), 0, L.wire(f), ACROSS, 'fb-fret');
    if (L.startsAtNut) rect(OPEN - 3.5, 0, 7, ACROSS, 'fb-nut');
    for (const string of [1, 2, 3, 4, 5, 6]) {
      const c = across(orientation, string);
      line(0, c, L.length - END, c, 'fb-string', { 'stroke-width': (1.5 + (string - 1) * 0.4).toFixed(1) });
    }

    // Números de traste y de cuerda.
    if (showFretNumbers) {
      for (let f = L.firstFretted; f <= toFret; f++) {
        text(L.center(f), vertical ? -side / 2 - 1 : ACROSS + side / 2 + 1, String(f), 'fb-num');
      }
    }
    if (showStringNumbers) {
      for (const string of [1, 2, 3, 4, 5, 6]) text(-before / 2, across(orientation, string), `${string}ª`, 'fb-num');
    }

    // Zonas táctiles: todas las casillas si hay onTap; si no, solo los puntos que suenan.
    const cells = [];
    if (onTap) {
      for (const string of [6, 5, 4, 3, 2, 1]) for (let f = fromFret; f <= toFret; f++) cells.push({ string, fret: f });
    } else if (playOnTap) {
      cells.push(...markers.filter((m) => m.fret >= fromFret && m.fret <= toFret));
    }
    const hits = svgEl('g', { class: 'fb-hits' });

    // Puntos.
    for (const marker of markers) {
      if (marker.fret < fromFret || marker.fret > toFret) continue;
      const [cx, cy] = pt(L.center(marker.fret), across(orientation, marker.string));
      const color = markerColor(marker);
      const lab = markerLabel(marker, accidentals);
      const g = svgEl('g', {
        class: `fb-dot fb-dot--${color}${marker.hollow ? ' fb-dot--hollow' : ''}`,
        'data-string': marker.string,
        'data-fret': marker.fret,
      });
      g.append(svgEl('circle', { cx, cy, r: DOT_R }));
      if (lab.alt) {
        g.append(svgEl('text', { x: cx, y: cy - 4, class: 'fb-dot__main' }, lab.main));
        g.append(svgEl('text', { x: cx, y: cy + 9, class: 'fb-dot__alt' }, lab.alt));
      } else {
        g.append(svgEl('text', { x: cx, y: cy + 1, class: `fb-dot__main${lab.main.length > 2 ? ' fb-dot__main--small' : ''}` }, lab.main));
      }
      if (marker.state) {
        const bx = cx + DOT_R * 0.75;
        const by = cy - DOT_R * 0.75;
        g.append(svgEl('circle', { cx: bx, cy: by, r: 8, class: 'fb-dot__badge' }));
        g.append(svgEl('text', { x: bx, y: by + 0.5, class: 'fb-dot__badge-text' }, marker.state === 'correct' ? '✓' : '✗'));
      }
      svg.append(g);
    }

    // Las zonas táctiles van encima de todo (transparentes).
    for (const cell of cells) {
      const a = cell.fret === 0 ? 0 : L.center(cell.fret) - CELL / 2;
      const la = cell.fret === 0 ? OPEN : CELL;
      const c = across(orientation, cell.string) - SPACING / 2;
      const [x1, y1] = pt(a, c);
      const [x2, y2] = pt(a + la, c + SPACING);
      const marker = markers.find((m) => m.string === cell.string && m.fret === cell.fret);
      const name = marker && markerLabel(marker, accidentals).spoken;
      const hit = svgEl('rect', {
        x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1),
        class: 'fb-hit',
        role: 'button',
        tabindex: '0',
        'aria-label': `${cell.string}ª cuerda, traste ${cell.fret}${name ? `: ${name}` : ''}`,
      });
      const activate = () => {
        if (onTap) onTap(cell.string, cell.fret);
        else {
          playAt(cell.string, cell.fret, marker);
          const dot = svg.querySelector(`.fb-dot[data-string="${cell.string}"][data-fret="${cell.fret}"]`);
          dot?.classList.remove('is-sounding');
          void dot?.getBoundingClientRect();
          dot?.classList.add('is-sounding');
        }
      };
      hit.addEventListener('click', activate);
      hit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
      hits.append(hit);
    }
    svg.append(hits);
    wrapper.replaceChildren(svg);
  }

  // Al girar el móvil, se vuelve a dibujar en la otra orientación.
  const onOrientation = () => {
    if (!wrapper.isConnected) { mq?.removeEventListener?.('change', onOrientation); return; }
    if (resolveOrientation(options.orientation) !== orientation) draw();
  };
  mq?.addEventListener?.('change', onOrientation);

  wrapper.setMarkers = (next) => { markers = next ?? []; draw(); };
  draw();
  return wrapper;
}

/** Marcas para las notas de una lista de posiciones, con la nota calculada por MIDI. */
export function positionMarkers(positions, { tuning = STANDARD_TUNING, ...rest } = {}) {
  return positions.map((p) => ({ ...rest, ...p, pc: mod12(midiAt(p.string, p.fret, tuning)) }));
}
