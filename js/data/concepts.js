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

import { tabFromNotes } from '../core/tab.js';
import { warmupOutward } from '../core/warmup.js';

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
const CHORDS_LESSON = '#/teoria/acordes/aprender';
const CHANGES_SETUP = '#/practica/acordes/cambios';
const STRUM_SETUP = '#/practica/acordes/rasgueo';
const WARMUP_SETUP = '#/practica/calentamiento/cromatico';

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
  c({
    id: 'unison',
    block: 'notes',
    title: 'Unísono',
    aliases: ['unísono', 'unísonos', 'misma nota', 'la misma nota exacta', 'unison'],
    short: 'La misma nota exacta, a la misma altura, en dos sitios distintos.',
    summary: 'Dos notas están al unísono cuando suenan exactamente igual: mismo nombre y misma altura. '
      + 'En la guitarra, casi todas las notas se pueden tocar en más de una cuerda. '
      + 'Por ejemplo, la 6ª cuerda en el traste 5 suena {{A}}, igual que la 5ª cuerda al aire. '
      + 'No es lo mismo que una [[octave|octava]], que tiene el mismo nombre pero suena más aguda o más grave.',
    sound: { midi: [45, 45] },
    diagram: {
      type: 'fretboard', fromFret: 0, toFret: 7, points: { select: 'unison', string: 6, fret: 5 }, highlight: 'start',
      caption: 'El punto ámbar (6ª cuerda, traste 5) y el gris (5ª cuerda al aire) son la misma nota exacta.',
    },
    lesson: NOTES_LESSON,
    related: ['five-fret-rule', 'octave', 'string-numbers'],
  }),
  c({
    id: 'five-fret-rule',
    block: 'notes',
    title: 'Regla de los 5 trastes (4 entre la 3ª y la 2ª)',
    aliases: ['regla de los 5 trastes', 'regla del quinto traste', 'traste 5', 'sol si', 'g b', 'afinar por el quinto traste', 'five fret rule'],
    short: 'El traste 5 de una cuerda suena como la siguiente al aire; de la 3ª a la 2ª, el traste 4.',
    summary: 'En la [[standard-tuning|afinación estándar]], el traste 5 de una cuerda suena igual que la siguiente cuerda más aguda al aire: es su [[unison|unísono]]. '
      + 'Vale para todas las parejas menos una: de la 3ª ({{G}}) a la 2ª ({{B}}) es el traste 4, porque entre ellas hay 4 [[semitone-tone|semitonos]] y no 5. '
      + 'Así, la misma nota en la cuerda grave de al lado está 5 trastes más allá (4 si pasas de la 2ª a la 3ª). '
      + 'En otras [[tuning|afinaciones]] las distancias cambian.',
    sound: { midi: [59, 59] },
    diagram: {
      type: 'fretboard', fromFret: 0, toFret: 5, points: { select: 'five-fret-rule' }, highlight: 'gap',
      caption: 'Cada nota pisada suena igual que la cuerda de al lado al aire: llevan el mismo nombre. En ámbar, la pareja de la 3ª y la 2ª, en el traste 4.',
    },
    lesson: NOTES_LESSON,
    related: ['unison', 'standard-tuning', 'octave-shapes'],
  }),
  c({
    id: 'octave-shapes',
    block: 'notes',
    title: 'Formas de octava',
    aliases: ['forma de octava', 'formas de octava', 'octavas en el mástil', 'octave shapes'],
    short: 'Dibujos fijos para encontrar la octava de una nota en otra cuerda, sin contar trastes.',
    summary: 'Para encontrar la [[octave|octava]] de una nota sin contar trastes se usan unas formas fijas. '
      + 'Desde la 6ª cuerda, la octava está en la 4ª, dos trastes más allá; desde la 5ª, en la 3ª, también dos trastes más allá. '
      + 'Desde la 4ª y la 3ª, en la 2ª y la 1ª, tres trastes más allá, porque la forma cruza la pareja de la 3ª y la 2ª ([[five-fret-rule|regla de los 5 trastes]]). '
      + 'Y la 6ª y la 1ª cuerda dan la misma nota en el mismo traste, dos octavas más aguda.',
    sound: { midi: [43, 55, 67] },
    diagram: {
      type: 'fretboard', fromFret: 0, toFret: 8, points: { select: 'octaves', string: 6, fret: 3 }, highlight: 'start',
      caption: 'Desde el punto ámbar (6ª cuerda, traste 3), sus octavas con las formas: 4ª cuerda, traste 5; 2ª, traste 8; y 1ª, traste 3.',
    },
    lesson: NOTES_LESSON,
    related: ['octave', 'five-fret-rule', 'string-numbers'],
  }),

  // ----- Acordes (Fase 3) -----
  c({
    id: 'chord',
    block: 'chords',
    title: 'Acorde',
    aliases: ['acorde', 'acordes', 'chord', 'chords'],
    short: 'Tres o más notas distintas que suenan a la vez.',
    summary: 'Un acorde son tres o más notas distintas que suenan a la vez. '
      + 'En la guitarra se toca pisando varias cuerdas y rasgueándolas juntas. '
      + 'Su nombre dice su [[root|fundamental]] y su tipo: {{chord:Am}} es un acorde menor con fundamental {{A}}. '
      + 'Toca el diagrama para oírlo, o cada punto para oír su nota.',
    diagram: { type: 'chord', chord: 'C', colorBy: 'function' },
    lesson: CHORDS_LESSON,
    related: ['triad', 'root', 'chord-diagram'],
  }),
  c({
    id: 'triad',
    block: 'chords',
    title: 'Tríada',
    aliases: ['tríada', 'triada', 'triad', 'fundamental, 3ª y 5ª', 'r 3 5'],
    short: 'Acorde de tres notas: fundamental, 3ª y 5ª.',
    summary: 'Una tríada es un acorde de tres notas: la [[root|fundamental]], la [[chord-third|3ª]] y la 5ª. '
      + 'La 3ª está a 3 o 4 [[semitone-tone|semitonos]] de la fundamental, y la 5ª, a 7. '
      + 'En la guitarra se tocan más de tres cuerdas porque algunas notas se repiten en otra [[octave|octava]]: '
      + '{{chord:C}} suena con {{C}}, {{E}}, {{G}}, {{C}} y {{E}}.',
    diagram: { type: 'chord', chord: 'C', colorBy: 'function' },
    lesson: CHORDS_LESSON,
    related: ['chord', 'root', 'chord-third'],
  }),
  c({
    id: 'root',
    block: 'chords',
    title: 'Fundamental',
    aliases: ['fundamental', 'raíz', 'root', 'nota fundamental', 'bajo del acorde'],
    short: 'La nota que da nombre al acorde.',
    summary: 'La fundamental (R, de *root*) es la nota que da nombre al acorde: en {{chord:G}}, es {{G}}. '
      + 'En los [[open-chord|acordes abiertos]] de la app es también la nota más grave, la de la cuerda más gruesa que suena. '
      + 'En los esquemas se pinta en rojo coral, y con «Mostrar en los puntos: intervalos» lleva una R.',
    diagram: { type: 'chord', chord: 'G', colorBy: 'function' },
    lesson: CHORDS_LESSON,
    related: ['triad', 'chord-third'],
  }),
  c({
    id: 'chord-third',
    block: 'chords',
    title: 'La 3ª: mayor o menor',
    aliases: ['tercera', '3ª', 'tercera mayor', 'tercera menor', 'mayor o menor', 'acorde mayor', 'acorde menor', 'third', 'major third', 'minor third', 'major', 'minor'],
    short: 'La nota que decide si un acorde es mayor o menor.',
    summary: 'La 3ª es la nota que decide el carácter del acorde. '
      + 'Si está a 4 [[semitone-tone|semitonos]] de la [[root|fundamental]] (3ª mayor), el acorde es mayor; si está a 3 (3ª menor), es menor. '
      + 'El mayor se suele describir como más luminoso y el menor, como más triste. '
      + 'Por ejemplo, {{chord:E}} lleva {{G#}} y {{chord:Em}} lleva {{G}}: es la única nota que cambia.',
    diagram: { type: 'chord', chord: 'E', compare: 'Em', colorBy: 'function' },
    lesson: CHORDS_LESSON,
    related: ['triad', 'root', 'dominant-seventh'],
  }),
  c({
    id: 'chord-diagram',
    block: 'chords',
    title: 'Diagrama de acorde',
    aliases: ['diagrama', 'diagrama de acorde', 'digitación', 'dedos', 'chord diagram', 'chord chart', 'chord box'],
    short: 'El dibujo que dice dónde pisar y con qué dedo.',
    summary: 'Un diagrama de acorde es el mástil visto de frente y en vertical: las líneas verticales son las cuerdas (la 6ª a la izquierda) y las horizontales, los [[fret|trastes]], con la cejuela arriba. '
      + 'Los puntos dicen dónde pisar, y el número de dentro, con qué dedo: 1 índice, 2 corazón, 3 anular y 4 meñique. '
      + 'Una o encima es una [[open-string|cuerda al aire]], y una ×, una cuerda que no se toca.',
    diagram: { type: 'chord', chord: 'D' },
    lesson: CHORDS_LESSON,
    related: ['open-chord', 'fret', 'string-numbers'],
  }),
  c({
    id: 'open-chord',
    block: 'chords',
    title: 'Acorde abierto',
    aliases: ['acorde abierto', 'acordes abiertos', 'acordes de primera posición', 'open chord', 'open chords', 'cowboy chords'],
    short: 'Acorde con cuerdas al aire, cerca de la cejuela.',
    summary: 'Un acorde abierto usa [[open-string|cuerdas al aire]] y se toca en los primeros trastes, cerca de la cejuela. '
      + 'Son los primeros que se aprenden, y suenan amplios porque las cuerdas al aire vibran libres. '
      + '{{chord:Em}} es de los más sencillos: dos dedos y cuatro cuerdas al aire.',
    diagram: { type: 'chord', chord: 'Em' },
    lesson: CHORDS_LESSON,
    related: ['chord-diagram', 'barre-chord'],
  }),
  c({
    id: 'dominant-seventh',
    block: 'chords',
    title: 'Acorde de séptima de dominante',
    aliases: ['séptima', 'séptima de dominante', 'acorde de séptima', 'siete', 'dominant seventh', 'seventh chord', 'dom7'],
    short: 'Tríada mayor con la 7ª menor: el «7» del nombre.',
    summary: 'Un acorde de séptima de dominante (el «7» del nombre, como {{chord:A7}}) es una tríada mayor con una nota más: la 7ª menor, a 10 [[semitone-tone|semitonos]] de la [[root|fundamental]]. '
      + 'Esa nota le da un sonido con tensión, que pide pasar a otro acorde, y es la base del blues. '
      + '{{chord:A7}} sale de {{chord:A}} levantando el dedo de la 3ª cuerda, que pasa a sonar al aire: {{G}}. '
      + 'En los esquemas, la 7ª se pinta en rosa.',
    diagram: { type: 'chord', chord: 'A', compare: 'A7', colorBy: 'function' },
    lesson: CHORDS_LESSON,
    related: ['chord-third', 'triad'],
  }),
  c({
    id: 'barre-chord',
    block: 'chords',
    title: 'Cejilla',
    aliases: ['cejilla', 'hacer cejilla', 'barra', 'barre', 'barre chord', 'capo', 'capotraste'],
    short: 'Pisar varias cuerdas en el mismo traste con un solo dedo.',
    summary: 'Hacer cejilla es pisar varias cuerdas en el mismo traste con un solo dedo, normalmente el índice estirado. '
      + '{{chord:F-barre}} pisa las 6 cuerdas en el traste 1; {{chord:F-mini}} solo pisa así la 1ª y la 2ª. '
      + 'Al principio cuesta: apoya el dedo justo detrás del traste y gíralo un poco hacia su lado, que es más duro. '
      + 'Ojo: en España también se llama cejilla a la pieza que se pone en el mástil para subir el tono (*capo*).',
    diagram: { type: 'chord', chord: 'F-mini', compare: 'F-barre' },
    lesson: CHORDS_LESSON,
    related: ['open-chord', 'chord-diagram'],
  }),
  c({
    id: 'progression',
    block: 'chords',
    title: 'Progresión de acordes',
    aliases: ['progresión', 'progresiones', 'grados', 'números romanos', 'i iv v', 'progression', 'chord progression', 'degrees'],
    short: 'Una serie de acordes que se repite, escrita por grados.',
    summary: 'Una progresión es una serie de acordes que se repite, como la base de una canción. '
      + 'Se suele escribir por grados, con números romanos que dicen el lugar del acorde en la tonalidad: I es el primero, IV el cuarto y V el quinto, y en minúscula los menores (vi). '
      + 'Así, I–IV–V en {{G}} es {{chord:G}}–{{chord:C}}–{{chord:D}}, y en {{D}} es {{chord:D}}–{{chord:G}}–{{chord:A}}: la misma progresión en otra tonalidad.',
    diagram: { type: 'chord', chord: 'G', compare: ['C', 'D'] },
    lesson: CHANGES_SETUP,
    related: ['chord-changes', 'chord'],
  }),
  c({
    id: 'chord-changes',
    block: 'chords',
    title: 'Cambios de acorde',
    aliases: ['cambios', 'cambio de acorde', 'cambios en un minuto', 'dedo guía', 'chord changes', 'one minute changes'],
    short: 'Pasar de un acorde a otro a tiempo.',
    summary: 'Cambiar de acorde a tiempo es lo que más cuesta al empezar. '
      + 'Practica despacio y con metrónomo: mejor un cambio lento y a tiempo que uno rápido y a destiempo. '
      + 'Busca los dedos que no se mueven entre dos acordes: {{chord:C}} y {{chord:Am}} comparten los dedos 1 y 2, y solo se mueve el 3. '
      + 'Levanta los dedos a la vez, como una sola forma, y colócalos juntos en el acorde siguiente.',
    diagram: { type: 'chord', chord: 'C', compare: 'Am' },
    lesson: CHANGES_SETUP,
    related: ['progression', 'metronome'],
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
  c({
    id: 'strumming',
    block: 'rhythm-technique',
    title: 'Rasgueo y regla del péndulo',
    aliases: ['rasgueo', 'rasguear', 'péndulo', 'regla del péndulo', 'patrón de rasgueo', 'abajo arriba', 'strumming', 'strum', 'strumming pattern'],
    short: 'Tocar las cuerdas de un golpe, con la mano como un péndulo.',
    summary: 'Rasguear es tocar las cuerdas de un golpe con la mano derecha, hacia abajo (↓) o hacia arriba (↑). '
      + 'Regla del péndulo: la mano baja en cada tiempo y sube en cada «y», aunque no toque las cuerdas. '
      + 'Así, los golpes abajo caen siempre en 1, 2, 3 y 4, y los de arriba, en los «y». '
      + 'Cuando una casilla no suena (·), la mano pasa igual por el aire, y el ritmo no se descuadra.',
    diagram: { type: 'strum', pattern: 'pop', chord: 'G', bpm: 70 },
    lesson: STRUM_SETUP,
    related: ['accent', 'swing', 'metronome'],
  }),
  c({
    id: 'accent',
    block: 'rhythm-technique',
    title: 'Acento',
    aliases: ['acento', 'acentos', 'golpe fuerte', 'backbeat', 'accent'],
    short: 'Un golpe más fuerte que los demás.',
    summary: 'Un acento es un golpe más fuerte que los demás. '
      + 'En el pop y el rock se suelen acentuar los tiempos 2 y 4 (el *backbeat*), que es donde suena la caja de la batería. '
      + 'En los patrones de la app, el golpe acentuado lleva un > encima.',
    diagram: { type: 'strum', pattern: 'pop-acento', chord: 'G', bpm: 90 },
    lesson: STRUM_SETUP,
    related: ['strumming', 'swing'],
  }),
  c({
    id: 'swing',
    block: 'rhythm-technique',
    title: 'Swing',
    aliases: ['swing', 'shuffle', 'corcheas con swing', 'ritmo ternario', 'swung eighths'],
    short: 'Corcheas largas y cortas, en proporción 2:1.',
    summary: 'Con swing, las corcheas no duran lo mismo: la del tiempo es larga y la del «y», corta, en proporción 2:1, como un «taa-ta, taa-ta». '
      + 'Es el ritmo del blues, del jazz y del *shuffle*. '
      + 'Se cuenta igual, «1 y 2 y», pero cada «y» llega un poco más tarde.',
    diagram: { type: 'strum', pattern: 'swing', chord: 'G', bpm: 90 },
    lesson: STRUM_SETUP,
    related: ['strumming', 'accent'],
  }),
  c({
    id: 'chromatic-warmup',
    block: 'rhythm-technique',
    title: 'Calentamiento cromático',
    aliases: ['calentamiento', 'cromático', 'un dedo por traste', 'araña', '1-2-3-4', 'spider', 'chromatic exercise', 'warm up', 'warm-up'],
    short: 'Un dedo por traste, cuerda a cuerda, para soltar los dedos.',
    summary: 'El calentamiento cromático recorre los trastes uno tras otro, de [[semitone-tone|semitono]] en semitono, con un dedo por traste: el índice en el primero, el corazón en el segundo, el anular en el tercero y el meñique en el cuarto. '
      + 'Se toca de la 6ª cuerda a la 1ª y vuelta, con [[metronome|metrónomo]], para soltar los dedos y que trabajen cada uno por su lado. '
      + 'No tiene que sonar bonito, sino limpio y a tiempo: la app sube el tempo poco a poco. '
      + 'Si te duele la mano, para y descansa.',
    diagram: { type: 'tab', tab: tabFromNotes(warmupOutward('1234', 1).slice(0, 8).map(({ string, fret }) => ({ string, fret, dur: 1 }))), bpm: 70 },
    lesson: WARMUP_SETUP,
    related: ['metronome', 'tablature'],
  }),

  // ----- Tablatura (Fase 3) -----
  c({
    id: 'tablature',
    block: 'tablature',
    title: 'Tablatura',
    aliases: ['tablatura', 'tab', 'tabs', 'tablature', 'leer tablatura', 'cómo leer una tablatura'],
    short: 'Música para guitarra escrita con números de traste.',
    summary: 'La tablatura (*tab*) escribe la música para guitarra con números en lugar de notas. '
      + 'Tiene 6 líneas, una por cuerda: la de arriba es la 1ª, la más aguda, y la de abajo, la 6ª, como en el mástil en horizontal de la app. '
      + 'Cada número es el [[fret|traste]] que hay que pisar (0 es la [[open-string|cuerda al aire]]), y los números de una misma columna suenan a la vez. '
      + 'Se lee de izquierda a derecha; la separación entre números y el conteo de debajo marcan el ritmo.',
    diagram: {
      type: 'tab',
      tab: {
        beatsPerBar: 4,
        events: [
          { notes: [{ string: 6, fret: 0 }], dur: 1 },
          { notes: [{ string: 5, fret: 2 }], dur: 1 },
          { notes: [{ string: 4, fret: 2 }], dur: 2 },
          { notes: [{ string: 3, fret: 0 }, { string: 2, fret: 0 }, { string: 1, fret: 0 }], dur: 4 },
        ],
      },
    },
    related: ['string-numbers', 'fret', 'hammer-on'],
  }),
  c({
    id: 'hammer-on',
    block: 'tablature',
    title: 'Ligado ascendente (h)',
    aliases: ['ligado ascendente', 'ligado', 'martilleo', 'hammer-on', 'hammer on', 'hammer', 'h'],
    short: 'Hacer sonar una nota más aguda golpeando con otro dedo.',
    summary: 'Un ligado ascendente (*hammer-on*) hace sonar una nota sin pulsarla: tocas la primera y golpeas con otro dedo un traste más arriba, en la misma cuerda. '
      + 'Se escribe con una h entre los dos números, 5h7, y se dibuja con un arco. '
      + 'Solo se pulsa la primera nota: la segunda suena por el golpe del dedo, así que golpea fuerte y justo detrás del traste.',
    diagram: { type: 'tab', tab: tabFromNotes([{ string: 3, fret: 5, dur: 2, tech: { type: 'hammer' } }, { string: 3, fret: 7, dur: 2 }]) },
    related: ['pull-off', 'trill', 'tapping'],
  }),
  c({
    id: 'pull-off',
    block: 'tablature',
    title: 'Ligado descendente (p)',
    aliases: ['ligado descendente', 'pull-off', 'pull off', 'pull', 'p'],
    short: 'Hacer sonar una nota más grave levantando el dedo.',
    summary: 'Un ligado descendente (*pull-off*) es lo contrario: con dos notas pisadas en la misma cuerda, tocas la más aguda y levantas ese dedo tirando un poco de la cuerda, y suena la más grave. '
      + 'Se escribe con una p, 7p5, y se dibuja con un arco. '
      + 'El dedo de la nota grave tiene que estar pisando antes de levantar el otro.',
    diagram: { type: 'tab', tab: tabFromNotes([{ string: 3, fret: 7, dur: 2, tech: { type: 'pull' } }, { string: 3, fret: 5, dur: 2 }]) },
    related: ['hammer-on', 'trill'],
  }),
  c({
    id: 'slide-up',
    block: 'tablature',
    title: 'Deslizamiento hacia arriba (/)',
    aliases: ['deslizamiento', 'deslizar', 'arrastre', 'slide', 'slide up', 's', '/'],
    short: 'Cambiar de nota arrastrando el dedo hacia agudos.',
    summary: 'Un deslizamiento (*slide*) cambia de nota sin levantar el dedo: tocas una nota y arrastras el dedo por la cuerda hasta otro traste. '
      + 'Hacia arriba (hacia los agudos) se escribe con una barra, 5/7, y se dibuja con una línea que sube. '
      + 'Si la barra va delante, /7, se entra deslizando desde unos trastes más abajo, sin una nota de salida concreta. '
      + 'Algunas tablaturas usan una s en lugar de la barra.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([
        { string: 3, fret: 5, dur: 2, tech: { type: 'slide' } }, { string: 3, fret: 7, dur: 2 },
        { string: 3, fret: 7, dur: 4, tech: { type: 'slide-in', from: 'below' } },
      ]),
    },
    related: ['slide-down', 'hammer-on'],
  }),
  c({
    id: 'slide-down',
    block: 'tablature',
    title: 'Deslizamiento hacia abajo (\\)',
    aliases: ['deslizamiento hacia abajo', 'salir deslizando', 'slide down', '\\'],
    short: 'Cambiar de nota arrastrando el dedo hacia graves.',
    summary: 'Hacia abajo (hacia los graves), el deslizamiento se escribe con la barra invertida, 7\\5, y se dibuja con una línea que baja. '
      + 'Si la barra va detrás, 7\\, se sale deslizando: tocas la nota y arrastras el dedo hacia la cejuela mientras se apaga. '
      + 'Mantén la presión justa: si aprietas poco, la nota se corta, y si aprietas mucho, cuesta mover el dedo.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([
        { string: 3, fret: 7, dur: 2, tech: { type: 'slide' } }, { string: 3, fret: 5, dur: 2 },
        { string: 3, fret: 7, dur: 4, tech: { type: 'slide-out', to: 'down' } },
      ]),
    },
    related: ['slide-up'],
  }),
  c({
    id: 'bend',
    block: 'tablature',
    title: 'Estiramiento (b)',
    aliases: ['estiramiento', 'estirar', 'bending', 'bend', 'b', 'full', '^'],
    short: 'Subir la nota empujando la cuerda hacia un lado.',
    summary: 'Un estiramiento (*bend*) sube la nota empujando la cuerda hacia un lado con el dedo, sin cambiar de traste. '
      + 'Se escribe con una b y el traste cuyo sonido hay que alcanzar: 7b9 sube un tono, hasta lo que sonaría en el traste 9 (algunas tablaturas usan ^ en lugar de b). '
      + 'En la app se dibuja con una flecha curva hacia arriba y la cantidad encima: ½ es medio tono, 1 es un tono (en inglés, *full*) y 1½, tono y medio. '
      + 'Se hace sobre todo en la 2ª y la 3ª cuerda, empujando con varios dedos a la vez.',
    diagram: { type: 'tab', tab: tabFromNotes([{ string: 3, fret: 7, dur: 4, tech: { type: 'bend', amount: 1 } }]) },
    related: ['release', 'pre-bend', 'vibrato'],
  }),
  c({
    id: 'release',
    block: 'tablature',
    title: 'Soltar el estiramiento (r)',
    aliases: ['soltar', 'soltar el estiramiento', 'release', 'bend and release', 'r'],
    short: 'Devolver la cuerda a su sitio tras un estiramiento.',
    summary: 'Soltar (*release*) es devolver la cuerda a su sitio después de un [[bend|estiramiento]], sin dejar de pisar: la nota baja hasta la original. '
      + 'Se escribe con una r, 7b9r7 (estiras hasta el sonido del traste 9 y vuelves al 7), y se dibuja con una flecha que sube y baja. '
      + 'Suelta despacio y con control, para que se oiga cómo baja.',
    diagram: { type: 'tab', tab: tabFromNotes([{ string: 3, fret: 7, dur: 4, tech: { type: 'bend', amount: 1, release: true } }]) },
    related: ['bend', 'pre-bend'],
  }),
  c({
    id: 'pre-bend',
    block: 'tablature',
    title: 'Estiramiento previo (pb)',
    aliases: ['estiramiento previo', 'pre-bend', 'prebend', 'pb'],
    short: 'Estirar la cuerda antes de tocarla.',
    summary: 'En un estiramiento previo (*pre-bend*) estiras la cuerda antes de tocarla, así que la nota ya suena alta desde el principio. '
      + 'Se escribe pb, 7pb9, y se dibuja con una flecha vertical antes del número; si después se suelta, 7pb9r7, una flecha baja. '
      + 'Es difícil porque hay que acertar la altura sin oírla: compárala antes con la nota del traste 9.',
    diagram: { type: 'tab', tab: tabFromNotes([{ string: 3, fret: 7, dur: 4, tech: { type: 'prebend', amount: 1, release: true } }]) },
    related: ['bend', 'release'],
  }),
  c({
    id: 'vibrato',
    block: 'tablature',
    title: 'Vibrato (~)',
    aliases: ['vibrato', 'vibrar', '~'],
    short: 'Hacer temblar la nota con pequeños estiramientos.',
    summary: 'El vibrato hace temblar la nota, subiéndola y bajándola un poco y muy deprisa con pequeños [[bend|estiramientos]] del dedo. '
      + 'Se escribe con una ~ detrás del número, 7~, y se dibuja con una línea ondulada encima. '
      + 'Se usa sobre todo en las notas largas, al final de una frase, para que canten.',
    diagram: { type: 'tab', tab: tabFromNotes([{ string: 2, fret: 7, dur: 8, tech: { type: 'vibrato' } }]) },
    related: ['bend'],
  }),
  c({
    id: 'dead-note',
    block: 'tablature',
    title: 'Nota muerta (x)',
    aliases: ['nota muerta', 'nota apagada', 'golpe apagado', 'dead note', 'muted note', 'x'],
    short: 'Un golpe seco, sin altura.',
    summary: 'Una nota muerta suena como un golpe seco, sin altura: apoyas el dedo sobre la cuerda sin pisarla hasta el traste y la tocas. '
      + 'Se escribe con una x en lugar del número. '
      + 'Da ritmo y percusión, sobre todo en el rasgueo y en el funk.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([
        { string: 4, fret: 0, dur: 1, tech: { type: 'dead' } }, { string: 4, fret: 0, dur: 1, tech: { type: 'dead' } },
        { string: 4, fret: 2, dur: 2 },
      ]),
    },
    related: ['ghost-note', 'palm-mute'],
  }),
  c({
    id: 'ghost-note',
    block: 'tablature',
    title: 'Nota fantasma ( )',
    aliases: ['nota fantasma', 'ghost note', 'paréntesis', '( )'],
    short: 'Una nota muy suave, casi sin que se oiga.',
    summary: 'Una nota fantasma se toca muy suave, casi sin que se oiga: más que una nota, es un adorno del ritmo. '
      + 'Se escribe con el número entre paréntesis, (7). '
      + 'Algunas tablaturas usan los paréntesis para otras cosas, como una nota que sigue sonando: fíjate en la leyenda de cada una.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([{ string: 3, fret: 5, dur: 2 }, { string: 3, fret: 7, dur: 1, tech: { type: 'ghost' } }, { string: 3, fret: 5, dur: 1 }]),
    },
    related: ['dead-note'],
  }),
  c({
    id: 'palm-mute',
    block: 'tablature',
    title: 'Apagado con la palma (PM)',
    aliases: ['apagado con la palma', 'palm mute', 'palm muting', 'pm'],
    short: 'Notas cortas y apagadas con el canto de la mano.',
    summary: 'Para apagar con la palma (*palm mute*), apoyas el canto de la mano derecha sobre las cuerdas, justo encima del puente, mientras tocas: el sonido sale corto y apagado. '
      + 'Se escribe PM encima de las notas, con una línea discontinua que marca hasta dónde dura. '
      + 'Es el sonido típico de las guitarras rítmicas del rock.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([0, 0, 0, 0, 2, 2, 0, 0].map((fret) => ({ string: 6, fret, dur: 1 })), { spans: [{ type: 'pm', from: 0, to: 7 }] }),
      bpm: 100,
    },
    related: ['dead-note', 'let-ring'],
  }),
  c({
    id: 'natural-harmonic',
    block: 'tablature',
    title: 'Armónico natural (<12>)',
    aliases: ['armónico', 'armónico natural', 'armónicos', 'harmonic', 'natural harmonic', '<12>'],
    short: 'Un sonido agudo y limpio, rozando la cuerda sobre el traste.',
    summary: 'Un armónico natural es un sonido agudo y limpio, como de campana. '
      + 'Se hace rozando la cuerda justo encima del traste metálico, sin apretar, y levantando el dedo al pulsarla. '
      + 'Se escribe con el número entre < >: <12> suena una [[octave|octava]] más aguda que la cuerda al aire; <7>, una octava y una quinta; y <5>, dos octavas. '
      + 'Los más fáciles son los de los trastes 12, 7 y 5.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([12, 7, 5].map((fret) => ({ string: 3, fret, dur: 4, tech: { type: 'harmonic' } }))),
    },
    related: ['artificial-harmonic', 'octave'],
  }),
  c({
    id: 'artificial-harmonic',
    block: 'tablature',
    title: 'Armónico artificial y pellizcado (AH, PH)',
    aliases: ['armónico artificial', 'armónico pellizcado', 'pinch harmonic', 'artificial harmonic', 'ah', 'ph'],
    short: 'Armónicos sobre una nota pisada.',
    summary: 'Un armónico artificial (AH) se hace sobre una nota pisada: rozas la cuerda 12 trastes más arriba con un dedo de la mano derecha y pulsas con otro, y suena una [[octave|octava]] más aguda. '
      + 'El armónico pellizcado (PH) se hace al pulsar con la púa: el pulgar roza la cuerda justo después y sale un chillido agudo, típico del rock y del metal. '
      + 'Se escriben con AH o PH junto al número, por ejemplo 7 AH o 5 PH. '
      + 'Qué armónico sale en el PH depende del punto exacto en que pulses, así que en la app suena solo aproximado.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([{ string: 3, fret: 7, dur: 4, tech: { type: 'ah' } }, { string: 3, fret: 5, dur: 4, tech: { type: 'ph' } }]),
    },
    related: ['natural-harmonic'],
  }),
  c({
    id: 'tapping',
    block: 'tablature',
    title: 'Tapping (t)',
    aliases: ['tapping', 'tap', 'golpeo', 't'],
    short: 'Pisar una nota de golpe con un dedo de la mano derecha.',
    summary: 'En el *tapping* pisas una nota de golpe con un dedo de la mano derecha, como un [[hammer-on|ligado ascendente]], y la haces sonar sin pulsar. '
      + 'Se escribe con una t junto al número, 12t, y suele encadenarse con ligados hacia notas que pisa la mano izquierda, como 5h8. '
      + 'Golpea con la yema, justo detrás del traste.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes([{ string: 1, fret: 12, dur: 1, tech: { type: 'tap' } }, { string: 1, fret: 5, dur: 1, tech: { type: 'hammer' } }, { string: 1, fret: 8, dur: 2 }]),
    },
    related: ['hammer-on', 'pull-off'],
  }),
  c({
    id: 'trill',
    block: 'tablature',
    title: 'Trino (tr)',
    aliases: ['trino', 'trill', 'tr'],
    short: 'Alternar muy deprisa dos notas con ligados.',
    summary: 'Un trino alterna muy deprisa dos notas de la misma cuerda, con [[hammer-on|ligados ascendentes]] y [[pull-off|descendentes]] seguidos y sin volver a pulsar. '
      + 'Se escribe tr con las dos notas, 5tr7; en la app, tr encima y la nota de destino entre paréntesis. '
      + 'Empieza despacio y a tiempo, y acelera solo cuando salga limpio.',
    diagram: { type: 'tab', tab: tabFromNotes([{ string: 3, fret: 5, dur: 8, tech: { type: 'trill', to: 7 } }]) },
    related: ['hammer-on', 'pull-off'],
  }),
  c({
    id: 'let-ring',
    block: 'tablature',
    title: 'Dejar sonar (let ring)',
    aliases: ['dejar sonar', 'let ring', 'que suene'],
    short: 'Mantener las notas para que suenen unas sobre otras.',
    summary: '«Let ring» significa dejar sonar: mantienes pisadas las notas para que sigan sonando unas sobre otras, en lugar de apagarlas al tocar la siguiente. '
      + 'Se escribe let ring encima de las notas, con una línea discontinua hasta donde dura. '
      + 'Es típico en los arpegios de acordes abiertos.',
    diagram: {
      type: 'tab',
      tab: tabFromNotes(
        [[5, 3], [4, 2], [3, 0], [2, 1], [1, 0], [2, 1], [3, 0], [4, 2]].map(([string, fret]) => ({ string, fret, dur: 1 })),
        { spans: [{ type: 'letring', from: 0, to: 7 }] },
      ),
    },
    related: ['palm-mute', 'open-chord'],
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
      + 'y prueba la voz y el pulso.',
  },
  lesson: {
    title: 'Aprender',
    text: 'La lección va en tarjetas cortas, con una idea en cada una. '
      + 'Pasa de una a otra con «Siguiente» y «Anterior», o deslizando el dedo. '
      + 'Toca los puntos del mástil para oírlos y las palabras subrayadas para ver su ficha. '
      + 'Al llegar a la última tarjeta, la lección queda marcada como completada.',
  },
  referenceNotes: {
    title: 'Consulta',
    text: 'El mástil con todas las notas, de la [[open-string|cuerda al aire]] al traste 12. '
      + 'Elige una nota arriba para ver solo esa (por ejemplo, todas las posiciones de una misma nota) o «Todas» para verlas todas. '
      + 'Toca cualquier punto para oírlo.',
    concepts: ['natural-notes', 'octave', 'unison'],
  },
  referenceChords: {
    title: 'Consulta',
    text: 'La biblioteca de [[open-chord|acordes abiertos]]. Elige uno arriba para ver su [[chord-diagram|diagrama]] y sus notas, coloreadas según su función: '
      + '[[root|fundamental]], [[chord-third|3ª]], 5ª y 7ª. Escúchalo rasgueado o arpegiado, y activa «Ver en el mástil» para verlo sobre el mástil. '
      + 'Toca un punto para oír esa nota.',
    concepts: ['chord', 'chord-diagram', 'chord-third'],
  },
  progressions: {
    title: 'Mis progresiones',
    text: 'Una [[progression|progresión]] es una serie de acordes que se repite. Las predefinidas se calculan por grados. '
      + 'En «Mis progresiones» puedes guardar las tuyas, de 3 a 5 acordes de la biblioteca, con el nombre que quieras: se guardan al momento y van en la copia que exportas.',
    concepts: ['progression', 'chord-changes'],
  },
  soon: {
    title: 'Próximamente',
    text: 'Esta parte aún no está construida: la app se construye por fases. Mientras tanto, todo lo demás funciona.',
  },
});

// Textos de "¿Qué nota es?": también los usan Contrarreloj y Rellena el mástil.
const POSITION_NOTE = Object.freeze({
  feedbackWrong: 'No es {{pc:%chosen%}}: es {{pc:%answer%}} (%string%ª cuerda, traste %fret%).',
  feedbackTimeout: 'Se acabó el tiempo: es {{pc:%answer%}} (%string%ª cuerda, traste %fret%).',
  whyOpen: 'Es la [[open-string|cuerda al aire]]: en esta afinación, la %string%ª cuerda al aire suena {{pc:%answer%}}.',
  whyFretted: 'En esta afinación, la %string%ª cuerda al aire es {{pc:%open%}}. '
    + 'Cada [[fret|traste]] sube un [[semitone-tone|semitono]], así que en el traste %fret% suena {{pc:%answer%}}.',
  whyChosen: ' {{pc:%chosen%}} estaría en el traste %chosenFret% de esa cuerda.',
  whyChosenOpen: ' {{pc:%chosen%}} es esa cuerda al aire (traste 0).',
  missLabel: '%string%ª cuerda · traste %fret%',
});

// Textos de "esta nota en esta cuerda" (Encuéntrala y Todas en una cuerda).
const NOTE_ON_STRING = Object.freeze({
  missLabel: '{{pc:%note%}} en la %string%ª cuerda',
  feedbackTimeout: 'Se acabó el tiempo: {{pc:%note%}} está en la %string%ª cuerda, %where%.',
  feedbackWrongString: 'Has tocado la %chosenString%ª cuerda: se pedía {{pc:%note%}} en la %string%ª (%where%).',
  feedbackWrong: 'En el traste %chosenFret% suena {{pc:%chosen%}}. {{pc:%note%}} está en la %string%ª cuerda, %where%.',
  whyOpen: 'La %string%ª cuerda al aire ya es {{pc:%note%}}: traste 0.',
  whyFretted: 'La %string%ª cuerda al aire es {{pc:%open%}}. Cada [[fret|traste]] sube un [[semitone-tone|semitono]]: '
    + 'contando desde ahí, {{pc:%note%}} cae en el traste %fret%.',
  whyOctave: ' Doce trastes más allá, en el traste %fret%, vuelve a sonar una [[octave|octava]] más aguda.',
  whyString: ' Fíjate en el número de la [[string-numbers|cuerda]]: la 1ª es la más fina y aguda, y la 6ª, la más gruesa y grave.',
});

// Etiqueta de fallo con la forma de un acorde ("¿Qué acorde es?" y "¿Mayor o menor?").
const CHORD_SHAPE = Object.freeze({ missLabel: 'Trastes %shape%' });

/**
 * Textos de cada ejercicio (BUILD_PLAN 6.8 y 7.1): howTo ("Cómo se juega") y las plantillas
 * con las que se genera la consigna, la corrección y el "¿Por qué?" a partir de las reglas.
 * Las plantillas usan %variable% (js/core/glossary.js, fillTemplate) y el marcado de siempre;
 * {{pc:%answer%}} escribe la nota con la preferencia ♯/♭ del usuario.
 */
export const EXERCISE_TEXTS = Object.freeze({
  // ----- Notas del mástil: Teoría -----
  'notas.teoria.que-nota': Object.freeze({
    prompt: '¿Qué nota es?',
    howTo: 'Se marca un punto del mástil con un «?». Elige qué nota suena en ese [[fret|traste]]. '
      + 'Si aciertas, pasa sola a la siguiente; si fallas, verás la corrección y el «¿Por qué?». '
      + 'Básico: solo [[natural-notes|notas naturales]], del traste 0 al 5, en las cuerdas que elijas, y sin tiempo. '
      + 'Intermedio: todas las cuerdas y notas, del traste 0 al 12, con 10 segundos por pregunta. Avanzado: 5 segundos.',
    ...POSITION_NOTE,
  }),
  'notas.teoria.contrarreloj': Object.freeze({
    howTo: 'Tienes 60 segundos para responder todas las preguntas de «¿Qué nota es?» que puedas. '
      + 'Al acertar pasa enseguida a la siguiente; al fallar ves la correcta un momento y sigue, porque el reloj no se para. '
      + 'Los fallos los repasas en el resumen. Tu récord es el número de aciertos en cada nivel. '
      + 'Los niveles cambian los trastes, las cuerdas y las notas, como en «¿Qué nota es?».',
  }),
  'notas.teoria.encuentrala': Object.freeze({
    prompt: 'Toca {{pc:%note%}} en la %string%ª cuerda',
    howTo: 'Te piden una nota en una [[string-numbers|cuerda]]. Tócala en el mástil, en esa cuerda. '
      + 'Si la nota está dos veces (al aire y en el traste 12, que es su [[octave|octava]]), vale cualquiera de las dos. '
      + 'Básico: [[natural-notes|naturales]], del traste 0 al 5, en las cuerdas que elijas, y sin tiempo. '
      + 'Intermedio: todas las cuerdas y notas, del traste 0 al 12, con 10 segundos. Avanzado: 5 segundos.',
    ...NOTE_ON_STRING,
  }),
  'notas.teoria.todas-en-una-cuerda': Object.freeze({
    prompt: 'Toca todos los {{pc:%note%}} de la %string%ª cuerda',
    howTo: 'Te piden una nota y una [[string-numbers|cuerda]]. Toca todas las veces que sale esa nota en la cuerda, del traste 0 al 12: '
      + 'cada acierto se pone en verde. Una nota se repite cada 12 trastes (su [[octave|octava]]), así que la nota de la cuerda al aire sale dos veces. '
      + 'Si tocas un traste equivocado, la pregunta cuenta como fallo y ves la solución. '
      + 'Básico: [[natural-notes|naturales]] en las cuerdas que elijas, sin tiempo. '
      + 'Intermedio: todas las cuerdas y notas, con 10 segundos por posición. Avanzado: 5 segundos.',
    ...NOTE_ON_STRING,
  }),
  'notas.teoria.octavas': Object.freeze({
    prompt: 'Toca una octava de esta nota',
    howTo: 'Se marca una nota en el mástil. Toca una de sus [[octave|octavas]] con una [[octave-shapes|forma de octava]]: '
      + 'desde la 6ª o la 5ª cuerda, dos cuerdas hacia la 1ª y dos trastes más allá; desde la 4ª o la 3ª, tres trastes más allá; '
      + 'o al revés, hacia las cuerdas graves. La 6ª y la 1ª cuerda en el mismo traste también valen (dos octavas). '
      + 'La misma nota en otro sitio que no sea una forma de octava no cuenta. '
      + 'Básico: [[natural-notes|naturales]] del traste 0 al 5, en las cuerdas que elijas, y sin tiempo. '
      + 'Intermedio: todas las cuerdas y notas, del traste 0 al 12, con 10 segundos. Avanzado: 5 segundos.',
    missLabel: '{{pc:%note%}} · %string%ª cuerda, traste %fret%',
    feedbackWrong: 'Esa no es una forma de octava. Desde la %string%ª cuerda, traste %fret%, valen: %targets%.',
    feedbackTimeout: 'Se acabó el tiempo. Desde la %string%ª cuerda, traste %fret%, valen: %targets%.',
    whyRule: 'Formas de octava: desde la 6ª y la 5ª cuerda, dos cuerdas hacia la 1ª y 2 trastes más; desde la 4ª y la 3ª, 3 trastes más, '
      + 'porque la forma cruza la pareja de la 3ª y la 2ª ([[five-fret-rule|regla de los 5 trastes]]). Hacia las cuerdas graves, se restan.',
    whySame: ' Has tocado la propia nota marcada.',
    whyUnison: ' Has tocado su [[unison|unísono]]: la misma nota exacta, no su octava.',
    whySameNote: ' Has tocado {{pc:%chosen%}}, la misma nota a otra altura, pero no con una forma de octava.',
    whyOther: ' Has tocado {{pc:%chosen%}}, que es otra nota.',
  }),
  'notas.teoria.unisonos': Object.freeze({
    prompt: 'Toca su unísono en la %target%ª cuerda',
    promptAll: 'Toca todos sus unísonos',
    howTo: 'Se marca un punto en el mástil. Busca su [[unison|unísono]]: la misma nota exacta, a la misma altura, en otra cuerda. '
      + 'Básico: el punto está en la 5ª o la 4ª cuerda y el unísono, en la cuerda grave de al lado: '
      + 'en [[standard-tuning|afinación estándar]], 5 trastes más allá ([[five-fret-rule|regla de los 5 trastes]]). '
      + 'Intermedio: cualquier cuerda, hacia la de al lado en las dos direcciones, incluida la pareja de la 3ª y la 2ª, con 10 segundos. '
      + 'Avanzado: todos los unísonos del punto entre los trastes 0 y 15, con 5 segundos por unísono. '
      + 'Funciona en cualquier [[tuning|afinación]]: la app calcula las notas a partir de ella.',
    missLabel: '{{pc:%note%}} · %string%ª cuerda, traste %fret%',
    feedbackWrong: 'No es ese. El unísono está en la %answers%.',
    feedbackTimeout: 'Se acabó el tiempo. El unísono está en la %answers%.',
    feedbackWrongAll: 'No es ese. Sus unísonos están en: %answers%.',
    feedbackTimeoutAll: 'Se acabó el tiempo. Sus unísonos están en: %answers%.',
    whyPoint: 'El punto es {{pc:%note%}} (%string%ª cuerda, traste %fret%). ',
    whyAll: 'Sus unísonos son todas las posiciones a la misma altura: %answers%. '
      + 'Cuanto más grave es una cuerda al aire, más trastes hay que pisar para llegar a esa nota.',
    whyLower: 'La %target%ª cuerda al aire suena %gap% [[semitone-tone|semitonos]] más grave que la %string%ª: '
      + 'para llegar a la misma nota hay que pisar %gap% trastes más, en el traste %answerFret%.',
    whyHigher: 'La %target%ª cuerda al aire suena %gap% [[semitone-tone|semitonos]] más aguda que la %string%ª: '
      + 'hacen falta %gap% trastes menos, así que la misma nota está en el traste %answerFret%.',
    whyChosenOctave: ' Lo que has tocado es {{pc:%chosen%}}, el mismo nombre pero a otra altura: es una [[octave|octava]], no un unísono.',
    whyChosenOther: ' En lo que has tocado suena {{pc:%chosen%}}.',
  }),
  'notas.teoria.rellena': Object.freeze({
    prompt: 'Rellena la %string%ª cuerda',
    promptTwo: 'Rellena la %a%ª y la %b%ª cuerda',
    howTo: 'Una cuerda vacía, del traste 0 al 12. Toca una casilla vacía y elige su nota en el teclado de abajo. '
      + 'Acierto en verde ✓; fallo en rojo ✗, con la nota correcta, el altavoz y el «¿Por qué?». '
      + 'Se cronometra y, si terminas sin fallos, se guarda tu mejor tiempo por cuerda y nivel. '
      + 'Básico: la 6ª o la 5ª cuerda, solo las [[natural-notes|naturales]], con los trastes 0, 5, 7 y 12 ya puestos. '
      + 'Intermedio: cualquier cuerda y todas las notas, con solo el traste 0 puesto (la [[open-string|cuerda al aire]]). '
      + 'Avanzado: sin pistas, a veces con dos cuerdas a la vez, y contrarreloj: 60 segundos por cuerda (90 con dos).',
    ...POSITION_NOTE,
  }),

  // ----- Notas del mástil: Práctica -----
  'notas.practica.todas-las-cuerdas': Object.freeze({
    howTo: 'La app dice una nota en voz alta. Tócala en las seis cuerdas, de la 6ª a la 1ª, antes de que acabe la cuenta atrás; '
      + 'los círculos de abajo se iluminan para marcarte el ritmo. '
      + 'Al acabarse el tiempo verás dónde estaba en cada cuerda (del traste 0 al 12) y la app pasa sola a la siguiente. '
      + '«Ver posiciones» te las enseña antes. Son 12 notas. '
      + 'Básico: solo [[natural-notes|naturales]], con 20 segundos por nota. Intermedio: todas las notas, con 12 segundos. Avanzado: 7 segundos.',
    instruction: 'Tócala en las 6 cuerdas',
  }),
  'notas.practica.cuerda-a-cuerda': Object.freeze({
    howTo: 'Eliges una [[string-numbers|cuerda]] en la preparación, o «Al azar». La app dice notas una a una y las tocas en esa cuerda '
      + 'antes de que acabe la cuenta atrás. Al acabarse el tiempo ves dónde estaba y pasa sola a la siguiente. Son 12 notas. '
      + 'Básico: [[natural-notes|naturales]] del traste 0 al 5, con 20 segundos. '
      + 'Intermedio: todas las notas, del traste 0 al 12, con 12 segundos. Avanzado: 7 segundos.',
    instruction: 'En la %string%ª cuerda',
  }),
  'notas.practica.paseo-octavas': Object.freeze({
    howTo: 'La app dice una nota y una cuerda. Tócala en esa cuerda y después su [[octave|octava]], con una [[octave-shapes|forma de octava]]. '
      + 'Al acabarse el tiempo verás la nota y sus octavas, marcadas con un 8, y pasa sola a la siguiente. Son 12 notas. '
      + 'Básico: [[natural-notes|naturales]] del traste 0 al 5, en la 6ª y la 5ª cuerda (o las que elijas), con 20 segundos. '
      + 'Intermedio: todas las cuerdas y notas, del traste 0 al 12, con 12 segundos. Avanzado: 7 segundos.',
    instruction: 'En la %string%ª cuerda, y después su octava',
    legend: 'En ámbar, la nota en esa cuerda; los puntos con un 8 son sus octavas.',
    speechEs: '%note%, %string% cuerda, y su octava',
    speechEn: '%note%, string %string%, and its octave',
  }),
  'notas.practica.unisonos': Object.freeze({
    howTo: 'La app dice un punto del mástil, por ejemplo «6ª cuerda, traste 7». Tócalo y después su [[unison|unísono]]: '
      + 'la misma nota exacta en otra cuerda. Al acabarse el tiempo verás los dos puntos y sonarán uno tras otro, para que oigas que son iguales. '
      + 'Básico: el punto está en la 5ª o la 4ª cuerda y el unísono, en la cuerda grave de al lado, con 20 segundos. '
      + 'Intermedio: cualquier cuerda, hacia la de al lado en las dos direcciones, con 12 segundos. '
      + 'Avanzado: todos sus unísonos entre los trastes 0 y 15, con 7 segundos. Son 12 puntos. '
      + 'Funciona en cualquier [[tuning|afinación]].',
    point: '%string%ª cuerda · traste %fret%',
    instruction: 'Tócalo y después su unísono en la %target%ª cuerda',
    instructionAll: 'Tócalo y después todos sus unísonos',
    legend: 'En ámbar, el punto de la consigna; en gris, la misma nota exacta en otra cuerda.',
    speechEs: '%string% cuerda, traste %fret%',
    speechEn: 'string %string%, fret %fret%',
  }),

  // ----- Acordes abiertos: Teoría -----
  'acordes.teoria.que-acorde': Object.freeze({
    prompt: '¿Qué acorde es?',
    howTo: 'Ves el [[chord-diagram|diagrama]] de un acorde, sin su nombre, y eliges cuál es entre 4 opciones. '
      + 'Fíjate en la nota más grave, que en los [[open-chord|acordes abiertos]] es la [[root|fundamental]], y en la [[chord-third|3ª]], que dice si es mayor o menor. '
      + 'Básico: los 8 acordes básicos, sin tiempo. '
      + 'Intermedio: además, {{chord:F-mini}} y los acordes de [[dominant-seventh|séptima]], con 15 segundos. '
      + 'Avanzado: también {{chord:F-barre}}, con 8 segundos.',
    ...CHORD_SHAPE,
    feedbackWrong: 'No es {{chord:%chosen%}}: es {{chord:%chord%}}.',
    feedbackTimeout: 'Se acabó el tiempo: es {{chord:%chord%}}.',
    whyName: 'Es {{chord:%chord%}}: suenan %tones%. ',
    whyChosen: ' {{chord:%chosen%}} tendría %chosenTones%.',
    whySameRoot: ' Tienen la misma fundamental: los distingue la 3ª.',
  }),
  'acordes.teoria.construyelo': Object.freeze({
    prompt: 'Construye {{chord:%chord%}}',
    howTo: 'Te piden un acorde: constrúyelo en el diagrama vacío. '
      + 'Toca una casilla para poner un punto en ese [[fret|traste]] (otra vez, para quitarlo), y toca encima de la cejuela para marcar cada cuerda al aire (o) o sin tocar (×); todas empiezan al aire. '
      + 'Cuando lo tengas, pulsa «Comprobar». No hace falta indicar los dedos. '
      + 'Básico: los 8 acordes básicos, sin tiempo. '
      + 'Intermedio: además, {{chord:F-mini}} y los de [[dominant-seventh|séptima]], con 30 segundos. '
      + 'Avanzado: también {{chord:F-barre}}, con 20 segundos.',
    missLabel: '{{chord:%chord%}}',
    feedbackWrong: 'Así no es. {{chord:%chord%}} se toca así: %shape% (de la 6ª cuerda a la 1ª).',
    feedbackTimeout: 'Se acabó el tiempo. {{chord:%chord%}} se toca así: %shape% (de la 6ª cuerda a la 1ª).',
    whyTones: '{{chord:%chord%}} tiene las notas %tones%.',
    whyString: ' En la %string%ª cuerda va %expected%, y has puesto %got%.',
    stringOpen: 'al aire (o)',
    stringMuted: 'sin tocar (×)',
    stringFret: 'el traste %fret% (%note%)',
  }),
  'acordes.teoria.que-notas': Object.freeze({
    prompt: '¿Qué %count% notas tiene {{chord:%chord%}}?',
    howTo: 'Ves un acorde con su diagrama. Elige en el teclado todas sus notas (3 en las [[triad|tríadas]] y 4 en los acordes de [[dominant-seventh|séptima]]) y pulsa «Comprobar». '
      + 'Da igual el orden y en qué cuerdas suenen. '
      + 'Truco: la [[root|fundamental]] da nombre al acorde; la [[chord-third|3ª]] está a 3 o 4 [[semitone-tone|semitonos]] de ella, y la 5ª, a 7. '
      + 'Básico: los 8 acordes básicos, sin tiempo. '
      + 'Intermedio: además, {{chord:F-mini}} y las séptimas, con 30 segundos. Avanzado: también {{chord:F-barre}}, con 20 segundos.',
    missLabel: 'Notas de {{chord:%chord%}}',
    feedbackWrong: '{{chord:%chord%}} tiene %tones%.',
    feedbackTimeout: 'Se acabó el tiempo. {{chord:%chord%}} tiene %tones%.',
    whyTriad: 'Su fundamental es %root%; la 3ª, %third%, está a %thirdSemis% semitonos (3ª %thirdKind%); y la 5ª, %fifth%, a 7.',
    whySeventh: ' Además lleva la 7ª, %seventh%, a 10 semitonos.',
    whyExtra: ' Sobra: %list%.',
    whyMissing: ' Falta: %list%.',
    thirdMajor: 'mayor',
    thirdMinor: 'menor',
  }),
  'acordes.teoria.mayor-menor': Object.freeze({
    prompt: '¿Mayor o menor?',
    howTo: 'Ves el diagrama de un acorde, sin su nombre, y decides si es mayor o menor. '
      + 'Busca la [[root|fundamental]] (la nota más grave) y su [[chord-third|3ª]]: a 4 [[semitone-tone|semitonos]], mayor; a 3, menor. '
      + 'Desde Intermedio hay una tercera opción, [[dominant-seventh|séptima de dominante]]: un acorde mayor con la 7ª menor añadida. '
      + 'Básico: los 8 acordes básicos, sin tiempo. Intermedio: además, {{chord:F-mini}} y las séptimas, con 15 segundos. '
      + 'Avanzado: también {{chord:F-barre}}, con 8 segundos.',
    ...CHORD_SHAPE,
    feedbackWrong: 'No es %chosen%: es %answer%. Es {{chord:%chord%}}.',
    feedbackTimeout: 'Se acabó el tiempo: es %answer%. Es {{chord:%chord%}}.',
    whyMajor: 'La fundamental es %root% (la nota más grave). Su 3ª, %third%, está a 4 semitonos: es una 3ª mayor, así que el acorde es mayor.',
    whyMinor: 'La fundamental es %root% (la nota más grave). Su 3ª, %third%, está a 3 semitonos: es una 3ª menor, así que el acorde es menor.',
    whyDom7: 'La fundamental es %root% (la nota más grave). Su 3ª, %third%, está a 4 semitonos (3ª mayor), y además suena %seventh%, la 7ª menor, a 10 semitonos: es un acorde de séptima de dominante.',
    whyWhere: ' En el diagrama, la 3ª suena en la %string%ª cuerda.',
  }),
  'acordes.teoria.nota-falta': Object.freeze({
    prompt: 'En {{chord:%chord%}}, ¿qué nota va en el «?»?',
    howTo: 'Ves el diagrama de un acorde con su nombre, pero a una cuerda le falta el punto: en su lugar hay un «?». Elige qué nota suena ahí. '
      + 'Cuenta desde la [[open-string|cuerda al aire]]: cada [[fret|traste]] sube un [[semitone-tone|semitono]]. Pista: tiene que ser una nota del acorde. '
      + 'Básico: los 8 acordes básicos, sin tiempo. Intermedio: además, {{chord:F-mini}} y las séptimas, con 15 segundos. '
      + 'Avanzado: también {{chord:F-barre}}, con 8 segundos.',
    missLabel: '{{chord:%chord%}} · %string%ª cuerda',
    feedbackWrong: 'No es {{pc:%chosen%}}: es %answer% (%string%ª cuerda, traste %fret%).',
    feedbackTimeout: 'Se acabó el tiempo: es %answer% (%string%ª cuerda, traste %fret%).',
    why: 'La %string%ª cuerda al aire es {{pc:%open%}}; %fret% %frets% más arriba suena %answer%, que es %function% de {{chord:%chord%}}.',
    fretOne: 'traste',
    fretMany: 'trastes',
    whyChosenTone: ' {{pc:%chosen%}} también es del acorde, pero suena en otra cuerda.',
    whyChosenOther: ' {{pc:%chosen%}} no es del acorde.',
  }),

  // ----- Acordes abiertos: Práctica -----
  'acordes.practica.cambios': Object.freeze({
    howTo: 'Elige una [[progression|progresión]]: una predefinida o una tuya («Mis progresiones»). '
      + 'La app enseña el acorde actual en grande, con su diagrama, y el siguiente en pequeño. '
      + 'Toca cada acorde al ritmo del [[metronome|metrónomo]] y cambia cuando toque: el último tiempo antes del cambio se marca en ámbar. '
      + 'La progresión se repite hasta que acabe la duración. '
      + 'Básico: 60 BPM, cambio cada 8 tiempos. Intermedio: 80 BPM, cada 4. Avanzado: 100 BPM, cada 2.',
  }),
  'acordes.practica.un-minuto': Object.freeze({
    howTo: 'Elige dos acordes y pasa de uno a otro tan rápido como puedas durante 60 segundos, tocando cada vez el acorde completo. '
      + 'Al acabar, anota cuántos cambios has hecho: cada paso de un acorde al otro cuenta uno. '
      + 'Se guarda tu récord para cada pareja, en cualquier orden. '
      + 'El nivel decide qué acordes puedes elegir: los 8 básicos; además, {{chord:F-mini}} y las séptimas; o también {{chord:F-barre}}.',
    countTitle: '¿Cuántos cambios has hecho?',
    countHint: 'Cada paso de un acorde al otro cuenta uno.',
    go: 'Ya',
  }),
  'acordes.practica.acorde-cantado': Object.freeze({
    howTo: 'La app dice un acorde en voz alta y lo enseña en grande. Tócalo antes de que acabe la cuenta atrás: al acabar verás su diagrama, y pasa sola al siguiente. '
      + 'Con «Mostrar diagramas» desactivado solo ves el nombre, para comprobar que te lo sabes de memoria. Son 12 acordes. '
      + 'Básico: los 8 básicos, con 12 segundos. Intermedio: además, {{chord:F-mini}} y las séptimas, con 8 segundos. '
      + 'Avanzado: también {{chord:F-barre}}, con 5 segundos.',
    instruction: 'Tócalo',
  }),
  'acordes.practica.rasgueo': Object.freeze({
    howTo: 'Elige una [[progression|progresión]] y un [[strumming|patrón de rasgueo]]: 8 casillas con ↓ (abajo), ↑ (arriba) o · (sin golpe). '
      + 'Puedes oírlo antes con «Escuchar el patrón». '
      + 'Durante el ejercicio, la casilla que toca se ilumina al ritmo del [[metronome|metrónomo]]: recuerda la regla del péndulo. '
      + 'Básico: 60–70 BPM y cambio de acorde cada 2 compases. Intermedio: 70–90 BPM y cambio en cada compás. '
      + 'Avanzado: 90–110 BPM, con patrones con [[accent|acento]] y con [[swing|swing]].',
  }),

  // ----- Calentamiento -----
  'calentamiento.practica.cromatico': Object.freeze({
    howTo: 'Un dedo por traste, de la 6ª cuerda a la 1ª y vuelta, en la posición que elijas (desde el traste 1 o desde el 5), con la [[tablature|tablatura]] en pantalla y [[metronome|metrónomo]]. '
      + 'La nota que toca se ilumina en ámbar. El tempo sube 4 BPM en cada vuelta completa (ida y vuelta) en Básico, y cada 2 vueltas en el resto; «Bajar» resta 8 BPM y detiene la subida. '
      + 'Tu récord es el tempo más alto al que terminas una vuelta entera, para cada variante y nivel. '
      + 'Básico: negras, con 1-2-3-4, desde 60 BPM. Intermedio: corcheas, con 4-3-2-1 y 1-3-2-4 además, desde 70. '
      + 'Avanzado: semicorcheas y también la araña (dedos 1 y 3 en una cuerda y 2 y 4 en la de al lado), desde 80.',
  }),
});

/** Piezas de texto de las posiciones y números de cuerda hablados (ejercicios de Notas). */
export const NOTES_TEXTS = Object.freeze({
  positions: Object.freeze({
    position: '%string%ª cuerda, traste %fret%',
    fretOne: 'traste %fret%',
    fretMany: 'trastes %list% y %last%',
    listOr: '%list%; o %last%',
    listAnd: '%list%; y %last%',
  }),
  spokenOrdinals: Object.freeze({ 1: 'primera', 2: 'segunda', 3: 'tercera', 4: 'cuarta', 5: 'quinta', 6: 'sexta' }),
});

/**
 * Lecciones de Aprender (BUILD_PLAN 6.6.4), por módulo: de 3 a 6 tarjetas con una idea cada
 * una (título y texto con marcado) y su esquema (mismo formato que los de los conceptos).
 */
export const LESSONS = Object.freeze({
  notas: Object.freeze({
    cards: Object.freeze([
      Object.freeze({
        id: 'semitonos',
        title: 'Cada traste, un semitono',
        text: 'Las notas del mástil van siempre en el mismo orden. Cada [[fret|traste]] sube la nota un [[semitone-tone|semitono]]. '
          + 'Si recorres una cuerda desde el aire, pasas por las 12 notas, una tras otra. Toca los puntos para oírlas.',
        diagram: { type: 'fretboard', fromFret: 0, toFret: 11, points: { select: 'string', string: 5 } },
      }),
      Object.freeze({
        id: 'naturales',
        title: 'Las 7 notas naturales',
        text: 'Siete de esas notas son las [[natural-notes|notas naturales]]: {{C}}, {{D}}, {{E}}, {{F}}, {{G}}, {{A}} y {{B}}. '
          + 'Son las que no llevan [[sharp-flat|sostenido ni bemol]]. '
          + 'Aquí las tienes en la 6ª y la 5ª cuerda, las que más se usan para buscar notas.',
        diagram: { type: 'fretboard', fromFret: 0, toFret: 12, points: { select: 'naturals', strings: [6, 5] } },
      }),
      Object.freeze({
        id: 'mi-fa-si-do',
        title: 'Dos parejas a un solo traste',
        text: 'Entre dos naturales seguidas suele haber un [[semitone-tone|tono]]: dos trastes. '
          + 'Solo hay dos parejas a un semitono, un traste: {{E}}–{{F}} y {{B}}–{{C}}. '
          + 'Por eso entre ellas no hay ninguna otra nota.',
        diagram: {
          type: 'fretboard', fromFret: 0, toFret: 12, points: { select: 'naturals', strings: [5] }, highlight: 'natural-semitones',
          caption: 'En ámbar, {{B}}–{{C}} y {{E}}–{{F}}: en la 5ª cuerda, cada pareja en trastes vecinos.',
        },
      }),
      Object.freeze({
        id: 'alteraciones',
        title: 'Las notas de en medio',
        text: 'En los huecos de un tono queda una nota en medio. '
          + 'Se nombra a partir de una natural vecina: con [[sharp-flat|sostenido]] (♯), que sube un semitono la de abajo, o con bemol (♭), que baja un semitono la de arriba. '
          + 'Por ejemplo, {{F#}} y {{Gb}} son la misma nota con dos nombres: son [[enharmonic|enarmónicos]].',
        diagram: {
          type: 'fretboard', fromFret: 0, toFret: 12, points: { select: 'string', string: 5 }, highlight: 'accidentals',
          caption: 'En ámbar, las notas con sostenido o bemol: cada una está entre dos naturales separadas por un tono.',
        },
      }),
      Object.freeze({
        id: 'traste-12',
        title: 'El traste 12: vuelta a empezar',
        text: 'Después de 12 semitonos la nota se repite, más aguda: es su [[octave|octava]]. '
          + 'Por eso, en cada cuerda, el traste 12 da la misma nota que la [[open-string|cuerda al aire]], y a partir de ahí el mástil se repite. '
          + 'La marca doble del traste 12 te lo recuerda.',
        diagram: { type: 'fretboard', fromFret: 0, toFret: 12, points: { select: 'frets', frets: [0, 12] } },
      }),
      Object.freeze({
        id: 'formas-de-octava',
        title: 'Formas de octava',
        text: 'Para encontrar una octava sin contar trastes, usa las [[octave-shapes|formas de octava]]. '
          + 'Desde la 6ª o la 5ª cuerda: dos cuerdas hacia la 1ª y dos trastes más allá. '
          + 'Desde la 4ª o la 3ª: tres trastes más allá, porque la forma cruza la pareja de la 3ª y la 2ª ([[five-fret-rule|regla de los 5 trastes]]).',
        diagram: {
          type: 'fretboard', fromFret: 0, toFret: 8, points: { select: 'octaves', string: 6, fret: 3 }, highlight: 'start',
          caption: 'Desde el punto ámbar (6ª cuerda, traste 3): 4ª cuerda, traste 5; 2ª, traste 8; y 1ª, traste 3.',
        },
      }),
    ]),
  }),
  acordes: Object.freeze({
    cards: Object.freeze([
      Object.freeze({
        id: 'acorde',
        title: 'Qué es un acorde',
        text: 'Un [[chord|acorde]] son varias notas distintas que suenan a la vez. '
          + 'El más sencillo es la [[triad|tríada]]: tres notas, que en la guitarra se reparten por varias cuerdas. '
          + 'Toca el diagrama para oír {{chord:C}} rasgueado, o cada punto para oír su nota.',
        diagram: { type: 'chord', chord: 'C', colorBy: 'function' },
      }),
      Object.freeze({
        id: 'fundamental',
        title: 'La fundamental',
        text: 'La [[root|fundamental]] es la nota que da nombre al acorde: en {{chord:G}}, {{G}}. '
          + 'En los [[open-chord|acordes abiertos]] es la nota más grave, así que la encontrarás en la cuerda más gruesa que suena. '
          + 'En los esquemas se pinta en rojo coral.',
        diagram: { type: 'chord', chord: 'G', colorBy: 'function' },
      }),
      Object.freeze({
        id: 'tercera',
        title: 'La 3ª decide: mayor o menor',
        text: 'Además de la fundamental, la tríada tiene una [[chord-third|3ª]] y una 5ª. '
          + 'Si la 3ª está a 4 [[semitone-tone|semitonos]] de la fundamental, el acorde es mayor; si está a 3, es menor. '
          + '{{chord:E}} y {{chord:Em}} solo se diferencian en esa nota: {{G#}} pasa a ser {{G}}.',
        diagram: { type: 'chord', chord: 'E', compare: 'Em', colorBy: 'function' },
      }),
      Object.freeze({
        id: 'otra-pareja',
        title: 'Mayor y menor, otra vez',
        text: 'Lo mismo pasa con {{chord:A}} y {{chord:Am}}: la 3ª baja un semitono, de {{C#}} a {{C}}. '
          + 'En el diagrama solo cambia la 2ª cuerda, del traste 2 al 1, aunque los dedos se colocan de otra forma. '
          + 'Escucha los dos y compara: el mayor suele sonar más luminoso, y el menor, más triste.',
        diagram: { type: 'chord', chord: 'A', compare: 'Am', colorBy: 'function' },
      }),
      Object.freeze({
        id: 'quinta-septima',
        title: 'La 5ª y la 7ª',
        text: 'La 5ª está a 7 semitonos de la fundamental, tanto en los acordes mayores como en los menores. '
          + 'Si a un acorde mayor le añades la 7ª menor, a 10 semitonos, tienes un acorde de [[dominant-seventh|séptima de dominante]], como {{chord:A7}}. '
          + 'Con esto ya puedes leer cualquier [[chord-diagram|diagrama de acorde]] y saber qué notas tiene.',
        diagram: { type: 'chord', chord: 'A', compare: 'A7', colorBy: 'function' },
      }),
    ]),
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
    missTapped: '%correct% (tocaste %chosen%)',
    missTimeout: '%correct% (se acabó el tiempo)',
    paused: 'En pausa',
    pausedHint: 'Toca «Seguir» para continuar. Mientras tanto, puedes ver la ayuda.',
    newRecord: 'Nuevo récord',
    getReady: 'Prepárate:',
    fillTime: 'Tiempo',
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
    setup: 'Ir al ejercicio',
  }),
  // Acordes (Fase 3).
  chordQualities: Object.freeze({ major: 'Mayor', minor: 'Menor', dom7: 'Séptima de dominante' }),
  chordFunctions: Object.freeze({ root: 'la fundamental', third: 'la 3ª', fifth: 'la 5ª', seventh: 'la 7ª' }),
  chordPractice: Object.freeze({
    next: 'Siguiente',
    showDiagrams: 'Mostrar diagramas',
    showDiagramsHint: 'Desactivado, solo ves los nombres.',
    check: 'Comprobar',
    slowDown: 'Bajar',
    rampStopped: 'Subida de tempo detenida',
    listenPattern: 'Escuchar el patrón',
    stopPattern: 'Parar',
    newProgression: 'Nueva',
    editProgression: 'Editar',
    deleteProgression: 'Borrar',
    deleteTitle: '¿Borrar esta progresión?',
    deleteText: 'Se borrará de «Mis progresiones». No se puede deshacer.',
    editorTitle: 'Mis progresiones',
    howMany: 'Cuántos acordes',
    nameLabel: 'Nombre',
    namePlaceholder: 'Por ejemplo, Blues o Country',
    pickChord: 'Elige un acorde',
    save: 'Guardar',
    emptyCustom: 'Aún no has guardado ninguna. Toca «Nueva» para crear la tuya.',
    presets: 'Predefinidas',
    custom: 'Mis progresiones',
    pairFirst: 'Primer acorde',
    pairSecond: 'Segundo acorde',
    countSave: 'Guardar',
    record: 'Récord',
    noRecord: 'Aún sin récord',
    lapMax: 'Vuelta más rápida',
  }),
  hints: {
    notation: 'La otra se ve en pequeño. Ejemplo:',
    accidentals: 'Para las notas del mástil, fuera de una tonalidad.',
    theme: 'Automático sigue al del sistema.',
    orientation: 'Auto: vertical con el móvil en vertical.',
    voice: 'La app dice en voz alta la nota o el acorde.',
    defaultTuning: 'Con la que empiezan los ejercicios que la admiten.',
    dev: 'Para probar el mástil, el sonido, la voz y el pulso.',
  },
});
