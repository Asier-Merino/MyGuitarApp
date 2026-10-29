// Textos con marcado (BUILD_PLAN 6.8): palabras pulsables [[id|texto]] que abren la ficha
// corta del concepto, notas {{F#}} con doble notación, y afinaciones. El marcado lo lee
// js/core/glossary.js; aquí solo se convierte en elementos.

import { parseRichText } from '../core/glossary.js';
import { getTuning } from '../data/tunings.js';
import { h } from './components.js';
import { NoteLabel } from './note-label.js';
import { openConceptSheet } from './help-sheet.js';

/** Nombre de una afinación: "Sol abierto" con la nota en doble notación, o su texto fijo. */
export function TuningName(tuning) {
  const { name } = tuning;
  if (name.text) return h('span', { class: 'tuning-name' }, name.text);
  return h('span', { class: 'tuning-name' }, NoteLabel(name.root, { accidentals: tuning.accidentals }), ` ${name.suffix}`);
}

/** Notas de las cuerdas al aire de una afinación, de la 6ª a la 1ª. */
export function TuningNotes(tuning) {
  const notes = [6, 5, 4, 3, 2, 1].map((s) => NoteLabel(tuning.midi[s] % 12, { accidentals: tuning.accidentals }));
  return h('span', { class: 'tuning-notes' }, notes.flatMap((n, i) => (i ? [' ', n] : [n])));
}

/**
 * Palabra pulsable: abre la ficha corta del concepto. Es un <span role="button"> y no un
 * <button> para que, si ocupa dos líneas, se corte como el resto del texto.
 */
export function Term(id, text) {
  const open = (e) => { e.preventDefault(); e.stopPropagation(); openConceptSheet(id); };
  return h('span', {
    class: 'term',
    role: 'button',
    tabindex: '0',
    dataset: { concept: id },
    onClick: open,
    onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') open(e); },
  }, text);
}

/** Convierte un texto con marcado en un elemento (por defecto, un <p>). */
export function richText(text, { tag = 'p', className } = {}) {
  const el = h(tag, { class: className });
  for (const part of parseRichText(text)) {
    switch (part.type) {
      case 'text': el.append(part.text); break;
      case 'em': el.append(h('em', {}, part.text)); break;
      case 'term': el.append(Term(part.id, part.text)); break;
      case 'note': el.append(NoteLabel(part.pc, { spelling: part.spelling })); break;
      case 'tuning': el.append(TuningNotes(getTuning(part.id))); break;
      case 'tuningName': el.append(TuningName(getTuning(part.id))); break;
      default: break;
    }
  }
  return el;
}
