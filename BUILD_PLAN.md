# BUILD PLAN — GuitarSeo

> Documento de referencia para construir la app con Claude Code, fase a fase.
> Leer junto con `CLAUDE.md`. Las casillas `[ ]` se marcan `[x]` al completar cada punto.

---

## 0. Cómo usar este plan

1. Crear una carpeta vacía con `CLAUDE.md` y `BUILD_PLAN.md` y abrir Claude Code en ella.
2. En cada sesión, pedir: **"Lee CLAUDE.md y BUILD_PLAN.md y ejecuta la Fase N."** (la Fase 1 se divide en **1A** y **1B**: cada una es una sesión).
3. Claude Code trabaja **una fase por sesión**. Al terminar:
   - pasa los tests (`npm test`),
   - marca las casillas de la fase,
   - añade una entrada al **Registro de cambios** (sección 13),
   - hace commit y push (se despliega en GitHub Pages),
   - pide al usuario que la pruebe en el iPhone.
4. **No empezar la fase siguiente sin la confirmación del usuario.** Si el usuario pide cambios, se hacen antes de avanzar.
5. Si algo del plan resulta incorrecto o mejorable durante la construcción, se propone el cambio al usuario y se actualiza este documento.

---

## 1. Visión del producto

**GuitarSeo** es una app personal para practicar teoría musical aplicada a la guitarra. El usuario lleva **un año tocando**, es **diestro**, usa sobre todo un **iPhone** (también PC) y habla español.

### Principios
- **Navegación por pantallas, como el menú de un juego** (6.4): cada pantalla tiene un solo propósito. Desde **Inicio** se entra a cuatro secciones principales, más Perfil y Ajustes:
  - **TEORÍA**: sin guitarra. Lecciones cortas por tarjetas, consulta (diagramas, mástil, escalas) y ejercicios en pantalla tipo quiz.
  - **PRÁCTICA**: con la guitarra en las manos. Manos ocupadas, así que: texto grande, avance automático con temporizador, voz que dice la nota o acorde, metrónomo y bases. **Sin autoevaluación**: el resumen solo dice qué se ha hecho.
  - **AFINACIONES**: las afinaciones que usa la app, para verlas y escucharlas.
  - **GLOSARIO**: todos los conceptos, con buscador.
  - **Perfil** (estadísticas, progreso y récords) y **Ajustes**, como iconos en Inicio.
- **Estilo inspirado en la app de Chess.com** (solo sus principios, nunca su marca): fondo oscuro neutro, un único acento **ámbar mate**, botones "físicos" y el **mástil** como protagonista visual (6.1).
- **Ayuda "?" en todos los ejercicios**: un recordatorio corto de la teoría que trabaja cada uno, y un **"¿Por qué?"** que explica cada fallo concreto (6.8).
- **Navegación libre**: todo está accesible siempre; no hay un orden obligatorio ni nada bloqueado.
- **Variedad**: los ejercicios se **generan al azar** a partir de reglas de teoría, cada módulo tiene **varios tipos de ejercicio** y **3 niveles** (Básico, Intermedio, Avanzado).
- **Doble notación siempre visible**: la principal (ES o EN, a elegir en Ajustes) en grande, y la otra en pequeño al lado. Ejemplo: **Fa** <sub>F</sub> o **F** <sub>Fa</sub>.
- **Mobile-first**, adaptada a PC. El mástil se dibuja **en vertical en el móvil en vertical** y **en horizontal en apaisado o en PC**.
- **PWA** instalable en el iPhone (pantalla de inicio, pantalla completa, funciona sin conexión), alojada en **GitHub Pages**.

### Módulos
| # | Módulo | Teoría (sin guitarra) | Práctica (con guitarra) |
|---|---|---|---|
| 1 | Notas del mástil | Quiz "¿qué nota es?", "encuéntrala", octavas, unísonos, rellena el mástil | La app dice una nota y tú la tocas en todas las cuerdas a contrarreloj |
| 2 | Acordes abiertos | Diagramas, notas que los forman, quiz | Cambios de acordes con metrónomo, progresiones y rasgueo |
| 3 | Oído | ¿Mayor o menor? | Suena una nota y la buscas en la guitarra |
| 4 | Escala y tonalidad | Intervalos, construcción, grados, quiz | Escala con metrónomo y progresiones de la tonalidad |
| 5 | Blues y slide | 12 compases, *blue note*, quiz | Base shuffle, notas objetivo, licks pregunta-respuesta |
| 6 | CAGED | Explorador de formas, quiz | Tocar un acorde en una forma, recorrer las 5 formas |
| 7 | Calentamiento | — | Un dedo por traste con tablatura y subida automática de tempo |

- Orden en la lista de cada sección: ver 6.6.2.
- **Progreso y Glosario ya no son módulos**: el progreso está en **Perfil** (6.6.13) y el Glosario es una sección principal (6.6.17).
- La **sesión mezclada** está arriba en las pantallas de Teoría y de Práctica.

---

## 2. Stack y decisiones técnicas

- **HTML + CSS + JavaScript vanilla** con **módulos ES nativos**. Sin frameworks, sin bundler, sin paso de build.
- **Sin dependencias de runtime.** Las únicas herramientas son Node (para tests con `node --test`, que encuentra solo los `*.test.js`) y un servidor estático local.
- **Gráficos**: SVG generado desde JS (mástil, diagramas, tablatura e iconos).
- **Audio**: Web Audio API con síntesis **Karplus-Strong** (cuerda pulsada) y un planificador con *lookahead* para metrónomo y bases.
- **Voz**: `speechSynthesis` (Web Speech API), `es-ES` o `en-US` según la notación principal.
- **Pantalla encendida**: Screen Wake Lock API en la sección Práctica.
- **Persistencia**: `localStorage` con esquema versionado, guardado automático, `navigator.storage.persist()` y exportar/importar en JSON (6.9).
- **Enrutado**: hash router (`#/teoria/notas`, `#/practica/blues`…), que mantiene el historial para la flecha ← y el botón atrás del navegador.
- **Hosting**: GitHub Pages, que da HTTPS. Es necesario para service worker, Wake Lock y micrófono en el iPhone. Con una cuenta gratuita, el repositorio tiene que ser **público** (la app no contiene datos personales: el progreso vive en el dispositivo).
- **Idioma**: interfaz en español; identificadores de código en inglés.

---

## 3. Estructura del proyecto

```
/
├── index.html
├── manifest.webmanifest
├── sw.js                      # service worker (cache con versión)
├── package.json               # "type": "module", script "test": "node --test"
├── .nojekyll                  # GitHub Pages sirve los archivos tal cual
├── tools/
│   └── make-icons.mjs         # genera los iconos PNG (npm run icons)
├── icons/                     # icon-192.png, icon-512.png, apple-touch-icon-180.png, maskable
├── docs/
│   └── capturas/fase-N/       # capturas de cada fase (fuera de la caché del service worker)
├── css/
│   └── styles.css             # tokens de color (tema oscuro y claro), botón físico, layout
├── js/
│   ├── main.js                # arranque: rutas → pantallas, tema
│   ├── router.js              # hash router con historial propio para la flecha ←
│   ├── routes.js              # mapa de pantallas y su pantalla madre (sin DOM, con test)
│   ├── storage.js             # localStorage versionado + export/import
│   ├── settings.js            # notación, alteraciones, tema, orientación, sonido, voz, afinación
│   ├── settings-view.js       # pantalla de ajustes
│   ├── state.js               # instancias únicas de almacén y ajustes
│   ├── pwa.js                 # registro del service worker y actualizaciones
│   ├── version.js             # versión visible (v0.N.x = fase N)
│   ├── core/                  # LÓGICA PURA: sin DOM, sin audio, testeable en Node
│   │   ├── theory.js          # pitch classes, intervalos, escalas, acordes, tonalidades
│   │   ├── notation.js        # nombres ES/EN, sostenidos/bemoles, deletreo por letra
│   │   ├── fretboard-model.js # afinación, nota de (cuerda, traste), posiciones de una nota
│   │   ├── random.js          # RNG con semilla opcional, shuffle, elección ponderada
│   │   ├── glossary.js        # buscador del glosario y lector del marcado [[id|…]] {{F#}}
│   │   ├── history.js         # días practicados y tiempo total del registro de sesiones
│   │   └── stats.js           # cálculo de pesos para repetición espaciada
│   ├── data/
│   │   ├── modules.js         # secciones, módulos, niveles y ejercicios previstos
│   │   ├── tunings.js         # las 7 afinaciones (4.2)
│   │   ├── chords.js          # acordes abiertos y de séptima (dedos incluidos)
│   │   ├── caged.js           # plantillas de las 5 formas
│   │   ├── scales.js          # fórmulas y cajas pentatónicas
│   │   ├── blues.js           # progresiones de 12 compases
│   │   ├── licks.js           # licks en La, transportables
│   │   ├── strum-patterns.js  # patrones de rasgueo
│   │   └── concepts.js        # conceptos: glosario, ayudas "?" y palabras pulsables
│   ├── ui/
│   │   ├── fretboard.js       # render SVG del mástil (vertical/horizontal)
│   │   ├── chord-diagram.js   # render SVG de diagramas de acorde
│   │   ├── note-label.js      # componente de doble notación
│   │   ├── tab.js             # tablatura completa (6.7)
│   │   ├── help-sheet.js      # panel de ayuda "?" y "¿Por qué?"
│   │   ├── term.js            # palabras pulsables [[id|texto]] y textos con marcado
│   │   ├── icons.js           # iconos SVG y logo
│   │   ├── tuning-picker.js   # fila y panel para elegir afinación
│   │   └── components.js      # botón físico, cabecera, listas, selector de nivel, resumen de ronda
│   ├── audio/
│   │   ├── context.js         # AudioContext, desbloqueo iOS, audio session
│   │   ├── pluck.js           # muestras Karplus-Strong afinadas (sin Web Audio, con test)
│   │   ├── synth.js           # Karplus-Strong, notas, rasgueos, arpegios
│   │   ├── scheduler.js       # reloj con lookahead
│   │   ├── metronome.js       # incluye la subida automática de tempo
│   │   └── backing.js         # base de blues (bajo, acordes, percusión)
│   ├── screens/               # Inicio, Sección, Módulo, Preparación, Próximamente
│   ├── engine/
│   │   ├── exercise-registry.js
│   │   ├── quiz-runner.js     # motor de ejercicios de Teoría
│   │   ├── practice-runner.js # motor de ejercicios de Práctica (temporizador, voz, wake lock)
│   │   └── speech.js
│   └── modules/
│       ├── notes/
│       ├── chords/
│       ├── ear/
│       ├── theory/            # Escala y tonalidad
│       ├── blues/             # Blues y slide
│       ├── caged/
│       ├── warmup/            # Calentamiento
│       ├── tunings/           # pantalla Afinaciones
│       ├── glossary/
│       └── profile/           # Perfil (sustituye a progress/)
└── tests/
    ├── theory.test.js
    ├── notation.test.js
    ├── fretboard-model.test.js
    ├── tunings.test.js
    ├── chords.test.js
    ├── caged.test.js
    ├── scales.test.js
    ├── blues.test.js
    ├── strum-patterns.test.js
    ├── concepts.test.js
    ├── random.test.js
    ├── pluck.test.js          # la cuerda sintetizada suena afinada (< 2 cents)
    ├── history.test.js
    ├── storage.test.js        # almacén versionado y ajustes (con un localStorage simulado)
    └── sw-assets.test.js      # el service worker guarda todos los archivos de la app
```

Regla clave: **todo lo que es teoría musical vive en `js/core/` y `js/data/`, sin DOM**, para poder testearlo con `node --test`.

---

## 4. Modelo de teoría (referencia exacta)

### 4.1 Notas
- Una nota es un **pitch class** de 0 a 11, con `0 = Do (C)`.
- Para sonar se usa **MIDI**: `freq = 440 * 2^((midi - 69) / 12)`.

| pc | ES (#) | ES (b) | EN (#) | EN (b) |
|---|---|---|---|---|
| 0 | Do | Do | C | C |
| 1 | Do# | Reb | C# | Db |
| 2 | Re | Re | D | D |
| 3 | Re# | Mib | D# | Eb |
| 4 | Mi | Mi | E | E |
| 5 | Fa | Fa | F | F |
| 6 | Fa# | Solb | F# | Gb |
| 7 | Sol | Sol | G | G |
| 8 | Sol# | Lab | G# | Ab |
| 9 | La | La | A | A |
| 10 | La# | Sib | A# | Bb |
| 11 | Si | Si | B | B |

- Al mostrarlas, `#` y `b` se pintan como `♯` y `♭`.
- **Deletreo por letra** para escalas y tonalidades: cada grado usa la letra siguiente (C D E F G A B), con alteración calculada. Así, en Fa mayor sale Sib (no La#) y en Re mayor sale Fa# (no Solb).
- Tonalidades mayores con bemoles: F, Bb, Eb, Ab, Db, Gb. Con sostenidos: G, D, A, E, B, F#.
- En ejercicios de mástil (sin tonalidad), se usa la preferencia del usuario (sostenidos por defecto). Las respuestas se comparan por pitch class, así que los enarmónicos son equivalentes.

### 4.2 Afinaciones
Cuerdas numeradas como en la guitarra: **1 = Mi aguda, 6 = Mi grave**.

**Afinación estándar** (la de referencia):

| Cuerda | Nota | MIDI al aire |
|---|---|---|
| 6 | Mi (E2) | 40 |
| 5 | La (A2) | 45 |
| 4 | Re (D3) | 50 |
| 3 | Sol (G3) | 55 |
| 2 | Si (B3) | 59 |
| 1 | Mi (E4) | 64 |

`midi(cuerda, traste) = openMidi[cuerda] + traste`, `pc = midi % 12`.
Rango normal: trastes 0–12. Para CAGED y pentatónicas el mástil se amplía a **0–15**.

**Las 7 afinaciones de la app** (`data/tunings.js`), agrupadas como en la pantalla Afinaciones (6.6.16). *Valores MIDI validados por el usuario (Fase 1A).*

| Grupo | Afinación | MIDI al aire (6→1) | Notas (6→1) | Cambios respecto a la estándar |
|---|---|---|---|---|
| Estándar y bajadas | Mi estándar | 40 45 50 55 59 64 | E A D G B E | — |
| Estándar y bajadas | Medio tono abajo | 39 44 49 54 58 63 | Eb Ab Db Gb Bb Eb | todas ↓ ½ tono |
| Estándar y bajadas | Re estándar | 38 43 48 53 57 62 | D G C F A D | todas ↓ 1 tono |
| Drop | Drop D | 38 45 50 55 59 64 | D A D G B E | 6ª ↓ 1 tono |
| Slide (abiertas) | Sol abierto | 38 43 50 55 59 62 | D G D G B D | 6ª, 5ª y 1ª ↓ 1 tono |
| Slide (abiertas) | Re abierto | 38 45 50 54 57 62 | D A D F# A D | 6ª, 2ª y 1ª ↓ 1 tono; 3ª ↓ ½ tono |
| Slide (abiertas) | Mi abierto | 40 47 52 56 59 64 | E B E G# B E | 5ª y 4ª ↑ 1 tono; 3ª ↑ ½ tono |

- Los nombres de las notas se calculan a partir del MIDI y se muestran con `NoteLabel`; la columna "Notas" es solo de comprobación.
- La línea de cambios ("6ª ↓ 1 tono") se **calcula** comparando con la estándar, no se escribe a mano.
- **Test** (`tests/tunings.test.js`): las 7 afinaciones existen con 6 cuerdas; la estándar coincide con la tabla de arriba; los cambios calculados coinciden con la última columna; Sol abierto suena como un acorde de Sol mayor al aire, Re abierto como Re mayor y Mi abierto como Mi mayor (todas sus notas pertenecen a la tríada y aparecen las tres).
- Cómo usan los ejercicios las afinaciones: ver 7.6.

### 4.3 Intervalos
| Semitonos | Nombre | Abrev. |
|---|---|---|
| 0 | Unísono | 1 |
| 1 | 2ª menor | b2 |
| 2 | 2ª mayor | 2 |
| 3 | 3ª menor | b3 |
| 4 | 3ª mayor | 3 |
| 5 | 4ª justa | 4 |
| 6 | Tritono (4ª aum. / 5ª dism.) | b5 |
| 7 | 5ª justa | 5 |
| 8 | 6ª menor | b6 |
| 9 | 6ª mayor | 6 |
| 10 | 7ª menor | b7 |
| 11 | 7ª mayor | 7 |
| 12 | Octava | 8 |

**Formas de octava en la guitarra** (afinación estándar):
- Desde la cuerda 6 o 5: dos cuerdas más agudas y **+2 trastes** (6→4, 5→3).
- Desde la cuerda 4 o 3: dos cuerdas más agudas y **+3 trastes** (4→2, 3→1), por la afinación de la cuerda Si.
- Desde la cuerda 6: la misma nota en la cuerda 1, mismo traste.

### 4.4 Fórmulas
- Escala mayor: `[0, 2, 4, 5, 7, 9, 11]` (T T S T T T S).
- Escala menor natural: `[0, 2, 3, 5, 7, 8, 10]`.
- Pentatónica menor: `[0, 3, 5, 7, 10]`.
- Pentatónica mayor: `[0, 2, 4, 7, 9]`.
- Escala blues: `[0, 3, 5, 6, 7, 10]` (la *blue note* es el 6).
- Tríada mayor: `[0, 4, 7]`. Tríada menor: `[0, 3, 7]`. Disminuida: `[0, 3, 6]`.
- Séptima de dominante: `[0, 4, 7, 10]`.
- Acordes de la tonalidad mayor: `I ii iii IV V vi vii°` (Mayor, menor, menor, Mayor, Mayor, menor, disminuido).

### 4.5 Paleta y código de colores (consistente en toda la app)
| Uso | Color |
|---|---|
| Botón principal, selección e identidad | ámbar mate |
| Correcto / incorrecto | verde / rojo, **siempre con ✓ o ✗** |
| Fundamental (R) | rojo coral |
| 3ª (mayor o menor) | azul celeste |
| 5ª | verde azulado (teal) |
| 7ª | rosa |
| *Blue note* (b5) | morado |
| Resto de notas de escala | gris |

- Los puntos del mástil llevan **siempre** su etiqueta dentro (nota o intervalo: R, 3, b3, 5…, según el ajuste "Mostrar en los puntos"), así que no dependen solo del color.
- **Valores de partida** (validados por el usuario en maquetas). Claude Code puede ajustarlos ligeramente si algún contraste de texto no llega a 4,5:1, y debe decir cuáles ha cambiado:

| Token | Oscuro | Claro |
|---|---|---|
| Fondo de pantalla | `#262421` | `#F4F1EC` |
| Botón y tarjeta (superficie) | `#3A3734` | `#FFFFFF` |
| Borde inferior de botón gris | `#23211F` | `#D8D2C8` |
| Texto principal | `#F2EFEA` | `#262421` |
| Texto secundario | `#B5AFA6` | `#6B645C` |
| Ámbar mate (botón principal) | `#D4A24C` | `#D4A24C` |
| Borde inferior del botón ámbar | `#9C7430` | `#9C7430` |
| Texto sobre ámbar | `#2A1E08` | `#2A1E08` |
| Iconos en ámbar | `#D4A24C` | `#A87B2E` |
| Fondo del mástil | `#33302C` | `#E8E2D8` |
| Cuerdas | `#CFC8BD` | `#5C554D` |
| Trastes | `#6B645C` | `#B5AEA4` |
| Cejuela | `#EDE6DA` | `#262421` |

- Los colores de función (R, 3, 5, 7, *blue note*), correcto e incorrecto se eligen en la misma gama apagada, con versión para cada tema (valores en `css/styles.css`, Fase 1A).
- **Ajustes de contraste (Fase 1A)**: en el tema claro, el ámbar de iconos `#A87B2E` no llega a 4,5:1 como texto (3,4:1), así que el texto en ámbar usa un token aparte, `--amber-text` = `#85601F` (5,1:1); en el oscuro sigue siendo `#D4A24C`. El rojo de peligro es `#EE8B7F` (oscuro) y `#B23A2B` (claro).
- **Barra de estado del iPhone**: con `black-translucent` su texto es siempre blanco, así que detrás va una franja `#262421` también en el tema claro.

---

## 5. Datos (referencia exacta)

### 5.1 Acordes
Formato: trastes de la cuerda 6 a la 1 (`x` = no se toca). Dedos: 1 índice … 4 meñique, 0 al aire.

| Acorde | Trastes (6→1) | Dedos (6→1) | Nivel |
|---|---|---|---|
| Do (C) | x 3 2 0 1 0 | x 3 2 0 1 0 | Básico |
| Re (D) | x x 0 2 3 2 | x x 0 1 3 2 | Básico |
| Mi (E) | 0 2 2 1 0 0 | 0 2 3 1 0 0 | Básico |
| Sol (G) | 3 2 0 0 0 3 | 2 1 0 0 0 3 | Básico |
| La (A) | x 0 2 2 2 0 | x 0 1 2 3 0 | Básico |
| Lam (Am) | x 0 2 2 1 0 | x 0 2 3 1 0 | Básico |
| Mim (Em) | 0 2 2 0 0 0 | 0 2 3 0 0 0 | Básico |
| Rem (Dm) | x x 0 2 3 1 | x x 0 2 3 1 | Básico |
| Fa mini (F) | x x 3 2 1 1 | x x 3 2 1 1 | Intermedio |
| La7 (A7) | x 0 2 0 2 0 | x 0 2 0 3 0 | Intermedio |
| Re7 (D7) | x x 0 2 1 2 | x x 0 2 1 3 | Intermedio |
| Mi7 (E7) | 0 2 0 1 0 0 | 0 2 0 1 0 0 | Intermedio |
| Si7 (B7) | x 2 1 2 0 2 | x 2 1 3 0 4 | Intermedio |
| Fa cejilla (F) | 1 3 3 2 1 1 | 1 3 4 2 1 1 | Avanzado |

Cada acorde guarda además: `root` (pc), `quality` (`major`, `minor`, `dom7`) y, opcionalmente, `barre` (traste y cuerdas).
**Test obligatorio**: todas las notas que suenan pertenecen al acorde, la nota más grave es la fundamental en todos salvo excepciones declaradas, y todas las notas del acorde aparecen al menos una vez.

### 5.2 CAGED (acordes mayores)
Plantillas relativas a `r`, el traste de la fundamental en su cuerda de referencia (cuerdas 6→1, `x` = no se toca):

| Forma | Cuerda de la fundamental | Plantilla (6→1) | Forma abierta (comprobación) |
|---|---|---|---|
| Do (C) | 5 | x, r, r-1, r-3, r-2, r-3 | r=3 → x 3 2 0 1 0 |
| La (A) | 5 | x, r, r+2, r+2, r+2, r | r=0 → x 0 2 2 2 0 |
| Sol (G) | 6 | r, r-1, r-3, r-3, r-3, r | r=3 → 3 2 0 0 0 3 |
| Mi (E) | 6 | r, r+2, r+2, r+1, r, r | r=0 → 0 2 2 1 0 0 |
| Re (D) | 4 | x, x, r, r+2, r+3, r+2 | r=0 → x x 0 2 3 2 |

- Para un acorde dado, `r` es el traste de su fundamental en la cuerda de referencia. Si algún traste queda negativo, se suma 12; si supera 15, se resta 12 a toda la forma.
- Orden a lo largo del mástil: **C → A → G → E → D** y vuelta a empezar.
- **Test obligatorio, Do mayor:**
  - C: x 3 2 0 1 0
  - A: x 3 5 5 5 3
  - G: 8 7 5 5 5 8
  - E: 8 10 10 9 8 8
  - D: x x 10 12 13 12
- Algunas formas desplazadas (sobre todo Sol y Do) son incómodas de tocar enteras. Cada plantilla puede marcar cuerdas como **opcionales** (se dibujan con un punto hueco), y en Práctica basta con tocar las obligatorias. Proponer al usuario qué cuerdas marcar como opcionales en cada forma antes de fijarlo.

### 5.3 Cajas de la pentatónica menor (referencia en La menor)
Trastes por cuerda (6→1), en La menor:

| Caja | Cuerda 6 | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| 1 | 5, 8 | 5, 7 | 5, 7 | 5, 7 | 5, 8 | 5, 8 |
| 2 | 8, 10 | 7, 10 | 7, 10 | 7, 9 | 8, 10 | 8, 10 |
| 3 | 10, 12 | 10, 12 | 10, 12 | 9, 12 | 10, 13 | 10, 12 |
| 4 | 12, 15 | 12, 15 | 12, 14 | 12, 14 | 13, 15 | 12, 15 |
| 5 | 3, 5 | 3, 5 | 2, 5 | 2, 5 | 3, 5 | 3, 5 |

- Para otra tonalidad: desplazar todos los trastes la diferencia de semitonos respecto a La y normalizar la caja entera al rango 0–15.
- *Blue notes* en la caja 1 en La: cuerda 5 traste 6 y cuerda 3 traste 8 (Mib). Calcularlas siempre, no fijarlas a mano: son las posiciones con pc = fundamental + 6 dentro de la ventana de la caja.
- **Test obligatorio**: todas las posiciones de cada caja pertenecen a la pentatónica, y cada caja contiene las 5 notas.
- Pentatónica mayor = mismas cajas que la menor relativa (Do mayor = La menor). Las cajas se muestran con la fundamental mayor resaltada.

### 5.4 Blues de 12 compases
Con acordes de séptima de dominante (I7, IV7, V7):

| Variante | Compases 1–12 |
|---|---|
| Estándar | I · I · I · I · IV · IV · I · I · V · IV · I · V |
| *Quick change* | I · IV · I · I · IV · IV · I · I · V · IV · I · V |
| Sin *turnaround* (Básico) | I · I · I · I · IV · IV · I · I · V · IV · I · I |

- Tonalidades: **La** (A7 D7 E7) y **Mi** (E7 A7 B7) en Básico e Intermedio. Avanzado añade Sol, Do y Re.
- **Test**: en La, compás 9 = Mi7, compás 5 = Re7, compás 12 (estándar) = Mi7.

### 5.5 Licks
Licks **originales y sencillos** de 3 a 6 notas, definidos en La sobre la caja 1 y transportables.
Formato de cada nota: `{ string, fret, dur, tech? }`, con `dur` en corcheas (con swing al reproducirse) y `tech` opcional: la técnica de esa nota con los símbolos de la tablatura (6.7), por ejemplo `{ type: 'bend', amount: 1 }` o `{ type: 'hammer' }`.
Cada lick indica `target`: el acorde (I, IV o V) sobre el que mejor resuelve, y su última nota es la fundamental de ese acorde.

Licks de partida (Claude Code puede añadir más hasta ~10, con el mismo criterio):
| Lick | Notas (cuerda:traste) | Notas | Objetivo |
|---|---|---|---|
| L1 | 3:7 → 3:5 → 4:7 | Re Do La | I |
| L2 | 2:5 → 2:8 → 1:5 | Mi Sol La | I |
| L3 | 3:5 → 3:7 → 3:8 → 3:7 → 4:7 | Do Re Mib Re La | I (con *blue note*) |
| L4 | 2:8 → 2:5 → 3:7 | Sol Mi Re | IV |
| L5 | 1:8 → 1:5 → 2:8 → 2:5 | Do La Sol Mi | V |
| L6 | 1:5 → 2:8 → 2:5 → 3:7 → 3:5 → 4:7 | La Sol Mi Re Do La | I (bajada) |

**Test**: todas las notas de cada lick pertenecen a la escala blues de La, y la última nota es la fundamental de su objetivo. La tablatura de cada lick coincide nota a nota con sus datos (cuerda, traste y técnica).

### 5.6 Patrones de rasgueo (`data/strum-patterns.js`)
El compás se divide en 8 casillas (corcheas: 1 y 2 y 3 y 4 y). Cada casilla vale `D` (**↓**, golpe abajo), `U` (**↑**, golpe arriba) o `-` (**·**, la mano se mueve sin golpear).

**Regla del péndulo**: la mano baja en los tiempos y sube en los "y", golpee o no. Por eso un `D` solo puede ir en casilla par (0, 2, 4, 6) y un `U` solo en impar.

| Nivel | Patrón (8 casillas) | Descripción |
|---|---|---|
| Básico | ↓ · ↓ · ↓ · ↓ · | negras, todo abajo |
| Básico | ↓ · ↓ ↑ ↓ · ↓ ↑ | abajo, abajo-arriba |
| Intermedio | ↓ · ↓ ↑ · ↑ ↓ ↑ | el patrón pop/folk más típico |
| Intermedio | ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑ | corcheas seguidas |
| Avanzado | ↓ · · ↑ · ↑ ↓ ↑ | con más huecos |
| Avanzado | patrones con acento o con swing | (proponer al usuario antes de fijarlos) |

- Tempo: Básico 60–70, Intermedio 70–90, Avanzado 90–110 BPM.
- **Test** (`tests/strum-patterns.test.js`): 8 casillas con valores `D`, `U` o `-`; `D` solo en posiciones pares y `U` solo en impares.

### 5.7 Progresiones de acordes predefinidas
Progresiones típicas con acordes abiertos, **calculadas por grados** (no escritas a mano):

| Progresión | Básico | Intermedio (además) |
|---|---|---|
| I–IV–V | Sol–Do–Re, Re–Sol–La, La–Re–Mi | Do–Fa–Sol (por el Fa) |
| I–V–vi–IV | Sol–Re–Mim–Do | Do–Sol–Lam–Fa |
| I–vi–IV–V | Sol–Mim–Do–Re | |
| vi–IV–I–V | Mim–Do–Sol–Re | |

- **Test**: cada progresión coincide con los grados de su tonalidad según `core/theory.js` y todos sus acordes existen en `data/chords.js`.

---

## 6. Diseño e interfaz

### 6.1 Estilo general
- **La app se llama GuitarSeo** (6.10).
- **Inspiración: la app de Chess.com.** Se toman sus principios, **no su marca**: nada de su verde exacto, su logo, sus piezas ni su nombre. La app tiene identidad propia.
  - Fondo oscuro neutro, sin texturas ni degradados.
  - Un único color de acento fuerte para la acción principal: **un solo botón ámbar por pantalla**.
  - Botones "físicos": color sólido con un borde inferior más oscuro (unos 4 px) que se hunde al pulsar (el borde se reduce y el botón baja esos píxeles). Los botones secundarios son grises con el mismo efecto.
  - Listas limpias: filas con icono a la izquierda, texto y un chevron.
  - El protagonista visual es el **mástil**, dibujado plano y limpio, como el tablero de Chess.com.
- **Color de identidad: ámbar mate** (apagado, nada chillón). Se usa en el botón principal de cada pantalla, en el elemento seleccionado y en los destacados. Paleta completa y valores en 4.5.
- **Temas**: **oscuro por defecto**. En Ajustes: Oscuro, Claro o Automático (sigue al sistema). Todos los colores se definen como tokens CSS en `:root`, en las dos versiones. El oscuro es cómodo para practicar con poca luz.
- **Tipografía del sistema** (la del iPhone), sin descargar fuentes. Grande y muy legible; en Práctica, el estímulo principal (nota o acorde) ocupa media pantalla.
- **Iconos**: SVG de trazo sencillo y estilo coherente. Pueden dibujarse a mano o tomarse de un conjunto con licencia libre (por ejemplo, Lucide, licencia ISC). **No se usan emojis como iconos.**
- **Pocas estadísticas en las pantallas de navegación**: los números y el progreso están en Perfil. Las listas solo muestran nombre y una línea de información.
- `viewport-fit=cover` y márgenes con `env(safe-area-inset-*)` para la isla dinámica y la barra inferior del iPhone. Sin scroll horizontal de página.
- **Celebración**: en una ronda perfecta o al batir un récord, una animación breve y discreta de confeti (1–2 s), **sin sonido**. Si el sistema tiene activado `prefers-reduced-motion`, no hay animación.

### 6.2 Componente de doble notación
- `NoteLabel(pc, { spelling })` muestra la principal en grande y la secundaria en pequeño y con menos contraste: **Fa** <sub>F</sub>.
- En los puntos del mástil: la principal dentro del punto y la secundaria en un texto diminuto debajo o al lado. En el mástil vertical del móvil, si no cabe, la secundaria se muestra al pulsar el punto.
- Botones de respuesta: las dos notaciones claramente legibles.

### 6.3 Mástil (`ui/fretboard.js`)
- Parámetros: `fromFret`, `toFret`, `orientation` (`auto | vertical | horizontal`), `tuning`, `markers` (lista de puntos con color, etiqueta e interacción), `onTap(string, fret)`, `showFretNumbers`.
- **Horizontal** (PC o móvil apaisado): cuerda 1 arriba y cuerda 6 abajo, cejuela a la izquierda (vista estándar de un diestro mirando el mástil).
- **Vertical** (móvil en vertical): cejuela arriba, cuerdas en columnas con la 6 a la izquierda y la 1 a la derecha (como un diagrama de acordes) y trastes hacia abajo.
- `auto` usa `matchMedia('(orientation: portrait)')`. En ajustes se puede forzar, por si el iPhone tiene la rotación bloqueada.
- Marcas de traste en 3, 5, 7, 9, 15 y doble en 12.
- Zonas táctiles de al menos **44×44 px** (aunque el punto visual sea más pequeño).
- El traste 0 (al aire) se representa a la izquierda o encima de la cejuela.
- **Aspecto** (igual en todas las pantallas y en los diagramas de acordes):
  - **Las cuerdas son más gruesas que las líneas de los trastes**, con grosor graduado como en una guitarra real: la 6ª la más gruesa y la 1ª la más fina (por ejemplo, de 1,5 px a 3,5 px a tamaño normal; ajustar a la escala del dibujo).
  - **Trastes**: líneas finas y de un tono más suave que las cuerdas.
  - **Cejuela**: una barra gruesa, claramente distinta de los trastes.
  - Mástil plano, sin texturas de madera; los puntos con buen contraste en los dos temas y siempre con su etiqueta dentro (4.5).

### 6.4 Navegación por pantallas
Ya **no hay pestañas** TEORÍA | PRÁCTICA (las de la Fase 0 se sustituyen en la Fase 1A). La app funciona como el menú de un juego: **cada pantalla tiene un solo propósito**.

```
Inicio
 ├── Teoría ──► Módulo ──► Aprender (lección)
 │                     ├─► Consulta
 │                     └─► Preparación del ejercicio ──► Ejercicio ──► Resumen
 ├── Práctica ──► Módulo ──► Preparación del ejercicio ──► Ejercicio ──► Resumen
 ├── Afinaciones
 ├── Glosario ──► Bloque ──► Ficha de concepto
 ├── Perfil (icono) ──► Mapa del mástil · Puntos débiles · Récords · Acerca de
 └── Ajustes (icono)
```

- **Cabecera de todas las pantallas interiores**: flecha **←** a la izquierda (vuelve a la pantalla anterior), título centrado y **"?"** a la derecha (ayuda de esa pantalla, 6.8).
  - Imprescindible: instalada en la pantalla de inicio del iPhone no hay botón de atrás del navegador.
  - El hash router mantiene el historial, así que el botón atrás del navegador en PC también funciona.
- El selector ES | EN de la cabecera de la Fase 0 desaparece: la notación se cambia en Ajustes.
- Navegación libre: todo es accesible siempre; nada se bloquea.

### 6.5 Ajustes (persistentes)
Lista agrupada; cada opción en una fila con su control (selector de opciones o interruptor):

| Grupo | Opciones |
|---|---|
| Notación y aspecto | Notación principal (ES / EN), Alteraciones (♯ / ♭), Tema (Oscuro / Claro / Auto) |
| Mástil | Orientación (Auto / Vertical / Horizontal), Mostrar en los puntos (Notas / Intervalos) |
| Sonido y voz | Sonido (interruptor), Volumen (deslizador), Voz en Práctica (interruptor) |
| Afinación | Afinación por defecto (abre la lista), Preguntar antes de cada ejercicio (interruptor) |
| Tus datos | Exportar copia, Importar copia, Borrar todo el progreso (en rojo, con confirmación) y la nota de 6.9 |
| App | Versión, Buscar actualización |

- "Acerca de" está en Perfil, no aquí.
- La página de prueba interna (`#/dev`, Fase 1B) se enlaza solo desde Ajustes.

### 6.6 Pantallas

#### 6.6.1 Inicio
```
 [Perfil]                      [Ajustes]
              (logo) GuitarSeo
              Racha: 4 días
   ┌───────────────────────────────┐
   │ ▶ Continuar                   │   ← solo si ya hay historial; único botón ámbar
   │   Notas · ¿Qué nota es? · Int.│
   └───────────────────────────────┘
   ┌───────────────────────────────┐
   │ [icono] Teoría                │   ← cuatro botones grandes iguales, grises
   │         Sin guitarra          │
   └───────────────────────────────┘
   ┌───────────────────────────────┐
   │ [icono] Práctica              │
   │         Guitarra en mano      │
   └───────────────────────────────┘
   ┌───────────────────────────────┐
   │ [icono] Afinaciones           │
   │         Ver las afinaciones   │
   └───────────────────────────────┘
   ┌───────────────────────────────┐
   │ [icono] Glosario              │
   │         Todos los conceptos   │
   └───────────────────────────────┘
```
- **Perfil** (arriba a la izquierda) y **Ajustes** (arriba a la derecha) como iconos.
- **Continuar** abre la pantalla de preparación del último ejercicio hecho, con su nivel y afinación ya puestos: un toque en Empezar y listo. Es el **único botón ámbar** de la pantalla. Si no hay historial, no se muestra y ningún botón va en ámbar.
- **Teoría, Práctica, Afinaciones y Glosario**: cuatro botones grandes iguales, en gris con efecto físico, icono en ámbar y una línea de subtítulo.
- **El Glosario es una sección principal**, no un módulo de Teoría.
- Racha: solo si hay al menos un día practicado.

#### 6.6.2 Sección (Teoría o Práctica)
```
 ←  Teoría                          ?
 ┌────────────────────────────────┐
 │ ★ Sesión mezclada              │   ← botón ámbar
 └────────────────────────────────┘
 [icono] Notas del mástil
         7 ejercicios
 [icono] Acordes abiertos
         5 ejercicios
 [icono] Blues y slide
         Próximamente                   ← módulo aún no construido, en gris
```
- **Lista** (no cuadrícula): una fila por módulo con su icono, el nombre y una línea secundaria (número de ejercicios o "Próximamente").
- **Sin barras de progreso** ni porcentajes.
- Módulos y orden:

| Teoría | Práctica |
|---|---|
| Notas del mástil | Calentamiento |
| Acordes abiertos | Notas del mástil |
| Oído | Acordes abiertos (con rasgueo) |
| Escala y tonalidad | Oído |
| Blues y slide | Escala y tonalidad |
| CAGED | Blues y slide |
| | CAGED |

- Hasta la Fase 8, "Sesión mezclada" abre una pantalla "Próximamente".

#### 6.6.3 Módulo
**En Teoría** (módulos con lección y consulta):
```
 ←  Notas del mástil                ?
 ┌───────────────┐ ┌───────────────┐
 │ Aprender      │ │ Consulta      │
 │ [Recomendado  │ │ El mástil con │
 │  antes de     │ │ todas las     │
 │  empezar]     │ │ notas         │
 └───────────────┘ └───────────────┘
 Ejercicios
 ¿Qué nota es?                      ›
 Nombra el punto iluminado
 Encuéntrala                        ›
 Toca la nota en su cuerda
 …
```
- **Aprender** y **Consulta** son dos botones grandes; cada uno abre **su propia pantalla completa** (no hay selector de pestañas).
- **Aprender** va resaltado (borde ámbar) con la etiqueta **"Recomendado antes de empezar"** hasta que se completa la lección. Después la etiqueta pasa a **"Completada ✓"** y el botón deja de destacar.
- **Debajo, la lista de ejercicios** en la misma pantalla: nombre y una frase de qué se hace, con chevron. Sin estadísticas.

**En Práctica, y en módulos sin lección ni consulta (Oído)**: la pantalla del módulo es directamente la lista de ejercicios.

#### 6.6.4 Aprender (lección por tarjetas)
- **Pantalla completa**: **X** para cerrar a la izquierda, título del módulo y "?".
- La lección se divide en **tarjetas cortas** (de 3 a 6), con **una idea por tarjeta**: un título, de 2 a 4 líneas de texto y **siempre un esquema visual** de lo que explica (un trozo de mástil, un diagrama de acorde o un trozo de tablatura), **interactivo: tocar un punto lo hace sonar**.
- Barra de avance segmentada arriba (una raya por tarjeta).
- Botones **Anterior** y **Siguiente** (Siguiente en ámbar), y también se puede deslizar con el dedo.
- La última tarjeta muestra **"Ir a los ejercicios"**, y la lección queda marcada como completada (se guarda).
- Los textos usan las palabras pulsables del glosario (6.8).

#### 6.6.5 Consulta
- **Pantalla completa** con la cabecera normal. El mástil o los diagramas ocupan todo el espacio disponible, sin otros elementos que estorben.

#### 6.6.6 Preparación del ejercicio
```
 ←  Octavas                         ?
 Ves una nota marcada en el mástil y
 tocas su octava con la forma correcta.

 Nivel
 [ Básico ][ Intermedio ][ Avanzado ]   ← recuerda el último

 Afinación                              ← solo si el ejercicio la admite
 Mi estándar                        ›
 E A D G B E · Mi La Re Sol Si Mi

 ┌────────────────────────────────┐
 │            Empezar             │   ← grande, abajo, ámbar
 └────────────────────────────────┘
```
- Una frase que explica el ejercicio. El "?" abre la ayuda completa (6.8).
- **Nivel**: tres botones; queda seleccionado el último usado en ese ejercicio.
- **Afinación**: una fila con la afinación actual. Al tocarla sube un panel con las afinaciones disponibles para ese ejercicio (7.6). Si el ejercicio no admite afinación, la fila no aparece.
- **Empezar**: botón grande en la parte baja, al alcance del pulgar.
- Algunos ejercicios añaden opciones propias aquí (por ejemplo, la progresión de acordes, 6.6.11, o "Mostrar diagramas", 6.6.12).

#### 6.6.7 Ejercicio de Teoría (pregunta y respuesta)
```
 X  ▓▓▓▓░░░░░░  4/10              ?
            ¿Qué nota es?
        (trozo de mástil con el punto
         de la pregunta en ámbar)
 [ Si  B ]            [ Do  C ]
 [ Re  D ]            [ La  A ]
```
- **Cabecera**: X para salir (pide confirmación si la ronda va por la mitad), barra de progreso con el contador (4/10) y "?", que pausa la ronda y abre la ayuda.
- **Temporizador** (en los niveles con tiempo): una segunda barra fina debajo de la de progreso, que se va vaciando.
- El mástil sigue la orientación del móvil (vertical en vertical).
- **Respuestas**: botones grandes en 2 columnas con doble notación y efecto físico.
- **Sin sonido automático al responder**: la app no suena sola al acertar ni al fallar. En su lugar hay un **botón de altavoz** (icono SVG) que reproduce la nota o el acorde de la respuesta correcta cuando el usuario lo pulsa.
  - Aparece **después de responder**, nunca antes (en los ejercicios de Oído existe aparte el botón "Repetir sonido").
  - Está en todos los ejercicios cuya respuesta tiene sonido: notas, acordes, intervalos, escalas, tablatura…
  - También en cada fallo del resumen de ronda (6.6.10) y en las fichas del glosario (botón Escuchar).
- **Al acertar**: el botón se pone verde con ✓ y aparece "Correcto ✓" con el altavoz al lado. **Pasa sola** a la siguiente pregunta tras **2 segundos**. Si se pulsa el altavoz en ese tiempo, el avance automático se cancela, suena la respuesta y aparece el botón **Continuar**.
- **Al fallar**: la correcta se marca en verde ✓ y la elegida en rojo ✗. Sube un panel con la corrección concreta (por ejemplo, "No es Re: es Do (5ª cuerda, traste 3)"), el **altavoz**, el enlace **"¿Por qué?"** (6.8) y el botón **Continuar** (ámbar). **No avanza hasta pulsar Continuar.**

#### 6.6.8 Ejercicio de Práctica (manos libres)
```
 X  ▓▓▓░░░░░░░  3/12             🔊
                 Sol  G             ← enorme, media pantalla
          Tócala en las 6 cuerdas
          ▓▓▓▓▓▓▓░░░░  8 s          ← cuenta atrás
        (6) (5) (4) (3) (2) (1)     ← guía de ritmo
 [ Pausa ]            [ Ver posiciones ]
```
(En el esquema, 🔊 representa el icono SVG del altavoz.)
- **Consigna enorme** con doble notación. La voz la dice al aparecer; el icono del altavoz de la cabecera silencia la voz.
- **Cuenta atrás** en barra y en segundos.
- **Guía de ritmo**: en los ejercicios que recorren cuerdas, los círculos de las cuerdas (6 a 1) se iluminan uno a uno, repartidos en el tiempo disponible.
- **Al acabarse el tiempo**: aparece automáticamente un trozo de mástil con las posiciones correctas durante **3 segundos** y después pasa a la siguiente consigna.
- **Pausa** y **Ver posiciones**: botones grandes abajo. En pausa se puede abrir el "?".
- Si la afinación no es la estándar, se ve la etiqueta "Afinación: …" bajo la cabecera.

#### 6.6.9 (reservado)
El aspecto del mástil está en 6.3.

#### 6.6.10 Resumen de ronda
**Se guarda todo automáticamente** al terminar la ronda (y también lo hecho hasta ese momento si se sale a mitad con la X). No hay botones de "Guardar".

**Teoría**
```
      ¿Qué nota es? · Intermedio
               8/10
             Muy bien
       [Nuevo récord de tiempo]     ← solo si se bate un récord
 [Tiempo medio 3,4 s] [Racha 4 días]
 Fallos
 5ª cuerda · traste 3   Do (dijiste Re)   🔊
 2ª cuerda · traste 6   Fa (dijiste Fa♯)  🔊
 ┌────────────── Repetir ──────────────┐   ← ámbar
 └─────────────────────────────────────┘
 [ Otro ejercicio ]
```
- Puntuación grande y una frase corta según el resultado ("Muy bien", "Vas mejorando"…).
- Solo dos datos: tiempo medio y racha.
- Lista de fallos con la respuesta correcta, la elegida y un altavoz. Al tocar un fallo se ve en el mástil con su "¿Por qué?".
- Botones: **Repetir** y **Otro ejercicio** (vuelve a la lista del módulo).

**Práctica**
```
  Nota por todas las cuerdas · Básico
          12 notas · 4 min
       [Nuevo récord]               ← solo si aplica (p. ej. tempo máximo)
 ┌────────────── Repetir ──────────────┐
 └─────────────────────────────────────┘
 [ Salir ]
```
- **Sin autoevaluación de ningún tipo**: no hay "Bien / Regular / Mal" ni "¿Cuáles te han costado?". El usuario ya sabe cómo le ha ido.
- Solo el ejercicio, el nivel, cuántas consignas, cuánto tiempo y un récord si se ha batido.
- Botones: **Repetir** y **Salir**.
- Consecuencia para la repetición espaciada: ver 7.4.

**Celebración**: confeti breve y sin sonido en una ronda perfecta o al batir un récord (6.1).

#### 6.6.11 Progresiones de acordes (Acordes, Práctica)
En "Cambios de acordes" y "Rasgueo", la preparación permite elegir qué acordes practicar:

- **Predefinidas**: las progresiones de 5.7, calculadas por grados.
- **Personalizada · Mis progresiones**: lista de progresiones guardadas por el usuario y un botón **"+ Nueva"**.
  1. Se elige **cuántos acordes: 3, 4 o 5**.
  2. Aparecen esas casillas en orden; al tocar una se elige el acorde de la biblioteca (5.1), de cualquier nivel.
  3. Se le pone **nombre** (por ejemplo, "Blues" o "Country") y se guarda al instante.
  - Cada progresión se puede **editar** y **borrar** (con confirmación). Se incluyen en exportar e importar. Queda seleccionada la última usada.
- Al empezar, la progresión se repite en bucle (pantalla 6.6.12).
- El **nivel** solo ajusta el tempo y cada cuántos tiempos se cambia de acorde.

#### 6.6.12 Pantalla de práctica de acordes (con diagramas)
En todos los ejercicios de Práctica con acordes ("Cambios de acordes", "Rasgueo", "Acorde cantado", "Cambios en un minuto"):

```
 X                                🔊
               Sol  G               ← nombre grande, doble notación
        ┌─────────────────┐
        │ diagrama grande │         ← forma del acorde, con dedos
        └─────────────────┘
        ● ● ○ ○                     ← tiempos del compás
 Siguiente:  Re  D  [mini diagrama]
 [ Pausa ]
```
- **Acorde actual**: el nombre en grande y, debajo, su **diagrama grande** con los números de los dedos, las cuerdas al aire (o) y las que no se tocan (x).
- **Tiempos del compás**: puntos que se iluminan con el metrónomo; el último tiempo antes del cambio se resalta en ámbar para avisar.
- **Siguiente acorde**: abajo, en pequeño, con nombre y mini diagrama.
- **Conmutador "Mostrar diagramas"** en la preparación, **activado por defecto**. Desactivado, solo salen los nombres (para comprobar que se saben de memoria). Se recuerda la elección.
- En "Rasgueo", el patrón de flechas (5.6) va entre el diagrama y el siguiente acorde.

#### 6.6.13 Perfil
```
 ←  Perfil                          ?
 [Racha 4 días] [Días 23] [Tiempo 6 h 40]
 Últimas 13 semanas
 ▢▣▢▢▣▢▢▣■▢▣■■    ← calendario: un cuadro por día,
 ...                 más ámbar cuanto más se practicó
 Dominio por tema
 Notas    ▓▓▓▓▓▓▓░░  72%
 Acordes  ▓▓▓▓▓▓▓▓░  85%
 Oído     ▓▓▓░░░░░░  40%
 Más detalle
 Mapa del mástil                    ›
 Puntos débiles                     ›
 Récords                            ›
 Acerca de                          ›
```
- **Progreso deja de ser un módulo**: todo está aquí.
- Tres datos arriba: racha, días practicados y tiempo total.
- Calendario de las últimas 13 semanas (estilo cuadrícula de contribuciones de GitHub), con intensidad según los minutos practicados.
- **Dominio por tema** con barras (aquí sí, porque es el sitio de las estadísticas). Se calcula con los aciertos recientes en Teoría; el "?" explica cómo. Sin datos: "—".
- **Más detalle**: cada fila abre su propia pantalla.
  - **Mapa del mástil**: mapa de calor de aciertos por posición (Notas y Oído).
  - **Puntos débiles**: lo que más se falla, con un botón para practicarlo.
  - **Récords**: contrarreloj, cambios en un minuto por pareja de acordes, "Rellena el mástil" por cuerda y tempo máximo en escalas y calentamiento.
  - **Acerca de**: nombre de la app, versión y autor (el usuario de GitHub del propietario del repositorio, sacado de la configuración de git o del remoto).
- **Sin logros** (la propuesta P8 está rechazada, sección 12).
- **Registro de sesiones** (desde la Fase 1B, para que Perfil tenga datos desde el principio): cada ronda guarda fecha, ejercicio, nivel, afinación, duración y resultado, y los récords se actualizan al terminarla.

#### 6.6.14 Ajustes
Ver 6.5.

#### 6.6.15 (reservado)
La tablatura está en 6.7.

#### 6.6.16 Afinaciones
```
 ←  Afinaciones                     ?
 Estándar y bajadas
 ┌ Mi estándar                           ┐
 │ [Mi E][La A][Re D][Sol G][Si B][Mi E] │   ← 6ª a 1ª, cada nota suena al tocarla
 │ La afinación de referencia            │
 │ [▶ Tocar todas]                       │
 └───────────────────────────────────────┘
 ┌ Medio tono abajo … ┐  ┌ Re estándar … ┐
 Drop
 ┌ Drop D … ┐
 Slide (abiertas)
 ┌ Sol abierto … ┐ ┌ Re abierto … ┐ ┌ Mi abierto … ┐
```
- Las **7 afinaciones** de 4.2, agrupadas: Estándar y bajadas (Mi estándar, Medio tono abajo, Re estándar), Drop (Drop D) y Slide (Sol abierto, Re abierto, Mi abierto).
- En cada ficha, **las cuerdas que cambian respecto a la estándar se resaltan en ámbar**, con la línea de cambios debajo ("6ª ↓ 1 tono").
- Cada nota **suena al tocarla**.
- Botón **"Tocar todas"**: suena cada cuerda de la 6ª a la 1ª, despacio (≈1,5 s cada una), para afinar de oído. Al volver a pulsarlo se detiene.
- **Sin botón de copiar.**
- El "?" explica qué significan "estándar", "drop" y "abierta".

#### 6.6.17 Glosario
```
 ←  Glosario
 [🔍 Busca un concepto: octava, bend…]
 Bloques
 Notas                               8
 Acordes                             7
 Intervalos                          6
 Escalas y tonalidad                 9
 Blues y slide                       8
 CAGED                               6
 Afinaciones                         4
 Ritmo y técnica                     5
 Tablatura                          16
```
(En el esquema, 🔍 representa el icono SVG de la lupa.)
- **Buscador**: busca en títulos y `aliases`, en español y en inglés (por ejemplo, "root" encuentra "Fundamental"), sin importar tildes ni mayúsculas. Los resultados aparecen mientras se escribe.
- **Bloques** en lista con el número de conceptos (calculado de `concepts.js`; los números del esquema son orientativos). Solo se muestran los bloques que ya tienen conceptos. Al tocar un bloque se ve su lista de conceptos; al tocar un concepto, su ficha.
- **Ficha de concepto** (pantalla completa; la misma en versión corta dentro del panel del "?"):
  - título, y debajo el bloque y los otros nombres del concepto;
  - esquema visual de lo que explica, con los colores de la app (mástil, diagrama de acorde o tablatura), **interactivo: tocar un punto lo hace sonar**. Por ejemplo: "Notas naturales" con el mástil mostrando las notas naturales; "Acorde abierto" con el diagrama de un acorde de ejemplo; un símbolo de tablatura con su trozo de tablatura; un intervalo con las dos notas en el mástil;
  - explicación corta (3–5 líneas);
  - botón **Escuchar** (si el concepto tiene sonido);
  - **Relacionados**: conceptos pulsables;
  - enlace **"Ver la lección completa"**.
- Las lecciones de Aprender enlazan a las fichas con palabras pulsables, y las fichas enlazan de vuelta a la lección.

### 6.7 Tablatura (`ui/tab.js`)
Tablatura estándar, como la de cualquier web de tablaturas, generada en SVG:

- **6 líneas horizontales**: la de **arriba es la 1ª cuerda (Mi aguda)** y la de abajo la 6ª, como en toda tablatura estándar (es al revés que el mástil vertical de la app; es lo correcto en tablatura).
- A la izquierda, el **nombre de cada cuerda** según la afinación del ejercicio y la **notación elegida**: en ES "Mi Si Sol Re La Mi" y en EN "e B G D A E" (en inglés la 1ª cuerda va en minúscula, `e`, como es habitual). La notación secundaria aparece en pequeño al lado.
- **Números sobre las líneas** = traste (0 = al aire). Varios números en la misma columna = notas a la vez.
- **Ritmo**: separación horizontal proporcional a la duración y, debajo, el conteo ("1 y 2 y…"). Barras verticales `|` como líneas de compás.
- **Siempre en horizontal**, también con el móvil en vertical. Si no cabe, se parte en varias líneas como una partitura.
- **Cursor de reproducción**: mientras suena, la nota que suena se resalta en ámbar. Tocar un número hace sonar esa nota.
- Conmutador **"Ver en el mástil"**: muestra encima un trozo de mástil con las mismas notas numeradas en orden.
- Se usa en: licks (blues y slide), pregunta-respuesta, licks por acorde, escala con metrónomo y calentamiento.
- **Nomenclatura completa**, con los símbolos más extendidos. El componente debe saber dibujarlos todos, aunque los licks actuales solo usen algunos:

| Símbolo | Técnica | Ejemplo |
|---|---|---|
| `h` | Ligado ascendente (*hammer-on*) | `5h7` |
| `p` | Ligado descendente (*pull-off*) | `7p5` |
| `/` | Deslizamiento hacia arriba (*slide*) | `5/7`, `/7` (entrar deslizando) |
| `\` | Deslizamiento hacia abajo | `7\5`, `7\` (salir deslizando) |
| `b` | Estiramiento (*bend*), con cuánto: ½, 1 o 1½ tonos | `7b9`, `7b(½)` |
| `r` | Soltar el estiramiento (*release*) | `7b9r7` |
| `pb` | Estiramiento previo (*pre-bend*) | `7pb9r7` |
| `~` | Vibrato | `7~` |
| `x` | Nota muerta o apagada | `x` |
| `( )` | Nota fantasma (muy suave) | `(7)` |
| `PM` | Apagado con la palma (*palm mute*), con línea de duración | `PM - - -` |
| `<12>` | Armónico natural | `<12>` |
| `AH` / `PH` | Armónico artificial / pellizcado | `7 AH`, `5 PH` |
| `t` | *Tapping* | `12t` |
| `tr` | Trino | `5tr7` |
| `let ring` | Dejar sonar | texto sobre las notas |

- **Representación gráfica** (como en las tablaturas impresas y en programas como Guitar Pro), no solo letras:
  - **Estiramiento**: flecha curva hacia arriba que sale del número, con la cantidad encima (`½`, `1`, `1½`; el "?" explica que `1` = un tono, lo que en inglés se escribe *full*).
  - **Soltar**: flecha curva hacia abajo. **Estirar y soltar**: flecha que sube y baja.
  - **Estiramiento previo**: flecha vertical hacia arriba antes de pulsar (y hacia abajo si se suelta).
  - **Ligados**: arco entre los dos números con la `h` o la `p` encima.
  - **Deslizamientos**: línea diagonal entre los números.
  - **Vibrato**: línea ondulada sobre la nota.
  - **PM** y **let ring**: el texto con una línea discontinua que marca su duración.
  - **Armónicos**: el número entre `< >`.
- Se usan las formas más habituales. Cuando haya variantes comunes en internet (`s` en lugar de `/`, `^` para el estiramiento…), la ficha del glosario las menciona.
- **Glosario**: bloque **"Tablatura"** con una ficha por símbolo: cómo se dibuja en la app, la forma en texto plano (`7b9`, `7b9r7`, `5h7`, `5/7`…), qué significa, cómo se toca y un ejemplo que suena.
- **Sonido**: la síntesis imita lo que pueda de forma creíble (ligados, deslizamientos y estiramientos como cambio de altura continuo, vibrato como oscilación, apagado con la palma con decaimiento más corto, armónicos con timbre más puro, nota muerta como golpe sin altura). Si alguna técnica no se puede imitar de forma convincente, se dibuja igual pero suena como nota normal, y **se le dice al usuario** en el resumen de la fase.
- Los datos de los licks (5.5) admiten el campo opcional `tech` por nota.
- **Tests**: cada símbolo se dibuja sin errores; la tablatura de cada lick coincide nota a nota con sus datos (cuerda, traste y técnica).

### 6.8 Ayuda "?" y "¿Por qué?"
Un recordatorio rápido, en contexto, de la teoría que trabaja cada ejercicio. Complementa a Aprender (lección larga) sin sustituirla.

- **Un único icono "?"**, igual en toda la app.
- **Formato**: panel que sube desde abajo, con el esquema del concepto (el mismo de la ficha, en pequeño), de 3 a 5 líneas de texto y el enlace "Ver la lección completa". **Al abrirlo, el ejercicio se pausa**; al cerrarlo, sigue donde estaba.

**Dónde aparece**
1. **En todos los ejercicios** (Teoría y Práctica), en la preparación y en la cabecera del ejercicio. El panel tiene dos partes:
   - **Cómo se juega**: las reglas del ejercicio.
   - **La teoría detrás**: las fichas de los conceptos que trabaja (pueden ser varias), cada una con "Abrir en el glosario".
2. **"¿Por qué?" al fallar** (Teoría): explica **el error concreto**, generado a partir de las reglas. Ejemplo: "Has elegido Mi♯, pero es Fa: entre Mi y Fa solo hay un semitono".
3. **Palabras clave pulsables** en todos los textos explicativos (subrayado de puntos): al tocarlas sale la ficha corta del concepto.
4. **En Práctica**, el "?" solo está en la preparación y en la pausa, nunca encima del ejercicio en marcha.
5. En las pantallas de **Sección**, **Afinaciones** y **Perfil** (qué es cada cosa y cómo leer los datos).

**Implementación**
- **Un único archivo de contenidos**: `js/data/concepts.js`. Cada concepto se escribe una sola vez y se usa en el glosario, en el "?" y en las palabras pulsables.
  ```js
  {
    id: 'octave-shapes',
    block: 'notes',            // notes | chords | intervals | scales-keys | blues-slide | caged | tunings | rhythm-technique | tablature
    title: 'Formas de octava',
    aliases: ['octava', 'octave'],   // buscador y palabras pulsables (ES y EN)
    summary: '3–5 líneas…',
    diagram: { type: 'fretboard', fromFret: 0, toFret: 7, markers: [...] },  // obligatorio (ver abajo)
    // noDiagramReason: '…',   // solo si un esquema no tiene sentido: explica por qué
    sound: { ... },            // opcional: qué suena con "Escuchar"
    lesson: '#/teoria/notas/aprender#octavas',
    related: ['octave', 'unison'],
  }
  ```
- **Esquema obligatorio**: todo concepto lleva `diagram` (`type`: `fretboard`, `chord` o `tab`). Solo si un esquema no tiene sentido se omite, y entonces el concepto lleva `noDiagramReason` con el motivo. Los puntos del esquema se calculan con `js/core/` (nunca se escriben a mano notas ni trastes que se puedan calcular) y suenan al tocarlos.
- **Marcado de palabras pulsables**: `[[id-del-concepto|texto visible]]`, por ejemplo `la [[blue-note|blue note]]`.
- **Campos nuevos en cada ejercicio** (7.1): `howTo` (cómo se juega), `concepts` (ids, al menos uno) y `check()` devuelve también `why` (explicación del error concreto).
- **Componentes**: `ui/help-sheet.js` (panel) y `ui/term.js` (palabra pulsable y parser).
- **Tests** (`tests/concepts.test.js`): no hay ids repetidos; todo id usado en `concepts`, `related` o `[[id|…]]` existe; todo ejercicio tiene `howTo` y al menos un concepto; todo `lesson` apunta a una ruta existente; todo concepto tiene `diagram` o `noDiagramReason` (desde la Fase 1B).

### 6.9 Almacenamiento de datos
- Todo se guarda **automáticamente y al momento** en el almacenamiento local del dispositivo (`localStorage`). No hay botones de "Guardar".
- Los datos son **de cada dispositivo**: no hay cuenta ni sincronización. **Exportar e importar** en Ajustes sirven de copia de seguridad y para pasar datos entre dispositivos. La exportación incluye progreso, historial, récords, lecciones completadas, progresiones guardadas y ajustes.
- Al arrancar, la app llama a `navigator.storage.persist()` (en un `try/catch`; si no está disponible, no pasa nada).
- En Ajustes, junto a exportar e importar, la nota: "Tus datos se guardan solo en este dispositivo. Si borras la app, se borran. Exporta una copia de vez en cuando."
- El historial de sesiones se guarda de forma compacta (un registro corto por ronda). Si en el futuro se acercara al límite, se valorará pasar a IndexedDB.

### 6.10 Nombre e icono
- **Nombre: GuitarSeo** (siempre así: G y S mayúsculas, sin espacio). Juego de palabras con "guitarreo" y el apodo del autor.
- Se usa en: el inicio, `<title>`, `manifest.webmanifest` (`name` y `short_name`), `apple-mobile-web-app-title` y "Acerca de".
- **El repositorio no cambia de nombre** (sigue siendo `MyGuitarApp`): cambiarlo cambiaría la dirección de GitHub Pages y habría que reinstalar la app.
- **Icono y logo** (aprobados en maqueta): cuadrado con esquinas redondeadas en ámbar `#D4A24C`; dentro, 4 cuerdas verticales y 2 trastes horizontales finos en `#2A1E08` (trastes algo más tenues) y un punto redondo `#2A1E08` en el centro, como una nota marcada. Sin texto.
  - SVG como fuente; exportar los PNG necesarios (192, 512, 180 para `apple-touch-icon` y una versión *maskable* con margen de seguridad).
  - Se pueden pulir proporciones y grosores manteniendo la idea; enseñar el resultado al usuario.

---

## 7. Motores de ejercicios

### 7.1 Interfaz común
Todos los ejercicios se registran en `exercise-registry.js` con esta forma:

```js
{
  id: 'notes.which-note',
  module: 'notes',
  section: 'teoria',            // 'teoria' | 'practica'
  title: '¿Qué nota es?',
  description: '...',           // la frase de la preparación (6.6.6)
  howTo: '...',                 // "Cómo se juega" en el panel "?" (6.8)
  concepts: ['note-names'],     // ids de concepts.js, al menos uno
  tunings: 'standard',          // 'standard' | 'any' | lista de ids de afinación (7.6)
  levels: { basico: {...}, intermedio: {...}, avanzado: {...} },  // parámetros por nivel
  roundLength: 10,              // preguntas por ronda (Teoría) o duración (Práctica)
  generate(levelParams, rng, stats) { ... },   // devuelve una pregunta o consigna
  render(item, container, ctx) { ... },        // dibuja la pregunta
  check(item, answer) { ... },                 // solo Teoría: { correct, feedback, why }
  statKeys(item) { ... },                      // claves para estadísticas, p. ej. 'note:s6f5'
}
```

Así la **sesión mezclada** puede escoger ejercicios de cualquier módulo.

### 7.2 Motor de Teoría (`quiz-runner.js`)
- Ronda de N preguntas, con la pantalla de 6.6.7.
- **Al acertar**: ✓ verde, "Correcto ✓" y altavoz; pasa sola a los 2 s (se cancela si se pulsa el altavoz y aparece Continuar).
- **Al fallar**: correcta ✓ en verde, elegida ✗ en rojo, panel con la corrección concreta, altavoz, "¿Por qué?" (el `why` de `check()`) y Continuar. No avanza solo.
- **Sin sonido automático**: solo suena al pulsar el altavoz.
- Temporizador opcional según el nivel. El "?" pausa la ronda.
- Registra en estadísticas: acierto, tiempo de respuesta y fecha. Al terminar (o al salir a mitad), guarda la ronda en el **registro de sesiones** (6.6.13).
- Las preguntas se eligen con **peso**, de modo que lo que más se falla sale más (ver 7.4). No se repite la misma pregunta dos veces seguidas.

### 7.3 Motor de Práctica (`practice-runner.js`)
- Pantalla de manos libres (6.6.8): consigna enorme, cuenta atrás visible, guía de ritmo y avance automático; al acabar el tiempo muestra las posiciones 3 s.
- **Voz**: dice la consigna ("Sol", "Do en forma de La"…). En ES usa nombres en español ("Fa sostenido", "Si bemol"); en EN, nombres en inglés ("F sharp").
- **Metrónomo** opcional, con tempo ajustable.
- **Wake Lock** activo mientras dura la ronda, y se vuelve a pedir en `visibilitychange`.
- Botones grandes de pausa y "Ver posiciones". El "?" solo se abre en la preparación o en pausa.
- **Sin autoevaluación**: al final, el resumen de 6.6.10 (ejercicio, nivel, consignas, tiempo y récord si lo hay).
- Cada ronda se guarda en el **registro de sesiones** (6.6.13).

### 7.4 Pesos de repetición
Para cada clave de estadística: `peso = 1 + 3 × tasaDeFallo + 0,5 × (no vista recientemente ? 1 : 0)`. Las claves nunca vistas tienen peso 1,5. La implementación va en `core/stats.js`, con tests.

- **Práctica no tiene datos de fallo** (no hay autoevaluación), así que sus consignas se eligen al azar evitando repetir las más recientes. Los pesos por fallo solo usan resultados de Teoría, que sí cuentan para la sesión mezclada de Práctica cuando el tema es el mismo.

### 7.5 Niveles (criterio general)
- **Básico**: rango reducido, solo notas naturales, sin tiempo o con mucho tiempo, menos opciones de respuesta.
- **Intermedio**: rango completo (0–12), alteraciones incluidas, tiempo moderado.
- **Avanzado**: todo el rango, menos tiempo, ejercicios inversos o combinados y tonalidades menos habituales.

Cada módulo concreta sus niveles en la sección 8. Se espera afinarlos con el uso.

### 7.6 Afinaciones en los ejercicios
- Cada ejercicio declara qué afinaciones admite con `tunings`: `'standard'` (solo la estándar; la fila de afinación no aparece en la preparación), `'any'` (cualquiera de las 7 de 4.2) o una lista de ids.
- Con otra afinación, todo (notas, posiciones, respuestas, unísonos, tablatura) se **calcula por MIDI** a partir de la afinación con `core/fretboard-model.js`; nunca se reutilizan trastes de la estándar escritos a mano.
- La afinación inicial es la **afinación por defecto** de Ajustes (6.5), y la preparación recuerda la última usada en cada ejercicio. Si la de Ajustes no la admite el ejercicio, se usa la estándar.
- El panel de la preparación (6.6.6) muestra solo las afinaciones admitidas, agrupadas como en 6.6.16.
- Los ejercicios que dependen de formas de la afinación estándar (octavas, CAGED, cajas, acordes abiertos) declaran `'standard'` salvo que su fase diga otra cosa.
- En Práctica, si no es la estándar, se muestra "Afinación: …" (6.6.8). La afinación se guarda en el registro de sesiones.

---

## 8. Fases de construcción

> **En todas las fases de la 2 a la 8**: escribir en `concepts.js` los conceptos del bloque, con `howTo`, `concepts` y `why` en todos sus ejercicios, y enlazar la lección con palabras pulsables.

### Fase 0 — Cimientos y despliegue
Objetivo: el esqueleto de la app funcionando en el iPhone a través de GitHub Pages.

- [x] Estructura de carpetas, `package.json` (`"type": "module"`, `"test": "node --test"`), `.gitignore`.
- [x] `core/theory.js`, `core/notation.js`, `core/fretboard-model.js` y `core/random.js` con sus tests (sección 4).
- [x] `storage.js` con esquema versionado (`schemaVersion`), lecturas y escrituras dentro de try/catch, y exportar/importar JSON.
- [x] `settings.js` y la pantalla de ajustes, aún sin las opciones que dependen de fases posteriores.
- [x] `router.js`, cabecera, pestañas TEORÍA | PRÁCTICA y rejilla de módulos con tarjetas "Próximamente". *(La Fase 1A lo sustituye por la navegación por pantallas, 6.4.)*
- [x] Componente `NoteLabel` de doble notación, y el selector ES | EN funcionando en toda la interfaz. *(En la Fase 1A el selector pasa a Ajustes.)*
- [x] Estilos base: tokens de color, tema claro/oscuro y safe areas. *(La Fase 1A los cambia por la paleta de 4.5.)*
- [x] PWA: `manifest.webmanifest` (`display: standalone`), iconos (generados: un diseño simple y original, por ejemplo un mástil estilizado), metas de iOS (`apple-mobile-web-app-capable`, obsoleta pero aún usada por iOS, más `mobile-web-app-capable`, `apple-touch-icon`, `theme-color`) y `sw.js`. *(La Fase 1A cambia nombre e icono, 6.10.)*
  - El service worker usa una constante `CACHE_VERSION` que se incrementa en cada despliegue.
  - El service worker **no se registra en `localhost`**, para evitar versiones viejas durante el desarrollo.
- [x] Repositorio git, primer push y GitHub Pages activado (rama `main`, raíz). Si `gh` no está disponible, Claude Code da al usuario los pasos exactos para hacerlo desde la web de GitHub.
  - Repositorio: https://github.com/Asier-Merino/MyGuitarApp · App: https://asier-merino.github.io/MyGuitarApp/
- [x] Instrucciones al usuario para abrir la URL en Safari y añadirla a la pantalla de inicio.

**Hecho cuando**: los tests pasan, la app se abre en el iPhone desde la pantalla de inicio a pantalla completa, el selector ES | EN cambia las notas en toda la interfaz y los ajustes se conservan al cerrar y abrir.

### Fase 1A — Navegación, estilo, Afinaciones, Glosario y Ajustes
Objetivo: adaptar lo de la Fase 0 a la navegación por pantallas y al estilo GuitarSeo, y dejar listas las secciones que no dependen del mástil ni del audio.

- [x] Estilo (6.1): tokens de color de los dos temas (4.5), tema oscuro por defecto con Oscuro / Claro / Auto, botón físico (gris y ámbar), filas de lista con icono y chevron, iconos SVG.
- [x] Navegación por pantallas (6.4): quitar las pestañas y la rejilla de la Fase 0; cabecera ← título ? en todas las pantallas interiores; historial del router para la flecha ← y el botón atrás.
- [x] Pantallas **Inicio** (6.6.1), **Sección** (6.6.2), **Módulo** (6.6.3) y **Preparación** (6.6.6), con las listas aún vacías o "Próximamente". "Continuar" no aparece todavía (no hay historial).
- [x] `data/tunings.js` con las 7 afinaciones (4.2), su test, y `core/fretboard-model.js` preparado para recibir una afinación.
- [x] Pantalla **Afinaciones** (6.6.16). Las notas suenan al tocarlas y "Tocar todas" funciona (con el sonido mínimo necesario; el sintetizador completo llega en la 1B).
- [x] `data/concepts.js` con los conceptos básicos de los bloques Notas y Afinaciones, `ui/term.js` (palabras pulsables) y `tests/concepts.test.js`.
- [x] **Glosario** (6.6.17): buscador, bloques, lista de conceptos y ficha.
- [x] **Ajustes** (6.5) con la tabla de grupos, incluida la afinación por defecto. El selector ES | EN sale de la cabecera.
- [x] **Perfil** provisional (6.6.13) con días practicados y tiempo total (muestra "—" hasta que la Fase 1B empiece a registrar sesiones) y "Acerca de".
- [x] Almacenamiento (6.9): guardado automático, `navigator.storage.persist()`, nota de Ajustes y exportación con todos los datos.
- [x] Nombre **GuitarSeo** e icono nuevo (6.10) en `<title>`, manifest, metas de iOS, Inicio y "Acerca de"; enseñar el icono al usuario.

**Hecho cuando**: en el iPhone se navega por todas las pantallas con la flecha ← sin quedarse atascado, los dos temas se ven bien, Afinaciones suena al tocar las notas, el Glosario encuentra conceptos en español y en inglés, los ajustes se conservan al cerrar y abrir, y el icono y el nombre GuitarSeo aparecen en la pantalla de inicio.

### Fase 1B — Mástil, sonido y motores de ejercicio
Objetivo: las piezas reutilizables que usan todos los módulos.

- [ ] `ui/fretboard.js` completo (6.3), con orientación automática y forzada, el aspecto de cuerdas, trastes y cejuela, y el parámetro `tuning`.
- [ ] `ui/chord-diagram.js`: diagrama vertical con trastes, dedos, cuerdas al aire (o) y no tocadas (x), y cejilla, con el mismo aspecto que el mástil.
- [ ] `audio/context.js`:
  - Crea el AudioContext **dentro del primer toque** del usuario (botón "Empezar" o el primer toque en cualquier botón).
  - Si existe `navigator.audioSession`, fija `type = 'playback'` para que suene con el iPhone en silencio. Si no existe, reproduce en bucle un `<audio>` silencioso tras el gesto, como alternativa.
- [ ] `audio/synth.js`: Karplus-Strong generado en un `AudioBuffer` por nota (≈2 s, decaimiento ≈0,996, filtro paso bajo suave) con caché por MIDI. Funciones `playNote(midi)`, `strum(chord, down|up)` con ~25 ms entre cuerdas y `arpeggio(chord)`.
- [ ] `audio/scheduler.js` (setInterval de 25 ms que programa con 100 ms de antelación sobre `audioCtx.currentTime`) y `audio/metronome.js` (40–200 BPM, acento en el primer tiempo).
- [ ] `engine/speech.js`: voces `es-ES`/`en-US`, nombres de nota hablados y una cola sencilla.
- [ ] `engine/exercise-registry.js` (con `howTo`, `concepts`, `tunings` y `why`, 7.1), `quiz-runner.js` y `practice-runner.js` (7.2, 7.3).
- [ ] Selector de afinación en la preparación (6.6.6, 7.6).
- [ ] Pantallas de ejercicio de Teoría (6.6.7) y de Práctica (6.6.8), con el **botón de altavoz** tras responder.
- [ ] **Esquemas del glosario**: conectar las fichas con el mástil, los diagramas de acordes y (cuando exista) la tablatura; añadir un esquema a todos los conceptos escritos en la Fase 1A; el esquema es interactivo (tocar un punto lo hace sonar). Añadir a `tests/concepts.test.js` que todo concepto tenga `diagram` o `noDiagramReason`.
- [ ] `ui/help-sheet.js` y el "?" en los ejercicios (6.8), con "Cómo se juega", "La teoría detrás" y "¿Por qué?".
- [ ] Resumen de ronda de Teoría y de Práctica, sin autoevaluación, y confeti (6.6.10).
- [ ] **Registro de sesiones** (6.6.13) y récords; "Continuar" en Inicio; el Perfil provisional ya muestra días y tiempo reales.
- [ ] Wake Lock en Práctica.
- [ ] Página de prueba interna (`#/dev`, enlazada solo desde ajustes) para ver el mástil, tocar notas y probar metrónomo y voz.

**Hecho cuando**: en el iPhone se ve el mástil en vertical y en horizontal al girarlo, al tocar un punto suena la nota (también con el iPhone en modo silencio), el metrónomo va estable, la voz dice notas en español, una ronda de prueba se juega de principio a fin con el "?" y el "¿Por qué?", y la ronda aparece en Perfil.

### Fase 2 — Módulo Notas del mástil
**Teoría**
- [ ] Componente de **lección por tarjetas** (6.6.4), estrenado con la lección de Notas.
- [ ] Aprender: cómo se distribuyen las notas, las 7 naturales, que entre Mi-Fa y Si-Do solo hay un semitono, el traste 12 como octava de la cuerda al aire, y las formas de octava.
- [ ] Consulta: mástil completo con todas las notas, con filtro por nota (por ejemplo, ver todos los Sol).
- [ ] Ejercicios:
  - "¿Qué nota es?": se ilumina un traste y se responde con botones.
  - "Encuéntrala": se pide una nota en una cuerda concreta y se toca en el mástil.
  - "Todas en una cuerda": encontrar todas las posiciones de una nota en una cuerda entre 0 y 12.
  - "Octavas": se muestra una nota y se toca su octava con la forma correcta.
  - "Unísonos" (ver abajo).
  - "Rellena el mástil" (ver abajo).
  - "Contrarreloj": el máximo de aciertos en 60 s (récord en Perfil).

**Práctica**
- [ ] "Nota por todas las cuerdas": la app dice una nota y tú la tocas en las 6 cuerdas antes de que acabe el tiempo.
- [ ] "Cuerda a cuerda": se fija una cuerda y la app canta notas al azar para que las toques.
- [ ] "Paseo de octavas": la app dice una nota y tú la tocas y luego su octava.
- [ ] "Unísonos" (ver abajo).

**Unísonos** (Teoría y Práctica)
Encontrar **la misma nota exacta** (mismo MIDI, no solo el mismo nombre) en otra cuerda.
- **Teoría**: se marca un punto (por ejemplo, 6ª cuerda traste 7) y se toca su unísono en la cuerda indicada (5ª cuerda traste 2).
- **Práctica**: la app dice "6ª cuerda, traste 7"; se toca ese punto y su unísono en la cuerda de al lado. Al mostrar la solución, la app hace sonar las dos para oír que son iguales.
- Se calcula siempre por MIDI a partir de la afinación (`tunings: 'any'`).
- Conceptos: "Unísono" y "Regla de los 5 trastes (4 entre Sol y Si)".

| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Dirección | hacia la cuerda más grave de al lado (+5 trastes) | ambas direcciones, incluido el paso Sol–Si | todas las posiciones de esa nota exacta en 0–15 |
| Cuerdas | 6, 5 y 4 | todas | todas |

- Test: la respuesta tiene siempre el mismo MIDI que la pregunta y cae dentro del rango.

**Rellena el mástil** (Teoría)
Un puzle: una cuerda vacía del 0 al 12 que hay que completar.
- Se toca una casilla vacía y se elige la nota en un teclado de 12 botones con doble notación (sin arrastrar).
- Acierto en verde ✓ y fallo en rojo ✗, con altavoz y "¿Por qué?".
- Se cronometra y se guarda el récord por cuerda y nivel.

| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Cuerdas | 6 o 5 | cualquiera | cualquiera, o dos a la vez |
| Casillas a rellenar | solo naturales | todas | todas |
| Pistas | trastes 0, 5, 7 y 12 puestos | solo el traste 0 | ninguna, con contrarreloj |

**Niveles** (resto de ejercicios)
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Trastes | 0–5 | 0–12 | 0–12 |
| Cuerdas | 6 y 5 (configurable) | todas | todas |
| Notas | naturales | con alteraciones | con alteraciones |
| Tiempo (Teoría) | sin límite | 10 s | 5 s |
| Tiempo por nota (Práctica) | 20 s | 12 s | 7 s |

- [ ] Las estadísticas se guardan con claves `note:s{cuerda}f{traste}`.
- [ ] Conceptos del bloque Notas en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: todos los ejercicios funcionan en los 3 niveles, en ambas orientaciones y con ambas notaciones, los unísonos funcionan también con afinaciones no estándar y las estadísticas se guardan.

### Fase 3 — Módulo Acordes abiertos y Calentamiento
**Teoría**
- [ ] Aprender: qué es una tríada, fundamental, 3ª y 5ª, y por qué la 3ª decide si el acorde es mayor o menor (comparar Mi y Mim, La y Lam).
- [ ] Consulta: biblioteca de acordes (5.1) con diagrama, notas que suenan (coloreadas por función), botón para escucharlo rasgueado y arpegiado, y un conmutador para ver el acorde en el mástil.
- [ ] Ejercicios:
  - "¿Qué acorde es?": diagrama, 4 opciones.
  - "Constrúyelo": se marcan los trastes en un diagrama vacío.
  - "¿Qué notas tiene?": elegir las 3 notas del acorde.
  - "¿Mayor o menor?" (visual): se muestra un diagrama y se identifica la calidad.
  - "¿Qué nota falta?": un diagrama con una cuerda sin marcar.

**Práctica**
- [ ] Progresiones predefinidas (5.7) y **Mis progresiones** (6.6.11), con su test.
- [ ] Pantalla de práctica de acordes con diagramas (6.6.12) y el conmutador "Mostrar diagramas".
- [ ] "Cambios de acordes": la app muestra el acorde actual en grande y el siguiente en pequeño, y cambia cada N tiempos con metrónomo, con la progresión elegida.
- [ ] "Cambios en un minuto": se elige una pareja de acordes, se cambia entre ellos durante 60 s, y al final se anota cuántos cambios has hecho (se guarda como récord por pareja).
- [ ] "Acorde cantado": la app dice un acorde al azar y tú lo tocas.
- [ ] **"Rasgueo"**:
  - El compás se dibuja como 8 casillas con **↓**, **↑** o **·** (5.6). La casilla actual se ilumina.
  - La app puede tocar el patrón para escucharlo antes, y contar en voz alta "1 y 2 y…" si se activa.
  - Usa las progresiones de 6.6.11 y la pantalla de 6.6.12 (el patrón entre el diagrama y el siguiente acorde).
  - `data/strum-patterns.js` con los patrones de 5.6 y su test.
  - Concepto: "Rasgueo y regla del péndulo" (bloque Ritmo y técnica).

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Acordes | los 8 básicos | + Fa mini y séptimas | + Fa con cejilla |
| Tempo de cambios | 60 BPM, cambio cada 8 tiempos | 80 BPM, cada 4 | 100 BPM, cada 2 |
| Tempo de rasgueo | 60–70 BPM | 70–90 BPM | 90–110 BPM |

**Calentamiento** (nuevo módulo de Práctica)
- [ ] Componente de **tablatura** completo (6.7), con el bloque Tablatura del glosario.
- [ ] Un dedo por traste, de la 6ª cuerda a la 1ª y vuelta, en una posición elegida (traste 1 o 5), con la **tablatura** en pantalla y metrónomo.
- [ ] Variantes: 1-2-3-4, 4-3-2-1, 1-3-2-4 y "araña" (dedos alternos en dos cuerdas).
- [ ] **Subida automática de tempo**: +4 BPM cada 2 vueltas completas. "Bajar" resta 8 BPM y detiene la subida. Se guarda el tempo máximo por variante como récord. Se implementa como función reutilizable del metrónomo (la propuesta P5 sigue pendiente para aplicarla a otros ejercicios).
- [ ] Duración elegible: 2, 3 o 5 minutos.
- [ ] Concepto: "Calentamiento cromático" (bloque Ritmo y técnica).

| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Notas por tiempo | 1 (negras) | 2 (corcheas) | 4 (semicorcheas) |
| Variantes | 1-2-3-4 | + 4-3-2-1 y 1-3-2-4 | + araña |
| Tempo inicial | 60 BPM | 70 BPM | 80 BPM |

- [ ] Conceptos de los bloques Acordes, Ritmo y técnica y Tablatura en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: todos los ejercicios funcionan, los datos de acordes pasan los tests de 5.1, las progresiones y los patrones de rasgueo pasan sus tests, la tablatura dibuja todos los símbolos de 6.7 y el calentamiento sube el tempo solo.

### Fase 4 — Módulo Oído
**Teoría**
- [ ] "¿Mayor o menor?": suena un acorde y se responde.
- [ ] "¿Más agudo o más grave?": suenan dos notas (calentamiento, nivel Básico).
- [ ] "¿Qué intervalo es?" (Intermedio y Avanzado): 3ª mayor o menor, 5ª, octava… La lista de intervalos se amplía con el nivel.

**Práctica**
- [ ] "Encuentra la nota": suena una nota y la buscas en tu guitarra. Al pulsar "Ver" (o pasado el tiempo), se muestra en el mástil.
- [ ] "Imita el acorde": suena un acorde abierto y lo tocas.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| ¿Mayor o menor? | rasgueado lento | arpegiado | + séptima de dominante (3 opciones) |
| Encuentra la nota | cuerda 6 o 5, naturales | cualquier cuerda, 0–12 | con alteraciones, sin pista de cuerda |
| Intervalos | — | 3ªM, 3ªm, 5ª, 8ª | todos hasta la octava |

- [ ] Botón "Repetir sonido" en todos los ejercicios.
- [ ] Conceptos del bloque Intervalos (los de oído) en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios.

**Hecho cuando**: los ejercicios suenan bien en el iPhone y la generación al azar no repite de forma evidente.

### Fase 5 — Módulo Escala y tonalidad
**Teoría**
- [ ] Aprender:
  - Tonos y semitonos en el mástil (1 traste = 1 semitono).
  - Intervalos (4.3), vistos en una cuerda y entre cuerdas, con sonido.
  - Escala mayor: fórmula T T S T T T S, primero sobre una sola cuerda y luego en una posición.
  - Acordes de la tonalidad: I ii iii IV V vi vii°, con ejemplos de progresiones famosas por grados (I–V–vi–IV, I–IV–V, ii–V–I) que se pueden escuchar.
- [ ] Consulta: selector de tonalidad que muestra escala, acordes de cada grado (con diagrama si existe en abierto) y las notas de la escala en el mástil.
- [ ] Ejercicios:
  - "Construye la escala": se elige el siguiente grado.
  - "¿Qué grado es?": por ejemplo, ¿qué grado es Mim en Re mayor?
  - "¿Qué acordes tiene la tonalidad?".
  - "¿Qué intervalo hay?": entre dos puntos del mástil.
  - "Completa la progresión": I–?–vi–IV en Sol.

**Práctica**
- [ ] "Escala con metrónomo": la escala mayor en una posición, subiendo y bajando, con tempo ajustable y la tablatura (6.7) en pantalla; tempo máximo como récord.
- [ ] "Progresión de la tonalidad": la app muestra una progresión por grados en una tonalidad y la tocas con metrónomo.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Tonalidades | Do, Sol, Re | + La, Mi, Fa | las 12 mayores |
| Intervalos | 2ª, 3ª, 5ª, 8ª | + 4ª, 6ª | todos, incluido el tritono |

- [ ] Tests: escalas bien deletreadas (Fa mayor con Sib, Re mayor con Fa# y Do#) y acordes de la tonalidad (Do: C Dm Em F G Am B°; Sol: G Am Bm C D Em F#°).
- [ ] Conceptos de los bloques Intervalos y Escalas y tonalidad en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: los tests pasan y todos los ejercicios funcionan en los 3 niveles.

### Fase 6 — Módulo Blues y slide
**Teoría**
- [ ] Aprender:
  - Pentatónica menor: las 5 notas y la caja 1.
  - Escala blues: la pentatónica más la *blue note* (b5), en morado.
  - Las 5 cajas y cómo se encadenan.
  - Estructura del blues de 12 compases (5.4) con I7, IV7 y V7.
  - Qué es una nota objetivo y por qué terminar las frases en la fundamental del acorde que suena.
- [ ] Consulta: mástil con la pentatónica o escala blues en la tonalidad elegida, caja a caja o el mástil completo, y la cuadrícula de 12 compases de cada variante.
- [ ] Ejercicios:
  - "¿Qué acorde va en el compás X?".
  - "¿Es nota de la escala?": un punto del mástil, sí o no.
  - "Completa la caja": falta un punto de la caja.
  - "¿Dónde está la *blue note*?".

**Práctica**
- [ ] **Base de blues** (`audio/backing.js`):
  - Shuffle con swing (corcheas en proporción 2:1).
  - Bajo *boogie* (fundamental-5ª / fundamental-6ª) en cuerdas graves.
  - Golpes de acorde en el tiempo 2 y 4.
  - Percusión sencilla: charles con ruido filtrado y bombo con una onda senoidal descendente.
  - Tempo de 60 a 120 BPM y tonalidad elegible.
  - La cuadrícula de 12 compases se ilumina en tiempo real.
- [ ] "Improvisa sobre la base": la caja elegida en el mástil mientras suena la base.
- [ ] "Notas objetivo": mientras suena la base, el mástil resalta dentro de la caja la fundamental del acorde actual (La, Re o Mi en La), y avisa un tiempo antes del cambio de acorde.
- [ ] "Pregunta-respuesta": la app toca un lick (5.5) en un compás, con la tablatura (6.7) en pantalla, y tú lo repites en el siguiente.
- [ ] "Licks por acorde": cada compás muestra un lick adecuado al acorde que suena (según `target`), con su tablatura.
- [ ] Los licks usan la tablatura de 6.7 y su campo `tech` (5.5).

**Slide**
- [ ] Contenido por definir con el usuario antes de empezar la fase (usa las afinaciones abiertas de 4.2). Proponer ejercicios y licks y esperar su aprobación.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Cajas | caja 1 | cajas 1 y 2 | las 5 |
| Tonalidad | La | La, Mi | La, Mi, Sol, Do, Re |
| Tempo | 60–70 BPM | 70–90 BPM | 90–120 BPM |
| Progresión | sin *turnaround* | estándar | estándar y *quick change* |

- [ ] Tests de 5.3, 5.4 y 5.5.
- [ ] Conceptos del bloque Blues y slide en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: la base suena con un swing estable al menos 5 minutos seguidos en el iPhone, los 12 compases se iluminan sincronizados y las notas objetivo cambian a tiempo.

### Fase 7 — Módulo CAGED
**Teoría**
- [ ] Aprender:
  - Idea clave: las formas de Do, La, Sol, Mi y Re son los acordes abiertos que ya conoces, desplazados por el mástil.
  - Las 5 formas de un acorde encajan como piezas de un puzzle, en el orden C-A-G-E-D.
  - Dónde está la fundamental en cada forma.
- [ ] Consulta: **explorador**. Se elige un acorde mayor y se recorren sus 5 formas con un deslizador o botones; la forma activa se ve con colores de función (R, 3, 5) sobre el mástil 0–15, y las vecinas atenuadas.
- [ ] Puente con la pentatónica: conmutador que superpone, sobre la forma activa, las notas de la **pentatónica mayor** de ese acorde que caen dentro de la ventana de trastes de la forma (±1 traste).
- [ ] Ejercicios:
  - "¿Qué forma es?": una forma en el mástil, responder C/A/G/E/D.
  - "¿Qué acorde es?": una forma en un traste, responder el acorde.
  - "¿Dónde está la fundamental?": tocar las fundamentales de una forma.
  - "Ordena las formas": a partir de una forma, ¿cuál viene después hacia agudos?

**Práctica**
- [ ] "Acorde en forma X": la app dice, por ejemplo, "Do en forma de La", y lo tocas. Al pulsar "Ver" se muestra.
- [ ] "Recorre las 5 formas": un acorde por las 5 formas seguidas, subiendo por el mástil, con metrónomo.
- [ ] "Misma zona, distintos acordes": se fija una zona del mástil (por ejemplo, trastes 5–8) y la app pide acordes que debes encontrar en esa zona con la forma que toque.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Formas | Mi y La | + Do y Sol | las 5 |
| Acordes | Do, Sol, La | + Re, Mi, Fa | todos los mayores |

- [ ] Tests de 5.2.
- [ ] Conceptos del bloque CAGED en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: el explorador muestra las 5 formas correctas para cualquier acorde mayor y los tests pasan.

### Fase 8 — Perfil completo y sesión mezclada
- [ ] **Perfil completo** (6.6.13):
  - Racha, días practicados y tiempo total.
  - Calendario de las últimas 13 semanas.
  - Dominio por tema con barras (aciertos recientes en Teoría).
  - **Mapa del mástil**: mapa de calor con el acierto por posición (de Notas y Oído).
  - **Puntos débiles**: las claves con más fallos, con un botón para practicarlas.
  - **Récords**: contrarreloj, cambios en un minuto por pareja de acordes, "Rellena el mástil" por cuerda y tempo máximo en escalas y calentamiento.
- [ ] **Sesión mezclada** (en Teoría y en Práctica): se elige la duración (5, 10 o 20 min) y la app encadena ejercicios de varios módulos, ponderando por puntos débiles (7.4) y por lo que hace tiempo que no se hace. Solo incluye los módulos y niveles que el usuario ha usado al menos una vez, más uno nuevo de vez en cuando.
- [ ] Revisión final: accesibilidad (contraste, tamaño de toque), rendimiento en el iPhone y textos.
- [ ] Actualizar la sección 11 con las ideas que hayan surgido.

**Hecho cuando**: el Perfil refleja lo practicado y la sesión mezclada propone una combinación sensata.

---

## 9. Particularidades de iOS (checklist)

- [ ] El audio solo arranca tras un gesto del usuario.
- [ ] Sonido con el interruptor de silencio activado: `navigator.audioSession.type = 'playback'`, o la alternativa del `<audio>` silencioso en bucle.
- [ ] Si el AudioContext queda en estado `suspended` o `interrupted` (llamada, cambio de app), volver a llamar a `resume()` al volver a la app.
- [ ] Wake Lock en Práctica, y pedirlo de nuevo al volver a la app.
- [ ] `speechSynthesis`: la primera locución dentro de un gesto. Las voces pueden cargarse tarde (`voiceschanged`).
- [ ] Safe areas (`env(safe-area-inset-*)`) y `viewport-fit=cover`.
- [ ] Bloqueo de rotación: opción manual de orientación del mástil en Ajustes.
- [ ] Almacenamiento: recomendar instalar en la pantalla de inicio y ofrecer exportar el progreso. Ojo: la app instalada guarda sus datos **aparte** de Safari; lo que se configure en Safari no aparece en la app de la pantalla de inicio.
- [ ] `navigator.storage.persist()` al arrancar, dentro de un `try/catch` (6.9).
- [ ] Service worker, Wake Lock y micrófono necesitan HTTPS: **probar en el iPhone siempre a través de GitHub Pages**. En la red local (`http://IP:8000`) se puede ver la interfaz, pero sin esas funciones.
- [ ] Evitar el zoom por doble toque en botones (`touch-action: manipulation`) y el resaltado gris al tocar (`-webkit-tap-highlight-color: transparent`).

---

## 10. Desarrollo, pruebas y despliegue

- **Servidor local**: `npx serve .` o `python3 -m http.server 8000`. Los módulos ES no funcionan abriendo el archivo con `file://`.
- **Tests**: `npm test` (con `node --test`). Todo lo de `core/` y `data/` tiene tests; la interfaz se comprueba manualmente.
- **Comprobación visual**: si hay un navegador disponible en la sesión, abrir la app en tamaño móvil (390×844) y en escritorio y revisar los dos temas y ambas orientaciones del mástil antes de dar una fase por terminada. Guardar capturas en `docs/capturas/fase-N/` (fuera de la caché del service worker).
- **Despliegue**: cada push a `main` actualiza GitHub Pages. Incrementar `CACHE_VERSION` en `sw.js` en cada push que cambie archivos de la app.
- **Versión visible** en Ajustes y en Perfil → Acerca de (por ejemplo, `v0.3.0` = fase 3), para comprobar en el iPhone qué versión está cargada.

---

## 11. Ideas para el futuro (fuera del alcance actual)

- Detección de notas por micrófono para comprobar en Práctica que la nota tocada es la correcta (notas sueltas; los acordes son mucho más difíciles).
- CAGED de acordes menores y de séptima.
- Tríadas en grupos de cuerdas y arpegios.
- Modos griegos y tonalidades menores.
- Más progresiones (blues menor, *rhythm changes*).
- Afinador.
- "¿Cuándo cambia el acorde?": escuchar la base de blues sin la cuadrícula y pulsar en cada cambio al IV o al V.
- Convertirla en app nativa con Capacitor (requiere un Mac y una cuenta de desarrollador de Apple).

---

## 12. Propuestas

Propuestas de mejora. Las pendientes se preguntan al usuario al llegar a su fase.

| Id | Propuesta | Estado |
|---|---|---|
| P1 | ~~Sonido automático al acertar o fallar~~ | **Sustituida** por el botón de altavoz tras responder (6.6.7) |
| P2 | *(descripción pendiente: pedírsela al usuario)* | Pendiente |
| P3 | *(descripción pendiente: pedírsela al usuario)* | Pendiente |
| P4 | *(descripción pendiente: pedírsela al usuario)* | Pendiente |
| P5 | Subida automática de tempo en otros ejercicios (ya se usa en el Calentamiento, Fase 3) | Pendiente |
| P6 | *(descripción pendiente: pedírsela al usuario)* | Pendiente |
| P7 | *(descripción pendiente: pedírsela al usuario)* | Pendiente |
| P8 | ~~Logros~~ | **Rechazada** |

---

## 13. Registro de cambios

| Fecha | Fase | Cambios | Notas del usuario |
|---|---|---|---|
| 2026-10-27 | 0 | Cimientos: lógica de teoría, notación, mástil y azar con tests; almacén versionado con exportar/importar; ajustes (notación, alteraciones, tema); router, cabecera, pestañas y módulos «Próximamente»; `NoteLabel`; tema claro/oscuro; PWA (manifest, iconos, service worker); despliegue en GitHub Pages. Cambios al plan: script de tests `node --test`, repositorio público, aviso de que iOS separa los datos de Safari y de la app instalada, metas de iOS actualizadas. | |
| 2026-10-29 | Plan | Integrado `CAMBIOS.md`: nombre GuitarSeo y estilo inspirado en Chess.com (ámbar mate, botón físico, tema oscuro por defecto); navegación por pantallas en lugar de pestañas; esquemas de cada pantalla (6.6); nueva paleta (4.5); 7 afinaciones (4.2) y su uso en ejercicios (7.6); ayuda "?", "¿Por qué?", glosario y `concepts.js` (6.8); tablatura completa (6.7); Perfil en lugar del módulo Progreso; Práctica sin autoevaluación; registro de sesiones; almacenamiento (6.9). Fase 1 dividida en 1A y 1B. Nuevos ejercicios: Unísonos y Rellena el mástil (Fase 2), Rasgueo, progresiones y Calentamiento (Fase 3). Módulos renombrados: Escala y tonalidad, Blues y slide. Fase 8 renombrada a "Perfil completo y sesión mezclada". Nueva sección 12 (Propuestas). | Valores MIDI de las afinaciones (4.2), descripción de P2–P7 y contenido del slide pendientes de confirmar. |
| 2026-10-30 | 1A | Navegación por pantallas con flecha ← (historial propio; sin historial vuelve a la pantalla madre); estilo GuitarSeo con tokens de los dos temas, botón físico, listas e iconos SVG; Inicio, Sección, Módulo, Preparación (nivel y afinación recordados por ejercicio; Empezar desactivado hasta la Fase 2) y pantallas «Próximamente»; `data/tunings.js` con las 7 afinaciones y cambios calculados; pantalla Afinaciones con sonido Karplus-Strong afinado y «Tocar todas»; `concepts.js` (15 conceptos de Notas y Afinaciones, ayudas «?» de cada pantalla), palabras pulsables y panel inferior; Glosario con buscador ES/EN; Ajustes completos (afinación por defecto, sonido, volumen, voz, mástil); Perfil provisional y Acerca de; esquema de datos v2 (récords, lecciones, progresiones, preparación) y `storage.persist()`; nombre e icono GuitarSeo. Cambios al plan: token `--amber-text` (4.5), franja de la barra de estado, bloques vacíos ocultos en el Glosario, estructura de carpetas (3). | Afinaciones de 4.2 validadas. |
| 2026-10-30 | Plan | Esquema visual obligatorio en las fichas del glosario y en las tarjetas de lección (`diagram`, o `noDiagramReason` si no tiene sentido), interactivo; tarea «Esquemas del glosario» y su test añadidos a la Fase 1B; convención añadida a CLAUDE.md. | Petición del usuario al cerrar la 1A. |
