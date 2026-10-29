// Mapa de pantallas (BUILD_PLAN 6.4), sin DOM: qué rutas existen, qué parámetros son
// válidos y a qué pantalla vuelve la flecha ← cuando no hay historial (app recién abierta).

import { compileRoute, matchRoute } from './router.js';
import { SECTION_IDS, SECTION_MODULES, getModule, getPlannedExercise } from './data/modules.js';
import { getBlock, getConcept, blockConcepts } from './data/concepts.js';

const isSection = (s) => SECTION_IDS.includes(s);
const inSection = (section, slug) => isSection(section) && SECTION_MODULES[section].includes(slug);

// El orden importa: las rutas fijas van antes que las que tienen parámetros en la misma posición.
const ROUTES = [
  { name: 'home', path: '/', parent: null },
  { name: 'tunings', path: '/afinaciones', parent: () => '/' },
  { name: 'glossary', path: '/glosario', parent: () => '/' },
  {
    name: 'concept',
    path: '/glosario/concepto/:id',
    valid: (p) => Boolean(getConcept(p.id)),
    parent: (p) => `/glosario/${getConcept(p.id).block}`,
  },
  {
    name: 'glossaryBlock',
    path: '/glosario/:block',
    valid: (p) => Boolean(getBlock(p.block)) && blockConcepts(p.block).length > 0,
    parent: () => '/glosario',
  },
  { name: 'profile', path: '/perfil', parent: () => '/' },
  { name: 'about', path: '/perfil/acerca-de', parent: () => '/perfil' },
  { name: 'settings', path: '/ajustes', parent: () => '/' },
  { name: 'section', path: '/:section', valid: (p) => isSection(p.section), parent: () => '/' },
  { name: 'mixed', path: '/:section/mezclada', valid: (p) => isSection(p.section), parent: (p) => `/${p.section}` },
  {
    name: 'lesson',
    path: '/teoria/:module/aprender',
    valid: (p) => inSection('teoria', p.module) && getModule(p.module).lesson,
    parent: (p) => `/teoria/${p.module}`,
  },
  {
    name: 'reference',
    path: '/teoria/:module/consulta',
    valid: (p) => inSection('teoria', p.module) && Boolean(getModule(p.module).reference),
    parent: (p) => `/teoria/${p.module}`,
  },
  {
    name: 'module',
    path: '/:section/:module',
    valid: (p) => inSection(p.section, p.module),
    parent: (p) => `/${p.section}`,
  },
  {
    name: 'setup',
    path: '/:section/:module/:exercise',
    valid: (p) => Boolean(getPlannedExercise(p.section, p.module, p.exercise)),
    parent: (p) => `/${p.section}/${p.module}`,
  },
].map((r) => ({ ...r, ...compileRoute(r.path) }));

export const ROUTE_NAMES = Object.freeze(ROUTES.map((r) => r.name));

/**
 * Devuelve { name, params, parent } para una ruta ('/teoria/notas' o '#/teoria/notas'),
 * o null si no existe o sus parámetros no son válidos.
 */
export function resolvePath(path) {
  const clean = String(path).replace(/^#/, '').split('?')[0] || '/';
  for (const route of ROUTES) {
    const match = matchRoute([route], clean);
    if (!match) continue;
    const { params } = match;
    if (route.valid && !route.valid(params)) continue;
    return { name: route.name, params, parent: route.parent ? route.parent(params) : null };
  }
  return null;
}

export const routeExists = (path) => resolvePath(path) !== null;
