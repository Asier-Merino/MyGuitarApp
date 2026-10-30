// Todos los textos explicativos de la app (BUILD_PLAN 6.8): fichas del glosario, ayudas "?"
// y palabras pulsables. Cada concepto se escribe una sola vez y se usa en todas partes.
//
// Marcado de los textos (lo interpreta js/core/glossary.js):
//   [[id|texto]] palabra pulsable · {{F#}} nota · {{tuning:id}} notas de una afinación
//   {{tname:id}} nombre de una afinación · *texto* cursiva
//
// Campos de cada concepto:
//   id, block, title, aliases (ES y EN, para el buscador), short (una línea),
//   summary (3–5 líneas), sound (opcional: qué suena con "Escuchar"),
//   lesson (opcional: ruta de la lección o pantalla relacionada), related (ids).
// sound: { midi: [notas en orden] } o { tuning: id } (las 6 cuerdas al aire, de la 6ª a la 1ª).

export const BLOCKS = Object.freeze([
  { id: 'notes', title: 'Notas' },
  { id: 'chords', title: 'Acordes' },
  { id: 'intervals', title: 'Intervalos' },
  { id: 'scales-keys', title: 'Escalas y tonalidad' },
  { id: 'blues-slide', title: 'Blues y slide' },
  { id: 'caged', title: 'CAGED' },
  { id: 'tunings', title: 'Afinaciones' },
  { id: 'rhythm-technique', title: 'Ritmo y técnica' },
  { id: 'tablature', title: 'Tablatura' },
].map(Object.freeze));

const NOTES_LESSON = '#/teoria/notas/aprender';
const TUNINGS_SCREEN = '#/afinaciones';

const c = (concept) => Object.freeze({ aliases: [], related: [], ...concept });

export const CONCEPTS = Object.freeze([
  // ----- Notas -----
  c({
    id: 'note-names',
    block: 'notes',
    title: 'Nombres de las notas',
    aliases: ['notas', 'nombre de nota', 'notación', 'cifrado americano', 'cifrado inglés', 'letras', 'note names'],
    short: 'Cada nota tiene un nombre en español y otro en inglés, con letras.',
    summary: 'Cada nota tiene dos nombres: uno en español y otro en inglés, que usa letras. '
      + 'Las siete [[natural-notes|notas naturales]] son {{C}}, {{D}}, {{E}}, {{F}}, {{G}}, {{A}} y {{B}}. '
      + 'Es la misma nota con dos nombres distintos. '
      + 'La app muestra siempre los dos: el que elijas en Ajustes, en grande, y el otro en pequeño.',
    noDiagramReason: 'Es una equivalencia de nombres, no un lugar del mástil; el esquema está en Notas naturales.',
    lesson: NOTES_LESSON,
    related: ['natural-notes', 'sharp-flat'],
  }),
  c({
    id: 'natural-notes',
    block: 'notes',
    title: 'Notas naturales',
    aliases: ['naturales', 'nota natural', 'teclas blancas', 'natural notes'],
    short: 'Las siete notas sin sostenido ni bemol.',
    summary: 'Son las siete notas sin [[sharp-flat|sostenido ni bemol]]: {{C}}, {{D}}, {{E}}, {{F}}, {{G}}, {{A}} y {{B}}. '
      + 'Después de {{B}} se vuelve a empezar por {{C}}, una [[octave|octava]] más aguda. '
      + 'En un piano, son las teclas blancas.',
    sound: { midi: [48, 50, 52, 53, 55, 57, 59, 60] },
    lesson: NOTES_LESSON,
    related: ['note-names', 'natural-semitones', 'sharp-flat'],
  }),
  c({
    id: 'sharp-flat',
    block: 'notes',
    title: 'Sostenido y bemol',
    aliases: ['sostenido', 'bemol', 'alteración', 'alteraciones', 'sharp', 'flat', '#', '♯', '♭'],
    short: 'El sostenido (♯) sube un semitono y el bemol (♭) lo baja.',
    summary: 'Son las alteraciones. El sostenido (♯) sube una nota un [[semitone-tone|semitono]]: '
      + 'en la guitarra, un [[fret|traste]] hacia el cuerpo. '
      + 'El bemol (♭) la baja un semitono: un traste hacia la [[fret|cejuela]]. '
      + 'Así, {{F#}} está un traste por encima de {{F}}, y {{Bb}}, un traste por debajo de {{B}}.',
    sound: { midi: [53, 54] },
    lesson: NOTES_LESSON,
    related: ['enharmonic', 'semitone-tone', 'natural-notes'],
  }),
  c({
    id: 'enharmonic',
    block: 'notes',
    title: 'Enarmónicos',
    aliases: ['enarmónico', 'enarmónica', 'enarmonía', 'misma nota', 'enharmonic'],
    short: 'Dos nombres para el mismo sonido.',
    summary: 'Son dos nombres para el mismo sonido. Por ejemplo, {{F#}} y {{Gb}} son la misma nota, '
      + 'en el mismo [[fret|traste]]. Cuál se usa depende de la escala o del acorde en que aparece; '
      + 'en Ajustes eliges si prefieres ver ♯ o ♭. '
      + 'En los ejercicios del mástil valen los dos nombres.',
    lesson: NOTES_LESSON,
    related: ['sharp-flat', 'semitone-tone'],
  }),
  c({
    id: 'semitone-tone',
    block: 'notes',
    title: 'Semitono y tono',
    aliases: ['semitono', 'tono', 'medio tono', 'semitone', 'half step', 'whole step', 'whole tone'],
    short: 'Un semitono es un traste; un tono, dos trastes.',
    summary: 'El semitono es la distancia más pequeña entre dos notas: '
      + 'en la guitarra, de un [[fret|traste]] al siguiente en la misma cuerda. '
      + 'Un tono son dos semitonos, es decir, dos trastes. '
      + 'De {{E}} a {{F}} hay un semitono; de {{G}} a {{A}}, un tono.',
    sound: { midi: [52, 53, 55, 57] },
    lesson: NOTES_LESSON,
    related: ['natural-semitones', 'sharp-flat', 'fret'],
  }),
  c({
    id: 'natural-semitones',
    block: 'notes',
    title: 'Los dos semitonos naturales',
    aliases: ['mi fa', 'si do', 'e f', 'b c', 'semitonos naturales'],
    short: 'Entre {{E}} y {{F}}, y entre {{B}} y {{C}}, solo hay un semitono.',
    summary: 'Entre casi todas las [[natural-notes|notas naturales]] hay un [[semitone-tone|tono]] (dos trastes). '
      + 'Solo hay dos excepciones, con un semitono (un traste): {{E}}–{{F}} y {{B}}–{{C}}. '
      + 'Por eso no hay ninguna nota entre ellas: un traste por encima de {{E}} ya es {{F}}.',
    sound: { midi: [52, 53, 59, 60] },
    lesson: NOTES_LESSON,
    related: ['semitone-tone', 'natural-notes'],
  }),
  c({
    id: 'octave',
    block: 'notes',
    title: 'Octava',
    aliases: ['octava', 'octavas', '8ª', 'traste 12', 'octave'],
    short: 'La misma nota, más aguda o más grave: 12 trastes.',
    summary: 'Es la misma nota, más aguda o más grave: suenan tan parecidas que llevan el mismo nombre. '
      + 'Entre una nota y su octava hay 12 [[semitone-tone|semitonos]], así que en cada cuerda '
      + 'el traste 12 es la octava de la [[open-string|cuerda al aire]]. '
      + 'Por ejemplo, la 5ª cuerda al aire es {{A}}, y en el traste 12 vuelve a sonar {{A}}, una octava más aguda.',
    sound: { midi: [45, 57] },
    lesson: NOTES_LESSON,
    related: ['open-string', 'natural-notes', 'string-numbers'],
  }),
  c({
    id: 'string-numbers',
    block: 'notes',
    title: 'Numeración de las cuerdas',
    aliases: ['cuerdas', 'número de cuerda', 'primera cuerda', 'sexta cuerda', '1ª cuerda', '6ª cuerda', 'cuerda aguda', 'cuerda grave', 'string numbers'],
    short: 'De la 1ª (la más fina y aguda) a la 6ª (la más gruesa y grave).',
    summary: 'Las cuerdas se numeran de la más aguda a la más grave. '
      + 'La 1ª es la más fina, la que queda más cerca del suelo al tocar; la 6ª es la más gruesa. '
      + 'En [[standard-tuning|afinación estándar]], de la 6ª a la 1ª, suenan {{tuning:standard}}.',
    sound: { tuning: 'standard' },
    lesson: NOTES_LESSON,
    related: ['standard-tuning', 'open-string'],
  }),
  c({
    id: 'fret',
    block: 'notes',
    title: 'Traste y cejuela',
    aliases: ['traste', 'trastes', 'cejuela', 'mástil', 'diapasón', 'fret', 'nut', 'fretboard'],
    short: 'Cada traste sube la nota un semitono; la cejuela es el comienzo del mástil.',
    summary: 'Los trastes son las barritas de metal del mástil. Al pisar una cuerda justo detrás de un traste, '
      + 'suena más aguda: cada traste sube un [[semitone-tone|semitono]]. '
      + 'La cejuela (*nut*) es la pieza del comienzo del mástil, junto a las clavijas. '
      + 'Los trastes se cuentan desde ella: el traste 1 es el más cercano.',
    lesson: NOTES_LESSON,
    related: ['semitone-tone', 'open-string'],
  }),
  c({
    id: 'open-string',
    block: 'notes',
    title: 'Cuerda al aire',
    aliases: ['al aire', 'cuerda al aire', 'cuerdas al aire', 'traste 0', 'open string'],
    short: 'Una cuerda que se toca sin pisarla: traste 0.',
    summary: 'Es una cuerda que se toca sin pisarla. En los diagramas y en la tablatura se escribe 0 (traste 0). '
      + 'Cada cuerda al aire da la nota de su [[tuning|afinación]]: '
      + 'en la [[standard-tuning|estándar]], la 5ª cuerda al aire es {{A}}.',
    lesson: NOTES_LESSON,
    related: ['tuning', 'fret', 'string-numbers'],
  }),

  // ----- Afinaciones -----
  c({
    id: 'tuning',
    block: 'tunings',
    title: 'Afinación',
    aliases: ['afinación', 'afinaciones', 'afinar', 'tuning'],
    short: 'Las notas en las que suenan las cuerdas al aire.',
    summary: 'Es la nota en la que suena cada [[open-string|cuerda al aire]]. '
      + 'Si cambia la afinación, cambian las notas de todo el mástil, pero la regla es la misma: '
      + 'cada [[fret|traste]] sube un [[semitone-tone|semitono]]. '
      + 'La app usa siete afinaciones, que puedes ver y escuchar en Afinaciones.',
    sound: { tuning: 'standard' },
    lesson: TUNINGS_SCREEN,
    related: ['standard-tuning', 'lowered-tuning', 'drop-tuning', 'open-tuning'],
  }),
  c({
    id: 'standard-tuning',
    block: 'tunings',
    title: 'Afinación estándar',
    aliases: ['estándar', 'afinación estándar', 'mi estándar', 'standard tuning', 'eadgbe', 'mi la re sol si mi'],
    short: 'La afinación de referencia.',
    summary: 'Es la más habitual y la que usa la app si no eliges otra. '
      + 'De la 6ª a la 1ª cuerda: {{tuning:standard}}. '
      + 'Entre cuerdas vecinas hay 5 [[semitone-tone|semitonos]], salvo entre la 3ª y la 2ª, donde hay 4. '
      + 'Por eso algunas formas, como las de [[octave|octava]], cambian al llegar a la 2ª cuerda.',
    sound: { tuning: 'standard' },
    lesson: TUNINGS_SCREEN,
    related: ['tuning', 'string-numbers', 'lowered-tuning'],
  }),
  c({
    id: 'lowered-tuning',
    block: 'tunings',
    title: 'Afinación bajada',
    aliases: ['bajada', 'afinación bajada', 'medio tono abajo', 'un tono abajo', 're estándar', 'mib', 'eb', 'd standard', 'down tuning'],
    short: 'Todas las cuerdas más graves; las formas no cambian.',
    summary: 'Se bajan todas las cuerdas lo mismo: medio [[semitone-tone|tono]] ({{tname:half-down}}) '
      + 'o un tono ({{tname:d-standard}}). '
      + 'Las distancias entre cuerdas no cambian, así que los acordes y las escalas se tocan igual, '
      + 'pero todo suena más grave. Las cuerdas quedan menos tensas y cuesta menos estirarlas.',
    sound: { tuning: 'half-down' },
    lesson: TUNINGS_SCREEN,
    related: ['standard-tuning', 'tuning'],
  }),
  c({
    id: 'drop-tuning',
    block: 'tunings',
    title: 'Afinación drop',
    aliases: ['drop', 'drop d', 'drop re', 'afinación drop'],
    short: 'Solo la 6ª cuerda baja un tono.',
    summary: 'Se baja solo la 6ª cuerda un [[semitone-tone|tono]], de {{E}} a {{D}}; '
      + 'las demás quedan como en la [[standard-tuning|estándar]]. '
      + 'Así, al pisar con un solo dedo las tres cuerdas más graves en el mismo [[fret|traste]], '
      + 'suena un acorde potente muy usado en rock y metal.',
    sound: { tuning: 'drop-d' },
    lesson: TUNINGS_SCREEN,
    related: ['standard-tuning', 'tuning'],
  }),
  c({
    id: 'open-tuning',
    block: 'tunings',
    title: 'Afinación abierta',
    aliases: ['abierta', 'afinación abierta', 'sol abierto', 're abierto', 'mi abierto', 'open tuning', 'open g', 'open d', 'open e', 'slide'],
    short: 'Las cuerdas al aire forman un acorde mayor.',
    summary: 'Al tocar todas las [[open-string|cuerdas al aire]] suena un acorde mayor. '
      + 'Se usan mucho con *slide*: un tubo de metal o cristal que se pone en un dedo y se desliza sobre las cuerdas sin pisarlas. '
      + 'Apoyado en cualquier [[fret|traste]], suena otro acorde mayor; por ejemplo, en {{tname:open-g}}, en el traste 5 suena {{C}} mayor. '
      + 'La app incluye {{tname:open-g}}, {{tname:open-d}} y {{tname:open-e}}.',
    sound: { tuning: 'open-g' },
    lesson: TUNINGS_SCREEN,
    related: ['tuning', 'standard-tuning'],
  }),
]);

export function getConcept(id) {
  return CONCEPTS.find((x) => x.id === id) ?? null;
}

export function getBlock(id) {
  return BLOCKS.find((b) => b.id === id) ?? null;
}

export function blockConcepts(blockId) {
  return CONCEPTS.filter((x) => x.block === blockId);
}

/** Bloques con al menos un concepto, en el orden de BLOCKS. */
export function nonEmptyBlocks() {
  return BLOCKS.filter((b) => blockConcepts(b.id).length > 0);
}

/**
 * Ayuda "?" de cada pantalla (BUILD_PLAN 6.8, punto 5). text admite el mismo marcado;
 * concepts: fichas que se ofrecen debajo.
 */
export const SCREEN_HELP = Object.freeze({
  teoria: {
    title: 'Teoría',
    text: 'Aquí se aprende sin la guitarra. Cada módulo tiene una lección corta (Aprender), '
      + 'una Consulta para mirar cuando quieras y ejercicios de pregunta y respuesta. '
      + '«Sesión mezclada» combina ejercicios de varios módulos. Los módulos en gris aún no están construidos.',
  },
  practica: {
    title: 'Práctica',
    text: 'Aquí se practica con la guitarra en las manos. La app te dice qué tocar, con letra grande, '
      + 'voz y cuenta atrás, y pasa sola a la siguiente consigna, así que no hace falta tocar la pantalla. '
      + 'Al terminar ves qué has hecho; no tienes que puntuarte. Los módulos en gris aún no están construidos.',
  },
  moduleTheory: {
    title: 'Módulo',
    text: 'Aprender es la lección del módulo, en tarjetas cortas: conviene hacerla antes de los ejercicios. '
      + 'Consulta sirve para mirar el mástil o los diagramas cuando quieras. '
      + 'Debajo están los ejercicios: toca uno para prepararlo.',
  },
  modulePractice: {
    title: 'Módulo',
    text: 'Toca un ejercicio para prepararlo: eliges el nivel y, si el ejercicio lo permite, la [[tuning|afinación]].',
  },
  setup: {
    title: 'Preparación',
    text: 'Elige el nivel: Básico, Intermedio o Avanzado. La app recuerda el último que usaste en cada ejercicio. '
      + 'Si el ejercicio lo permite, también puedes elegir la [[tuning|afinación]]. '
      + 'Cuando el ejercicio esté construido, aquí verás también cómo se juega y la teoría que trabaja.',
  },
  tunings: {
    title: 'Afinaciones',
    text: 'Cada ficha muestra las notas de las [[open-string|cuerdas al aire]], de la 6ª a la 1ª. '
      + 'Toca una nota para oírla, o «Tocar todas» para oírlas una a una, despacio, y afinar de oído. '
      + 'Las cuerdas que cambian respecto a la [[standard-tuning|estándar]] se marcan en ámbar, con una flecha y los semitonos que suben o bajan.',
    concepts: ['standard-tuning', 'lowered-tuning', 'drop-tuning', 'open-tuning'],
  },
  glossary: {
    title: 'Glosario',
    text: 'Busca cualquier concepto en español o en inglés; no importan las tildes ni las mayúsculas. '
      + 'También puedes entrar en un bloque y ver sus conceptos. '
      + 'En toda la app, las palabras subrayadas con puntos abren su ficha.',
  },
  settings: {
    title: 'Ajustes',
    text: 'Los cambios se guardan al momento. La notación principal se ve en grande y la otra, en pequeño. '
      + 'Tus datos viven solo en este dispositivo: exporta una copia de vez en cuando.',
  },
  profile: {
    title: 'Perfil',
    text: 'Aquí verás cuánto practicas: los días en que has practicado y el tiempo total. '
      + 'Empezarán a contarse cuando lleguen los primeros ejercicios. Todo se guarda solo en este dispositivo.',
  },
  about: {
    title: 'Acerca de',
    text: 'El nombre de la app, la versión que tienes cargada y su autor. '
      + 'La versión sirve para comprobar que el iPhone tiene la última.',
  },
  soon: {
    title: 'Próximamente',
    text: 'Esta parte aún no está construida: la app se construye por fases. Mientras tanto, todo lo demás funciona.',
  },
});

/** Textos fijos de la interfaz que explican algo (BUILD_PLAN 6.9). */
export const UI_TEXTS = Object.freeze({
  storageNote: 'Tus datos se guardan solo en este dispositivo. Si borras la app, se borran. Exporta una copia de vez en cuando.',
  noStorage: 'Este navegador no permite guardar datos: los ajustes y el progreso se perderán al cerrar la app.',
  importConfirm: 'Importar sustituirá tu progreso y tus ajustes actuales por los de la copia.',
  clearConfirm: 'Se borrarán tus estadísticas, el historial, los récords y las lecciones completadas. '
    + 'Los ajustes y tus progresiones se conservan. No se puede deshacer.',
  soundOff: 'El sonido está desactivado en Ajustes.',
  hints: {
    notation: 'La otra se ve en pequeño. Ejemplo:',
    accidentals: 'Para las notas del mástil, fuera de una tonalidad.',
    theme: 'Automático sigue al del sistema.',
    orientation: 'Auto: vertical con el móvil en vertical.',
    voice: 'La app dice en voz alta la nota o el acorde.',
    defaultTuning: 'Con la que empiezan los ejercicios que la admiten.',
  },
});
