// "Construye la escala" (Fase 5): 7 casillas, una por grado, con la fundamental ya puesta, y
// 4 botones para elegir la nota del grado siguiente. Si se acierta, la nota entra en su casilla
// y salen las opciones del siguiente; el primer fallo termina la pregunta. Debajo de las
// casillas, la fórmula T T S T T T S (si el nivel la enseña). La lógica está en core/keys.js.

import { h, render } from './components.js';
import { NoteLabel } from './note-label.js';
import { spellingPc } from '../core/notation.js';

const MARK = { correct: '✓', wrong: '✗' };

/**
 * ScaleBuilder({ scale, steps, showSteps, options, onDone })
 * scale: [{ pc, spelling }] (7 notas) · steps: ['T', 'T', 'S'…] · options: por cada grado del 2º
 * al 7º, [{ spelling, pc, correct }] en el orden en que se enseñan.
 * onDone({ picks, failedAt }): picks son los deletreos elegidos (con la fundamental).
 * Devuelve el elemento con lock() y reveal(picks).
 */
export function ScaleBuilder({ scale, steps, showSteps, options, onDone, label }) {
  const slots = scale.map((note, i) => h('li', { class: 'scale-slot' },
    h('span', { class: 'scale-slot__degree', 'aria-hidden': 'true' }, String(i + 1)),
    h('span', { class: 'scale-slot__note' }, i === 0 ? NoteLabel(note.pc, { spelling: note.spelling, className: 'note-label--stacked' }) : '?'),
    h('span', { class: 'scale-slot__mark', 'aria-hidden': 'true' }),
    h('span', { class: 'sr-only scale-slot__sr' }, `Grado ${i + 1}${i === 0 ? '' : ': por elegir'}`)));
  slots[0].classList.add('is-given');
  const stepsEl = showSteps && h('ol', { class: 'scale-steps', 'aria-label': `Fórmula: ${steps.join(' ')}` },
    steps.map((s) => h('li', { class: `scale-steps__step scale-steps__step--${s === 'T' ? 'tone' : 'semitone'}`, 'aria-hidden': 'true' }, s)));
  const buttonsEl = h('div', { class: 'quiz__answers scale-builder__options' });
  const picks = [scale[0].spelling];
  let current = 1;
  let locked = false;
  let buttons = [];

  const fill = (i, spelling, state) => {
    const slot = slots[i];
    render(slot.querySelector('.scale-slot__note'), NoteLabel(spellingPc(spelling), { spelling, className: 'note-label--stacked' }));
    slot.classList.remove('is-current');
    slot.classList.add(`scale-slot--${state}`);
    slot.querySelector('.scale-slot__mark').textContent = MARK[state] ?? '';
    slot.querySelector('.scale-slot__sr').textContent = `Grado ${i + 1}${state === 'wrong' ? ', tu respuesta, no es correcta' : ''}`;
  };

  function showOptions() {
    slots.forEach((s, i) => s.classList.toggle('is-current', i === current));
    buttons = options[current - 1].map((o) => {
      const btn = h('button', { type: 'button', class: 'btn btn--grey answer', onClick: () => pick(o) },
        NoteLabel(o.pc, { spelling: o.spelling }),
        h('span', { class: 'answer__mark', 'aria-hidden': 'true' }),
        h('span', { class: 'sr-only answer__sr' }));
      return { btn, o };
    });
    render(buttonsEl, buttons.map((b) => b.btn));
  }

  function markButtons(chosen) {
    for (const { btn, o } of buttons) {
      btn.disabled = true;
      if (o.correct) { btn.classList.add('answer--correct'); btn.querySelector('.answer__mark').textContent = '✓'; btn.querySelector('.answer__sr').textContent = ', correcta'; }
      else if (o === chosen) { btn.classList.add('answer--wrong'); btn.querySelector('.answer__mark').textContent = '✗'; btn.querySelector('.answer__sr').textContent = ', tu respuesta'; }
    }
  }

  function pick(o) {
    if (locked) return;
    picks.push(o.spelling);
    if (!o.correct) {
      locked = true;
      fill(current, o.spelling, 'wrong');
      markButtons(o);
      onDone({ picks: [...picks], failedAt: current });
      return;
    }
    fill(current, o.spelling, 'correct');
    current += 1;
    if (current >= scale.length) {
      locked = true;
      render(buttonsEl);
      onDone({ picks: [...picks], failedAt: null });
      return;
    }
    showOptions();
  }

  const el = h('div', { class: 'scale-builder', role: 'group', 'aria-label': label },
    h('ol', { class: 'scale-slots' }, slots), stepsEl, buttonsEl);
  el.lock = () => { locked = true; buttons.forEach(({ btn }) => { btn.disabled = true; }); };
  /** Al terminar: las casillas que faltan, con la nota correcta. */
  el.reveal = () => {
    // Si se acabó el tiempo, se marca la opción correcta del grado que tocaba.
    if (!locked && current < scale.length) markButtons(null);
    el.lock();
    slots.forEach((slot, i) => {
      if (i === 0 || slot.classList.contains('scale-slot--correct') || slot.classList.contains('scale-slot--wrong')) return;
      fill(i, scale[i].spelling, 'answer');
    });
  };
  showOptions();
  return el;
}
