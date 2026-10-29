// Router por hash ('#/teoria', '#/glosario/concepto/octave'…) con historial propio
// para la flecha ← (BUILD_PLAN 6.4): cada entrada guarda su profundidad en history.state,
// así se sabe si "atrás" sigue dentro de la app o hay que ir a la pantalla madre.

export function compileRoute(pattern) {
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
      let params;
      try {
        params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      } catch {
        continue; // %XX mal formado
      }
      return { route, params };
    }
  }
  return null;
}

/** onRoute(path) pinta la pantalla de `path` ('/teoria'…). */
export function createRouter({ onRoute }) {
  let lastDepth = 0; // profundidad de la última pantalla pintada
  const currentPath = () => location.hash.replace(/^#/, '') || '/';
  const depth = () => (Number.isInteger(history.state?.depth) ? history.state.depth : 0);

  function resolve() {
    const path = currentPath();
    onRoute(path);
  }

  // Un enlace normal (<a href="#/x">) crea una entrada sin profundidad: se la ponemos.
  function onHashChange() {
    if (!Number.isInteger(history.state?.depth)) {
      history.replaceState({ depth: lastDepth + 1 }, '', location.href);
    }
    lastDepth = depth();
    resolve();
  }

  return {
    start() {
      if (!Number.isInteger(history.state?.depth)) history.replaceState({ depth: 0 }, '', location.href);
      lastDepth = depth();
      window.addEventListener('hashchange', onHashChange);
      resolve();
    },
    /** Vuelve a pintar la pantalla actual (p. ej. al cambiar la notación). */
    refresh: resolve,
    replace(path) {
      history.replaceState({ depth: depth() }, '', `#${path}`);
      resolve();
    },
    /** Flecha ←: atrás en el historial si la pantalla anterior es de la app; si no, a `fallback`. */
    back(fallback = '/') {
      if (depth() > 0) history.back();
      else this.replace(fallback);
    },
  };
}
