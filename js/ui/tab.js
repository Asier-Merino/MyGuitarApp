// Tablatura en SVG (BUILD_PLAN 6.7): 6 líneas (arriba la 1ª cuerda), el nombre de cada
// cuerda con la notación elegida (en inglés la 1ª en minúscula, «e»), números sobre las
// líneas, ritmo proporcional con barras de compás y conteo debajo, y los adornos de cada
// técnica dibujados como en las tablaturas impresas. Siempre en horizontal: si no cabe, se
// parte en varias líneas. Tocar un número lo hace sonar. Con `player`, botón para escuchar
// con el selector de velocidad 50 % · 75 % · 100 % y cursor ámbar en la nota que suena.
// Con `fretboardToggle`, el conmutador "Ver en el mástil" (las notas numeradas en orden).
//
// Tab(tab, { tuning, bpm, player, fretboardToggle, label, onStep })

import { h, render, segmented, toggle, settingRow } from './components.js';
import { icon } from './icons.js';
import { noteNames } from './note-label.js';
import { Fretboard } from './fretboard.js';
import { layoutTab, noteText, plainText } from '../core/tab.js';
import { STANDARD } from '../data/tunings.js';
import { settings } from '../state.js';
import { playTab, playTabEvent } from '../audio/tab-player.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const NAMES_W = 48;   // nombres de las cuerdas
const LINE_GAP = 14;  // entre líneas de cuerda
const TOP = 34;       // espacio para estiramientos, PM y let ring
const TOP_LINKS = 24; // para ligados, vibrato y etiquetas sobre la 1ª cuerda
const TOP_PLAIN = 12; // sin adornos encima
const BOTTOM = 22;    // conteo
export const TAB_SPEEDS = Object.freeze([0.5, 0.75, 1]);

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

// Margen superior de la línea que se está dibujando: solo el que piden sus adornos.
let lineTop = TOP;
const yOf = (string) => lineTop + (string - 1) * LINE_GAP;
function topFor(line) {
  if (line.decorations.some((d) => d.kind === 'bend' || d.kind === 'span')) return TOP;
  return line.decorations.length ? TOP_LINKS : TOP_PLAIN;
}

/** Nombre de una cuerda al aire: { main, alt } con la notación elegida; en inglés, la 1ª en minúscula. */
export function stringName(string, tuning) {
  const names = noteNames(tuning.midi[string] % 12, { accidentals: tuning.accidentals });
  const notation = settings.get('notation');
  const lowerEn = (text) => (string === 1 ? text.toLowerCase() : text);
  return notation === 'en'
    ? { main: lowerEn(names.primary), alt: names.secondary }
    : { main: names.primary, alt: lowerEn(names.secondary) };
}

/** Adorno de una técnica (ver decorate() en js/core/tab.js). */
function drawDecoration(d) {
  const y = d.string ? yOf(d.string) : 0;
  const g = el('g', { class: 'tab-deco' });
  switch (d.kind) {
    case 'link': {
      if (d.label) {
        const mid = (d.x1 + d.x2) / 2;
        g.append(el('path', { d: `M${d.x1 + 3} ${y - 7} Q${mid} ${y - 19} ${d.x2 - 3} ${y - 7}`, class: 'tab-arc' }));
        g.append(el('text', { x: mid, y: y - 16, class: 'tab-small' }, d.label));
      } else {
        const [a, b] = d.up ? [y + 4, y - 4] : [y - 4, y + 4];
        g.append(el('line', { x1: d.x1 + 8, y1: a, x2: d.x2 - 8, y2: b, class: 'tab-arc' }));
      }
      break;
    }
    case 'bend': {
      const top = 8;
      if (d.pre) {
        g.append(el('line', { x1: d.x - 11, y1: y - 2, x2: d.x - 11, y2: top + 6, class: 'tab-arc' }));
        g.append(el('path', { d: `M${d.x - 14} ${top + 9} L${d.x - 11} ${top + 3} L${d.x - 8} ${top + 9}`, class: 'tab-arrow' }));
        g.append(el('text', { x: d.x - 11, y: top, class: 'tab-small' }, d.label));
        if (d.release) {
          g.append(el('path', { d: `M${d.x + 8} ${top + 6} Q${d.x + 18} ${top + 6} ${d.x + 18} ${y - 6}`, class: 'tab-arc' }));
          g.append(el('path', { d: `M${d.x + 15} ${y - 10} L${d.x + 18} ${y - 4} L${d.x + 21} ${y - 10}`, class: 'tab-arrow' }));
        }
      } else {
        const peak = d.x + 16;
        g.append(el('path', { d: `M${d.x + 8} ${y} Q${peak} ${y} ${peak} ${top + 6}`, class: 'tab-arc' }));
        g.append(el('path', { d: `M${peak - 3} ${top + 9} L${peak} ${top + 3} L${peak + 3} ${top + 9}`, class: 'tab-arrow' }));
        g.append(el('text', { x: peak, y: top, class: 'tab-small' }, d.label));
        if (d.release) {
          g.append(el('path', { d: `M${peak} ${top + 6} Q${peak} ${top + 2} ${peak + 10} ${top + 10} L${peak + 12} ${y - 6}`, class: 'tab-arc' }));
          g.append(el('path', { d: `M${peak + 9} ${y - 10} L${peak + 12} ${y - 4} L${peak + 15} ${y - 10}`, class: 'tab-arrow' }));
        }
      }
      break;
    }
    case 'vibrato': {
      let path = `M${d.x - 6} ${y - 11}`;
      for (let i = 0; i < 4; i++) path += ` q2.5 -4 5 0 q2.5 4 5 0`;
      g.append(el('path', { d: path, class: 'tab-arc' }));
      break;
    }
    case 'slide-in':
      g.append(el('line', { x1: d.x - 17, y1: d.up ? y + 5 : y - 5, x2: d.x - 8, y2: d.up ? y - 2 : y + 2, class: 'tab-arc' }));
      break;
    case 'slide-out':
      g.append(el('line', { x1: d.x + 8, y1: d.up ? y + 2 : y - 2, x2: d.x + 17, y2: d.up ? y - 5 : y + 5, class: 'tab-arc' }));
      break;
    case 'label':
      g.append(el('text', { x: d.x, y: y - 11, class: 'tab-small' }, d.text));
      break;
    case 'trill': {
      g.append(el('text', { x: d.x, y: y - 11, class: 'tab-small' }, 'tr'));
      g.append(el('text', { x: d.x + 17, y: y + 1, class: 'tab-small tab-small--side' }, `(${d.to})`));
      break;
    }
    case 'span': {
      g.append(el('text', { x: d.x1 - 8, y: 12, class: 'tab-small tab-small--start' }, d.label));
      const startX = d.x1 - 8 + (d.label.length * 6.5) + 4;
      if (d.x2 > startX) g.append(el('line', { x1: startX, y1: 9, x2: d.x2, y2: 9, class: 'tab-dash' }));
      break;
    }
    default: break;
  }
  return g;
}

/** Un trozo de mástil con las notas numeradas en orden (conmutador "Ver en el mástil"). */
function tabFretboard(tab, tuning) {
  const seen = new Map();
  tab.events.forEach((ev) => ev.notes.forEach((n) => {
    if (n.tech?.type === 'dead') return;
    const key = `${n.string}:${n.fret}`;
    if (!seen.has(key)) seen.set(key, { string: n.string, fret: n.fret, text: String(seen.size + 1), color: 'amber' });
  }));
  const frets = [...seen.values()].map((m) => m.fret);
  const toFret = Math.max(4, ...frets);
  const fromFret = Math.min(...frets) <= 2 ? 0 : Math.max(0, Math.min(...frets) - 1);
  return Fretboard({ fromFret, toFret: Math.min(24, toFret + 1), tuning: tuning.midi, markers: [...seen.values()], dense: false, compact: true, label: 'Las notas de la tablatura en el mástil, numeradas en orden' });
}

export function Tab(tab, { tuning = STANDARD, bpm = 80, player = false, fretboardToggle = false, label, onStep, maxWidth } = {}) {
  const width = maxWidth ?? Math.min(640, (globalThis.innerWidth || 390) - 2 * 16 - 8) - NAMES_W;
  const { lines } = layoutTab(tab, { maxWidth: width });
  const numbers = []; // por evento: lista de <text>
  const root = h('div', { class: 'tab' });
  const sheet = h('div', { class: 'tab__lines', role: 'group', 'aria-label': label ?? `Tablatura: ${plainText(tab)}` });
  let stopSound = null;

  const playOne = (i) => {
    stopSound?.();
    stopSound = playTabEvent(tab, i, { tuning: tuning.midi });
  };

  for (const line of lines) {
    lineTop = topFor(line);
    const w = NAMES_W + line.width;
    const hgt = lineTop + 5 * LINE_GAP + BOTTOM;
    const svg = el('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'tab__svg', width: w, height: hgt });
    const body = el('g', { transform: `translate(${NAMES_W} 0)` });
    for (let s = 1; s <= 6; s++) {
      const y = yOf(s);
      const name = stringName(s, tuning);
      const t = el('text', { x: 4, y: y + 4, class: 'tab-name' });
      t.append(el('tspan', {}, name.main));
      t.append(el('tspan', { class: 'tab-name__alt', dx: 2 }, name.alt));
      svg.append(t);
      body.append(el('line', { x1: 0, y1: y, x2: line.width, y2: y, class: 'tab-string' }));
    }
    for (const x of line.bars) body.append(el('line', { x1: x, y1: yOf(1), x2: x, y2: yOf(6), class: 'tab-bar' }));
    for (const d of line.decorations) body.append(drawDecoration(d));
    for (const col of line.columns) {
      const ev = tab.events[col.event];
      for (const n of ev.notes) {
        const text = el('text', { x: col.x, y: yOf(n.string) + 4.5, class: 'tab-num', role: 'button', tabindex: '-1' }, noteText(n));
        text.addEventListener('click', () => { playOne(col.event); onStep?.(col.event); });
        (numbers[col.event] ??= []).push(text);
        body.append(text);
      }
    }
    for (const c of line.counts) body.append(el('text', { x: c.x, y: yOf(6) + 19, class: 'tab-count' }, c.text));
    svg.append(body);
    sheet.append(svg);
  }

  let active = -1;
  const setActive = (i) => {
    numbers[active]?.forEach((n) => n.classList.remove('is-active'));
    active = i;
    numbers[active]?.forEach((n) => n.classList.add('is-active'));
  };

  const controls = h('div', { class: 'tab__controls' });
  let speed = 1;
  let playing = false;
  const playLabel = h('span', {}, 'Escuchar');
  const playIcon = h('span', { class: 'tab__play-icon' }, icon('play'));
  const playBtn = h('button', { type: 'button', class: 'btn btn--grey btn--small tab__play', 'aria-pressed': 'false' }, playIcon, playLabel);
  const setPlaying = (on) => {
    playing = on;
    playLabel.textContent = on ? 'Parar' : 'Escuchar';
    render(playIcon, icon(on ? 'stop' : 'play'));
    playBtn.setAttribute('aria-pressed', String(on));
    if (!on) setActive(-1);
  };
  const stop = () => { stopSound?.(); stopSound = null; setPlaying(false); };
  playBtn.addEventListener('click', () => {
    if (playing) { stop(); return; }
    stopSound?.();
    stopSound = playTab(tab, {
      bpm,
      speed,
      tuning: tuning.midi,
      onStep: (i) => { if (!root.isConnected) { stop(); return; } setActive(i); onStep?.(i); },
      onEnd: () => setPlaying(false),
    });
    if (stopSound) setPlaying(true);
  });
  const drawSpeed = () => render(speedEl, segmented({
    label: 'Velocidad',
    value: speed,
    options: TAB_SPEEDS.map((v) => ({ value: v, label: `${v * 100} %` })),
    onChange: (v) => { speed = v; drawSpeed(); if (playing) { stop(); playBtn.click(); } },
  }));
  const speedEl = h('div', { class: 'tab__speed' });
  if (player) {
    drawSpeed();
    controls.append(playBtn, speedEl);
  }

  const boardEl = h('div', { class: 'tab__board' });
  let showBoard = false;
  const drawToggle = () => render(toggleEl, settingRow({
    label: 'Ver en el mástil',
    control: toggle({ label: 'Ver en el mástil', checked: showBoard, onChange: (on) => { showBoard = on; drawToggle(); render(boardEl, on && tabFretboard(tab, tuning)); } }),
  }));
  const toggleEl = h('div', { class: 'tab__toggle' });
  if (fretboardToggle) drawToggle();

  render(root, boardEl, sheet, (player || fretboardToggle) && h('div', { class: 'tab__footer' }, controls, toggleEl));
  root.setActive = setActive;
  root.stop = stop;
  return root;
}
