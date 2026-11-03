// Opciones propias de la preparación (BUILD_PLAN 6.6.6, 6.6.11 y 6.6.12), además de las de
// siempre (metrónomo y elección): interruptor ("Mostrar diagramas"), progresión con "Mis
// progresiones" (crear, editar y borrar), patrón de rasgueo con "Escuchar el patrón",
// tempo dentro del rango del nivel, pareja de acordes y elección que depende del nivel.
// También la tablatura del Calentamiento para escucharla antes de empezar.

import { h, render, button, segmented, toggle, settingRow, iconButton, listRow } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { ChordLabel } from '../ui/note-label.js';
import { ChordDiagram } from '../ui/chord-diagram.js';
import { StrumCells } from '../ui/strum.js';
import { Tab } from '../ui/tab.js';
import { openSheet, confirmSheet, closeSheet } from '../ui/help-sheet.js';
import { richText } from '../ui/term.js';
import { PRESETS, customProgressions, resolveProgressionChoice, newCustomId, cleanName } from '../core/progressions.js';
import { CUSTOM_PROGRESSION_SIZES, CUSTOM_NAME_MAX } from '../data/progressions.js';
import { CHORDS, getChord, chordMidis } from '../data/chords.js';
import { getStrumPattern } from '../data/strum-patterns.js';
import { getTuning } from '../data/tunings.js';
import { LEVELS } from '../data/modules.js';
import { SCREEN_HELP, UI_TEXTS } from '../data/concepts.js';
import { playStrumPattern } from '../audio/strum-player.js';
import { store } from '../state.js';

const T = UI_TEXTS.chordPractice;

/** Nombres de los acordes de una progresión, separados por guiones: Sol–Do–Re. */
function chordLine(chords) {
  const el = h('span', { class: 'prog-line' });
  chords.forEach((c, i) => { if (i) el.append('–'); el.append(ChordLabel(c)); });
  return el;
}

/* ----- Selector de acordes (panel) ----- */

/** Lista de acordes de la biblioteca (los de `allowed`), agrupados por nivel. onSelect(id). */
function chordPickerContent({ allowed = CHORDS.map((c) => c.id), value, onSelect }) {
  return LEVELS.map((level) => {
    const chords = CHORDS.filter((c) => c.level === level.id && allowed.includes(c.id));
    if (!chords.length) return null;
    return h('section', { class: 'picker-group' },
      h('h3', { class: 'group__title' }, level.title),
      h('div', { class: 'chord-grid' }, chords.map((c) => h('button', {
        type: 'button',
        class: ['btn', 'btn--grey', 'chord-pick', c.id === value && 'is-selected'].filter(Boolean).join(' '),
        'aria-pressed': String(c.id === value),
        onClick: () => onSelect(c.id),
      }, ChordLabel(c), ChordDiagram(c, { size: 'mini', playOnTap: false })))));
  });
}

export function openChordPicker({ allowed, value, onSelect, title = T.pickChord }) {
  openSheet({ title, content: chordPickerContent({ allowed, value, onSelect: (id) => { closeSheet(); onSelect(id); } }) });
}

/* ----- Mis progresiones ----- */

function saveCustom(prog) {
  store.update((d) => {
    const i = d.progressions.findIndex((p) => p.id === prog.id);
    if (i >= 0) d.progressions[i] = prog; else d.progressions.push(prog);
  });
}

function deleteCustom(id) {
  store.update((d) => { d.progressions = d.progressions.filter((p) => p.id !== id); });
}

/**
 * Editor de una progresión (6.6.11): cuántos acordes (3, 4 o 5), una casilla por acorde que
 * abre la biblioteca, y el nombre. "Guardar" la guarda al momento. onSaved(id).
 */
export function openProgressionEditor({ existing = null, onSaved }) {
  const state = {
    size: existing?.chords.length ?? 4,
    chords: existing ? [...existing.chords] : [],
    name: existing?.name ?? '',
  };
  let picking = null; // índice de la casilla que se está eligiendo
  const body = h('div', { class: 'prog-editor' });
  const close = openSheet({ title: T.editorTitle, content: body });

  const valid = () => state.chords.length === state.size && state.chords.every(Boolean) && cleanName(state.name).length > 0;

  function draw() {
    if (picking !== null) {
      render(body,
        h('p', { class: 'lead' }, `${T.pickChord} (${picking + 1}/${state.size})`),
        chordPickerContent({
          value: state.chords[picking],
          onSelect: (id) => { state.chords[picking] = id; picking = null; draw(); },
        }));
      return;
    }
    state.chords = state.chords.slice(0, state.size);
    const input = h('input', {
      class: 'text-input', type: 'text', maxlength: String(CUSTOM_NAME_MAX), value: state.name,
      placeholder: T.namePlaceholder, 'aria-label': T.nameLabel, autocomplete: 'off',
    });
    const saveBtn = button({
      label: T.save, variant: 'primary', block: true, disabled: !valid(),
      onClick: () => {
        const prog = { id: existing?.id ?? newCustomId(store.data.progressions), name: cleanName(state.name), chords: [...state.chords] };
        saveCustom(prog);
        close();
        onSaved?.(`custom:${prog.id}`);
      },
    });
    input.addEventListener('input', () => { state.name = input.value; saveBtn.disabled = !valid(); });
    render(body,
      richText(SCREEN_HELP.progressions.text, { className: 'setup__hint' }),
      h('h3', { class: 'sheet__section' }, T.howMany),
      segmented({
        label: T.howMany,
        value: state.size,
        options: CUSTOM_PROGRESSION_SIZES.map((n) => ({ value: n, label: String(n) })),
        onChange: (n) => { state.size = n; draw(); },
      }),
      h('h3', { class: 'sheet__section' }, T.slotsLabel),
      h('div', { class: 'prog-slots' }, Array.from({ length: state.size }, (_, i) => {
        const chord = state.chords[i] ? getChord(state.chords[i]) : null;
        return h('button', {
          type: 'button',
          class: ['btn', 'btn--grey', 'prog-slot', !chord && 'prog-slot--empty'].filter(Boolean).join(' '),
          'aria-label': chord ? `Acorde ${i + 1}: cambiar` : `Acorde ${i + 1}: elegir`,
          onClick: () => { picking = i; draw(); },
        }, h('span', { class: 'prog-slot__num' }, String(i + 1)), chord ? ChordLabel(chord) : icon('plus'));
      })),
      h('h3', { class: 'sheet__section' }, T.nameLabel),
      input,
      h('div', { class: 'prog-editor__save' }, saveBtn));
  }
  draw();
}

/** Lista de progresiones: predefinidas y "Mis progresiones", con la elegida marcada. */
function progressionOption({ value, onChange, redraw }) {
  const saved = store.data.progressions;
  const custom = customProgressions(saved);
  const current = resolveProgressionChoice(value, saved).id;
  const row = (prog, extra) => h('div', { class: ['prog-row', prog.id === current && 'is-selected'].filter(Boolean).join(' ') },
    h('button', {
      type: 'button',
      class: 'prog-row__main',
      role: 'radio',
      'aria-checked': String(prog.id === current),
      onClick: () => onChange(prog.id),
    },
    h('span', { class: 'prog-row__check', 'aria-hidden': 'true' }, prog.id === current ? '✓' : ''),
    h('span', { class: 'prog-row__text' },
      h('span', { class: 'prog-row__title' }, prog.kind === 'preset' ? prog.degrees.join('–') : prog.name),
      chordLine(prog.chords))),
    extra);
  return [
    h('h2', { class: 'section-title' }, 'Progresión'),
    h('div', { class: 'list prog-list', role: 'radiogroup', 'aria-label': T.presets },
      h('p', { class: 'prog-list__group' }, T.presets),
      PRESETS.map((p) => row(p)),
      h('p', { class: 'prog-list__group' }, T.custom),
      custom.length ? custom.map((p) => row(p, h('div', { class: 'prog-row__tools' },
        iconButton({ iconName: 'edit', label: `${T.editProgression} «${p.name}»`, onClick: () => openProgressionEditor({ existing: saved.find((x) => x.id === p.customId), onSaved: () => redraw() }) }),
        iconButton({
          iconName: 'trash',
          label: `${T.deleteProgression} «${p.name}»`,
          onClick: async () => {
            const ok = await confirmSheet({ title: T.deleteTitle, text: T.deleteText, confirmLabel: T.deleteProgression, danger: true });
            if (ok) { deleteCustom(p.customId); redraw(); }
          },
        }))))
        : h('p', { class: 'prog-list__empty' }, T.emptyCustom),
      h('div', { class: 'prog-list__new' }, button({ label: T.newProgression, iconName: 'plus', onClick: () => openProgressionEditor({ onSaved: (id) => onChange(id) }) }))),
  ];
}

/* ----- Patrón de rasgueo ----- */

let stopPreview = null;

function strumOption({ opt, level, value, onChange, options }) {
  const pattern = getStrumPattern(value);
  const cells = StrumCells(pattern);
  const label = h('span', {}, T.listenPattern);
  const listen = h('button', { type: 'button', class: 'btn btn--grey btn--small', 'aria-pressed': 'false' }, icon('play'), label);
  const done = () => { stopPreview = null; cells.clear(); label.textContent = T.listenPattern; listen.setAttribute('aria-pressed', 'false'); };
  listen.addEventListener('click', () => {
    if (stopPreview) { stopPreview(); return; }
    const prog = resolveProgressionChoice(options.progression, store.data.progressions);
    stopPreview = playStrumPattern({
      pattern,
      midis: chordMidis(prog.chords[0]),
      bpm: options.tempo,
      onCell: (i) => { if (!listen.isConnected) { stopPreview?.(); return; } cells.light(i); },
      onEnd: done,
    });
    if (stopPreview) { label.textContent = T.stopPattern; listen.setAttribute('aria-pressed', 'true'); }
  });
  return [
    h('h2', { class: 'section-title' }, opt.label),
    segmented({
      label: opt.label,
      value,
      options: opt.byLevel[level].map((id) => ({ value: id, label: getStrumPattern(id).title })),
      onChange: (v) => { stopPreview?.(); onChange(v); },
    }),
    h('div', { class: 'card setup__pattern' }, cells, h('div', { class: 'btn-row' }, listen)),
  ];
}

/* ----- Pareja de acordes ----- */

function pairOption({ opt, exercise, level, value, onChange }) {
  const allowed = exercise.levels[level].chords;
  const slot = (i, title) => listRow({
    title,
    subtitle: null,
    end: ChordLabel(getChord(value[i])),
    onClick: () => openChordPicker({
      allowed: allowed.filter((id) => id !== value[1 - i]),
      value: value[i],
      onSelect: (id) => { const next = [...value]; next[i] = id; onChange(next); },
    }),
  });
  return [
    h('h2', { class: 'section-title' }, opt.label),
    h('div', { class: 'list' }, slot(0, T.pairFirst), slot(1, T.pairSecond)),
  ];
}

/**
 * Una opción de la preparación, o null si su tipo lo dibuja setup.js (metrónomo y elección).
 * ctx: { exercise, level, value, options, onChange(valor), save(patch de opciones guardadas), redraw }
 */
export function renderOption(opt, ctx) {
  const { level, value } = ctx;
  switch (opt.type) {
    case 'toggle':
      return h('div', { class: 'card setup__option' }, settingRow({
        label: opt.label,
        hint: opt.hint,
        control: toggle({ label: opt.label, checked: value, onChange: ctx.onChange }),
      }));
    case 'progression':
      return progressionOption(ctx);
    case 'strum-pattern':
      return strumOption({ ...ctx, opt });
    case 'tempo': {
      const { min, max } = opt.byLevel[level];
      const set = (bpm) => ctx.save({ [opt.id]: { ...(ctx.saved[opt.id] ?? {}), [level]: Math.min(max, Math.max(min, bpm)) } });
      return h('div', { class: 'card setup__option' }, settingRow({
        label: opt.label,
        hint: `${min}–${max} BPM en este nivel`,
        control: h('div', { class: 'stepper' },
          iconButton({ iconName: 'minus', label: 'Bajar el tempo', onClick: () => set(value - opt.step) }),
          h('span', { class: 'stepper__value' }, `${value} BPM`),
          iconButton({ iconName: 'plus', label: 'Subir el tempo', onClick: () => set(value + opt.step) })),
      }));
    }
    case 'chord-pair':
      return pairOption({ ...ctx, opt });
    case 'level-choice':
      return [
        h('h2', { class: 'section-title' }, opt.label),
        segmented({ label: opt.label, value, options: opt.byLevel[level].map((id) => ({ value: id, label: opt.choiceLabel(id) })), onChange: ctx.onChange }),
      ];
    default:
      return null;
  }
}

/** Para dejar de sonar al salir de la preparación. */
export function stopSetupSound() {
  stopPreview?.();
}

/** Escuchar el patrón del Calentamiento (la ida) con el selector de velocidad (6.7). */
export function warmupPreview(exercise, setup) {
  const plan = exercise.generate(exercise.levels[setup.level], null, { options: setup.options, level: setup.level });
  const ida = { ...plan.tab, events: plan.tab.events.slice(0, plan.tab.events.length / 2) };
  return [
    h('h2', { class: 'section-title' }, 'Patrón'),
    h('div', { class: 'card setup__tab' }, Tab(ida, { tuning: getTuning(setup.tuning), bpm: plan.startBpm, player: true, fretboardToggle: true, label: 'Tablatura de la ida' })),
  ];
}
