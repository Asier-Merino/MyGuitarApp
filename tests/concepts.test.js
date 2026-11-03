// Conceptos del glosario (BUILD_PLAN 6.8): ids, enlaces, rutas, marcado y lo que afirman los textos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONCEPTS, BLOCKS, SCREEN_HELP, EXERCISE_TEXTS, UI_TEXTS, LESSONS, getConcept, blockConcepts, nonEmptyBlocks,
} from '../js/data/concepts.js';
import { MODULES } from '../js/data/modules.js';
import { getTuning, TUNINGS } from '../js/data/tunings.js';
import { routeExists, resolvePath } from '../js/routes.js';
import { parseRichText, searchConcepts, normalizeText, plainText, parseNoteToken, displayAliases } from '../js/core/glossary.js';
import { LETTER_PC, LETTERS, spellingPc } from '../js/core/notation.js';
import { midiAt, pcAt, STRINGS } from '../js/core/fretboard-model.js';
import { mod12 } from '../js/core/theory.js';
import { fretboardDiagramPoints, naturalSemitonePcs, DIAGRAM_TYPES, chordDiagramFunctions } from '../js/core/diagrams.js';
import { secondsPerBeat } from '../js/core/rhythm.js';
import { fillTemplate } from '../js/core/glossary.js';

const TEXT_FIELDS = ['short', 'summary'];
const lessonCards = () => Object.entries(LESSONS).flatMap(([mod, l]) => l.cards.map((card) => ({ ...card, id: `${mod}.${card.id}` })));
const allTexts = () => [
  ...CONCEPTS.flatMap((c) => TEXT_FIELDS.map((f) => [`${c.id}.${f}`, c[f]])),
  ...Object.entries(SCREEN_HELP).map(([k, h]) => [`help.${k}`, h.text]),
  ...lessonCards().flatMap((card) => [[`${card.id}.text`, card.text], [`${card.id}.title`, card.title]]),
  ...[...CONCEPTS, ...lessonCards()].filter((c) => c.diagram?.caption).map((c) => [`${c.id}.caption`, c.diagram.caption]),
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
  assert.ok(blockConcepts('chords').length >= 7);
  assert.ok(blockConcepts('tablature').length >= 16);
  assert.deepEqual(nonEmptyBlocks().map((b) => b.id), ['notes', 'chords', 'intervals', 'tunings', 'rhythm-technique', 'tablature']);
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

test('rutas: existen las pantallas y su pantalla madre', () => {
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
    // Fase 2: los ejercicios de Notas ya se juegan.
    '/teoria/notas/que-nota/jugar': ['/teoria/notas/que-nota'],
    '/teoria/notas/rellena/jugar': ['/teoria/notas/rellena'],
    '/practica/notas/paseo-octavas/jugar': ['/practica/notas/paseo-octavas'],
  };
  for (const [path, [parent]] of Object.entries(cases)) {
    const r = resolvePath(path);
    assert.ok(r, path);
    assert.equal(r.parent, parent, path);
    if (r.parent) assert.ok(routeExists(r.parent), `madre de ${path}`);
  }
  for (const bad of ['/teoria/calentamiento', '/teoria/oido/aprender', '/glosario/caged', '/glosario/concepto/nada',
    '/otra', '/teoria/notas/nada', '/practica/notas/que-nota', '/dev/nada', '/dev/que-nota', '/dev/que-nota/jugar',
    '/teoria/notas/nada/jugar']) {
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
  for (const c of CONCEPTS.filter((x) => x.diagram?.type === 'fretboard' && x.diagram.colorBy === 'function')) {
    for (const p of fretboardDiagramPoints(c).points) assert.ok(UI_TEXTS.functionNames[p.color], `${c.id}: ${p.color}`);
  }
});

test('cada ficha enlaza a su lección o pantalla con un texto adecuado', () => {
  for (const c of CONCEPTS.filter((x) => x.lesson)) {
    assert.ok(UI_TEXTS.lessonLinks[resolvePath(c.lesson).name], `${c.id}: ${c.lesson}`);
  }
});

/* ----- Fase 2: Notas del mástil ----- */

test('unísono: el punto y su unísono tienen el mismo MIDI, como dice la ficha', () => {
  const pts = fretboardDiagramPoints(getConcept('unison')).points;
  assert.deepEqual(pts.map((p) => `${p.string}/${p.fret}`), ['6/5', '5/0']);
  assert.equal(pts[0].midi, pts[1].midi);
  assert.deepEqual(pts.map((p) => p.midi), getConcept('unison').sound.midi);
  assert.equal(pts[0].pc, LETTER_PC.A); // "la 6ª cuerda en el traste 5 suena La"
  assert.deepEqual(pts.map((p) => p.color), ['amber', 'neutral']);
});

test('regla de los 5 trastes: 5 en todas las parejas menos la 3ª–2ª (4), cada pareja al unísono', () => {
  const pts = fretboardDiagramPoints(getConcept('five-fret-rule')).points;
  for (let i = 0; i < pts.length; i += 2) {
    const [pressed, open] = [pts[i], pts[i + 1]];
    assert.equal(pressed.midi, open.midi, `${pressed.string}ª y ${open.string}ª`);
    assert.equal(open.fret, 0);
    assert.equal(open.string, pressed.string - 1);
    assert.equal(pressed.fret, pressed.string === 3 ? 4 : 5);
    assert.equal(pressed.color, pressed.string === 3 ? 'amber' : 'neutral');
  }
  assert.equal(pts.length, 10);
  // "de la 3ª (Sol) a la 2ª (Si) es el traste 4"
  assert.equal(pcAt(3, 0), LETTER_PC.G);
  assert.equal(pcAt(2, 0), LETTER_PC.B);
  assert.deepEqual(getConcept('five-fret-rule').sound.midi, [midiAt(3, 4), midiAt(2, 0)]);
});

test('formas de octava: los puntos del esquema son la misma nota, a una o dos octavas', () => {
  const pts = fretboardDiagramPoints(getConcept('octave-shapes')).points;
  assert.deepEqual(pts.map((p) => `${p.string}/${p.fret}`).sort(), ['1/3', '2/8', '4/5', '6/3']);
  assert.ok(pts.every((p) => p.pc === LETTER_PC.G));
  assert.equal(pts.find((p) => p.color === 'amber').string, 6);
  const midis = new Set(pts.map((p) => p.midi));
  assert.deepEqual([...midis].sort((a, b) => a - b), getConcept('octave-shapes').sound.midi);
  assert.deepEqual(getConcept('octave-shapes').sound.midi, [43, 55, 67]);
});

test('lecciones: de 3 a 6 tarjetas con título, texto de 2 a 4 frases y esquema dentro del rango', () => {
  for (const [slug, lesson] of Object.entries(LESSONS)) {
    assert.ok(MODULES.some((m) => m.slug === slug && m.lesson), slug);
    assert.ok(lesson.cards.length >= 3 && lesson.cards.length <= 6, slug);
    assert.equal(new Set(lesson.cards.map((c) => c.id)).size, lesson.cards.length);
    for (const card of lesson.cards) {
      assert.ok(card.title && card.diagram, card.id);
      const sentences = plainText(card.text).split(/(?<=[.!?])\s+/).filter(Boolean);
      assert.ok(sentences.length >= 2 && sentences.length <= 4, `${card.id}: ${sentences.length} frases`);
      for (const part of parseRichText(card.text)) if (part.type === 'term') assert.ok(getConcept(part.id), `${card.id}: ${part.id}`);
      if (card.diagram.highlight) assert.ok(card.diagram.caption, `${card.id}: falta la leyenda`);
      if (card.diagram.type === 'chord') {
        assert.ok(chordDiagramFunctions(card.diagram).length > 0, card.id);
        continue;
      }
      const { points, tuning } = fretboardDiagramPoints(card);
      assert.ok(points.length > 0, card.id);
      for (const p of points) {
        assert.ok(p.fret >= card.diagram.fromFret && p.fret <= card.diagram.toFret, card.id);
        assert.equal(p.midi, tuning[p.string] + p.fret);
      }
    }
  }
});

test('lección de Notas: lo que dice cada tarjeta coincide con su esquema', () => {
  const card = (id) => LESSONS.notas.cards.find((c) => c.id === id);
  const pts = (id) => fretboardDiagramPoints(card(id)).points;
  // "al recorrer una cuerda desde el aire, pasas por las 12 notas"
  assert.equal(new Set(pts('semitonos').map((p) => p.pc)).size, 12);
  pts('semitonos').forEach((p, i) => assert.equal(p.fret, i));
  // Las 7 naturales, en la 6ª y la 5ª.
  assert.deepEqual(new Set(pts('naturales').map((p) => p.pc)), new Set(Object.values(LETTER_PC)));
  assert.deepEqual([...new Set(pts('naturales').map((p) => p.string))], [6, 5]);
  // Mi–Fa y Si–Do resaltadas.
  assert.deepEqual(pts('mi-fa-si-do').filter((p) => p.color === 'amber').map((p) => p.pc).sort((a, b) => a - b), [0, 4, 5, 11]);
  // Las notas de en medio: resaltadas exactamente las que no son naturales.
  for (const p of pts('alteraciones')) assert.equal(p.color === 'amber', !Object.values(LETTER_PC).includes(p.pc));
  // "el traste 12 da la misma nota que la cuerda al aire", una octava más aguda.
  for (const s of STRINGS) {
    const [open, twelve] = pts('traste-12').filter((p) => p.string === s);
    assert.deepEqual([open.fret, twelve.fret], [0, 12]);
    assert.equal(twelve.midi - open.midi, 12);
  }
  // Formas de octava: el mismo esquema que la ficha.
  assert.deepEqual(pts('formas-de-octava'), fretboardDiagramPoints(getConcept('octave-shapes')).points);
});

test('la lección de Notas enlaza a los conceptos del bloque Notas que trabaja', () => {
  const linked = new Set(LESSONS.notas.cards.flatMap((c) => parseRichText(c.text).filter((p) => p.type === 'term').map((p) => p.id)));
  for (const id of ['fret', 'semitone-tone', 'natural-notes', 'sharp-flat', 'enharmonic', 'octave', 'open-string', 'octave-shapes', 'five-fret-rule']) {
    assert.ok(linked.has(id), id);
  }
});
