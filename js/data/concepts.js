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
//   diagram (esquema visual, obligatorio; formato en js/core/diagrams.js) o, solo si un
//   esquema no tiene sentido, noDiagramReason con el motivo,
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
const METRONOME_SCREEN = '#/metronomo';

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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 12, points: { select: 'naturals' } },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 5, points: { select: 'sound', string: 4 } },
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
    sound: { midi: [42] },
    diagram: {
      type: 'fretboard', fromFret: 0, toFret: 5, points: { select: 'sound', string: 6 },
      caption: '{{F#}} y {{Gb}}: el mismo traste y el mismo sonido.',
    },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 7, points: { select: 'sound', string: 4 } },
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
    diagram: {
      type: 'fretboard', fromFret: 0, toFret: 12, points: { select: 'naturals', strings: [5] }, highlight: 'natural-semitones',
      caption: 'En la 5ª cuerda, {{B}} y {{C}} están en trastes vecinos, igual que {{E}} y {{F}}.',
    },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 12, points: { select: 'sound', string: 5 } },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 4, points: { select: 'open' }, showStringNumbers: true },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 5, points: { select: 'string', string: 1 }, showFretNumbers: true },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 4, points: { select: 'open' } },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 4, points: { select: 'open' } },
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
    diagram: { type: 'fretboard', fromFret: 0, toFret: 4, points: { select: 'open' }, showStringNumbers: true },
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
    diagram: { type: 'fretboard', tuning: 'half-down', fromFret: 0, toFret: 4, points: { select: 'open' } },
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
    diagram: {
      type: 'fretboard', tuning: 'drop-d', fromFret: 0, toFret: 4, points: { select: 'open' }, highlight: 'changed',
      caption: 'En ámbar, la 6ª cuerda: la única que cambia respecto a la estándar.',
    },
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
    diagram: { type: 'fretboard', tuning: 'open-g', fromFret: 0, toFret: 4, points: { select: 'open' }, colorBy: 'function' },
    lesson: TUNINGS_SCREEN,
    related: ['tuning', 'standard-tuning'],
  }),

  // ----- Ritmo y técnica -----
  c({
    id: 'metronome',
    block: 'rhythm-technique',
    title: 'Metrónomo, tempo y BPM',
    aliases: ['metrónomo', 'tempo', 'bpm', 'pulso', 'pulsos por minuto', 'compás', 'metronome', 'beats per minute', 'beat'],
    short: 'El metrónomo marca el pulso; el tempo es su velocidad, en BPM.',
    summary: 'El metrónomo marca el pulso con un clic regular, para tocar a tempo. '
      + 'El tempo es la velocidad de ese pulso y se mide en BPM (pulsos por minuto, *beats per minute*): '
      + 'a 60 BPM suena un clic por segundo, y a 120, dos. '
      + 'Los pulsos se agrupan en compases, y el primero de cada compás se acentúa: suena más agudo y más fuerte, y en la app se ve en ámbar. '
      + 'Para mejorar, empieza a un tempo lento en el que todo te salga limpio y súbelo poco a poco.',
    diagram: { type: 'beats', beatsPerBar: 4, bpm: 60 },
    lesson: METRONOME_SCREEN,
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
      + 'Este ejercicio aún no está construido: cuando llegue, este «?» te explicará cómo se juega y la teoría que trabaja.',
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
    text: 'La racha son los días seguidos en que has practicado; si hoy aún no has practicado, cuenta hasta ayer. '
      + 'Los días practicados y el tiempo total suman todas tus rondas de ejercicios. '
      + 'Todo se guarda solo en este dispositivo.',
  },
  about: {
    title: 'Acerca de',
    text: 'El nombre de la app, la versión que tienes cargada y su autor. '
      + 'La versión sirve para comprobar que el iPhone tiene la última.',
  },
  dev: {
    title: 'Página de prueba',
    text: 'Sirve para comprobar que todo funciona: toca los puntos del mástil y los acordes para oírlos, '
      + 'prueba la voz y el pulso, y juega los dos ejercicios de prueba. Las rondas de prueba cuentan en tu Perfil.',
  },
  soon: {
    title: 'Próximamente',
    text: 'Esta parte aún no está construida: la app se construye por fases. Mientras tanto, todo lo demás funciona.',
  },
});

/**
 * Textos de cada ejercicio (BUILD_PLAN 6.8 y 7.1): howTo ("Cómo se juega") y las plantillas
 * con las que se genera la corrección y el "¿Por qué?" a partir de las reglas.
 * Las plantillas usan %variable% (js/core/glossary.js, fillTemplate) y el marcado de siempre;
 * {{pc:%answer%}} escribe la nota con la preferencia ♯/♭ del usuario.
 */
export const EXERCISE_TEXTS = Object.freeze({
  'dev.teoria.que-nota': Object.freeze({
    howTo: 'Se marca un punto del mástil con un «?». Elige qué nota suena en ese [[fret|traste]]. '
      + 'Si aciertas, pasa sola a la siguiente pregunta; si fallas, verás la corrección y el «¿Por qué?». '
      + 'En Básico salen solo [[natural-notes|notas naturales]] y no hay tiempo; '
      + 'en Intermedio tienes 10 segundos por pregunta y en Avanzado, 5.',
    feedbackWrong: 'No es {{pc:%chosen%}}: es {{pc:%answer%}} (%string%ª cuerda, traste %fret%).',
    feedbackTimeout: 'Se acabó el tiempo: es {{pc:%answer%}} (%string%ª cuerda, traste %fret%).',
    whyOpen: 'Es la [[open-string|cuerda al aire]]: en esta afinación, la %string%ª cuerda al aire suena {{pc:%answer%}}.',
    whyFretted: 'En esta afinación, la %string%ª cuerda al aire es {{pc:%open%}}. '
      + 'Cada [[fret|traste]] sube un [[semitone-tone|semitono]], así que en el traste %fret% suena {{pc:%answer%}}.',
    whyChosen: ' {{pc:%chosen%}} estaría en el traste %chosenFret% de esa cuerda.',
    whyChosenOpen: ' {{pc:%chosen%}} es esa cuerda al aire (traste 0).',
    missLabel: '%string%ª cuerda · traste %fret%',
  }),
  'dev.practica.seis-cuerdas': Object.freeze({
    howTo: 'La app dice una nota en voz alta. Tócala en las seis cuerdas, de la 6ª a la 1ª, antes de que acabe la cuenta atrás; '
      + 'los círculos de abajo se iluminan para marcarte el ritmo. '
      + 'Al acabarse el tiempo verás dónde estaba en cada cuerda, y la app pasa sola a la siguiente. '
      + '«Ver posiciones» te las enseña antes, sin parar la cuenta. La ronda dura lo que elijas en Duración.',
    instruction: 'Tócala en las 6 cuerdas',
  }),
});

/** Textos fijos de la interfaz que explican algo (BUILD_PLAN 6.9). */
export const UI_TEXTS = Object.freeze({
  storageNote: 'Tus datos se guardan solo en este dispositivo. Si borras la app, se borran. Exporta una copia de vez en cuando.',
  noStorage: 'Este navegador no permite guardar datos: los ajustes y el progreso se perderán al cerrar la app.',
  importConfirm: 'Importar sustituirá tu progreso y tus ajustes actuales por los de la copia.',
  clearConfirm: 'Se borrarán tus estadísticas, el historial, los récords y las lecciones completadas. '
    + 'Los ajustes y tus progresiones se conservan. No se puede deshacer.',
  soundOff: 'El sonido está desactivado en Ajustes.',
  // Rondas de ejercicio y resumen (BUILD_PLAN 6.6.7, 6.6.8 y 6.6.10).
  round: Object.freeze({
    exitTitle: '¿Salir de la ronda?',
    exitText: 'Lo que llevas hecho se guarda en tu historial.',
    finishTitle: '¿Terminar la ronda?',
    finishText: 'Verás el resumen de lo que has hecho.',
    missChosen: '%correct% (dijiste %chosen%)',
    missTimeout: '%correct% (se acabó el tiempo)',
    paused: 'En pausa',
    pausedHint: 'Toca «Seguir» para continuar. Mientras tanto, puedes ver la ayuda.',
    newRecord: 'Nuevo récord',
  }),
  scoreBands: Object.freeze({
    perfect: '¡Perfecto!',
    great: 'Muy bien',
    good: 'Vas bien',
    keepGoing: 'Sigue practicando',
    none: '',
  }),
  // Leyenda de los colores de función (BUILD_PLAN 4.5).
  functionNames: Object.freeze({
    root: 'Fundamental (R)',
    third: '3ª',
    fifth: '5ª',
    seventh: '7ª',
    blue: 'Blue note (b5)',
    other: 'Otras notas de la escala',
  }),
  // Enlace de cada ficha a su lección o pantalla (según el tipo de ruta de `lesson`).
  lessonLinks: Object.freeze({
    lesson: 'Ver la lección completa',
    tunings: 'Ir a Afinaciones',
    metronome: 'Abrir el Metrónomo',
  }),
  hints: {
    notation: 'La otra se ve en pequeño. Ejemplo:',
    accidentals: 'Para las notas del mástil, fuera de una tonalidad.',
    theme: 'Automático sigue al del sistema.',
    orientation: 'Auto: vertical con el móvil en vertical.',
    voice: 'La app dice en voz alta la nota o el acorde.',
    defaultTuning: 'Con la que empiezan los ejercicios que la admiten.',
    dev: 'Para probar el mástil, el sonido, la voz y los motores de ejercicio.',
  },
});
