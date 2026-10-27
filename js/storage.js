// Persistencia en localStorage con esquema versionado. Todos los accesos van en try/catch:
// si localStorage no está disponible, se usa memoria (los datos no se conservan).

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'myguitarapp';
const EXPORT_APP_ID = 'myguitarapp';

export function defaultData() {
  return { schemaVersion: SCHEMA_VERSION, settings: {}, stats: {}, history: [] };
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Migraciones: MIGRATIONS[n] convierte datos de la versión n a la n+1. */
const MIGRATIONS = {
  // 0 → 1: datos sin versión; se conservan los campos conocidos.
  0: (d) => ({ ...defaultData(), ...d, schemaVersion: 1 }),
};

function normalize(d) {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: isPlainObject(d.settings) ? d.settings : {},
    stats: isPlainObject(d.stats) ? d.stats : {},
    history: Array.isArray(d.history) ? d.history : [],
  };
}

/** Lleva unos datos de cualquier versión anterior a la actual. Lanza error si no son válidos. */
export function migrate(raw) {
  if (!isPlainObject(raw)) throw new Error('El formato de los datos no es válido');
  let data = { ...raw };
  let version = Number.isInteger(data.schemaVersion) ? data.schemaVersion : 0;
  if (version > SCHEMA_VERSION) {
    throw new Error('Los datos son de una versión más nueva de la app. Actualiza la app primero.');
  }
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`No se pueden convertir datos de la versión ${version}`);
    data = step(data);
    version += 1;
  }
  return normalize(data);
}

function memoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

function detectLocalStorage() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const probe = '__myguitarapp_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

/**
 * Crea el almacén. `backend` permite inyectar un objeto con getItem/setItem/removeItem
 * (tests); por defecto usa localStorage si funciona.
 */
export function createStore({ backend, key = STORAGE_KEY } = {}) {
  const real = backend === undefined ? detectLocalStorage() : backend;
  const target = real || memoryBackend();
  let lastError = null;
  let data = read();

  function read() {
    let text = null;
    try {
      text = target.getItem(key);
      if (text == null) return defaultData();
      return migrate(JSON.parse(text));
    } catch (e) {
      lastError = e;
      // Guardar una copia de los datos ilegibles antes de que se sobrescriban.
      try { if (text != null) target.setItem(`${key}.backup`, text); } catch { /* sin espacio */ }
      return defaultData();
    }
  }

  function save() {
    try {
      target.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      lastError = e;
      return false;
    }
  }

  return {
    /** true si los datos se guardan de verdad en el dispositivo. */
    persistent: Boolean(real),
    get data() { return data; },
    get lastError() { return lastError; },

    /** Modifica los datos con `mutator(data)` y guarda. Devuelve si se pudo guardar. */
    update(mutator) {
      mutator(data);
      return save();
    },

    exportJSON() {
      return JSON.stringify({ app: EXPORT_APP_ID, exportedAt: new Date().toISOString(), ...data }, null, 2);
    },

    /** Sustituye los datos por los de un JSON exportado. Devuelve { ok, error? }. */
    importJSON(text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: 'El archivo no es un JSON válido.' };
      }
      try {
        if (!isPlainObject(parsed) || (parsed.app !== undefined && parsed.app !== EXPORT_APP_ID)) {
          throw new Error('El archivo no es una copia de esta app.');
        }
        const { app, exportedAt, ...rest } = parsed;
        data = migrate(rest);
      } catch (e) {
        return { ok: false, error: e.message };
      }
      return save() ? { ok: true } : { ok: false, error: 'No se pudieron guardar los datos importados.' };
    },

    /** Borra estadísticas e historial; conserva los ajustes. */
    clearProgress() {
      data.stats = {};
      data.history = [];
      return save();
    },
  };
}
