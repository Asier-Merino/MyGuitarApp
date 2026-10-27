# BUILD PLAN — App de teoría musical para guitarra

> Documento de referencia para construir la app con Claude Code, fase a fase.
> Leer junto con `CLAUDE.md`. Las casillas `[ ]` se marcan `[x]` al completar cada punto.

---

## 0. Cómo usar este plan

1. Crear una carpeta vacía con `CLAUDE.md` y `BUILD_PLAN.md` y abrir Claude Code en ella.
2. En cada sesión, pedir: **"Lee CLAUDE.md y BUILD_PLAN.md y ejecuta la Fase N."**
3. Claude Code trabaja **una fase por sesión**. Al terminar:
   - pasa los tests (`npm test`),
   - marca las casillas de la fase,
   - añade una entrada al **Registro de cambios** (sección 12),
   - hace commit y push (se despliega en GitHub Pages),
   - pide al usuario que la pruebe en el iPhone.
4. **No empezar la fase siguiente sin la confirmación del usuario.** Si el usuario pide cambios, se hacen antes de avanzar.
5. Si algo del plan resulta incorrecto o mejorable durante la construcción, se propone el cambio al usuario y se actualiza este documento.

---

## 1. Visión del producto

App personal para practicar teoría musical aplicada a la guitarra. El usuario lleva **un año tocando**, es **diestro**, usa sobre todo un **iPhone** (también PC) y habla español.

### Principios
- **Dos secciones, separadas por situación de uso:**
  - **TEORÍA**: sin guitarra. Explicaciones cortas y visuales, consulta (diagramas, mástil, escalas) y ejercicios en pantalla tipo quiz.
  - **PRÁCTICA**: con la guitarra en las manos. Manos ocupadas, así que: texto grande, avance automático con temporizador, voz que dice la nota o acorde, metrónomo y bases. Autoevaluación al final de la ronda.
- **Navegación libre**: todos los módulos están accesibles siempre; no hay un orden obligatorio.
- **Variedad**: los ejercicios se **generan al azar** a partir de reglas de teoría, cada módulo tiene **varios tipos de ejercicio** y **3 niveles** (Básico, Intermedio, Avanzado).
- **Doble notación siempre visible**: la principal (ES o EN, a elegir como un selector de idioma) en grande, y la otra en pequeño al lado. Ejemplo: **Fa** <sub>F</sub> o **F** <sub>Fa</sub>.
- **Mobile-first**, adaptada a PC. El mástil se dibuja **en vertical en el móvil en vertical** y **en horizontal en apaisado o en PC**.
- **PWA** instalable en el iPhone (pantalla de inicio, pantalla completa, funciona sin conexión), alojada en **GitHub Pages**.

### Módulos
| # | Módulo | Teoría (sin guitarra) | Práctica (con guitarra) |
|---|---|---|---|
| 1 | Notas del mástil | Quiz "¿qué nota es?", "encuéntrala", octavas | La app dice una nota y tú la tocas en todas las cuerdas a contrarreloj |
| 2 | Acordes abiertos | Diagramas, notas que los forman, quiz | Cambios de acordes con metrónomo |
| 3 | Oído | ¿Mayor o menor? | Suena una nota y la buscas en la guitarra |
| 4 | Teoría: intervalos, escala mayor y tonalidad | Construcción, grados, quiz | Escala con metrónomo y progresiones de la tonalidad |
| 5 | Pentatónica y blues | 12 compases, *blue note*, quiz | Base shuffle, notas objetivo, licks pregunta-respuesta |
| 6 | CAGED | Explorador de formas, quiz | Tocar un acorde en una forma, recorrer las 5 formas |
| 7 | Progreso | Estadísticas, mapa de calor, sesión mezclada (común a ambas secciones) | |

---

## 2. Stack y decisiones técnicas

- **HTML + CSS + JavaScript vanilla** con **módulos ES nativos**. Sin frameworks, sin bundler, sin paso de build.
- **Sin dependencias de runtime.** Las únicas herramientas son Node (para tests con `node --test`, que encuentra solo los `*.test.js`) y un servidor estático local.
- **Gráficos**: SVG generado desde JS (mástil y diagramas).
- **Audio**: Web Audio API con síntesis **Karplus-Strong** (cuerda pulsada) y un planificador con *lookahead* para metrónomo y bases.
- **Voz**: `speechSynthesis` (Web Speech API), `es-ES` o `en-US` según la notación principal.
- **Pantalla encendida**: Screen Wake Lock API en la sección Práctica.
- **Persistencia**: `localStorage` con esquema versionado, más exportar/importar en JSON.
- **Enrutado**: hash router (`#/teoria/notas`, `#/practica/blues`…).
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
├── icons/                     # icon-192.png, icon-512.png, apple-touch-icon-180.png
├── css/
│   └── styles.css             # tokens de color, claro/oscuro, layout
├── js/
│   ├── main.js                # arranque, router, cabecera, ajustes
│   ├── router.js
│   ├── storage.js             # localStorage versionado + export/import
│   ├── settings.js            # notación, alteraciones, tema, orientación, sonido, voz
│   ├── settings-view.js       # pantalla de ajustes
│   ├── state.js               # instancias únicas de almacén y ajustes
│   ├── pwa.js                 # registro del service worker y actualizaciones
│   ├── version.js             # versión visible (v0.N.x = fase N)
│   ├── core/                  # LÓGICA PURA: sin DOM, sin audio, testeable en Node
│   │   ├── theory.js          # pitch classes, intervalos, escalas, acordes, tonalidades
│   │   ├── notation.js        # nombres ES/EN, sostenidos/bemoles, deletreo por letra
│   │   ├── fretboard-model.js # afinación, nota de (cuerda, traste), posiciones de una nota
│   │   ├── random.js          # RNG con semilla opcional, shuffle, elección ponderada
│   │   └── stats.js           # cálculo de pesos para repetición espaciada
│   ├── data/
│   │   ├── chords.js          # acordes abiertos y de séptima (dedos incluidos)
│   │   ├── caged.js           # plantillas de las 5 formas
│   │   ├── scales.js          # fórmulas y cajas pentatónicas
│   │   ├── blues.js           # progresiones de 12 compases
│   │   └── licks.js           # licks en La, transportables
│   ├── ui/
│   │   ├── fretboard.js       # render SVG del mástil (vertical/horizontal)
│   │   ├── chord-diagram.js   # render SVG de diagramas de acorde
│   │   ├── note-label.js      # componente de doble notación
│   │   ├── tab.js             # mini tablatura para licks
│   │   └── components.js      # botones, tarjetas, selector de nivel, resumen de ronda
│   ├── audio/
│   │   ├── context.js         # AudioContext, desbloqueo iOS, audio session
│   │   ├── synth.js           # Karplus-Strong, notas, rasgueos, arpegios
│   │   ├── scheduler.js       # reloj con lookahead
│   │   ├── metronome.js
│   │   └── backing.js         # base de blues (bajo, acordes, percusión)
│   ├── engine/
│   │   ├── exercise-registry.js
│   │   ├── quiz-runner.js     # motor de ejercicios de Teoría
│   │   ├── practice-runner.js # motor de ejercicios de Práctica (temporizador, voz, wake lock)
│   │   └── speech.js
│   └── modules/
│       ├── notes/
│       ├── chords/
│       ├── ear/
│       ├── theory/
│       ├── blues/
│       ├── caged/
│       └── progress/
└── tests/
    ├── theory.test.js
    ├── notation.test.js
    ├── fretboard-model.test.js
    ├── chords.test.js
    ├── caged.test.js
    ├── scales.test.js
    ├── blues.test.js
    ├── random.test.js
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

### 4.2 Afinación estándar
Cuerdas numeradas como en la guitarra: **1 = Mi aguda, 6 = Mi grave**.

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

**Formas de octava en la guitarra:**
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

### 4.5 Código de colores (consistente en toda la app)
| Función | Color |
|---|---|
| Fundamental (R) | rojo coral |
| 3ª (mayor o menor) | ámbar |
| 5ª | azul |
| 7ª | verde |
| *Blue note* (b5) | morado |
| Resto de notas de escala | gris neutro |

Nunca depender solo del color: los puntos pueden mostrar **nota** o **intervalo** (R, 3, b3, 5, b7…), con un conmutador en el propio mástil.

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
Formato de cada nota: `{ string, fret, dur }`, con `dur` en corcheas (con swing al reproducirse).
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

**Test**: todas las notas de cada lick pertenecen a la escala blues de La, y la última nota es la fundamental de su objetivo.

---

## 6. Diseño e interfaz

### 6.1 Pantallas
- **Cabecera fija**: título, selector **ES | EN** (notación principal) y botón de ajustes.
- **Pestañas grandes**: **TEORÍA | PRÁCTICA**.
- **Inicio de cada sección**: tarjeta destacada **"Sesión mezclada"** arriba y, debajo, una rejilla con los módulos.
- **Dentro de un módulo**: subpestañas **Aprender** y **Consulta** (solo en Teoría) y **Ejercicios**. En Ejercicios se elige el tipo y el nivel y se pulsa Empezar.
- **Pantalla de resumen** al terminar cada ronda: aciertos, tiempo medio, fallos destacados y botones "Repetir" y "Otro ejercicio".

### 6.2 Componente de doble notación
- `NoteLabel(pc, { spelling })` muestra la principal en grande y la secundaria en pequeño y con menos contraste: **Fa** <sub>F</sub>.
- En los puntos del mástil: la principal dentro del punto y la secundaria en un texto diminuto debajo o al lado. En el mástil vertical del móvil, si no cabe, la secundaria se muestra al pulsar el punto.
- Botones de respuesta: las dos notaciones claramente legibles.

### 6.3 Mástil (`ui/fretboard.js`)
- Parámetros: `fromFret`, `toFret`, `orientation` (`auto | vertical | horizontal`), `markers` (lista de puntos con color, etiqueta e interacción), `onTap(string, fret)`, `showFretNumbers`.
- **Horizontal** (PC o móvil apaisado): cuerda 1 arriba y cuerda 6 abajo, cejuela a la izquierda (vista estándar de un diestro mirando el mástil).
- **Vertical** (móvil en vertical): cejuela arriba, cuerdas en columnas con la 6 a la izquierda y la 1 a la derecha (como un diagrama de acordes) y trastes hacia abajo.
- `auto` usa `matchMedia('(orientation: portrait)')`. En ajustes hay un botón para forzarla, por si el iPhone tiene la rotación bloqueada.
- Marcas de traste en 3, 5, 7, 9, 15 y doble en 12.
- Zonas táctiles de al menos **44×44 px** (aunque el punto visual sea más pequeño).
- El traste 0 (al aire) se representa a la izquierda o encima de la cejuela.

### 6.4 Estilo
- Tema **claro y oscuro** según el sistema, con conmutador en ajustes. El oscuro es cómodo para practicar con poca luz.
- Colores como tokens CSS en `:root`.
- Tipografía grande y muy legible. En Práctica, el estímulo principal (nota o acorde) ocupa media pantalla.
- `viewport-fit=cover` y márgenes con `env(safe-area-inset-*)` para la isla dinámica y la barra inferior del iPhone.
- Sin scroll horizontal de página.

### 6.5 Ajustes (persistentes)
- Notación principal: ES / EN.
- Alteraciones: sostenidos / bemoles.
- Orientación del mástil: auto / vertical / horizontal.
- Tema: sistema / claro / oscuro.
- Sonido: activado o no, y volumen.
- Voz en Práctica: activada o no.
- Mostrar en el mástil: notas / intervalos.
- Exportar e importar progreso; borrar progreso (con confirmación).
- Versión de la app y botón "Buscar actualización".

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
  description: '...',
  levels: { basico: {...}, intermedio: {...}, avanzado: {...} },  // parámetros por nivel
  roundLength: 10,              // preguntas por ronda (Teoría) o duración (Práctica)
  generate(levelParams, rng, stats) { ... },   // devuelve una pregunta o consigna
  render(item, container, ctx) { ... },        // dibuja la pregunta
  check(item, answer) { ... },                 // solo Teoría: { correct, feedback }
  statKeys(item) { ... },                      // claves para estadísticas, p. ej. 'note:s6f5'
}
```

Así la **sesión mezclada** puede escoger ejercicios de cualquier módulo.

### 7.2 Motor de Teoría (`quiz-runner.js`)
- Ronda de N preguntas, con feedback inmediato (correcto/incorrecto y la respuesta buena).
- Temporizador opcional según el nivel.
- Registra en estadísticas: acierto, tiempo de respuesta y fecha.
- Las preguntas se eligen con **peso**, de modo que lo que más se falla sale más (ver 7.4). No se repite la misma pregunta dos veces seguidas.

### 7.3 Motor de Práctica (`practice-runner.js`)
- Pantalla de manos libres: consigna enorme, cuenta atrás visible y avance automático.
- **Voz**: dice la consigna ("Sol", "Do en forma de La"…). En ES usa nombres en español ("Fa sostenido", "Si bemol"); en EN, nombres en inglés ("F sharp").
- **Metrónomo** opcional, con tempo ajustable.
- **Wake Lock** activo mientras dura la ronda, y se vuelve a pedir en `visibilitychange`.
- Botones grandes de pausa y salir (por si hace falta tocar la pantalla).
- Al final, **autoevaluación**: Bien / Regular / Mal para la ronda, y opcionalmente marcar consignas concretas que costaron. Se guarda en estadísticas.

### 7.4 Pesos de repetición
Para cada clave de estadística: `peso = 1 + 3 × tasaDeFallo + 0,5 × (no vista recientemente ? 1 : 0)`. Las claves nunca vistas tienen peso 1,5. La implementación va en `core/stats.js`, con tests.

### 7.5 Niveles (criterio general)
- **Básico**: rango reducido, solo notas naturales, sin tiempo o con mucho tiempo, menos opciones de respuesta.
- **Intermedio**: rango completo (0–12), alteraciones incluidas, tiempo moderado.
- **Avanzado**: todo el rango, menos tiempo, ejercicios inversos o combinados y tonalidades menos habituales.

Cada módulo concreta sus niveles en la sección 8. Se espera afinarlos con el uso.

---

## 8. Fases de construcción

### Fase 0 — Cimientos y despliegue
Objetivo: el esqueleto de la app funcionando en el iPhone a través de GitHub Pages.

- [x] Estructura de carpetas, `package.json` (`"type": "module"`, `"test": "node --test"`), `.gitignore`.
- [x] `core/theory.js`, `core/notation.js`, `core/fretboard-model.js` y `core/random.js` con sus tests (sección 4).
- [x] `storage.js` con esquema versionado (`schemaVersion`), lecturas y escrituras dentro de try/catch, y exportar/importar JSON.
- [x] `settings.js` y la pantalla de ajustes (6.5), aún sin las opciones que dependen de fases posteriores.
- [x] `router.js`, cabecera, pestañas TEORÍA | PRÁCTICA y rejilla de módulos con tarjetas "Próximamente".
- [x] Componente `NoteLabel` de doble notación, y el selector ES | EN funcionando en toda la interfaz.
- [x] Estilos base: tokens de color, tema claro/oscuro y safe areas.
- [x] PWA: `manifest.webmanifest` (`display: standalone`), iconos (generados: un diseño simple y original, por ejemplo un mástil estilizado), metas de iOS (`apple-mobile-web-app-capable`, obsoleta pero aún usada por iOS, más `mobile-web-app-capable`, `apple-touch-icon`, `theme-color`) y `sw.js`.
  - El service worker usa una constante `CACHE_VERSION` que se incrementa en cada despliegue.
  - El service worker **no se registra en `localhost`**, para evitar versiones viejas durante el desarrollo.
- [ ] Repositorio git, primer push y GitHub Pages activado (rama `main`, raíz). Si `gh` no está disponible, Claude Code da al usuario los pasos exactos para hacerlo desde la web de GitHub.
- [ ] Instrucciones al usuario para abrir la URL en Safari y añadirla a la pantalla de inicio.

**Hecho cuando**: los tests pasan, la app se abre en el iPhone desde la pantalla de inicio a pantalla completa, el selector ES | EN cambia las notas en toda la interfaz y los ajustes se conservan al cerrar y abrir.

### Fase 1 — Mástil, sonido y motor de práctica
Objetivo: las piezas reutilizables que usan todos los módulos.

- [ ] `ui/fretboard.js` completo (6.3), con orientación automática y forzada.
- [ ] `ui/chord-diagram.js`: diagrama vertical con trastes, dedos, cuerdas al aire (o) y no tocadas (x), y cejilla.
- [ ] `audio/context.js`:
  - Crea el AudioContext **dentro del primer toque** del usuario (botón "Empezar" o el primer toque en cualquier botón).
  - Si existe `navigator.audioSession`, fija `type = 'playback'` para que suene con el iPhone en silencio. Si no existe, reproduce en bucle un `<audio>` silencioso tras el gesto, como alternativa.
- [ ] `audio/synth.js`: Karplus-Strong generado en un `AudioBuffer` por nota (≈2 s, decaimiento ≈0,996, filtro paso bajo suave) con caché por MIDI. Funciones `playNote(midi)`, `strum(chord, down|up)` con ~25 ms entre cuerdas y `arpeggio(chord)`.
- [ ] `audio/scheduler.js` (setInterval de 25 ms que programa con 100 ms de antelación sobre `audioCtx.currentTime`) y `audio/metronome.js` (40–200 BPM, acento en el primer tiempo).
- [ ] `engine/speech.js`: voces `es-ES`/`en-US`, nombres de nota hablados y una cola sencilla.
- [ ] `engine/exercise-registry.js`, `quiz-runner.js`, `practice-runner.js` (sección 7) y la pantalla de resumen de ronda.
- [ ] Wake Lock en Práctica.
- [ ] Página de prueba interna (`#/dev`, enlazada solo desde ajustes) para ver el mástil, tocar notas y probar metrónomo y voz.

**Hecho cuando**: en el iPhone se ve el mástil en vertical y en horizontal al girarlo, al tocar un punto suena la nota (también con el iPhone en modo silencio), el metrónomo va estable y la voz dice notas en español.

### Fase 2 — Módulo Notas del mástil
**Teoría**
- [ ] Aprender: cómo se distribuyen las notas, las 7 naturales, que entre Mi-Fa y Si-Do solo hay un semitono, el traste 12 como octava de la cuerda al aire, y las formas de octava.
- [ ] Consulta: mástil completo con todas las notas, con filtro por nota (por ejemplo, ver todos los Sol).
- [ ] Ejercicios:
  - "¿Qué nota es?": se ilumina un traste y se responde con botones.
  - "Encuéntrala": se pide una nota en una cuerda concreta y se toca en el mástil.
  - "Todas en una cuerda": encontrar todas las posiciones de una nota en una cuerda entre 0 y 12.
  - "Octavas": se muestra una nota y se toca su octava con la forma correcta.
  - "Contrarreloj": el máximo de aciertos en 60 s.

**Práctica**
- [ ] "Nota por todas las cuerdas": la app dice una nota y tú la tocas en las 6 cuerdas antes de que acabe el tiempo.
- [ ] "Cuerda a cuerda": se fija una cuerda y la app canta notas al azar para que las toques.
- [ ] "Paseo de octavas": la app dice una nota y tú la tocas y luego su octava.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Trastes | 0–5 | 0–12 | 0–12 |
| Cuerdas | 6 y 5 (configurable) | todas | todas |
| Notas | naturales | con alteraciones | con alteraciones |
| Tiempo (Teoría) | sin límite | 10 s | 5 s |
| Tiempo por nota (Práctica) | 20 s | 12 s | 7 s |

- [ ] Las estadísticas se guardan con claves `note:s{cuerda}f{traste}`.

**Hecho cuando**: todos los ejercicios funcionan en los 3 niveles, en ambas orientaciones y con ambas notaciones, y las estadísticas se guardan.

### Fase 3 — Módulo Acordes abiertos
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
- [ ] "Cambios de acordes": la app muestra el acorde actual en grande y el siguiente en pequeño, y cambia cada N tiempos con metrónomo. Se pueden elegir los acordes o dejarlo al azar.
- [ ] "Cambios en un minuto": se elige una pareja de acordes, se cambia entre ellos durante 60 s, y al final se anota cuántos cambios has hecho (se guarda para ver la evolución).
- [ ] "Acorde cantado": la app dice un acorde al azar y tú lo tocas.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Acordes | los 8 básicos | + Fa mini y séptimas | + Fa con cejilla |
| Tempo de cambios | 60 BPM, cambio cada 8 tiempos | 80 BPM, cada 4 | 100 BPM, cada 2 |

**Hecho cuando**: todos los ejercicios funcionan y los datos de acordes pasan los tests de 5.1.

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

**Hecho cuando**: los ejercicios suenan bien en el iPhone y la generación al azar no repite de forma evidente.

### Fase 5 — Módulo Teoría (intervalos, escala mayor y tonalidad)
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
- [ ] "Escala con metrónomo": la escala mayor en una posición, subiendo y bajando, con tempo ajustable.
- [ ] "Progresión de la tonalidad": la app muestra una progresión por grados en una tonalidad y la tocas con metrónomo.

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Tonalidades | Do, Sol, Re | + La, Mi, Fa | las 12 mayores |
| Intervalos | 2ª, 3ª, 5ª, 8ª | + 4ª, 6ª | todos, incluido el tritono |

- [ ] Tests: escalas bien deletreadas (Fa mayor con Sib, Re mayor con Fa# y Do#) y acordes de la tonalidad (Do: C Dm Em F G Am B°; Sol: G Am Bm C D Em F#°).

**Hecho cuando**: los tests pasan y todos los ejercicios funcionan en los 3 niveles.

### Fase 6 — Módulo Pentatónica y blues
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
- [ ] "Pregunta-respuesta": la app toca un lick (5.5) en un compás, con la tablatura en pantalla, y tú lo repites en el siguiente.
- [ ] "Licks por acorde": cada compás muestra un lick adecuado al acorde que suena (según `target`).

**Niveles**
| | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Cajas | caja 1 | cajas 1 y 2 | las 5 |
| Tonalidad | La | La, Mi | La, Mi, Sol, Do, Re |
| Tempo | 60–70 BPM | 70–90 BPM | 90–120 BPM |
| Progresión | sin *turnaround* | estándar | estándar y *quick change* |

- [ ] Tests de 5.3, 5.4 y 5.5.

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

**Hecho cuando**: el explorador muestra las 5 formas correctas para cualquier acorde mayor y los tests pasan.

### Fase 8 — Progreso y sesión mezclada
- [ ] Pantalla de progreso:
  - Resumen por módulo: aciertos, tiempo medio y tendencia de los últimos días.
  - **Mapa de calor del mástil** con el acierto por posición (de Notas y Oído).
  - Puntos débiles: las 5 claves con más fallos, con un botón para practicarlas.
  - Historial de "Cambios en un minuto" por pareja de acordes.
  - Racha de días practicando.
- [ ] **Sesión mezclada** (en Teoría y en Práctica): se elige la duración (5, 10 o 20 min) y la app encadena ejercicios de varios módulos, ponderando por puntos débiles (7.4) y por lo que hace tiempo que no se hace. Solo incluye los módulos y niveles que el usuario ha usado al menos una vez, más uno nuevo de vez en cuando.
- [ ] Revisión final: accesibilidad (contraste, tamaño de toque), rendimiento en el iPhone y textos.
- [ ] Actualizar la sección 11 con las ideas que hayan surgido.

**Hecho cuando**: el progreso refleja lo practicado y la sesión mezclada propone una combinación sensata.

---

## 9. Particularidades de iOS (checklist)

- [ ] El audio solo arranca tras un gesto del usuario.
- [ ] Sonido con el interruptor de silencio activado: `navigator.audioSession.type = 'playback'`, o la alternativa del `<audio>` silencioso en bucle.
- [ ] Si el AudioContext queda en estado `suspended` o `interrupted` (llamada, cambio de app), volver a llamar a `resume()` al volver a la app.
- [ ] Wake Lock en Práctica, y pedirlo de nuevo al volver a la app.
- [ ] `speechSynthesis`: la primera locución dentro de un gesto. Las voces pueden cargarse tarde (`voiceschanged`).
- [ ] Safe areas (`env(safe-area-inset-*)`) y `viewport-fit=cover`.
- [ ] Bloqueo de rotación: botón manual de orientación del mástil.
- [ ] Almacenamiento: recomendar instalar en la pantalla de inicio y ofrecer exportar el progreso. Ojo: la app instalada guarda sus datos **aparte** de Safari; lo que se configure en Safari no aparece en la app de la pantalla de inicio.
- [ ] Service worker, Wake Lock y micrófono necesitan HTTPS: **probar en el iPhone siempre a través de GitHub Pages**. En la red local (`http://IP:8000`) se puede ver la interfaz, pero sin esas funciones.
- [ ] Evitar el zoom por doble toque en botones (`touch-action: manipulation`) y el resaltado gris al tocar (`-webkit-tap-highlight-color: transparent`).

---

## 10. Desarrollo, pruebas y despliegue

- **Servidor local**: `npx serve .` o `python3 -m http.server 8000`. Los módulos ES no funcionan abriendo el archivo con `file://`.
- **Tests**: `npm test` (con `node --test`). Todo lo de `core/` y `data/` tiene tests; la interfaz se comprueba manualmente.
- **Comprobación visual**: si hay un navegador disponible en la sesión, abrir la app en tamaño móvil (390×844) y en escritorio y revisar ambas orientaciones del mástil antes de dar una fase por terminada.
- **Despliegue**: cada push a `main` actualiza GitHub Pages. Incrementar `CACHE_VERSION` en `sw.js` en cada push que cambie archivos de la app.
- **Versión visible** en ajustes (por ejemplo, `v0.3.0` = fase 3), para comprobar en el iPhone qué versión está cargada.

---

## 11. Ideas para el futuro (fuera del alcance actual)

- Detección de notas por micrófono para comprobar en Práctica que la nota tocada es la correcta (notas sueltas; los acordes son mucho más difíciles).
- CAGED de acordes menores y de séptima.
- Tríadas en grupos de cuerdas y arpegios.
- Modos griegos y tonalidades menores.
- Más progresiones (blues menor, *rhythm changes*).
- Afinador.
- Convertirla en app nativa con Capacitor (requiere un Mac y una cuenta de desarrollador de Apple).

---

## 12. Registro de cambios

| Fecha | Fase | Cambios | Notas del usuario |
|---|---|---|---|
| 2026-10-27 | 0 | Cimientos: lógica de teoría, notación, mástil y azar con tests; almacén versionado con exportar/importar; ajustes (notación, alteraciones, tema); router, cabecera, pestañas y módulos «Próximamente»; `NoteLabel`; tema claro/oscuro; PWA (manifest, iconos, service worker); despliegue en GitHub Pages. Cambios al plan: script de tests `node --test`, repositorio público, aviso de que iOS separa los datos de Safari y de la app instalada, metas de iOS actualizadas. | |
