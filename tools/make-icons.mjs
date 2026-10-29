// Genera el icono de GuitarSeo sin dependencias: `npm run icons` (BUILD_PLAN 6.10).
// Diseño: cuadrado ámbar con esquinas redondeadas; dentro, 4 cuerdas verticales y 2 trastes
// horizontales finos (algo más tenues) y un punto en el centro, como una nota marcada. Sin texto.
// La misma geometría (coordenadas 0–100) se usa en js/ui/icons.js → logo().
//
// Salida: icons/icon.svg (fuente), icon-192.png e icon-512.png (esquinas redondeadas y
// transparentes), apple-touch-icon-180.png (opaco y cuadrado: iOS redondea las esquinas)
// e icon-maskable-512.png (fondo a sangre y dibujo dentro de la zona segura del 80 %).

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../icons/', import.meta.url));

const AMBER = '#D4A24C';
const INK = '#2A1E08';
const FRET_OPACITY = 0.55;
const RADIUS = 22;

const STRINGS_X = [32, 44, 56, 68];
const STRING = { y0: 20, y1: 80, w: 4 };
const FRETS_Y = [38, 62];
const FRET = { x0: 24, x1: 76, h: 3.5 };
const DOT = { cx: 50, cy: 50, r: 8.5 };

/* ----- SVG ----- */

function svg() {
  const rect = (x, y, w, h, rx, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"${extra}/>`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
    `  ${rect(0, 0, 100, 100, RADIUS, ` fill="${AMBER}"`)}`,
    `  <g fill="${INK}" opacity="${FRET_OPACITY}">`,
    ...FRETS_Y.map((y) => `    ${rect(FRET.x0, y - FRET.h / 2, FRET.x1 - FRET.x0, FRET.h, FRET.h / 2)}`),
    '  </g>',
    `  <g fill="${INK}">`,
    ...STRINGS_X.map((x) => `    ${rect(x - STRING.w / 2, STRING.y0, STRING.w, STRING.y1 - STRING.y0, STRING.w / 2)}`),
    `    <circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}"/>`,
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}

/* ----- PNG ----- */

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const AMBER_RGB = hex(AMBER);
const INK_RGB = hex(INK);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return Math.hypot(x - cx, y - cy) <= r;
}

/** Color y opacidad en (x, y) del dibujo (0–100). rounded: esquinas transparentes. */
function sample(x, y, { rounded }) {
  if (rounded && !inRoundRect(x, y, 0, 0, 100, 100, RADIUS)) return [0, 0, 0, 0];
  let c = AMBER_RGB;
  if (FRETS_Y.some((fy) => inRoundRect(x, y, FRET.x0, fy - FRET.h / 2, FRET.x1, fy + FRET.h / 2, FRET.h / 2))) {
    c = mix(c, INK_RGB, FRET_OPACITY);
  }
  if (STRINGS_X.some((sx) => inRoundRect(x, y, sx - STRING.w / 2, STRING.y0, sx + STRING.w / 2, STRING.y1, STRING.w / 2))
    || Math.hypot(x - DOT.cx, y - DOT.cy) <= DOT.r) {
    c = INK_RGB;
  }
  return [...c, 1];
}

/** scale < 1 encoge el dibujo (no el fondo) hacia el centro: versión maskable. */
function renderPng(size, { rounded = true, scale = 1, ss = 4 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = ((px + (sx + 0.5) / ss) / size) * 100;
          const y = ((py + (sy + 0.5) / ss) / size) * 100;
          const inner = sample(50 + (x - 50) / scale, 50 + (y - 50) / scale, { rounded: false });
          const [r, g, b, a] = scale === 1 ? sample(x, y, { rounded }) : inner;
          acc = [acc[0] + r * a, acc[1] + g * a, acc[2] + b * a, acc[3] + a];
        }
      }
      const o = (py * size + px) * 4;
      const alpha = acc[3] / (ss * ss);
      rgba[o] = acc[3] ? Math.round(acc[0] / acc[3]) : 0;
      rgba[o + 1] = acc[3] ? Math.round(acc[1] / acc[3]) : 0;
      rgba[o + 2] = acc[3] ? Math.round(acc[2] / acc[3]) : 0;
      rgba[o + 3] = Math.round(alpha * 255);
    }
  }
  return rgba;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // sin filtro
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'icon.svg'), svg());
console.log('icons/icon.svg');
const outputs = [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['apple-touch-icon-180.png', 180, { rounded: false }],
  ['icon-maskable-512.png', 512, { scale: 0.8 }],
];
for (const [name, size, opts] of outputs) {
  writeFileSync(join(OUT, name), encodePng(size, renderPng(size, opts)));
  console.log(`icons/${name} (${size}×${size})`);
}
