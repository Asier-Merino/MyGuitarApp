// Comprueba que el service worker guarda todos los archivos de la app,
// para que no falte ninguno al usarla sin conexión.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(join(root, 'sw.js'), 'utf8');

function listFiles(dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const full = join(abs, name);
    if (statSync(full).isDirectory()) return listFiles(relative(root, full));
    return [`./${relative(root, full).split(sep).join('/')}`];
  });
}

const assets = [...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

test('CACHE_VERSION es un entero', () => {
  assert.match(sw, /const CACHE_VERSION = \d+;/);
});

test('todos los archivos de ASSETS existen', () => {
  for (const asset of assets) {
    if (asset === './') continue;
    assert.ok(existsSync(join(root, asset)), `No existe ${asset}`);
  }
});

test('ASSETS incluye todos los archivos de la app', () => {
  const appFiles = [
    './index.html',
    './manifest.webmanifest',
    ...listFiles('css'),
    ...listFiles('js'),
    ...listFiles('icons'),
  ];
  const missing = appFiles.filter((f) => !assets.includes(f));
  assert.deepEqual(missing, [], `Añade a ASSETS en sw.js: ${missing.join(', ')}`);
});
