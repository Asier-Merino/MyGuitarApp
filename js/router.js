// Router por hash: '#/teoria', '#/practica/blues', '#/ajustes'…

function compile(pattern) {
  const keys = [];
  const source = pattern
    .split('/')
    .map((part) => {
      if (part.startsWith(':')) {
        keys.push(part.slice(1));
        return '([^/]+)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { keys, regex: new RegExp(`^${source}/?$`) };
}

/** Busca la ruta que coincide con `path`. Devuelve { route, params } o null. */
export function matchRoute(compiledRoutes, path) {
  for (const route of compiledRoutes) {
    const m = path.match(route.regex);
    if (m) {
      const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      return { route, params };
    }
  }
  return null;
}

/**
 * routes: [{ path: '/teoria/:module', view: (params, path) => void }]
 * notFound: (path) => void
 */
export function createRouter({ routes, notFound, defaultPath }) {
  const compiled = routes.map((r) => ({ ...r, ...compile(r.path) }));
  const listeners = new Set();

  const currentPath = () => location.hash.replace(/^#/, '') || '';

  function resolve() {
    const path = currentPath();
    if (!path || path === '/') {
      location.replace(`#${defaultPath}`);
      return;
    }
    const match = matchRoute(compiled, path);
    if (match) match.route.view(match.params, path);
    else notFound(path);
    listeners.forEach((fn) => fn(path));
  }

  return {
    start() {
      window.addEventListener('hashchange', resolve);
      resolve();
    },
    /** Vuelve a pintar la vista actual (p. ej. al cambiar la notación). */
    refresh: resolve,
    navigate(path) { location.hash = path; },
    get path() { return currentPath(); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
