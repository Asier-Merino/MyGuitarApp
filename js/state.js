// Instancias únicas del almacén y los ajustes para toda la app (solo navegador).
import { createStore } from './storage.js';
import { createSettings } from './settings.js';

export const store = createStore();
export const settings = createSettings(store);
