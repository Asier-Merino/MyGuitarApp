# FUTURAS UPDATES — GuitarSeo después de la v1.0

> Mejoras **aprobadas por el usuario** para hacer **después de la v1.0**, más las ideas que quedan sin decidir.
> **Este archivo no forma parte del plan y no se ejecuta.** Cuando el usuario quiera empezar alguna, se pasará a `BUILD_PLAN.md` como fase nueva (con su "Hecho cuando") mediante un documento de cambios.
> Todo dato musical de aquí debe llevar su test contra las reglas de la teoría cuando se implemente (CLAUDE.md, "Calidad y veracidad").
> Las referencias 1.1 a 1.6 apuntan a las ampliaciones de la v1 (documento de cambios ya integrado en el plan): 1.1 = duración elegible, 1.2 = licks con técnicas, 1.3 = licks por estilo.

## Antes de la Fase 10: publicar la v1.0 (M1 y M3)
- Crear la rama **`desarrollo`**: los cambios nuevos se hacen ahí y solo se fusionan con `main` cuando el usuario los ha probado.
- Configurar una **dirección de pruebas** con HTTPS para la rama de desarrollo (por ejemplo, Cloudflare Pages o Netlify, conectados al repositorio), con su propio nombre ("GuitarSeo Pruebas") para que sus datos vayan aparte de los reales.
- Prueba en un **Android real**.
- Comprobar en cada actualización que la versión nueva **lee bien los datos guardados** de la anterior (migración con `schemaVersion`).

## Fase 10 — Herramientas
- El metrónomo (F1) ya está en la v1, en la fila "Herramientas" del Inicio.
- **Nota de bordón (F4)**: nueva herramienta en esa misma fila del Inicio. Nota grave sostenida de fondo: se elige la nota (12, con doble notación), el volumen y un timbre suave. Se puede usar junto al metrónomo, y como opción dentro de "Escala con metrónomo" e "Improvisa sobre la base".

## Fase 11 — Más acordes, afinaciones y oído
- **Afinaciones nuevas (C1)**, con sus tests de 4.2:

| id | Nombre | Cuerdas 6→1 | MIDI 6→1 | Grupo |
|---|---|---|---|---|
| `open-a` | La abierto (slide) | Mi La Mi La Do♯ Mi · E A E A C♯ E | 40 45 52 57 61 64 | slide |
| `open-c` | Do abierto (slide) | Do Sol Do Sol Do Mi · C G C G C E | 36 43 48 55 60 64 | slide |
| `dadgad` | DADGAD | Re La Re Sol La Re · D A D G A D | 38 45 50 55 57 62 | otras (grupo nuevo) |
| `drop-c` | Drop C | Do Sol Do Fa La Re · C G C F A D | 36 43 48 53 57 62 | drop |
| `c-standard` | Do estándar (dos tonos abajo) | Do Fa Si♭ Mi♭ Sol Do · C F B♭ E♭ G C | 36 41 46 51 55 60 | standard (ortografía con bemoles) |

  - La abierto y Do abierto se añaden también al apartado Slide (su I-IV-V con el slide en 0/12, 5 y 7 se comprueba con los mismos tests de la Fase 7).
- **Acordes nuevos (C2 a C7)**. Trastes de la 6ª a la 1ª; la digitación será la más habitual y el test comprueba las notas:

| Grupo | Acordes (trastes 6→1) | Nivel |
|---|---|---|
| C2 · Séptimas abiertas | Do7 `x 3 2 3 1 0` · Sol7 `3 2 0 0 0 1` · Lam7 `x 0 2 0 1 0` · Mim7 `0 2 2 0 3 0` · Rem7 `x x 0 2 1 1` | Intermedio |
| C3 · Suspendidos y añadidos | Resus2 `x x 0 2 3 0` · Resus4 `x x 0 2 3 3` · Lasus2 `x 0 2 2 0 0` · Lasus4 `x 0 2 2 3 0` · Misus4 `0 2 2 2 0 0` · Doadd9 `x 3 2 0 3 3` | Intermedio |
| C4 · Maj7 | Domaj7 `x 3 2 0 0 0` · Famaj7 `x x 3 2 1 0` | Intermedio |
| C5 · Bajo cambiado | Sol/Si `x 2 0 0 0 3` · Re/Fa♯ `2 x 0 2 3 2` · Do/Sol `3 3 2 0 1 0` | Intermedio |
| C6 · Con cejilla | Sim `x 2 4 4 3 2` · Si `x 2 4 4 4 2` · Fa♯m `2 4 4 2 2 2` · Dom `x 3 5 5 4 3` · Si♭ `x 1 3 3 3 1` · Fam `1 3 3 1 1 1` | Avanzado |
| C7 · Quintas | Mi5 `0 2 2 x x x` · La5 `x 0 2 2 x x` · Re5 `x x 0 2 3 x` · Sol5 `3 5 5 x x x` (forma móvil desde la 6ª y la 5ª cuerda) | Intermedio |

  - En los acordes con bajo cambiado, el test admite que la nota más grave no sea la fundamental (es su definición) y comprueba que es la indicada tras la barra.
  - Las quintas no tienen 3ª: el glosario explica por qué no son ni mayores ni menores.
- **Oído (C18)**: ejercicio "¿Qué tipo de acorde es?" con mayor, menor, séptima, sus2, sus4, maj7 y m7, según nivel.

## Fase 12 — Progresiones ampliadas
- **Progresiones de 2 acordes (F6)**: el mínimo de "Mis progresiones" y de las predefinidas baja de 3 a 2. Predefinidas nuevas (C11): Mim–Do, La–Re, Sol–Do.
- **Tonalidades menores (F13)**: `core/theory.js` calcula la escala menor natural y sus grados (i ii° III iv v VI VII), bien deletreados, y contempla el **V mayor** de la menor armónica. Tests: La menor = Lam, Si°, Do, Rem, Mim, Fa, Sol; con V mayor = Mi.
  - **Cadencia andaluza (C9)**: Lam–Sol–Fa–Mi (i–VII–VI–V) y Mim–Re–Do–Si7.
  - **Escala menor natural (C17)** con sus ejercicios, y **pentatónica mayor** completa (cajas y ejercicios).
- **Progresiones largas con duración por acorde (F14)**: el modelo de progresión pasa a ser una lista de `{ acorde, compases }` sin límite de 5. Usa la duración elegible (1.1).
  - **Blues de 12 y 8 compases (C10)** en "Cambios de acordes", en La, Mi, Sol, Do y Re, con acordes de séptima (requiere C2). 12 compases: las variantes de 5.4. 8 compases: I · V · IV · IV · I · V · I · V (la forma más habitual; el texto dice que hay variantes).
- **Progresiones simples nuevas (C8)**: ii–V–I en Do (Rem–Sol–Do) y en Sol (Lam–Re–Sol), I–IV–I–V en Sol (Sol–Do–Sol–Re), I–iii–IV–V en Do (Do–Mim–Fa–Sol).
- Todas calculadas por grados y con test (como en la Fase 3).

## Fase 13 — Bases, rasgueo y licks
- **Base para tus progresiones (F8)**: batería y bajo para cualquier progresión (predefinida o de "Mis progresiones"), reutilizando el motor de la base de blues. Estilos: **rock** (ritmo de rock en corcheas), **balada** (lento, negras) y **country** (bajo alternado "boom-chick"). Tempo, duración (1.1), cuadrícula de acordes que se ilumina y el siguiente acorde con su diagrama.
- **Más patrones de rasgueo en 4/4 (C15)**, cumpliendo la regla del péndulo:
  - Ska: `· ↑ · ↑ · ↑ · ↑` (golpes arriba en los "y").
  - Reggae: `· · ↓ · · · ↓ ·` (golpes cortos y apagados en los tiempos 2 y 4).
  - Shuffle: `↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑` con swing.
  - Si un patrón necesita marcar golpes apagados o acentos, se añade ese símbolo al dibujo del patrón y su concepto al glosario.
- **Más licks (C12)**: licks nuevos en la **caja 2** de la pentatónica y más variedad por estilo, con las mismas reglas que 1.2 y 1.3.

## Ideas sin decidir
Ideas comentadas pero no elegidas por ahora. Se pueden recuperar más adelante:
- Bucle en licks y escalas (F3).
- Pedal Bluetooth o teclado (F5, antes P6).
- Rutina diaria (F9).
- Calculadora de cejilla (F10, antes P4).
- Reto del día (F11, antes P2).
- Cancionero (F12, antes P3).
- Compases de 3/4 y 6/8 y sus rasgueos (F15 y C16).
- Afinador y detección por micrófono (F16, antes P7).
- Oído avanzado: reconocer progresiones y "¿cuándo cambia el acorde?" (F17).
- Módulos de teoría nuevos: tríadas en grupos de cuerdas, arpegios, CAGED menor, modos y blues menor (F18).
- Imágenes de referencia del diseño para Claude Code (M4).
- CAGED de acordes de séptima (antes en la sección 11 del plan).
- Progresiones *rhythm changes* (antes en la sección 11 del plan).
- Convertirla en app nativa con Capacitor; requiere un Mac y una cuenta de desarrollador de Apple (antes en la sección 11 del plan).
- Descartadas por limitaciones del iPhone: recordatorios diarios con notificación y vibración al acertar.
