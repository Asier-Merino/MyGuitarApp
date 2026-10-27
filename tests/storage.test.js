import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, migrate, SCHEMA_VERSION, STORAGE_KEY } from '../js/storage.js';
import { createSettings, normalizeSettings, defaultSettings, isValidSetting } from '../js/settings.js';

function fakeBackend(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

function throwingBackend() {
  const fail = () => { throw new Error('QuotaExceededError'); };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

test('almacén nuevo con datos por defecto', () => {
  const store = createStore({ backend: fakeBackend() });
  assert.equal(store.persistent, true);
  assert.deepEqual(store.data, { schemaVersion: SCHEMA_VERSION, settings: {}, stats: {}, history: [] });
});

test('guarda y vuelve a leer (se conserva al cerrar y abrir)', () => {
  const backend = fakeBackend();
  const a = createStore({ backend });
  assert.equal(a.update((d) => { d.settings.notation = 'en'; }), true);
  const b = createStore({ backend });
  assert.equal(b.data.settings.notation, 'en');
  assert.equal(JSON.parse(backend.map.get(STORAGE_KEY)).schemaVersion, SCHEMA_VERSION);
});

test('datos corruptos: arranca con valores por defecto y guarda copia', () => {
  const backend = fakeBackend({ [STORAGE_KEY]: '{no es json' });
  const store = createStore({ backend });
  assert.deepEqual(store.data.settings, {});
  assert.ok(store.lastError);
  assert.equal(backend.map.get(`${STORAGE_KEY}.backup`), '{no es json');
});

test('si localStorage falla no se rompe nada', () => {
  const store = createStore({ backend: throwingBackend() });
  assert.deepEqual(store.data.stats, {});
  assert.equal(store.update((d) => { d.stats.x = 1; }), false);
  assert.equal(store.data.stats.x, 1); // sigue en memoria
});

test('sin localStorage usa memoria', () => {
  const store = createStore({ backend: null });
  assert.equal(store.persistent, false);
  assert.equal(store.update((d) => { d.stats.y = 2; }), true);
});

test('migrate: datos sin versión y de versión futura', () => {
  const m = migrate({ settings: { theme: 'dark' }, stats: { 'note:s6f5': {} } });
  assert.equal(m.schemaVersion, SCHEMA_VERSION);
  assert.equal(m.settings.theme, 'dark');
  assert.ok(m.stats['note:s6f5']);
  assert.deepEqual(m.history, []);
  assert.throws(() => migrate({ schemaVersion: SCHEMA_VERSION + 1 }), /más nueva/);
  assert.throws(() => migrate([]));
  assert.throws(() => migrate(null));
});

test('exportar e importar JSON', () => {
  const a = createStore({ backend: fakeBackend() });
  a.update((d) => { d.settings.notation = 'en'; d.stats.k = { ok: 3 }; d.history.push({ t: 1 }); });
  const json = a.exportJSON();
  const parsed = JSON.parse(json);
  assert.equal(parsed.app, 'myguitarapp');
  assert.ok(parsed.exportedAt);

  const b = createStore({ backend: fakeBackend() });
  assert.deepEqual(b.importJSON(json), { ok: true });
  assert.deepEqual(b.data, a.data);
});

test('importar archivos no válidos no toca los datos', () => {
  const store = createStore({ backend: fakeBackend() });
  store.update((d) => { d.stats.keep = true; });
  assert.equal(store.importJSON('hola').ok, false);
  assert.equal(store.importJSON('[1,2]').ok, false);
  assert.equal(store.importJSON(JSON.stringify({ app: 'otra-app' })).ok, false);
  assert.equal(store.importJSON(JSON.stringify({ schemaVersion: 999 })).ok, false);
  assert.equal(store.data.stats.keep, true);
});

test('borrar progreso conserva los ajustes', () => {
  const store = createStore({ backend: fakeBackend() });
  store.update((d) => { d.settings.notation = 'en'; d.stats.a = 1; d.history.push(1); });
  store.clearProgress();
  assert.deepEqual(store.data.stats, {});
  assert.deepEqual(store.data.history, []);
  assert.equal(store.data.settings.notation, 'en');
});

test('ajustes: valores por defecto y validación', () => {
  const d = defaultSettings();
  assert.equal(d.notation, 'es');
  assert.equal(d.accidentals, 'sharp');
  assert.equal(d.theme, 'system');
  assert.equal(isValidSetting('notation', 'fr'), false);
  assert.equal(isValidSetting('volume', 1.5), false);
  assert.equal(isValidSetting('sound', false), true);
  const n = normalizeSettings({ notation: 'en', theme: 'pink', unknown: 1 });
  assert.equal(n.notation, 'en');
  assert.equal(n.theme, 'system');
  assert.ok(!('unknown' in n));
});

test('ajustes: set guarda, avisa y persiste', () => {
  const backend = fakeBackend();
  const settings = createSettings(createStore({ backend }));
  const calls = [];
  const off = settings.subscribe((_, key) => calls.push(key));
  settings.set('notation', 'en');
  settings.set('notation', 'en'); // sin cambios: no avisa
  assert.deepEqual(calls, ['notation']);
  assert.throws(() => settings.set('notation', 'fr'));
  off();
  settings.set('accidentals', 'flat');
  assert.deepEqual(calls, ['notation']);

  const reopened = createSettings(createStore({ backend }));
  assert.equal(reopened.get('notation'), 'en');
  assert.equal(reopened.get('accidentals'), 'flat');
});
