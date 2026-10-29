# CLAUDE.md

**GuitarSeo**: app personal (PWA) para practicar teoría musical de guitarra. El plan completo, con fases, datos de referencia y criterios de "hecho", está en **`BUILD_PLAN.md`**: léelo entero antes de trabajar.

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
- Todo texto explicativo (conceptos, ayudas y "¿por qué?") va en `js/data/concepts.js` o se genera a partir de reglas. **Nunca se escriben explicaciones sueltas dentro de los módulos.**
- Todo ejercicio nuevo declara `howTo` y `concepts`, y su `check()` devuelve `why`.
- Toda ronda de ejercicio se registra en el historial de sesiones.

## Diseño
- La app se llama **GuitarSeo**. El estilo y cada pantalla están definidos en BUILD_PLAN (sección 6): síguelos tal cual. Si algo no está definido, propónlo al usuario antes de inventarlo.
- Inspiración Chess.com solo en el estilo: nunca su marca, sus colores exactos, su logo ni sus piezas.
- Colores solo mediante tokens CSS, definidos para el tema oscuro (por defecto) y el claro. Nunca colores sueltos en el código.
- Un único botón ámbar (acción principal) por pantalla. El resto, botones grises con el mismo efecto físico.
- Toda pantalla interior lleva la cabecera ← título ?. La app instalada no tiene botón de atrás del navegador.
- Comprueba cada pantalla nueva en los dos temas y en las dos orientaciones del mástil.
- Al terminar cada fase, guarda capturas de las pantallas nuevas (tamaño móvil, tema oscuro y claro) en `docs/capturas/fase-N/` y dile al usuario dónde están para que las revise. Esa carpeta no se incluye en la caché del service worker.

## Comandos
- Servidor local: `npx serve .` o `python3 -m http.server 8000`
- Tests: `npm test`

## Flujo de trabajo
1. Trabaja **una fase por sesión**, la que pida el usuario (la Fase 1 son dos sesiones: 1A y 1B).
2. Antes de terminar: `npm test` en verde, comprobación visual en tamaño móvil y escritorio si hay navegador disponible, incrementar `CACHE_VERSION` en `sw.js` y la versión visible en ajustes.
3. Marca las casillas de la fase en `BUILD_PLAN.md` y añade una fila al Registro de cambios.
4. Commit con mensaje claro (`Fase N: ...`) y push a `main`.
5. Explica al usuario, en pocas líneas, qué probar en el iPhone. **No empieces la fase siguiente sin su confirmación.**
6. Si detectas un error o una mejora en el plan, propónla al usuario y actualiza `BUILD_PLAN.md` si la acepta.
7. Los datos musicales de BUILD_PLAN (afinaciones, acordes, CAGED, cajas, licks, rasgueos, progresiones) son la referencia; si un test contradice esos datos, revisa ambos y avisa al usuario en vez de "arreglar" el test.

## Calidad y veracidad
Esta app enseña teoría musical a alguien que está aprendiendo: un dato falso se lo aprenderá mal. La exactitud va antes que la velocidad.

### Veracidad musical
- No inventes teoría. Todo dato musical (notas, acordes, escalas, cajas, formas, afinaciones, patrones) sale de las tablas de BUILD_PLAN o se **calcula** con las funciones de `js/core/`. Nunca escribas a mano una nota o un traste que se pueda calcular.
- Todo dato musical nuevo (un acorde, un lick, un patrón, una afinación) llega con un test que lo comprueba contra las reglas de la teoría, no contra sí mismo.
- Si no estás seguro de un dato o de una explicación, **pregunta al usuario en vez de suponer**. Es mejor dejar algo pendiente que enseñar algo incorrecto.
- Cuando algo es una convención que varía según el método (numeración de las cajas, digitaciones, nombres de patrones, símbolos de tablatura), el texto lo dice ("lo más habitual es…").
- Los textos explicativos deben coincidir con lo que hace el código: si una ficha dice "4 trastes entre Sol y Si", un test o una comprobación debe confirmarlo.

### Textos para el usuario
- Español de España correcto, con tildes, ñ y signos de apertura (¿ ¡). Terminología habitual de guitarra en español (traste, cejuela, cejilla, rasgueo, fundamental), con el término inglés entre paréntesis la primera vez si es útil.
- Nivel de alguien con un año tocando: frases cortas, un concepto cada vez, un ejemplo concreto en el mástil. Ningún término técnico sin su palabra pulsable al glosario.
- Relee cada texto nuevo antes de darlo por bueno: ortografía, que sea cierto y que se entienda sin contexto.

### Forma de trabajar
- Lee el código existente relacionado antes de cambiarlo, y sigue los patrones que ya hay.
- Cambios pequeños y verificados uno a uno, no grandes bloques sin probar.
- Sin código muerto, `TODO` olvidados ni `console.log` de depuración en lo que se sube.
- No amplíes el alcance por tu cuenta: si ves una mejora, propónla y espera respuesta.
- Ante una decisión ambigua o con varias opciones razonables, pregunta.

### Verificación antes de cerrar una fase
1. `npm test` en verde.
2. Abre la app en un navegador (por ejemplo, con Playwright) a tamaño móvil (390×844) y escritorio, y comprueba que la consola no tiene errores.
3. Juega al menos una ronda de cada ejercicio nuevo en los 3 niveles, con notación ES y EN, y con una afinación no estándar si el ejercicio la admite.
4. Revisa los casos límite: traste 0, último traste, enarmónicos (Fa♯/Sol♭), paso entre las cuerdas Sol y Si, afinaciones abiertas, tema oscuro y claro, y mástil vertical y horizontal.
5. Haz una **autorrevisión del diff completo** como si fueras otra persona revisándolo: busca errores, incoherencias entre texto y datos, y textos mal escritos. Corrige lo que encuentres.
6. Marca una casilla solo si está terminada y comprobada.

### Honestidad en el resumen
- Di qué has comprobado y cómo, y qué no has podido comprobar (por ejemplo, el sonido real en el iPhone o el modo silencio).
- Di las limitaciones o dudas que queden. No presentes como hecho algo que no has verificado.
