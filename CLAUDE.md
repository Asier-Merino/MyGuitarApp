# CLAUDE.md

App personal (PWA) para practicar teoría musical de guitarra. El plan completo, con fases, datos de referencia y criterios de "hecho", está en **`BUILD_PLAN.md`**: léelo entero antes de trabajar.

## Usuario
- Guitarrista con ~1 año de experiencia, diestro, habla español.
- Usa sobre todo un **iPhone** (Safari / pantalla de inicio), también PC.
- Escríbele siempre en español, en un tono claro y sin jerga técnica innecesaria.

## Stack (no cambiar sin consultar)
- HTML + CSS + JavaScript vanilla con módulos ES nativos. **Sin frameworks, sin bundler, sin dependencias de runtime.**
- SVG para mástil y diagramas. Web Audio API (Karplus-Strong) para el sonido. Web Speech API para la voz.
- `localStorage` versionado para persistencia. Hash router.
- Alojada en GitHub Pages (HTTPS).

## Convenciones
- Interfaz en español; identificadores de código y nombres de archivo en inglés.
- Toda la lógica musical en `js/core/` y `js/data/`, **sin DOM**, con tests en `tests/`.
- Notas como pitch class 0–11 (0 = Do/C). Cuerdas 1 (Mi aguda) a 6 (Mi grave).
- Los nombres de nota se muestran siempre con el componente de doble notación (`NoteLabel`); nunca escribir nombres de nota a mano en la interfaz.
- Colores de función musical como tokens CSS (ver BUILD_PLAN 4.5). Nunca transmitir información solo con color.
- Zonas táctiles de al menos 44×44 px. Mobile-first.
- Envolver todos los accesos a `localStorage` en try/catch.

## Comandos
- Servidor local: `npx serve .` o `python3 -m http.server 8000`
- Tests: `npm test`

## Flujo de trabajo
1. Trabaja **una fase por sesión**, la que pida el usuario.
2. Antes de terminar: `npm test` en verde, comprobación visual en tamaño móvil y escritorio si hay navegador disponible, incrementar `CACHE_VERSION` en `sw.js` y la versión visible en ajustes.
3. Marca las casillas de la fase en `BUILD_PLAN.md` y añade una fila al Registro de cambios.
4. Commit con mensaje claro (`Fase N: ...`) y push a `main`.
5. Explica al usuario, en pocas líneas, qué probar en el iPhone. **No empieces la fase siguiente sin su confirmación.**
6. Si detectas un error o una mejora en el plan, propónla al usuario y actualiza `BUILD_PLAN.md` si la acepta.
7. Los datos musicales de BUILD_PLAN (acordes, CAGED, cajas, licks) son la referencia; si un test contradice esos datos, revisa ambos y avisa al usuario en vez de "arreglar" el test.
