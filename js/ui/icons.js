// Iconos SVG de trazo sencillo (24×24, trazo 2). La mayoría siguen el estilo de Lucide
// (licencia ISC); guitarra, diapasón y logo están dibujados para la app. Sin emojis.

const SVG_NS = 'http://www.w3.org/2000/svg';

const PATHS = {
  back: ['M19 12H5', 'm12 19-7-7 7-7'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  chevron: ['m9 18 6-6-6-6'],
  help: ['circle:12,12,10', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  search: ['circle:11,11,7', 'm20 20-4.3-4.3'],
  play: ['M7 4.5v15l12-7.5z'],
  stop: ['rect:6,6,12,12,2'],
  volume: ['M11 5 6 9H3v6h3l5 4z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 5.5a9 9 0 0 1 0 13'],
  star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z'],
  user: ['circle:12,8,4', 'M4 21a8 8 0 0 1 16 0'],
  settings: ['M20 7h-9', 'M14 17H4', 'circle:17,17,3', 'circle:7,7,3'],
  info: ['circle:12,12,10', 'M12 16v-4', 'M12 8h.01'],
  check: ['M20 6 9 17l-5-5'],
  // Secciones de Inicio
  theory: ['M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z', 'M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z'],
  guitar: ['M14.5 9.5 21 3', 'm18 2 4 4', 'M10.5 8.6a3.4 3.4 0 0 0-5.3 1.2 3 3 0 0 0-2.6 4.3l.5 1c.6 1.2.6 2.6 0 3.8a1.9 1.9 0 0 0 2.6 2.6c1.2-.6 2.6-.6 3.8 0l1 .5a3 3 0 0 0 4.3-2.6 3.4 3.4 0 0 0 1.2-5.3', 'circle:10,14,1.6'],
  tuningFork: ['M8 2v8a4 4 0 0 0 8 0V2', 'M12 14v8'],
  glossary: ['M4 19.5V5a2 2 0 0 1 2-2h14v15H6.5a2.5 2.5 0 0 0 0 5H20', 'M9 7h7', 'M9 11h5'],
  // Módulos
  note: ['M9 18V5l11-2v13', 'circle:6,18,3', 'circle:17,16,3'],
  chord: ['rect:5,3,14,18,2', 'M9.7 3v18', 'M14.3 3v18', 'M5 9h14', 'M5 15h14'],
  ear: ['M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0', 'M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4'],
  scale: ['M4 20h4v-4h4v-4h4V8h4', 'M4 20V4'],
  blues: ['M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0', 'M2 18c2-4 4-4 6 0s4 4 6 0 4-4 6 0'],
  caged: ['m12 2 10 5-10 5L2 7z', 'm2 12 10 5 10-5', 'm2 17 10 5 10-5'],
  warmup: ['M22 12h-4l-3 8L9 4l-3 8H2'],
};

function shape(spec) {
  const [kind, args] = spec.includes(':') ? spec.split(':') : ['path', spec];
  if (kind === 'circle') {
    const [cx, cy, r] = args.split(',');
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('cx', cx); el.setAttribute('cy', cy); el.setAttribute('r', r);
    return el;
  }
  if (kind === 'rect') {
    const [x, y, w, hgt, rx] = args.split(',');
    const el = document.createElementNS(SVG_NS, 'rect');
    el.setAttribute('x', x); el.setAttribute('y', y); el.setAttribute('width', w); el.setAttribute('height', hgt);
    if (rx) el.setAttribute('rx', rx);
    return el;
  }
  const el = document.createElementNS(SVG_NS, 'path');
  el.setAttribute('d', args);
  return el;
}

/** <svg> decorativo (aria-hidden): el texto del botón o el aria-label dicen qué es. */
export function icon(name, { size = 24, className = 'icon' } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const spec of PATHS[name] ?? PATHS.info) svg.append(shape(spec));
  return svg;
}

/**
 * Logo de GuitarSeo (BUILD_PLAN 6.10): cuadrado ámbar redondeado con 4 cuerdas, 2 trastes
 * y un punto central. Misma geometría que tools/make-icons.mjs; los colores son tokens CSS.
 */
export function logo({ size = 72 } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('class', 'logo');
  svg.setAttribute('aria-hidden', 'true');
  const add = (tag, attrs) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.append(el);
  };
  add('rect', { x: 0, y: 0, width: 100, height: 100, rx: 22, class: 'logo__bg' });
  for (const y of [38, 62]) add('rect', { x: 24, y: y - 1.75, width: 52, height: 3.5, rx: 1.75, class: 'logo__fret' });
  for (const x of [32, 44, 56, 68]) add('rect', { x: x - 2, y: 20, width: 4, height: 60, rx: 2, class: 'logo__string' });
  add('circle', { cx: 50, cy: 50, r: 8.5, class: 'logo__dot' });
  return svg;
}
