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
   - crea la **etiqueta de versión** de la fase y la sube (10),
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
  - Fila **Herramientas** debajo de las cuatro secciones: utilidades sueltas para tocar, de momento solo el **Metrónomo** (6.6.18). Admite más herramientas en el futuro sin rediseñar el Inicio.
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

- Blues y slide es un solo módulo, pero se construye en dos fases: el blues en la Fase 6 y el slide en la Fase 7 (sección 8).

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
│   ├── FUTURAS_UPDATES.md     # mejoras para después de la v1.0 e ideas sin decidir (no forma parte del plan)
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
│   │   ├── history.js         # días practicados, tiempo total y racha del registro de sesiones
│   │   ├── stats.js           # estadísticas por clave y pesos de repetición (7.4)
│   │   ├── rhythm.js          # tempo, compás, subdivisión y "marcar el tempo tocando"
│   │   ├── session.js         # duración elegible, entrada del registro, récords, resumen
│   │   ├── diagrams.js        # puntos de los esquemas del glosario, calculados
│   │   ├── progressions.js    # progresiones por grados y "Mis progresiones" (Fase 3)
│   │   ├── tab.js             # tablatura: símbolos, texto plano, colocación, ritmo y curvas de altura
│   │   └── warmup.js          # calentamiento: ida y vuelta, araña y subida de tempo
│   ├── data/
│   │   ├── modules.js         # secciones, módulos, niveles y ejercicios previstos
│   │   ├── tunings.js         # las 7 afinaciones (4.2)
│   │   ├── chords.js          # acordes abiertos y de séptima (dedos incluidos)
│   │   ├── caged.js           # plantillas de las 5 formas
│   │   ├── scales.js          # fórmulas y cajas pentatónicas
│   │   ├── blues.js           # progresiones de 12 compases
│   │   ├── licks.js           # licks transportables, con técnica, estilo y nivel (5.5)
│   │   ├── strum-patterns.js  # patrones de rasgueo
│   │   ├── progressions.js    # progresiones predefinidas (grados y tonalidad)
│   │   └── concepts.js        # conceptos: glosario, ayudas "?" y palabras pulsables
│   ├── ui/
│   │   ├── fretboard.js       # render SVG del mástil (vertical/horizontal)
│   │   ├── chord-diagram.js   # render SVG de diagramas de acorde
│   │   ├── note-label.js      # componente de doble notación
│   │   ├── tab.js             # tablatura completa (6.7)
│   │   ├── strum.js           # patrón de rasgueo (8 casillas) y su esquema
│   │   ├── help-sheet.js      # panel de ayuda "?" y "¿Por qué?"
│   │   ├── term.js            # palabras pulsables [[id|texto]] y textos con marcado
│   │   ├── icons.js           # iconos SVG y logo
│   │   ├── tuning-picker.js   # fila y panel para elegir afinación
│   │   ├── concept-diagram.js # esquema de un concepto (mástil, acorde, pulsos) con leyenda
│   │   ├── beats.js           # indicador y esquema de pulsos
│   │   ├── confetti.js        # celebración
│   │   └── components.js      # botón físico, cabecera, listas, selector de nivel, resumen de ronda
│   ├── audio/
│   │   ├── context.js         # AudioContext, desbloqueo iOS, audio session
│   │   ├── pluck.js           # muestras Karplus-Strong afinadas (sin Web Audio, con test)
│   │   ├── synth.js           # Karplus-Strong, notas, rasgueos, arpegios
│   │   ├── scheduler.js       # reloj con lookahead
│   │   ├── metronome.js       # 30–240 BPM, compás, subdivisión y subida automática de tempo
│   │   ├── strum-player.js    # toca un patrón de rasgueo con un acorde
│   │   ├── tab-player.js      # toca una tablatura con sus técnicas y la velocidad elegida
│   │   └── backing.js         # base de blues (bajo, acordes, percusión)
│   ├── screens/               # Inicio, Sección, Módulo, Preparación (setup.js y setup-options.js), Aprender (lesson.js), Ejercicio (play.js), Próximamente
│   ├── engine/
│   │   ├── exercise-registry.js
│   │   ├── quiz-runner.js     # motor de ejercicios de Teoría
│   │   ├── practice-runner.js # motor de ejercicios de Práctica (duración, temporizador, voz, wake lock)
│   │   ├── fill-runner.js     # motor de "Rellena el mástil" (puzle con teclado de 12 notas)
│   │   ├── chord-runner.js    # pantalla de práctica de acordes: Cambios de acordes y Rasgueo (6.6.12)
│   │   ├── minute-runner.js   # Cambios en un minuto
│   │   ├── warmup-runner.js   # Calentamiento con tablatura y subida de tempo
│   │   ├── practice-common.js # cabecera, pausa y resumen de esos motores
│   │   ├── rounds.js          # preparación, arranque, registro de sesiones, estadísticas y récords
│   │   ├── countdown.js       # temporizador que se puede pausar
│   │   ├── wake-lock.js       # pantalla encendida
│   │   └── speech.js
│   └── modules/
│       ├── notes/             # common.js, theory-exercises.js, practice-exercises.js, reference-view.js
│       ├── chords/            # common.js, theory-exercises.js, practice-exercises.js, reference-view.js
│       ├── ear/
│       ├── theory/            # Escala y tonalidad
│       ├── blues/             # Blues y slide
│       ├── caged/
│       ├── warmup/            # Calentamiento (exercises.js)
│       ├── tunings/           # pantalla Afinaciones
│       ├── glossary/
│       ├── tools/             # Herramientas: metronome-view.js (pantalla Metrónomo, 6.6.18)
│       ├── dev/               # página de prueba (#/dev): mástil, acordes, voz y pulso
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
    ├── progressions.test.js   # progresiones por grados y Mis progresiones
    ├── tab.test.js            # cada símbolo de la tablatura, ritmo y sonido
    ├── warmup.test.js         # calentamiento: un dedo por traste, espejo, araña y tempo
    ├── chords-exercises.test.js # ejercicios de Acordes y Calentamiento, y lo que dicen sus fichas
    ├── concepts.test.js
    ├── random.test.js
    ├── pluck.test.js          # la cuerda sintetizada suena afinada (< 2 cents)
    ├── history.test.js
    ├── storage.test.js        # almacén versionado y ajustes (con un localStorage simulado)
    ├── rhythm.test.js         # tempo, compás, subdivisión y marcar el tempo
    ├── scheduler.test.js      # planificador con lookahead (pulso regular, sin ráfagas)
    ├── stats.test.js          # pesos de repetición (7.4)
    ├── session.test.js        # duración, registro, récords, racha
    ├── countdown.test.js      # temporizador con pausa
    ├── speech.test.js         # idioma y voz
    ├── exercises.test.js      # registro de ejercicios y ejercicios de prueba en las 7 afinaciones
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
- **Ajustes de contraste (Fase 1B)**: el texto de los puntos del mástil usa `--on-fn` (oscuro `#1E1B18`, claro `#FFFFFF`) y los puntos neutros `--dot-neutral` / `--on-dot-neutral`. Para que el texto blanco llegue a 4,5:1 en el tema claro se oscurecieron un poco: fundamental `#C4553A` → `#C05339`, 3ª `#3B7EBF` → `#3878B5`, 5ª `#2C8C82` → `#298279`, 7ª `#B85C8A` → `#AF5783`, resto `#8A847C` → `#79746D` y correcto `#3D8B3D` → `#3A843A`. El tema oscuro no cambia. Todo lo que se resalta con color en un esquema lleva leyenda escrita.
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
Licks **originales y sencillos** de 3 a 8 notas, definidos en La y transportables. **Nunca copiados de canciones.**
Formato de cada nota: `{ string, fret, dur, tech? }`, con `dur` en corcheas (con swing al reproducirse) y `tech` opcional: la técnica de esa nota con los símbolos de la tablatura (6.7), por ejemplo `{ type: 'bend', amount: 1 }` o `{ type: 'hammer' }`.
Cada lick indica además:
- `target`: el acorde (I, IV o V) sobre el que mejor resuelve; su última nota es la fundamental de ese acorde.
- `scale`: la escala a la que pertenecen todas sus notas.
- `style`: **blues**, **rock** o **country** (al menos 3 licks de cada estilo):
  - **Blues y rock**: escala blues o pentatónica menor, sobre la caja 1. El rock, con más estiramientos y notas repetidas.
  - **Country**: **pentatónica mayor** (en La: La Si Do♯ Mi Fa♯), con ligados y deslizamientos. Se tocan sobre el acorde mayor. La caja de la pentatónica mayor que se use se propone al usuario antes de fijarla.
- `level`, según las técnicas que usa:
  - **Básico**: sin técnicas, o solo con deslizamiento.
  - **Intermedio**: con ligados (ascendentes y descendentes) y estiramientos de ½ o 1 tono.
  - **Avanzado**: con combinaciones (estirar y soltar, estiramiento previo).
  - El vibrato no está asignado a ningún nivel: preguntar al usuario al empezar la Fase 6.

**Técnicas** (las de la tablatura, 6.7): **estiramientos** de ½ y 1 tono (sobre todo en las cuerdas 2 y 3), **ligados ascendentes y descendentes**, **deslizamientos** y **vibrato** en la nota final. Los licks de slide (Fase 7) usan sobre todo deslizamientos y vibrato, que es lo propio de la técnica.

Licks de partida (sin técnicas, nivel Básico, estilo blues). Claude Code añade más hasta **unos 12** con las técnicas y los estilos de arriba, y los enseña al usuario antes de fijarlos:
| Lick | Notas (cuerda:traste) | Notas | Objetivo |
|---|---|---|---|
| L1 | 3:7 → 3:5 → 4:7 | Re Do La | I |
| L2 | 2:5 → 2:8 → 1:5 | Mi Sol La | I |
| L3 | 3:5 → 3:7 → 3:8 → 3:7 → 4:7 | Do Re Mib Re La | I (con *blue note*) |
| L4 | 2:8 → 2:5 → 3:7 | Sol Mi Re | IV |
| L5 | 1:8 → 1:5 → 2:8 → 2:5 | Do La Sol Mi | V |
| L6 | 1:5 → 2:8 → 2:5 → 3:7 → 3:5 → 4:7 | La Sol Mi Re Do La | I (bajada) |

**Test**:
- Todas las notas de cada lick, de salida y de llegada, pertenecen a la escala declarada en `scale`, y esa escala es la de su estilo (blues y rock: blues o pentatónica menor; country: pentatónica mayor).
- La última nota es la fundamental de su objetivo, y cada lick tiene de 3 a 8 notas.
- **Ligado ascendente**: misma cuerda y traste de destino mayor. **Descendente**: misma cuerda y traste de destino menor.
- **Deslizamiento**: misma cuerda.
- **Estiramiento**: la nota de llegada (traste + 1 para ½ tono, + 2 para 1 tono) pertenece a la escala del lick.
- El `level` declarado coincide con las técnicas que usa el lick, y hay al menos 3 licks de cada estilo.
- La tablatura de cada lick coincide nota a nota con sus datos (cuerda, traste y técnica).

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
| Avanzado | ↓ · ↓ ↑ · ↑ ↓ ↑ con acento en 2 y 4 | pop con acento (aprobado en la Fase 3) |
| Avanzado | ↓ · ↓ ↑ ↓ · ↓ ↑ con swing (2:1) | abajo, abajo-arriba con swing (aprobado en la Fase 3) |

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
- **Tamaños** (Fase 2): normal (trastes de 58), `compact` (46, para los ejercicios en los que se toca el mástil: del 0 al 12 cabe en la pantalla del iPhone) y `dense` (32, solo para mástiles que se miran sin tocarlos, como la solución de Práctica). En las preguntas con botones se enseña un trozo de 5 trastes alrededor del punto (o del 0 al 5 entero en Básico).
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
 ├── Herramientas ──► Metrónomo
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
   Herramientas
   [ (icono) Metrónomo ]                ← botones pequeños, grises
```
- **Perfil** (arriba a la izquierda) y **Ajustes** (arriba a la derecha) como iconos.
- **Continuar** abre la pantalla de preparación del último ejercicio hecho, con su nivel y afinación ya puestos: un toque en Empezar y listo. Es el **único botón ámbar** de la pantalla. Si no hay historial, no se muestra y ningún botón va en ámbar.
- **Teoría, Práctica, Afinaciones y Glosario**: cuatro botones grandes iguales, en gris con efecto físico, icono en ámbar y una línea de subtítulo.
- **El Glosario es una sección principal**, no un módulo de Teoría.
- **Herramientas**: fila debajo de los cuatro botones grandes, con el título "Herramientas" y botones pequeños (gris con efecto físico e icono en ámbar). De momento solo **Metrónomo** (6.6.18). Es el sitio para futuras herramientas (bordón, afinador), así que debe admitir más botones sin rediseñar el Inicio.
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

- Hasta la Fase 9, "Sesión mezclada" abre una pantalla "Próximamente".

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
- **Duración** (solo en los ejercicios que van por tiempo): selector **30 s · 1 min · 2 min 30 · 5 min · 10 min**. Se recuerda la última elegida en cada ejercicio.
  - Ejercicios que la llevan: bases de blues y de slide, improvisar sobre la base, notas objetivo, cambios de acordes, rasgueo, escala con metrónomo, progresión de la tonalidad, recorrer las formas CAGED y Calentamiento.
  - Las **bases para improvisar** (blues y slide) añaden la opción **"Sin límite"**.
  - **"Cambios en un minuto"** no la lleva: se queda en 60 s fijos, para que el récord sea comparable.
  - Es un control común de la preparación, con soporte en `practice-runner` (7.3).
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
- En los ejercicios con **Duración** (6.6.6), la cabecera muestra el **tiempo restante** de la ronda (qué se muestra con "Sin límite" se propone al usuario en la Fase 6). Al acabarse, va al resumen de ronda (6.6.10).

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

#### 6.6.18 Metrónomo (herramienta)
Se abre desde la fila Herramientas del Inicio (6.6.1).
```
 ←  Metrónomo                       ?
        ( − )      80      ( + )
                   BPM
   30 ───────●──────────────── 240
   [ Marcar el tempo tocando aquí ]
           ●  ●  ○  ○                ← tiempos; el 1º en ámbar
   Tiempos por compás
   [2][3][4][5][6][7]
   Subdivisión
   [ Negras ][ Corcheas ][ Tresillos ]
   ┌────────────── Empezar ──────────────┐   ← único botón ámbar; pasa a "Parar"
   └─────────────────────────────────────┘
```
- **Tempo** grande en el centro (BPM), con botones **−** y **+** a los lados (pulsación larga = cambio rápido) y un **deslizador** de **30 a 240 BPM**.
- **"Marcar el tempo tocando aquí"**: al tocar varias veces al ritmo, calcula el tempo con la media de los últimos toques (descartando toques demasiado separados).
- **Indicador de tiempos**: un punto por tiempo del compás que se ilumina al sonar; el primero, acentuado, en ámbar.
- **Tiempos por compás**: 2 a 7, con acento (clic más agudo y fuerte) en el primero.
- **Subdivisión**: negras, corcheas o tresillos (clics más suaves entre tiempos).
- **Empezar / Parar**: botón grande abajo, el único ámbar de la pantalla.
- Suena **sin límite de tiempo**, mantiene la **pantalla encendida** (Wake Lock) mientras suena y respeta el volumen de Ajustes.
- Recuerda los últimos ajustes (tempo, compás y subdivisión).
- Usa el planificador con *lookahead* (`audio/scheduler.js`) para que el pulso sea estable.
- El "?" abre el concepto "Metrónomo, tempo y BPM" (bloque Ritmo y técnica), con el esquema de pulsos (6.8).

### 6.7 Tablatura (`ui/tab.js`)
Tablatura estándar, como la de cualquier web de tablaturas, generada en SVG:

- **6 líneas horizontales**: la de **arriba es la 1ª cuerda (Mi aguda)** y la de abajo la 6ª, como en toda tablatura estándar (es al revés que el mástil vertical de la app; es lo correcto en tablatura).
- A la izquierda, el **nombre de cada cuerda** según la afinación del ejercicio y la **notación elegida**: en ES "Mi Si Sol Re La Mi" y en EN "e B G D A E" (en inglés la 1ª cuerda va en minúscula, `e`, como es habitual). La notación secundaria aparece en pequeño al lado.
- **Números sobre las líneas** = traste (0 = al aire). Varios números en la misma columna = notas a la vez.
- **Ritmo**: separación horizontal proporcional a la duración y, debajo, el conteo ("1 y 2 y…"). Barras verticales `|` como líneas de compás.
- **Siempre en horizontal**, también con el móvil en vertical. Si no cabe, se parte en varias líneas como una partitura.
- **Cursor de reproducción**: mientras suena, la nota que suena se resalta en ámbar. Tocar un número hace sonar esa nota.
- **Velocidad**: el reproductor tiene un selector **50 % · 75 % · 100 %**. Cambia la velocidad sin cambiar la altura de las notas: la síntesis se programa con otro tempo (no se estira el audio).
  - Aparece en: la consulta de licks, "Ver en el mástil", el Calentamiento (escuchar el patrón) y la escala con metrónomo.
  - En "Pregunta-respuesta" no aparece: la velocidad la marca el tempo de la base.
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
- **Esquema obligatorio**: todo concepto lleva `diagram` (`type`: `fretboard`, `chord`, `tab`, `beats` o `strum`; `strum` es el patrón de rasgueo de 8 casillas, que suena al pulsarlo, desde la Fase 3). `beats` es el **esquema de pulsos**: un punto por tiempo del compás, el primero en ámbar, que se iluminan al ritmo al pulsarlo (como el indicador del Metrónomo, 6.6.18); se usa para conceptos de ritmo como "Metrónomo, tempo y BPM". Solo si un esquema no tiene sentido se omite, y entonces el concepto lleva `noDiagramReason` con el motivo. Los puntos del esquema se calculan con `js/core/` (nunca se escriben a mano notas ni trastes que se puedan calcular) y suenan al tocarlos.
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
- **Duración de la ronda** (6.6.6): en los ejercicios que van por tiempo, la ronda dura lo elegido en la preparación (o "Sin límite" en las bases para improvisar), muestra el tiempo restante en la cabecera y al acabar pasa al resumen.
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

> **En todas las fases de módulo (de la 2 a la 8)**: escribir en `concepts.js` los conceptos del bloque, con `howTo`, `concepts` y `why` en todos sus ejercicios, y enlazar la lección con palabras pulsables.

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

- [x] `ui/fretboard.js` completo (6.3), con orientación automática y forzada, el aspecto de cuerdas, trastes y cejuela, y el parámetro `tuning`.
- [x] `ui/chord-diagram.js`: diagrama vertical con trastes, dedos, cuerdas al aire (o) y no tocadas (x), y cejilla, con el mismo aspecto que el mástil.
- [x] `audio/context.js`:
  - Crea el AudioContext **dentro del primer toque** del usuario (botón "Empezar" o el primer toque en cualquier botón).
  - Si existe `navigator.audioSession`, fija `type = 'playback'` para que suene con el iPhone en silencio. Si no existe, reproduce en bucle un `<audio>` silencioso tras el gesto, como alternativa.
- [x] `audio/synth.js`: Karplus-Strong generado en un `AudioBuffer` por nota (≈2 s, decaimiento ≈0,996, filtro paso bajo suave) con caché por MIDI. Funciones `playNote(midi)`, `strum(chord, down|up)` con ~25 ms entre cuerdas y `arpeggio(chord)`.
- [x] `audio/scheduler.js` (setInterval de 25 ms que programa con 100 ms de antelación sobre `audioCtx.currentTime`) y `audio/metronome.js` (**30–240 BPM**, **tiempos por compás de 2 a 7** con acento en el primero, y **subdivisión**: negras, corcheas o tresillos, con clics más suaves entre tiempos).
- [x] **Herramienta Metrónomo**: fila Herramientas en el Inicio (6.6.1) y pantalla Metrónomo (6.6.18), con Wake Lock mientras suena y sus ajustes recordados.
- [x] Concepto "Metrónomo, tempo y BPM" (bloque Ritmo y técnica) con el nuevo **esquema de pulsos** (`diagram.type: 'beats'`, 6.8), enlazado desde el "?" del Metrónomo.
- [x] `engine/speech.js`: voces `es-ES`/`en-US`, nombres de nota hablados y una cola sencilla.
- [x] `engine/exercise-registry.js` (con `howTo`, `concepts`, `tunings` y `why`, 7.1), `quiz-runner.js` y `practice-runner.js` (7.2, 7.3).
- [x] Selector de afinación en la preparación (6.6.6, 7.6).
- [x] **Duración elegible** (6.6.6, 7.3): control común "Duración" en la preparación (30 s · 1 min · 2 min 30 · 5 min · 10 min, con "Sin límite" como opción que cada ejercicio puede activar), recordado por ejercicio, y soporte en `practice-runner` con el tiempo restante en la cabecera. Aún no hay ejercicios por tiempo: se prueba en la página `#/dev` y lo estrenan los de la Fase 3.
- [x] En `js/data/modules.js`, pasar CAGED a `phase: 8` (el slide pasa a ser la Fase 7).
- [x] Pantallas de ejercicio de Teoría (6.6.7) y de Práctica (6.6.8), con el **botón de altavoz** tras responder.
- [x] **Esquemas del glosario**: conectar las fichas con el mástil, los diagramas de acordes y (cuando exista) la tablatura; añadir un esquema a todos los conceptos escritos en la Fase 1A (salvo «Nombres de las notas», que ya lleva `noDiagramReason`: es una equivalencia de nombres y su esquema sería el de «Notas naturales»); el esquema es interactivo (tocar un punto lo hace sonar). Añadir a `tests/concepts.test.js` que todo concepto tenga `diagram` o `noDiagramReason`.
- [x] `ui/help-sheet.js` y el "?" en los ejercicios (6.8), con "Cómo se juega", "La teoría detrás" y "¿Por qué?".
- [x] Resumen de ronda de Teoría y de Práctica, sin autoevaluación, y confeti (6.6.10).
- [x] **Registro de sesiones** (6.6.13) y récords; "Continuar" en Inicio; el Perfil provisional ya muestra días y tiempo reales.
- [x] Wake Lock en Práctica y en el Metrónomo.
- [x] Página de prueba interna (`#/dev`, enlazada solo desde ajustes) para ver el mástil, tocar notas y probar metrónomo, voz y duración. (El usuario ya tiene el metrónomo en su propia pantalla; aquí es solo para pruebas.)

**Hecho cuando**: en el iPhone se ve el mástil en vertical y en horizontal al girarlo, al tocar un punto suena la nota (también con el iPhone en modo silencio), el metrónomo se abre desde el Inicio y mantiene un pulso estable durante varios minutos en el iPhone, la voz dice notas en español, una ronda de prueba se juega de principio a fin con el "?" y el "¿Por qué?", y la ronda aparece en Perfil.

### Fase 2 — Módulo Notas del mástil
**Teoría**
- [x] Componente de **lección por tarjetas** (6.6.4), estrenado con la lección de Notas.
- [x] Aprender: cómo se distribuyen las notas, las 7 naturales, que entre Mi-Fa y Si-Do solo hay un semitono, el traste 12 como octava de la cuerda al aire, y las formas de octava.
- [x] Consulta: mástil completo con todas las notas, con filtro por nota (por ejemplo, ver todos los Sol).
- [x] Ejercicios:
  - "¿Qué nota es?": se ilumina un traste y se responde con botones.
  - "Encuéntrala": se pide una nota en una cuerda concreta y se toca en el mástil.
  - "Todas en una cuerda": encontrar todas las posiciones de una nota en una cuerda entre 0 y 12.
  - "Octavas": se muestra una nota y se toca su octava con la forma correcta.
  - "Unísonos" (ver abajo).
  - "Rellena el mástil" (ver abajo).
  - "Contrarreloj": el máximo de aciertos en 60 s (récord en Perfil).

**Práctica**
- [x] "Nota por todas las cuerdas": la app dice una nota y tú la tocas en las 6 cuerdas antes de que acabe el tiempo.
- [x] "Cuerda a cuerda": se fija una cuerda y la app canta notas al azar para que las toques.
- [x] "Paseo de octavas": la app dice una nota y tú la tocas y luego su octava.
- [x] "Unísonos" (ver abajo).

**Unísonos** (Teoría y Práctica)
Encontrar **la misma nota exacta** (mismo MIDI, no solo el mismo nombre) en otra cuerda.
- **Teoría**: se marca un punto (por ejemplo, 5ª cuerda traste 2) y se toca su unísono en la cuerda indicada (6ª cuerda traste 7).
- **Práctica**: la app dice "6ª cuerda, traste 7"; se toca ese punto y su unísono en la cuerda de al lado. Al mostrar la solución, la app hace sonar las dos para oír que son iguales.
- Se calcula siempre por MIDI a partir de la afinación (`tunings: 'any'`).
- Conceptos: "Unísono" y "Regla de los 5 trastes (4 entre Sol y Si)".

| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Dirección | hacia la cuerda más grave de al lado (+5 trastes) | ambas direcciones, incluido el paso Sol–Si | todas las posiciones de esa nota exacta en 0–15 |
| Cuerdas | 6, 5 y 4 (el punto en la 5ª o la 4ª; el unísono en la 6ª o la 5ª) | todas | todas |

- Rango: trastes 0–12 en Básico e Intermedio y 0–15 en Avanzado. Tiempo (Teoría): el de la tabla general (sin límite, 10 s y 5 s), multiplicado por el número de unísonos en Avanzado.
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

- [x] Las estadísticas se guardan con claves `note:s{cuerda}f{traste}`.
- [x] Conceptos del bloque Notas en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Decisiones de la Fase 2** (aprobadas por el usuario antes de empezar):
- **Afinaciones**: admiten cualquiera de las 7 "¿Qué nota es?", "Encuéntrala", "Todas en una cuerda", "Rellena el mástil", "Contrarreloj", "Nota por todas las cuerdas", "Cuerda a cuerda" y los dos "Unísonos". "Octavas" y "Paseo de octavas" solo la estándar.
- **Cuerdas en Básico**: opción "Cuerdas" en la preparación, solo en Básico: 6ª y 5ª (por defecto), 6ª, 5ª o todas.
- **Tocar varios puntos** ("Todas en una cuerda" y Unísonos Avanzado): la pregunta termina al encontrarlos todos o al primer toque equivocado (fallo y solución). El tiempo del nivel se multiplica por el número de posiciones.
- **"Todas en una cuerda"**: trastes 0–12 en los tres niveles; el nivel cambia las cuerdas, las notas y el tiempo.
- **"Octavas"**: vale cualquier forma de octava de 4.3, hacia agudos o graves, dentro del mástil visible (0–7 en Básico, 0–12 en el resto). La misma nota en otro sitio que no sea una forma no cuenta, y el "¿Por qué?" lo explica.
- **"Rellena el mástil"**: una ronda es una cuerda (dos en Avanzado, la mitad de las veces). En Básico, las casillas con alteración salen rellenas. Un fallo enseña la nota correcta con ✗ y cuenta como fallo. El récord es el tiempo, solo sin fallos. Contrarreloj de Avanzado: 60 s por cuerda (90 s con dos).
- **"Contrarreloj"**: preguntas de "¿Qué nota es?"; al acertar pasa enseguida y al fallar enseña la correcta un momento, sin esperar a Continuar. Récord por nivel.
- **Práctica**: rondas de 12 consignas, sin selector de duración. "Cuerda a cuerda": cuerda elegida en la preparación (6ª a 1ª o "Al azar", una para toda la ronda). "Paseo de octavas": la consigna dice la cuerda, y la solución marca las octavas con un 8. "Nota por todas las cuerdas" usa las 6 cuerdas y los trastes 0–12 en todos los niveles (es la naturaleza del ejercicio).
- **Consulta**: trastes 0–12, con filtro de 12 notas y "Todas".
- **Pantalla del móvil** (al probarla): en "¿Qué nota es?" y "Contrarreloj" se ve un trozo de 5 trastes (6.6.7), para que los botones queden a la vista; los ejercicios en los que se toca el mástil usan el mástil compacto (6.3); y en Práctica, al enseñar la solución, la consigna se encoge para que el mástil quepa.
- **`#/dev`**: se quitan los ejercicios de prueba de la 1B; la página queda para el mástil, los acordes, la voz y el pulso.
- **Conceptos nuevos**: "Unísono", "Regla de los 5 trastes (4 entre la 3ª y la 2ª)" (el título no escribe los nombres de nota a mano; el texto nombra Sol y Si con la notación elegida) y "Formas de octava".

**Hecho cuando**: todos los ejercicios funcionan en los 3 niveles, en ambas orientaciones y con ambas notaciones, los unísonos funcionan también con afinaciones no estándar y las estadísticas se guardan.

### Fase 3 — Módulo Acordes abiertos y Calentamiento
**Teoría**
- [x] Aprender: qué es una tríada, fundamental, 3ª y 5ª, y por qué la 3ª decide si el acorde es mayor o menor (comparar Mi y Mim, La y Lam).
- [x] Consulta: biblioteca de acordes (5.1) con diagrama, notas que suenan (coloreadas por función), botón para escucharlo rasgueado y arpegiado, y un conmutador para ver el acorde en el mástil.
- [x] Ejercicios:
  - "¿Qué acorde es?": diagrama, 4 opciones.
  - "Constrúyelo": se marcan los trastes en un diagrama vacío.
  - "¿Qué notas tiene?": elegir las 3 notas del acorde.
  - "¿Mayor o menor?" (visual): se muestra un diagrama y se identifica la calidad.
  - "¿Qué nota falta?": un diagrama con una cuerda sin marcar.

**Práctica**
- [x] Progresiones predefinidas (5.7) y **Mis progresiones** (6.6.11), con su test.
- [x] Pantalla de práctica de acordes con diagramas (6.6.12) y el conmutador "Mostrar diagramas".
- [x] "Cambios de acordes": la app muestra el acorde actual en grande y el siguiente en pequeño, y cambia cada N tiempos con metrónomo, con la progresión elegida, durante la **duración** elegida (6.6.6).
- [x] "Cambios en un minuto": se elige una pareja de acordes, se cambia entre ellos durante 60 s, y al final se anota cuántos cambios has hecho (se guarda como récord por pareja). Sin selector de duración: siempre 60 s, para que el récord sea comparable.
- [x] "Acorde cantado": la app dice un acorde al azar y tú lo tocas.
- [x] **"Rasgueo"**:
  - El compás se dibuja como 8 casillas con **↓**, **↑** o **·** (5.6). La casilla actual se ilumina.
  - La app puede tocar el patrón para escucharlo antes, y contar en voz alta "1 y 2 y…" si se activa.
  - Usa las progresiones de 6.6.11 y la pantalla de 6.6.12 (el patrón entre el diagrama y el siguiente acorde).
  - Con selector de **duración** (6.6.6).
  - `data/strum-patterns.js` con los patrones de 5.6 y su test.
  - Concepto: "Rasgueo y regla del péndulo" (bloque Ritmo y técnica).

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Acordes | los 8 básicos | + Fa mini y séptimas | + Fa con cejilla |
| Tempo de cambios | 60 BPM, cambio cada 8 tiempos | 80 BPM, cada 4 | 100 BPM, cada 2 |
| Tempo de rasgueo | 60–70 BPM | 70–90 BPM | 90–110 BPM |

**Calentamiento** (nuevo módulo de Práctica)
- [x] Componente de **tablatura** completo (6.7), con el selector de velocidad 50 % · 75 % · 100 % y el bloque Tablatura del glosario.
- [x] Un dedo por traste, de la 6ª cuerda a la 1ª y vuelta, en una posición elegida (traste 1 o 5), con la **tablatura** en pantalla y metrónomo.
- [x] Variantes: 1-2-3-4, 4-3-2-1, 1-3-2-4 y "araña" (dedos alternos en dos cuerdas).
- [x] **Subida automática de tempo**: +4 BPM cada 2 vueltas completas. "Bajar" resta 8 BPM y detiene la subida. Se guarda el tempo máximo por variante como récord. Se implementa como función del metrónomo. Solo la usa el Calentamiento (la propuesta P5 de llevarla a otros ejercicios queda sustituida por la duración elegible, sección 12).
- [x] Duración elegible con el selector común (6.6.6): 30 s · 1 min · 2 min 30 · 5 min · 10 min. La subida automática de tempo se mantiene con cualquier duración.
- [x] Botón para escuchar el patrón en la tablatura, con el selector de velocidad (6.7).
- [x] Concepto: "Calentamiento cromático" (bloque Ritmo y técnica).

| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Notas por tiempo | 1 (negras) | 2 (corcheas) | 4 (semicorcheas) |
| Variantes | 1-2-3-4 | + 4-3-2-1 y 1-3-2-4 | + araña |
| Tempo inicial | 60 BPM | 70 BPM | 80 BPM |

- [x] Conceptos de los bloques Acordes, Ritmo y técnica y Tablatura en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Decisiones de la Fase 3** (aprobadas por el usuario antes de empezar):
- **Una sola sesión** para toda la fase (se propuso dividirla en 3A y 3B; el usuario prefirió hacerla entera).
- **"¿Qué notas tiene?"**: se eligen todas las notas del acorde (3 en las tríadas y 4 en las séptimas); el enunciado dice cuántas.
- **"¿Mayor o menor?"**: desde Intermedio hay una tercera opción, "Séptima de dominante".
- **"¿Qué nota falta?"**: a una cuerda pisada le falta el punto (sale un «?») y se elige la nota entre 4 botones.
- **"Constrúyelo"**: vale solo la forma exacta de la biblioteca (puntos y o/× de cada cuerda); no se piden los dedos.
- **Progresiones**: se ven siempre todas las predefinidas; el nivel solo cambia el tempo y cada cuántos tiempos se cambia. Do–Fa–Sol y Do–Sol–Lam–Fa usan el Fa mini.
- **"Acorde cantado"**: 12 acordes, con 12, 8 y 5 s por nivel, y el diagrama 3 s al acabar (desde el principio si "Mostrar diagramas" está activado).
- **"Cambios en un minuto"**: la pareja se elige en la preparación entre los acordes del nivel; al acabar se anotan los cambios con − y +; récord por pareja, sin importar el orden; 3 s para prepararse antes del minuto.
- **Rasgueo**: sin "contar en voz alta" (la voz del sistema no llega a tiempo, sobre todo en el iPhone); el conteo se ve escrito y lo marca el metrónomo. Cambio de acorde cada 2 compases en Básico y cada compás en el resto. Tempo elegible dentro del rango del nivel, empezando en el más bajo. Cada nivel ofrece sus patrones de 5.6.
- **Patrones de Avanzado** (5.6): el pop `↓ · ↓ ↑ · ↑ ↓ ↑` con acento en los tiempos 2 y 4, y `↓ · ↓ ↑ ↓ · ↓ ↑` con swing (2:1).
- **Calentamiento**: la vuelta va en espejo (la ida al revés: 1-2-3-4 vuelve en 4-3-2-1); la araña alterna dos cuerdas vecinas (dedos 1 y 3 en una, 2 y 4 en la otra). La subida de tempo es de +4 BPM en cada vuelta en Básico (una vuelta dura unos 48 s) y cada 2 vueltas en el resto. El récord es el tempo más alto al que se termina una vuelta entera, por variante y nivel. Admite cualquier afinación.
- **Tiempo por pregunta** (criterio de 7.5): sin límite en Básico; 15 y 8 s para reconocer un acorde y 30 y 20 s para construirlo o nombrar sus notas.
- **Esquema de rasgueo**: nuevo tipo de esquema `strum` (6.8) para las fichas de ritmo (rasgueo, acento, swing).

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
- [ ] "Escala con metrónomo": la escala mayor en una posición, subiendo y bajando, con tempo ajustable y la tablatura (6.7) en pantalla, con su selector de velocidad para escucharla; tempo máximo como récord. Con selector de **duración** (6.6.6).
- [ ] "Progresión de la tonalidad": la app muestra una progresión por grados en una tonalidad y la tocas con metrónomo. Con selector de **duración** (6.6.6).

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Tonalidades | Do, Sol, Re | + La, Mi, Fa | las 12 mayores |
| Intervalos | 2ª, 3ª, 5ª, 8ª | + 4ª, 6ª | todos, incluido el tritono |

- [ ] Tests: escalas bien deletreadas (Fa mayor con Sib, Re mayor con Fa# y Do#) y acordes de la tonalidad (Do: C Dm Em F G Am B°; Sol: G Am Bm C D Em F#°).
- [ ] Conceptos de los bloques Intervalos y Escalas y tonalidad en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: los tests pasan y todos los ejercicios funcionan en los 3 niveles.

### Fase 6 — Módulo Blues y slide: el blues
El módulo es "Blues y slide"; esta fase construye la parte de blues y el slide llega en la Fase 7.

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
  - Con selector de **duración** (6.6.6), que aquí añade **"Sin límite"**.
- [ ] "Improvisa sobre la base": la caja elegida en el mástil mientras suena la base. Con **duración**, incluido "Sin límite".
- [ ] "Notas objetivo": mientras suena la base, el mástil resalta dentro de la caja la fundamental del acorde actual (La, Re o Mi en La), y avisa un tiempo antes del cambio de acorde. Con **duración** (6.6.6).
- [ ] "Pregunta-respuesta": la app toca un lick (5.5) en un compás, con la tablatura (6.7) en pantalla, y tú lo repites en el siguiente. La velocidad la marca el tempo de la base.
- [ ] "Licks por acorde": cada compás muestra un lick adecuado al acorde que suena (según `target`), con su tablatura.
- [ ] En la preparación de "Pregunta-respuesta" y "Licks por acorde", filtro por **estilo**: Blues, Rock, Country o Todos (5.5).
- [ ] **Licks** (5.5): ampliar hasta unos 12, con técnicas (estiramientos, ligados, deslizamientos y vibrato), `style`, `scale` y `level`, al menos 3 por estilo. Enseñarlos al usuario antes de fijarlos.
- [ ] Consulta de licks con su tablatura (6.7), "Ver en el mástil" y el selector de velocidad.
- [ ] Los licks usan la tablatura de 6.7 y su campo `tech` (5.5).

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Cajas | caja 1 | cajas 1 y 2 | las 5 |
| Tonalidad | La | La, Mi | La, Mi, Sol, Do, Re |
| Tempo | 60–70 BPM | 70–90 BPM | 90–120 BPM |
| Progresión | sin *turnaround* | estándar | estándar y *quick change* |

- [ ] Tests de 5.3, 5.4 y 5.5 (incluidas las reglas de técnicas, estilos y niveles).
- [ ] Conceptos del bloque Blues y slide en `concepts.js`, entre ellos "Pentatónica mayor" (si no existe ya) y "Estilos: blues, rock y country", con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: la base suena con un swing estable al menos 5 minutos seguidos en el iPhone, los 12 compases se iluminan sincronizados, las notas objetivo cambian a tiempo y los licks de los tres estilos pasan sus tests.

### Fase 7 — Módulo Blues y slide: el slide
- [ ] **Contenido por definir con el usuario antes de empezar la fase** (usa las afinaciones abiertas de 4.2). Proponer lección, ejercicios, niveles y licks, y esperar su aprobación.
- [ ] Ya decidido:
  - **Base de slide** con selector de **duración** (6.6.6), incluido **"Sin límite"**.
  - **Licks de slide** con las reglas de 5.5 (con su `style`, `scale` y `level`), que usan sobre todo **deslizamientos** y **vibrato**.
- [ ] Tests de los licks y de cualquier otro dato musical nuevo del slide, contra las reglas de la teoría.
- [ ] Conceptos del slide en el bloque Blues y slide de `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: se concreta al aprobar el contenido con el usuario; como mínimo, la base de slide suena estable en el iPhone en una afinación abierta y los licks de slide pasan sus tests.

### Fase 8 — Módulo CAGED
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
- [ ] "Recorre las 5 formas": un acorde por las 5 formas seguidas, subiendo por el mástil, con metrónomo. Con selector de **duración** (6.6.6).
- [ ] "Misma zona, distintos acordes": se fija una zona del mástil (por ejemplo, trastes 5–8) y la app pide acordes que debes encontrar en esa zona con la forma que toque.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Formas | Mi y La | + Do y Sol | las 5 |
| Acordes | Do, Sol, La | + Re, Mi, Fa | todos los mayores |

- [ ] Tests de 5.2.
- [ ] Conceptos del bloque CAGED en `concepts.js`, con `howTo`, `concepts` y `why` en todos los ejercicios, y lección enlazada con palabras pulsables.

**Hecho cuando**: el explorador muestra las 5 formas correctas para cualquier acorde mayor y los tests pasan.

### Fase 9 — Perfil completo y sesión mezclada
- [ ] **Perfil completo** (6.6.13):
  - Racha, días practicados y tiempo total.
  - Calendario de las últimas 13 semanas.
  - Dominio por tema con barras (aciertos recientes en Teoría).
  - **Mapa del mástil**: mapa de calor con el acierto por posición (de Notas y Oído).
  - **Puntos débiles**: las claves con más fallos, con un botón para practicarlas.
  - **Récords**: contrarreloj, cambios en un minuto por pareja de acordes, "Rellena el mástil" por cuerda y tempo máximo en escalas y calentamiento.
- [ ] **Sesión mezclada** (en Teoría y en Práctica): se elige la duración (5, 10 o 20 min) y la app encadena ejercicios de varios módulos, ponderando por puntos débiles (7.4) y por lo que hace tiempo que no se hace. Solo incluye los módulos y niveles que el usuario ha usado al menos una vez, más uno nuevo de vez en cuando.
- [ ] Revisión final: accesibilidad (contraste, tamaño de toque), rendimiento en el iPhone y textos.
- [ ] Añadir a `docs/FUTURAS_UPDATES.md` ("Ideas sin decidir") las ideas que hayan surgido.
- [ ] Versión visible **1.0.0** y etiqueta de git **`v1.0.0`** (10): primera versión completa.

**Hecho cuando**: el Perfil refleja lo practicado y la sesión mezclada propone una combinación sensata.

---

## 9. Particularidades de iOS (checklist)

- [ ] El audio solo arranca tras un gesto del usuario.
- [ ] Sonido con el interruptor de silencio activado: `navigator.audioSession.type = 'playback'`, o la alternativa del `<audio>` silencioso en bucle.
- [ ] Si el AudioContext queda en estado `suspended` o `interrupted` (llamada, cambio de app), volver a llamar a `resume()` al volver a la app.
- [ ] Wake Lock en Práctica y en el Metrónomo, y pedirlo de nuevo al volver a la app.
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
- **Simulación de Android**: en la verificación de cada fase, abrir también la app con la emulación de un móvil Android de Playwright (por ejemplo, Pixel 7) y comprobar:
  - que el diseño se ve bien en esa pantalla (otras proporciones y la fuente del sistema de Android);
  - que el **botón o gesto de atrás** del sistema vuelve a la pantalla anterior (historial del hash router);
  - que la consola no tiene errores.
  - La prueba en un Android real se hará antes de publicar la v1.0 (`docs/FUTURAS_UPDATES.md`).
- **Despliegue**: cada push a `main` actualiza GitHub Pages. Incrementar `CACHE_VERSION` en `sw.js` en cada push que cambie archivos de la app.
- **Versión visible** en Ajustes y en Perfil → Acerca de, para comprobar en el iPhone qué versión está cargada: `0.N.x` = fase N. La Fase 1A es `0.1.0` y la 1B `0.1.1`; desde la Fase 2, cada fase empieza en `0.N.0`. Al terminar la Fase 9: **`1.0.0`**.
- **Etiquetas de versión**: al terminar **cada fase**, Claude Code crea una etiqueta de git con la versión de esa fase (`v` + la versión visible, por ejemplo `v0.2.0`) sobre el commit final de la fase y la sube (`git push origin <etiqueta>`). Así se puede volver a cualquier fase anterior si algo sale mal.

| Etiqueta | Fase | Commit |
|---|---|---|
| `v0.0.0` | 0 | `02807df` (Fase 0: marcar despliegue en BUILD_PLAN) |
| `v0.1.0` | 1A | `0625545` (Fase 1A: navegación, estilo GuitarSeo, Afinaciones, Glosario y Ajustes) |
| `v0.1.1` | 1B | commit "Fase 1B: mástil, sonido, metrónomo y motores de ejercicio" |
| `v0.2.0` | 2 | commit "Fase 2: módulo Notas del mástil" |
| `v0.3.0` | 3 | commit "Fase 3: Acordes abiertos, rasgueo, tablatura y Calentamiento" |

---

## 11. Ideas para el futuro (fuera del alcance actual)

Las mejoras para después de la v1.0 y las ideas sin decidir están en `docs/FUTURAS_UPDATES.md`.

---

## 12. Propuestas

Propuestas de mejora. Las pendientes se preguntan al usuario al llegar a su fase. Ahora mismo no hay ninguna pendiente. Lo que está en `docs/FUTURAS_UPDATES.md` no se pregunta en cada fase.

| Id | Propuesta | Estado |
|---|---|---|
| P1 | ~~Sonido automático al acertar o fallar~~ | **Sustituida** por el botón de altavoz tras responder (6.6.7) |
| P2 | Reto del día | **Movida a futuras updates** (`docs/FUTURAS_UPDATES.md`, "Ideas sin decidir") |
| P3 | Cancionero | **Movida a futuras updates** (`docs/FUTURAS_UPDATES.md`, "Ideas sin decidir") |
| P4 | Calculadora de cejilla | **Movida a futuras updates** (`docs/FUTURAS_UPDATES.md`, "Ideas sin decidir") |
| P5 | ~~Subida automática de tempo en otros ejercicios~~ | **Sustituida** por la duración elegible (6.6.6). El Calentamiento conserva su subida automática (Fase 3) |
| P6 | Pedal Bluetooth o teclado | **Movida a futuras updates** (`docs/FUTURAS_UPDATES.md`, "Ideas sin decidir") |
| P7 | Afinador y detección por micrófono | **Movida a futuras updates** (`docs/FUTURAS_UPDATES.md`, "Ideas sin decidir") |
| P8 | ~~Logros~~ | **Rechazada** |

---

## 13. Registro de cambios

| Fecha | Fase | Cambios | Notas del usuario |
|---|---|---|---|
| 2026-10-27 | 0 | Cimientos: lógica de teoría, notación, mástil y azar con tests; almacén versionado con exportar/importar; ajustes (notación, alteraciones, tema); router, cabecera, pestañas y módulos «Próximamente»; `NoteLabel`; tema claro/oscuro; PWA (manifest, iconos, service worker); despliegue en GitHub Pages. Cambios al plan: script de tests `node --test`, repositorio público, aviso de que iOS separa los datos de Safari y de la app instalada, metas de iOS actualizadas. | |
| 2026-10-29 | Plan | Integrado `CAMBIOS.md`: nombre GuitarSeo y estilo inspirado en Chess.com (ámbar mate, botón físico, tema oscuro por defecto); navegación por pantallas en lugar de pestañas; esquemas de cada pantalla (6.6); nueva paleta (4.5); 7 afinaciones (4.2) y su uso en ejercicios (7.6); ayuda "?", "¿Por qué?", glosario y `concepts.js` (6.8); tablatura completa (6.7); Perfil en lugar del módulo Progreso; Práctica sin autoevaluación; registro de sesiones; almacenamiento (6.9). Fase 1 dividida en 1A y 1B. Nuevos ejercicios: Unísonos y Rellena el mástil (Fase 2), Rasgueo, progresiones y Calentamiento (Fase 3). Módulos renombrados: Escala y tonalidad, Blues y slide. Fase 8 renombrada a "Perfil completo y sesión mezclada". Nueva sección 12 (Propuestas). | Valores MIDI de las afinaciones (4.2), descripción de P2–P7 y contenido del slide pendientes de confirmar. |
| 2026-10-30 | 1A | Navegación por pantallas con flecha ← (historial propio; sin historial vuelve a la pantalla madre); estilo GuitarSeo con tokens de los dos temas, botón físico, listas e iconos SVG; Inicio, Sección, Módulo, Preparación (nivel y afinación recordados por ejercicio; Empezar desactivado hasta la Fase 2) y pantallas «Próximamente»; `data/tunings.js` con las 7 afinaciones y cambios calculados; pantalla Afinaciones con sonido Karplus-Strong afinado y «Tocar todas»; `concepts.js` (15 conceptos de Notas y Afinaciones, ayudas «?» de cada pantalla), palabras pulsables y panel inferior; Glosario con buscador ES/EN; Ajustes completos (afinación por defecto, sonido, volumen, voz, mástil); Perfil provisional y Acerca de; esquema de datos v2 (récords, lecciones, progresiones, preparación) y `storage.persist()`; nombre e icono GuitarSeo. Cambios al plan: token `--amber-text` (4.5), franja de la barra de estado, bloques vacíos ocultos en el Glosario, estructura de carpetas (3). | Afinaciones de 4.2 validadas. |
| 2026-10-30 | Plan | Esquema visual obligatorio en las fichas del glosario y en las tarjetas de lección (`diagram`, o `noDiagramReason` si no tiene sentido), interactivo; tarea «Esquemas del glosario» y su test añadidos a la Fase 1B; convención añadida a CLAUDE.md. «Nombres de las notas» queda sin esquema (`noDiagramReason`). | Petición del usuario al cerrar la 1A; aceptada la propuesta para «Nombres de las notas». |
| 2026-11-02 | Plan | Integrado `CAMBIOS.md` (ampliaciones de la v1): **duración elegible** en los ejercicios por tiempo (6.6.6, 6.6.8, 7.3; control común en la Fase 1B, estrenado en la Fase 3), que sustituye a P5; el Calentamiento conserva la subida de tempo y "Cambios en un minuto" sigue en 60 s; **licks** ampliados a unos 12, de 3 a 8 notas, con técnicas, estilo (blues, rock, country), escala y nivel, y sus reglas de test (5.5); filtro por estilo en "Pregunta-respuesta" y "Licks por acorde"; **velocidad 50/75/100 %** en el reproductor de la tablatura (6.7); **etiquetas de versión** por fase (10), creadas ya `v0.0.0` y `v0.1.0`; **simulación de Android** en la verificación (10). **El slide pasa a su propia fase**: Fase 6 blues, Fase 7 slide, Fase 8 CAGED y Fase 9 Perfil y sesión mezclada (`v1.0.0`). | Separar el slide: el usuario lo sugirió y pidió opinión; se adopta. Pendiente: `docs/FUTURAS_UPDATES.md` y la reorganización de las secciones 11 y 12 (nota en la 12); en qué nivel cuenta el vibrato (Fase 6). |
| 2026-11-02 | Plan | **Metrónomo como herramienta**: fila Herramientas en el Inicio (1, 6.6.1), rama en la navegación (6.4), pantalla nueva 6.6.18 y `modules/tools/` (3); en la Fase 1B, `audio/metronome.js` pasa a 30–240 BPM con tiempos por compás (2–7) y subdivisión, tarea "Herramienta Metrónomo", Wake Lock también en el Metrónomo y nuevo "Hecho cuando". Nuevo tipo de esquema `beats` (pulsos) en 6.8 para el concepto "Metrónomo, tempo y BPM". **Futuras updates**: `docs/FUTURAS_UPDATES.md` añadido (no forma parte del plan); la sección 11 remite a él (CAGED de séptima, *rhythm changes* y Capacitor copiados a "Ideas sin decidir"; el resto ya estaba); P2, P3, P4, P6 y P7 movidas allí con su nombre, y la sección 12 queda sin propuestas pendientes. | Esquema de pulsos elegido por el usuario. Queda resuelta la duda de la descripción de P2–P7. |
| 2026-11-02 | 1B | Mástil SVG (vertical y horizontal, automático o forzado, cuerdas graduadas, cejuela, marcas, doble notación en los puntos, zonas táctiles de 58×50) y diagrama de acorde (dedos, o, ×, cejilla); `data/chords.js` con la tabla 5.1 y su test (adelantado de la Fase 3, solo datos); audio: contexto creado en el primer toque, `audioSession = playback` o `<audio>` silencioso en bucle en iPhones antiguos, Karplus-Strong con filtro paso bajo, rasgueo (25 ms) y arpegio; planificador con lookahead (25 ms / 100 ms, sin ráfagas al volver de segundo plano); metrónomo 30–240 BPM, 2–7 tiempos, negras/corcheas/tresillos; herramienta **Metrónomo** con −/+ (pulsación larga), deslizador, marcar el tempo tocando (media de 4 intervalos, se reinicia tras 2 s), Wake Lock y ajustes recordados; fila Herramientas en Inicio; concepto «Metrónomo, tempo y BPM» con esquema de pulsos; esquemas calculados en las 14 fichas de la 1A (leyenda escrita en todo lo resaltado con color); voz es-ES/en-US; registro de ejercicios validado; motores de Teoría y de Práctica (pausa con el «?», cuenta atrás, guía de ritmo, posiciones 3 s, duración con «Sin límite», metrónomo opcional); preparación con duración, metrónomo y «Preguntar antes de cada ejercicio»; resumen con frase según el porcentaje, fallos con «¿Por qué?» y confeti; registro de sesiones, estadísticas, récords, racha y «Continuar»; Perfil con racha; página de prueba `#/dev` con dos ejercicios de prueba. Cambios al plan: esquema de datos v3 (`tools`), colores de función del tema claro algo más oscuros (4.5), CAGED en la fase 8 y sesión mezclada en la 9 (`modules.js`), estructura de carpetas (3). | Aceptadas todas las propuestas de la 1B (ejercicios de prueba en `#/dev` que cuentan en Perfil, adelantar `chords.js`, esquemas de las fichas, comportamientos sin definir). Pendiente de comprobar en el iPhone: sonido real, modo silencio, voz, Wake Lock y pulso del metrónomo. |
| 2026-11-02 | 2 | Módulo **Notas del mástil**: componente de lección por tarjetas (6.6.4: barra segmentada, Anterior/Siguiente, deslizar, "Ir a los ejercicios" y lección completada) con la lección de Notas en 6 tarjetas con esquema interactivo; Consulta con el mástil 0–12 y filtro por nota; 7 ejercicios de Teoría ("¿Qué nota es?", "Encuéntrala", "Todas en una cuerda", "Octavas", "Unísonos", "Rellena el mástil" con su motor y teclado de 12 notas, "Contrarreloj" de 60 s con récord) y 4 de Práctica ("Nota por todas las cuerdas", "Cuerda a cuerda", "Paseo de octavas" y "Unísonos", que hace sonar los dos puntos al enseñar la solución); estadísticas `note:s{cuerda}f{traste}`; récords de Contrarreloj y Rellena; conceptos nuevos "Unísono", "Regla de los 5 trastes (4 entre la 3ª y la 2ª)" y "Formas de octava", con esquemas calculados; motor de Teoría con respuesta tocando el mástil, consigna por pregunta y ronda por tiempo; opciones de elección en la preparación (Cuerdas, Cuerda); mástil `compact` y `dense` (6.3); se quitan los ejercicios de prueba de `#/dev`. Tests contra la teoría (MIDI, formas de octava de 4.3, regla de los 5 trastes) en las 7 afinaciones. Cambios al plan: decisiones de la Fase 2, ejemplo de Unísonos de Teoría corregido para que coincida con su tabla, estructura de carpetas (3), tamaños del mástil (6.3). | Aceptadas todas las propuestas de la Fase 2 (afinaciones, opción de cuerdas, toques múltiples, Octavas, Rellena, Contrarreloj, Práctica de 12 consignas, Consulta 0–12, quitar los ejercicios de prueba). |
| 2026-11-03 | 3 | Módulo **Acordes abiertos**: lección en 5 tarjetas con diagramas coloreados por función (comparando Mi/Mim, La/Lam y La/La7); Consulta con la biblioteca, notas por función, rasgueado, arpegiado y "Ver en el mástil"; 5 ejercicios de Teoría ("¿Qué acorde es?", "Constrúyelo" con un diagrama editable, "¿Qué notas tiene?" con teclado de varias notas, "¿Mayor o menor?" y "¿Qué nota falta?"); progresiones predefinidas calculadas por grados y **Mis progresiones** (crear, editar y borrar, en la exportación); pantalla de práctica de acordes (6.6.12) con "Mostrar diagramas"; "Cambios de acordes", "Cambios en un minuto" (récord por pareja), "Acorde cantado" y **Rasgueo** (patrones de 5.6 con "Escuchar el patrón", acento y swing). **Calentamiento**: "Un dedo por traste" con tablatura, 4 variantes, subida automática de tempo (función del metrónomo), "Bajar" y récord. **Tablatura** completa (6.7): todos los símbolos, ritmo, partición en líneas, cursor, reproductor a 50/75/100 % y "Ver en el mástil", con sonido de cada técnica (curva de altura sobre la cuerda sintetizada). Glosario: 31 conceptos nuevos (Acordes, Ritmo y técnica, y Tablatura) con esquemas que suenan; marcado `{{chord:id}}`; deletreo por letra de las notas de un acorde. Tests contra la teoría (grados, fórmulas, MIDI, armónicos). Cambios al plan: decisiones de la Fase 3, patrones de Avanzado (5.6), esquema `strum` (6.8), estructura de carpetas (3). | Aceptadas todas las propuestas (una sola sesión; ejercicios de Teoría; progresiones; Acorde cantado; Cambios en un minuto; rasgueo sin voz; patrones con acento y swing; vuelta en espejo y araña; subida cada vuelta en Básico). |
