// Genera los iconos PNG de la app sin dependencias: `npm run icons`.
// Diseño: un mástil en vertical (cejuela arriba, cuerda 6 a la izquierda) con el acorde
// de Mi mayor coloreado por función: fundamental (coral), 3ª (ámbar) y 5ª (azul).

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../icons/', import.meta.url));

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

const BG_TOP = hex('#25343a');
const BG_BOTTOM = hex('#131b1f');
const WOOD = hex('#c48a52');
const WOOD_DARK = hex('#a8713f');
const NUT = hex('#f3ead8');
const FRET = hex('#d7dadd');
const STRING = hex('#f7f2e8');
const ROOT = hex('#e5533d');
const THIRD = hex('#f0a91b');
const FIFTH = hex('#3b7be0');
const RING = hex('#ffffff');

// Geometría en coordenadas 0–1.
const NECK = { x0: 0.2, x1: 0.8, y0: 0.15 };
const NUT_Y = [0.15, 0.205];
const FRETS = [0.385, 0.565, 0.745, 0.925];
const stringX = (s) => 0.26 + ((6 - s) * (0.48 / 5)); // s = 6 (izquierda) … 1 (derecha)
const fretCenter = (f) => [(NUT_Y[1] + FRETS[0]) / 2, (FRETS[0] + FRETS[1]) / 2][f - 1];
const DOTS = [
  { s: 5, f: 2, color: FIFTH }, // Si: 5ª
  { s: 4, f: 2, color: ROOT }, // Mi: fundamental
  { s: 3, f: 1, color: THIRD }, // Sol#: 3ª
];
const DOT_R = 0.037;

function colorAt(x, y) {
  let c = lerp(BG_TOP, BG_BOTTOM, y);
  if (x >= NECK.x0 && x <= NECK.x1 && y >= NECK.y0) {
    c = lerp(WOOD, WOOD_DARK, (y - NECK.y0) / (1 - NECK.y0));
    if (y >= NUT_Y[0] && y <= NUT_Y[1]) c = NUT;
    if (FRETS.some((fy) => Math.abs(y - fy) <= 0.008)) c = FRET;
  }
  for (let s = 1; s <= 6; s++) {
    const w = 0.0045 + (s - 1) * 0.0011;
    if (y >= NUT_Y[0] && Math.abs(x - stringX(s)) <= w) c = STRING;
  }
  for (const d of DOTS) {
    const dist = Math.hypot(x - stringX(d.s), y - fretCenter(d.f));
    if (dist <= DOT_R + 0.009) c = RING;
    if (dist <= DOT_R) c = d.color;
  }
  return c;
}

function render(size, ss = 4) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = colorAt((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
          acc = acc.map((v, i) => v + c[i]);
        }
      }
      const o = (py * size + px) * 4;
      rgba[o] = Math.round(acc[0] / (ss * ss));
      rgba[o + 1] = Math.round(acc[1] / (ss * ss));
      rgba[o + 2] = Math.round(acc[2] / (ss * ss));
      rgba[o + 3] = 255; // opaco: iOS redondea las esquinas
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
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon-180.png', 180]]) {
  writeFileSync(join(OUT, name), encodePng(size, render(size)));
  console.log(`icons/${name} (${size}×${size})`);
}
