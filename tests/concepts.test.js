// Conceptos del glosario (BUILD_PLAN 6.8): ids, enlaces, rutas, marcado y lo que afirman los textos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONCEPTS, BLOCKS, SCREEN_HELP, EXERCISE_TEXTS, UI_TEXTS, getConcept, blockConcepts, nonEmptyBlocks,
} from '../js/data/concepts.js';
import { getTuning, TUNINGS } from '../js/data/tunings.js';
import { routeExists, resolvePath } from '../js/routes.js';
import { parseRichText, searchConcepts, normalizeText, plainText, parseNoteToken, displayAliases } from '../js/core/glossary.js';
import { LETTER_PC, LETTERS, spellingPc } from '../js/core/notation.js';
import { midiAt, pcAt, STRINGS } from '../js/core/fretboard-model.js';
import { mod12 } from '../js/core/theory.js';
import { fretboardDiagramPoints, naturalSemitonePcs, DIAGRAM_TYPES } from '../js/core/diagrams.js';
import { secondsPerBeat } from '../js/core/rhythm.js';
import { fillTemplate } from '../js/core/glossary.js';

const TEXT_FIELDS = ['short', 'summary'];
const allTexts = () => [
  ...CONCEPTS.flatMap((c) => TEXT_FIELDS.map((f) => [`${c.id}.${f}`, c[f]])),
  ...Object.entries(SCREEN_HELP).map(([k, h]) => [`help.${k}`, h.text]),
];

test('ids únicos y bloques válidos', () => {
  const ids = CONCEPTS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of CONCEPTS) assert.ok(BLOCKS.some((b) => b.id === c.block), `${c.id}: bloque ${c.block}`);
  assert.equal(new Set(BLOCKS.map((b) => b.id)).size, BLOCKS.length);
});

test('cada concepto tiene título, alias, línea corta y resumen', () => {
  for (const c of CONCEPTS) {
    assert.ok(c.title && c.short && c.summary, c.id);
    assert.ok(c.aliases.length > 0, `${c.id}: sin alias`);
  }
});

test('todo id usado en related, [[id|…]] o ayudas existe', () => {
  for (const c of CONCEPTS) {
    for (const r of c.related) assert.ok(getConcept(r), `${c.id} → related ${r}`);
    assert.ok(!c.related.includes(c.id), `${c.id} se relaciona consigo mismo`);
  }
  for (const [where, text] of allTexts()) {
    for (const part of parseRichText(text)) {
      if (part.type === 'term') assert.ok(getConcept(part.id), `${where}: [[${part.id}]] no existe`);
      if (part.type === 'tuning' || part.type === 'tuningName') assert.ok(getTuning(part.id), `${where}: afinación ${part.id}`);
    }
  }
  for (const h of Object.values(SCREEN_HELP)) for (const id of h.concepts ?? []) assert.ok(getConcept(id), id);
});

test('todo lesson apunta a una ruta existente', () => {
  for (const c of CONCEPTS) if (c.lesson) assert.ok(routeExists(c.lesson), `${c.id}: ${c.lesson}`);
});

test('el marcado se entiende entero (ningún {{…}} ni [[…]] suelto)', () => {
  for (const [where, text] of allTexts()) {
    const plain = plainText(text);
    assert.ok(!/\[\[|\]\]|\{\{|\}\}/.test(plain), `${where}: marcado roto`);
  }
});

test('los textos no escriben nombres de nota a mano (se usan {{…}})', () => {
  // La y Si se comprueban solo con alteración, porque también son palabras corrientes ("la app", "si cambia").
  const handWritten = /\b(Do|Re|Mi|Fa|Sol)\b|\b(La|Si)(♯|♭|#)|(?<![\wáéíóúñ])[A-G](♯|♭|#)?(?![\wáéíóúñ])/;
  for (const [where, text] of allTexts()) {
    const plain = parseRichText(text).filter((p) => p.type === 'text' || p.type === 'em' || p.type === 'term')
      .map((p) => p.text).join(' ');
    assert.ok(!handWritten.test(plain), `${where}: "${plain.match(handWritten)?.[0]}"`);
  }
});

test('resúmenes de 3 a 5 frases, sin espacios dobles y con puntuación final', () => {
  for (const c of CONCEPTS) {
    const plain = plainText(c.summary);
    const sentences = plain.split(/(?<=[.!?])\s+/).filter(Boolean);
    assert.ok(sentences.length >= 2 && sentences.length <= 5, `${c.id}: ${sentences.length} frases`);
    for (const [where, text] of [[c.id, c.summary], [c.id, c.short]]) {
      const p = plainText(text);
      assert.ok(!/ {2}/.test(p), `${where}: espacio doble`);
      assert.match(p, /[.!?]$/, `${where}: sin punto final`);
    }
  }
});

test('los sonidos son válidos', () => {
  for (const c of CONCEPTS) {
    if (!c.sound) continue;
    if (c.sound.tuning) assert.ok(getTuning(c.sound.tuning), c.id);
    else assert.ok(c.sound.midi.every((m) => Number.isInteger(m) && m >= 28 && m <= 88), c.id);
  }
});

/* ----- Lo que dicen los textos, comprobado con la teoría ----- */

test('naturales: 7 letras; un semitono solo entre Mi–Fa y Si–Do, un tono en el resto', () => {
  assert.equal(LETTERS.length, 7);
  const steps = LETTERS.map((l, i) => mod12(LETTER_PC[LETTERS[(i + 1) % 7]] - LETTER_PC[l]));
  const semis = LETTERS.filter((_, i) => steps[i] === 1);
  assert.deepEqual(semis, ['E', 'B']); // E→F y B→C
  assert.ok(steps.every((s) => s === 1 || s === 2));
  // El sonido de "Notas naturales" son solo naturales, subiendo, y termina en la octava.
  const { midi } = getConcept('natural-notes').sound;
  assert.ok(midi.every((m) => Object.values(LETTER_PC).includes(mod12(m))));
  assert.equal(midi.at(-1) - midi[0], 12);
});

test('sostenido sube un semitono; bemol baja uno (ejemplos de la ficha)', () => {
  assert.equal(spellingPc(parseNoteToken('F#')) - spellingPc(parseNoteToken('F')), 1);
  assert.equal(spellingPc(parseNoteToken('B')) - spellingPc(parseNoteToken('Bb')), 1);
  const [a, b] = getConcept('sharp-flat').sound.midi;
  assert.equal(b - a, 1);
  assert.equal(mod12(a), LETTER_PC.F);
});

test('enarmónicos: Fa♯ y Sol♭ son el mismo sonido', () => {
  assert.equal(spellingPc(parseNoteToken('F#')), spellingPc(parseNoteToken('Gb')));
});

test('semitono y tono: los ejemplos de la ficha y su sonido', () => {
  const [e, f, g, a] = getConcept('semitone-tone').sound.midi;
  assert.deepEqual([mod12(e), mod12(f), mod12(g), mod12(a)], [LETTER_PC.E, LETTER_PC.F, LETTER_PC.G, LETTER_PC.A]);
  assert.equal(f - e, 1);
  assert.equal(a - g, 2);
  const [e2, f2, b2, c2] = getConcept('natural-semitones').sound.midi;
  assert.equal(f2 - e2, 1);
  assert.equal(c2 - b2, 1);
  assert.equal(mod12(b2), LETTER_PC.B);
});

test('octava: la 5ª cuerda al aire es La y el traste 12 suena una octava más aguda', () => {
  assert.equal(pcAt(5, 0), LETTER_PC.A);
  assert.equal(midiAt(5, 12) - midiAt(5, 0), 12);
  assert.deepEqual(getConcept('octave').sound.midi, [midiAt(5, 0), midiAt(5, 12)]);
});

test('"La app usa siete afinaciones"', () => {
  assert.match(getConcept('tuning').summary, /siete afinaciones/);
  assert.equal(TUNINGS.length, 7);
});

test('Drop D: "de Mi a Re", un tono, solo la 6ª', () => {
  const d = getTuning('drop-d').midi;
  assert.equal(pcAt(6, 0), LETTER_PC.E);
  assert.equal(pcAt(6, 0, d), LETTER_PC.D);
  assert.equal(midiAt(6, 0) - midiAt(6, 0, d), 2);
  assert.deepEqual(STRINGS.filter((s) => d[s] !== midiAt(s, 0)), [6]);
});

test('bloques: conteo y bloques con conceptos', () => {
  assert.ok(blockConcepts('notes').length >= 8);
  assert.ok(blockConcepts('tunings').length >= 4);
  assert.ok(blockConcepts('rhythm-technique').some((c) => c.id === 'metronome'));
  assert.deepEqual(nonEmptyBlocks().map((b) => b.id), ['notes', 'tunings', 'rhythm-technique']);
});

/* ----- Buscador ----- */

test('normalizeText quita tildes y mayúsculas', () => {
  assert.equal(normalizeText('  Afinación ESTÁNDAR '), 'afinacion estandar');
});

test('el buscador encuentra en español y en inglés, sin tildes', () => {
  const ids = (q) => searchConcepts(CONCEPTS, q).map((c) => c.id);
  assert.ok(ids('octave').includes('octave'));
  assert.ok(ids('OCTAVA').includes('octave'));
  assert.ok(ids('afinacion').includes('tuning'));
  assert.ok(ids('sharp').includes('sharp-flat'));
  assert.ok(ids('nut').includes('fret'));
  assert.ok(ids('open g').includes('open-tuning'));
  assert.ok(ids('semitono').includes('semitone-tone'));
  assert.equal(ids('semitono')[0], 'semitone-tone'); // empieza por la búsqueda: primero
  assert.deepEqual(ids(''), []);
  assert.deepEqual(ids('zzz'), []);
});

/* ----- Lector del marcado ----- */

test('parseRichText', () => {
  assert.deepEqual(parseRichText('a [[octave|octava]] y {{F#}}, {{tuning:standard}} *slide* {{tname:open-g}}.'), [
    { type: 'text', text: 'a ' },
    { type: 'term', id: 'octave', text: 'octava' },
    { type: 'text', text: ' y ' },
    { type: 'note', spelling: { letter: 'F', accidental: 1 }, pc: 6 },
    { type: 'text', text: ', ' },
    { type: 'tuning', id: 'standard' },
    { type: 'text', text: ' ' },
    { type: 'em', text: 'slide' },
    { type: 'text', text: ' ' },
    { type: 'tuningName', id: 'open-g' },
    { type: 'text', text: '.' },
  ]);
  assert.equal(parseRichText('{{Bb}}')[0].pc, 10);
  assert.equal(parseRichText('{{C}}')[0].pc, 0);
  assert.throws(() => parseRichText('{{H}}'));
  assert.throws(() => parseRichText('{{x:y}}'));
});

/* ----- Rutas ----- */

test('rutas: existen las pantallas de la Fase 1A y su pantalla madre', () => {
  const cases = {
    '/': [null],
    '/teoria': ['/'],
    '/practica/mezclada': ['/practica'],
    '/teoria/notas': ['/teoria'],
    '/practica/calentamiento': ['/practica'],
    '/teoria/notas/aprender': ['/teoria/notas'],
    '/teoria/notas/consulta': ['/teoria/notas'],
    '/teoria/notas/que-nota': ['/teoria/notas'],
    '/practica/notas/unisonos': ['/practica/notas'],
    '/afinaciones': ['/'],
    '/glosario': ['/'],
    '/glosario/notes': ['/glosario'],
    '/glosario/concepto/octave': ['/glosario/notes'],
    '/perfil': ['/'],
    '/perfil/acerca-de': ['/perfil'],
    '/ajustes': ['/'],
    '/metronomo': ['/'],
    '/dev': ['/ajustes'],
    '/dev/que-nota': ['/dev'],
    '/dev/que-nota/jugar': ['/dev/que-nota'],
    '/dev/seis-cuerdas/jugar': ['/dev/seis-cuerdas'],
  };
  for (const [path, [parent]] of Object.entries(cases)) {
    const r = resolvePath(path);
    assert.ok(r, path);
    assert.equal(r.parent, parent, path);
    if (r.parent) assert.ok(routeExists(r.parent), `madre de ${path}`);
  }
  for (const bad of ['/teoria/calentamiento', '/teoria/oido/aprender', '/glosario/caged', '/glosario/concepto/nada',
    '/otra', '/teoria/notas/nada', '/practica/notas/que-nota', '/dev/nada', '/dev/nada/jugar',
    // Ejercicios anunciados pero aún sin construir: se preparan, pero no se juegan.
    '/teoria/notas/que-nota/jugar']) {
    assert.equal(resolvePath(bad), null, bad);
  }
});

test('los alias que se muestran no llevan nombres de nota escritos a mano', () => {
  const shown = displayAliases(getConcept('open-tuning'));
  assert.ok(shown.includes('open tuning') && shown.includes('slide'));
  assert.ok(!shown.some((a) => /sol|re abierto|mi abierto|open g|open d|open e/.test(a)), shown.join(', '));
  assert.deepEqual(displayAliases(getConcept('natural-semitones')), ['semitonos naturales']);
  assert.ok(!displayAliases(getConcept('lowered-tuning')).includes('mib'));
  assert.ok(!displayAliases(getConcept('standard-tuning')).includes('eadgbe'));
  assert.ok(!displayAliases(getConcept('octave')).includes('octava'));
});

/* ----- Esquemas (BUILD_PLAN 6.8, Fase 1B) ----- */

test('todo concepto tiene esquema (diagram) o el motivo de no tenerlo (noDiagramReason), no los dos', () => {
  for (const c of CONCEPTS) {
    assert.ok(Boolean(c.diagram) !== Boolean(c.noDiagramReason), `${c.id}: diagram o noDiagramReason`);
    if (c.diagram) assert.ok(DIAGRAM_TYPES.includes(c.diagram.type), `${c.id}: tipo ${c.diagram.type}`);
    if (c.noDiagramReason) assert.ok(c.noDiagramReason.length > 20, c.id);
  }
  assert.ok(getConcept('note-names').noDiagramReason);
});

test('los esquemas de mástil se calculan sin errores y sus puntos caen dentro del rango', () => {
  for (const c of CONCEPTS.filter((x) => x.diagram?.type === 'fretboard')) {
    const { points, tuning } = fretboardDiagramPoints(c);
    assert.ok(points.length > 0, c.id);
    for (const p of points) {
      assert.ok(p.fret >= c.diagram.fromFret && p.fret <= c.diagram.toFret, `${c.id}: traste ${p.fret}`);
      assert.equal(p.midi, tuning[p.string] + p.fret, c.id);
    }
    if (c.diagram.caption) {
      const plain = plainText(c.diagram.caption);
      assert.match(plain, /[.!?]$/, `${c.id}: leyenda sin punto final`);
    }
  }
});

test('lo que muestran los esquemas coincide con lo que dicen las fichas', () => {
  const pts = (id) => fretboardDiagramPoints(getConcept(id)).points;
  // Notas naturales: solo naturales, en las 6 cuerdas.
  assert.ok(pts('natural-notes').every((p) => Object.values(LETTER_PC).includes(p.pc)));
  assert.equal(new Set(pts('natural-notes').map((p) => p.string)).size, 6);
  // Los esquemas que salen del sonido del concepto marcan exactamente esas notas.
  for (const id of ['sharp-flat', 'semitone-tone', 'octave', 'enharmonic']) {
    assert.deepEqual(pts(id).map((p) => p.midi), getConcept(id).sound.midi, id);
  }
  assert.deepEqual(pts('sharp-flat').map((p) => p.fret), [3, 4]);
  assert.deepEqual(pts('octave').map((p) => p.fret), [0, 12]);
  // Enarmónicos: el punto es Fa♯/Sol♭, como dice la leyenda.
  assert.equal(pts('enharmonic')[0].pc, spellingPc(parseNoteToken('F#')));
  assert.equal(pts('enharmonic')[0].pc, spellingPc(parseNoteToken('Gb')));
  // Semitonos naturales: en la 5ª cuerda, Si–Do y Mi–Fa en trastes vecinos, resaltados.
  const s5 = pts('natural-semitones');
  const fretOf = (letter) => s5.find((p) => p.pc === LETTER_PC[letter]).fret;
  assert.equal(fretOf('C') - fretOf('B'), 1);
  assert.equal(fretOf('F') - fretOf('E'), 1);
  assert.deepEqual(s5.filter((p) => p.color === 'amber').map((p) => p.pc).sort((a, b) => a - b), [0, 4, 5, 11]);
  assert.deepEqual(naturalSemitonePcs(), [0, 4, 5, 11]);
  // Drop D: solo la 6ª resaltada. Sol abierto: R, 3 y 5 de Sol.
  assert.deepEqual(pts('drop-tuning').filter((p) => p.color === 'amber').map((p) => p.string), [6]);
  const colors = new Set(pts('open-tuning').map((p) => p.color));
  assert.deepEqual([...colors].sort(), ['fifth', 'root', 'third']);
  // Afinación bajada: las cuerdas al aire de "Medio tono abajo".
  assert.deepEqual(pts('lowered-tuning').map((p) => p.midi), [6, 5, 4, 3, 2, 1].map((s) => getTuning('half-down').midi[s]));
});

test('metrónomo: esquema de pulsos y lo que dice la ficha', () => {
  const m = getConcept('metronome');
  assert.equal(m.diagram.type, 'beats');
  assert.ok(m.diagram.beatsPerBar >= 2 && m.diagram.beatsPerBar <= 7);
  assert.match(m.summary, /a 60 BPM suena un clic por segundo, y a 120, dos/);
  assert.equal(secondsPerBeat(60), 1);
  assert.equal(secondsPerBeat(120), 0.5);
});

test('textos de los ejercicios: marcado válido y sin notas escritas a mano', () => {
  const handWritten = /\b(Do|Re|Mi|Fa|Sol)\b|\b(La|Si)(♯|♭|#)|(?<![\wáéíóúñ%])[A-G](♯|♭|#)?(?![\wáéíóúñ%])/;
  for (const [id, texts] of Object.entries(EXERCISE_TEXTS)) {
    for (const [k, text] of Object.entries(texts)) {
      const filled = text.replace(/%\w+%/g, '1');
      const parts = parseRichText(filled);
      for (const p of parts) if (p.type === 'term') assert.ok(getConcept(p.id), `${id}.${k}: [[${p.id}]]`);
      const plain = parts.filter((p) => ['text', 'em', 'term'].includes(p.type)).map((p) => p.text).join(' ');
      assert.ok(!handWritten.test(plain), `${id}.${k}: "${plain.match(handWritten)?.[0]}"`);
    }
  }
});

test('plantillas: {{pc:N}} y %variables%', () => {
  assert.deepEqual(parseRichText('{{pc:6}}'), [{ type: 'note', spelling: null, pc: 6 }]);
  assert.throws(() => parseRichText('{{pc:12}}'));
  assert.equal(fillTemplate('traste %fret% de la %s%ª', { fret: 0, s: 5 }), 'traste 0 de la 5ª');
  assert.throws(() => fillTemplate('%nada%', {}));
});

test('ningún esquema informa solo con color: lo resaltado lleva leyenda escrita', () => {
  for (const c of CONCEPTS.filter((x) => x.diagram?.highlight)) assert.ok(c.diagram.caption, `${c.id}: falta la leyenda`);
  // Los colores de función llevan la leyenda automática (FunctionLegend) con su nombre.
  for (const c of CONCEPTS.filter((x) => x.diagram?.colorBy === 'function')) {
    for (const p of fretboardDiagramPoints(c).points) assert.ok(UI_TEXTS.functionNames[p.color], `${c.id}: ${p.color}`);
  }
});

test('cada ficha enlaza a su lección o pantalla con un texto adecuado', () => {
  for (const c of CONCEPTS.filter((x) => x.lesson)) {
    assert.ok(UI_TEXTS.lessonLinks[resolvePath(c.lesson).name], `${c.id}: ${c.lesson}`);
  }
});
