// Buscador del glosario y lector del marcado de los textos explicativos (sin DOM).
//
// Marcado de los textos de concepts.js:
//   [[id|texto]]    palabra pulsable que abre la ficha del concepto `id` (BUILD_PLAN 6.8)
//   {{F#}} {{Bb}}   nombre de nota (letra inglesa + # o b), que se muestra con NoteLabel
//   {{pc:6}}        nota por su pitch class, escrita con la preferencia ♯/♭ del usuario
//                   (la usan los textos que se generan con reglas, p. ej. el "¿Por qué?")
//   {{tuning:id}}   las notas de las cuerdas al aire de una afinación, de la 6ª a la 1ª
//   {{tname:id}}    el nombre de una afinación ("Sol abierto")
//   {{chord:id}}    el nombre de un acorde de la biblioteca ("Lam"), con doble notación
//   {{ch:F#:minor}} un acorde por su fundamental deletreada y su calidad (major, minor,
//                   diminished, dom7): "Fa♯m", "Si°" (acordes de una tonalidad)
//   {{key:7}}       la fundamental de una tonalidad mayor con su deletreo ("Sol"; en la 6,
//                   Fa♯ o Sol♭ según la preferencia del usuario)
//   {{deg:7:vi}}    el acorde de un grado de una tonalidad mayor, calculado ("Mim" en Sol)
//   *texto*         cursiva (términos en inglés)

import { LETTER_PC } from './notation.js';

/** Calidades que admite el marcado {{ch:…}}. */
export const CHORD_QUALITIES = Object.freeze(['major', 'minor', 'diminished', 'dom7']);
/** Grados que admite el marcado {{deg:…}}. */
export const DEGREE_ROMANS = Object.freeze(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
const PC_RE = /^(\d|1[01])$/;

/** Minúsculas y sin tildes, para buscar "afinacion" y encontrar "Afinación". */
export function normalizeText(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Conceptos cuyo título o algún alias contiene la búsqueda (sin importar tildes ni mayúsculas).
 * Orden: coincidencia exacta, luego los que tienen una palabra que empieza por la búsqueda,
 * luego el resto; dentro de cada grupo, por título.
 */
export function searchConcepts(concepts, query) {
  const q = normalizeText(query);
  if (!q) return [];
  const scored = [];
  for (const concept of concepts) {
    const words = [concept.title, ...(concept.aliases ?? [])].map(normalizeText);
    if (!words.some((w) => w.includes(q))) continue;
    let rank = 2;
    if (words.includes(q)) rank = 0;
    else if (words.some((w) => w.startsWith(q) || w.includes(` ${q}`))) rank = 1;
    scored.push({ concept, rank });
  }
  return scored
    .sort((a, b) => a.rank - b.rank || a.concept.title.localeCompare(b.concept.title, 'es'))
    .map((s) => s.concept);
}

const NOTE_RE = /^([A-G])(#|b)?$/;

/** '{{F#}}' → { letter: 'F', accidental: 1 }. Devuelve null si no es una nota. */
export function parseNoteToken(text) {
  const m = NOTE_RE.exec(text);
  if (!m) return null;
  return { letter: m[1], accidental: m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0 };
}

const TOKEN_RE = /\[\[([a-z0-9-]+)\|([^\]]+)\]\]|\{\{([^}]+)\}\}|\*([^*]+)\*/g;

/**
 * Convierte un texto con marcado en una lista de piezas:
 * { type: 'text', text } · { type: 'term', id, text } · { type: 'note', spelling, pc } (spelling null con {{pc:N}})
 * { type: 'tuning', id } · { type: 'tuningName', id } · { type: 'chord', id } · { type: 'em', text }
 * { type: 'keyChord', spelling, quality } · { type: 'key', key } · { type: 'degree', key, roman }
 * Lanza un error si encuentra un {{…}} que no entiende, para detectarlo en los tests.
 */
export function parseRichText(text) {
  const parts = [];
  let last = 0;
  for (const m of String(text).matchAll(TOKEN_RE)) {
    if (m.index > last) parts.push({ type: 'text', text: text.slice(last, m.index) });
    last = m.index + m[0].length;
    if (m[1]) { parts.push({ type: 'term', id: m[1], text: m[2] }); continue; }
    if (m[4]) { parts.push({ type: 'em', text: m[4] }); continue; }
    const inner = m[3].trim();
    const [kind, arg, extra] = inner.includes(':') ? inner.split(':') : [null, inner];
    if (kind === 'ch') {
      const spelling = parseNoteToken(arg ?? '');
      if (!spelling || !CHORD_QUALITIES.includes(extra)) throw new Error(`Marcado desconocido: ${m[0]}`);
      parts.push({ type: 'keyChord', spelling, quality: extra });
    } else if (kind === 'key') {
      if (!PC_RE.test(arg ?? '')) throw new Error(`Marcado desconocido: ${m[0]}`);
      parts.push({ type: 'key', key: Number(arg) });
    } else if (kind === 'deg') {
      if (!PC_RE.test(arg ?? '') || !DEGREE_ROMANS.includes(extra)) throw new Error(`Marcado desconocido: ${m[0]}`);
      parts.push({ type: 'degree', key: Number(arg), roman: extra });
    } else if (kind === 'tuning') parts.push({ type: 'tuning', id: arg });
    else if (kind === 'pc') {
      if (!/^(\d|1[01])$/.test(arg)) throw new Error(`Marcado desconocido: ${m[0]}`);
      parts.push({ type: 'note', spelling: null, pc: Number(arg) });
    }
    else if (kind === 'tname') parts.push({ type: 'tuningName', id: arg });
    else if (kind === 'chord') {
      if (!/^[A-Za-z0-9-]+$/.test(arg ?? '')) throw new Error(`Marcado desconocido: ${m[0]}`);
      parts.push({ type: 'chord', id: arg });
    }
    else {
      const spelling = kind === null ? parseNoteToken(arg) : null;
      if (!spelling) throw new Error(`Marcado desconocido: ${m[0]}`);
      parts.push({ type: 'note', spelling, pc: (LETTER_PC[spelling.letter] + spelling.accidental + 12) % 12 });
    }
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) });
  return parts;
}

/** Texto plano (sin marcado), para comprobar ortografía o longitud en los tests. */
export function plainText(text, { noteName = (p) => (p.spelling ? p.spelling.letter : `pc${p.pc}`), tuningName = (id) => id } = {}) {
  return parseRichText(text).map((p) => {
    switch (p.type) {
      case 'note': return noteName(p);
      case 'tuning': return `[${p.id}]`;
      case 'tuningName': return tuningName(p.id);
      case 'chord': return `[${p.id}]`;
      case 'keyChord': return `[${p.spelling.letter}:${p.quality}]`;
      case 'key': return `[key ${p.key}]`;
      case 'degree': return `[${p.roman} ${p.key}]`;
      default: return p.text;
    }
  }).join('');
}

/**
 * Rellena una plantilla de concepts.js: '%fret%' → vars.fret. Lanza un error si falta
 * alguna variable, para que un texto incompleto no llegue nunca a la pantalla.
 */
export function fillTemplate(template, vars = {}) {
  return String(template).replace(/%(\w+)%/g, (_, name) => {
    if (vars[name] === undefined || vars[name] === null) throw new Error(`Falta %${name}% en la plantilla`);
    return String(vars[name]);
  });
}

// Alias con nombres de nota ("sol abierto", "e f", "eadgbe"): sirven para buscar, pero no se
// muestran, porque en pantalla las notas van siempre con la notación elegida.
const NOTE_WORD = /(^|[\s(])(do|re|mi|fa|sol|la|si|[a-g])(#|b|♯|♭)?(?=$|[\s)])|^[a-g]{6}$/i;

/** Alias que se pueden mostrar en la ficha ("También: …"). */
export function displayAliases(concept) {
  const title = normalizeText(concept.title);
  return (concept.aliases ?? []).filter((a) => !NOTE_WORD.test(a) && normalizeText(a) !== title && !/^[#♯♭]$/.test(a));
}

/** Marcado de una nota con su deletreo: { letter: 'G', accidental: 1 } → '{{G#}}'. */
export function noteToken({ letter, accidental }) {
  if (accidental < -1 || accidental > 1) throw new RangeError('El marcado solo admite ♯ o ♭ sencillos');
  return `{{${letter}${accidental === 1 ? '#' : accidental === -1 ? 'b' : ''}}}`;
}
