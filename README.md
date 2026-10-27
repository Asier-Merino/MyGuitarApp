<p align="center">
  <img src="icons/icon-192.png" alt="Icono de MyGuitarApp" width="96" height="96">
</p>

<h1 align="center">MyGuitarApp</h1>

<p align="center">
  App personal para practicar <strong>teoría musical aplicada a la guitarra</strong>.<br>
  Funciona en el iPhone como una app más (pantalla de inicio, pantalla completa y sin conexión) y también en el PC.
</p>

<p align="center">
  <a href="https://asier-merino.github.io/MyGuitarApp/"><strong>▶ Abrir la app</strong></a>
  &nbsp;·&nbsp;
  <a href="BUILD_PLAN.md">Plan de construcción</a>
  &nbsp;·&nbsp;
  <a href="#estado-del-proyecto">Estado</a>
</p>

---

## ¿Qué es?

Una app para aprender y practicar teoría **con la guitarra en mente**. Está dividida en dos secciones según dónde estés:

| | **TEORÍA** | **PRÁCTICA** |
|---|---|---|
| **Cuándo** | Sin guitarra (en el sofá, en el metro…) | Con la guitarra en las manos |
| **Cómo** | Explicaciones cortas, diagramas y ejercicios tipo quiz | Texto grande, avance automático, voz que dice la nota o el acorde, metrónomo y bases |
| **Al final** | Aciertos y fallos de cada ronda | Te autoevalúas: Bien / Regular / Mal |

Algunas ideas clave:

- **Navegación libre**: todos los módulos están siempre disponibles, sin un orden obligatorio.
- **Ejercicios generados al azar**, con **3 niveles** (Básico, Intermedio y Avanzado). La app repite más lo que más fallas.
- **Doble notación**: la principal en grande y la otra en pequeño, por ejemplo **Fa** <sub>F</sub> o **F** <sub>Fa</sub>. Se cambia con el botón **ES | EN**.
- **Colores con significado**: la fundamental, la 3ª, la 5ª, la 7ª y la *blue note* tienen siempre el mismo color en toda la app.

---

## Instalarla en el iPhone

1. Abre **https://asier-merino.github.io/MyGuitarApp/** en **Safari**. Tiene que ser Safari.
2. Pulsa **Compartir** (el cuadrado con la flecha hacia arriba).
3. Elige **«Añadir a pantalla de inicio»** y pulsa **Añadir**.
4. Ábrela siempre desde el icono: se verá a pantalla completa y funcionará sin conexión.

> **Importante:** el iPhone guarda los datos de la app instalada **aparte** de los de Safari. Usa siempre el icono, y de vez en cuando haz una copia de tu progreso desde **Ajustes → Exportar**.

**Actualizaciones:** cuando hay una versión nueva, aparece un aviso con el botón **Actualizar**. También puedes ir a **Ajustes → Buscar actualización**. La versión que tienes cargada se ve en **Ajustes**.

---

## Módulos

| # | Módulo | Teoría (sin guitarra) | Práctica (con guitarra) |
|---|---|---|---|
| 1 | **Notas del mástil** | «¿Qué nota es?», encuéntrala, octavas | La app dice una nota y la tocas en todas las cuerdas a contrarreloj |
| 2 | **Acordes abiertos** | Diagramas, notas que los forman, quiz | Cambios de acordes con metrónomo |
| 3 | **Oído** | ¿Mayor o menor?, intervalos | Suena una nota y la buscas en la guitarra |
| 4 | **Intervalos, escala mayor y tonalidad** | Construcción, grados, quiz | Escala con metrónomo y progresiones |
| 5 | **Pentatónica y blues** | 12 compases, *blue note*, quiz | Base shuffle, notas objetivo, licks pregunta-respuesta |
| 6 | **CAGED** | Explorador de las 5 formas, quiz | Un acorde en una forma, recorrer las 5 formas |
| 7 | **Progreso** | Estadísticas, mapa de calor del mástil, puntos débiles y sesión mezclada | |

---

## Estado del proyecto

La app se construye **por fases**. Cada fase se prueba en el iPhone antes de empezar la siguiente.

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Cimientos: estructura, ajustes, notación ES/EN, temas, PWA y publicación | ✅ Hecha (v0.0.0) |
| 1 | Mástil, sonido, voz, metrónomo y motores de ejercicios | ⏳ Siguiente |
| 2 | Notas del mástil | Pendiente |
| 3 | Acordes abiertos | Pendiente |
| 4 | Oído | Pendiente |
| 5 | Intervalos, escala mayor y tonalidad | Pendiente |
| 6 | Pentatónica y blues | Pendiente |
| 7 | CAGED | Pendiente |
| 8 | Progreso y sesión mezclada | Pendiente |

El detalle de cada fase, con sus casillas y su registro de cambios, está en **[BUILD_PLAN.md](BUILD_PLAN.md)**.

---

## Para desarrollar

No hay frameworks ni nada que instalar para que la app funcione: es **HTML, CSS y JavaScript** normales. Solo hace falta [Node.js](https://nodejs.org/) para los tests.

### Abrirla en el ordenador

```bash
npx serve .
```

Después abre la dirección que aparece (normalmente http://localhost:3000). Si haces doble clic en `index.html` no funciona, porque hace falta un servidor.

> En `localhost` el modo sin conexión está desactivado a propósito, para ver siempre los últimos cambios.

### Tests

```bash
npm test
```

Comprueban toda la lógica musical (nombres de nota, escalas, afinación, octavas…), el guardado de datos y que la app tenga todos sus archivos para funcionar sin conexión.

### Otros comandos

| Comando | Para qué |
|---|---|
| `npm run icons` | Volver a generar los iconos de `icons/` |

### Publicar una versión nueva

Cada `push` a la rama `main` actualiza la app publicada en 1–2 minutos. Antes de subir cambios de la app:

1. `npm test` en verde.
2. Subir `CACHE_VERSION` en [`sw.js`](sw.js), para que los iPhone descarguen la versión nueva.
3. Subir `APP_VERSION` en [`js/version.js`](js/version.js) (`0.N.x` = fase N).

---

## Cómo está organizado

```
├── index.html               Página principal
├── manifest.webmanifest     Datos para instalarla como app
├── sw.js                    Funcionamiento sin conexión
├── css/styles.css           Estilos, colores y temas claro/oscuro
├── icons/                   Iconos de la app
├── js/
│   ├── main.js              Arranque, cabecera y pantallas de inicio
│   ├── settings-view.js     Pantalla de ajustes
│   ├── core/                Lógica musical (notas, escalas, mástil…), sin interfaz
│   ├── data/                Datos musicales: acordes, CAGED, cajas, licks (próximas fases)
│   ├── ui/                  Piezas de interfaz (doble notación, botones…)
│   └── …                    Router, guardado de datos y ajustes
├── tests/                   Tests de la lógica musical y del guardado
└── tools/                   Utilidades (generador de iconos)
```

Toda la teoría musical vive en `js/core/` y `js/data/`, separada de la interfaz, para poder comprobarla con tests.

---

## Documentos del proyecto

- **[BUILD_PLAN.md](BUILD_PLAN.md)**: el plan completo, con las fases, los datos musicales de referencia (acordes, CAGED, cajas pentatónicas, licks), el diseño y el registro de cambios.
- **[CLAUDE.md](CLAUDE.md)**: las instrucciones y convenciones para Claude Code, que construye la app fase a fase.
