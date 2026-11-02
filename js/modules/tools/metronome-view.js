// Herramienta Metrónomo (BUILD_PLAN 6.6.18): tempo con − y + (pulsación larga = cambio rápido)
// y deslizador de 30 a 240 BPM, "Marcar el tempo tocando aquí", indicador de tiempos, tiempos
// por compás, subdivisión y Empezar / Parar (único botón ámbar). Suena sin límite de tiempo,
// mantiene la pantalla encendida mientras suena y recuerda los últimos ajustes.

import { h, segmented, render } from '../../ui/components.js';
import { icon } from '../../ui/icons.js';
import { BeatDots } from '../../ui/beats.js';
import { openConceptSheet } from '../../ui/help-sheet.js';
import { renderScreen } from '../../screens/screen.js';
import { createMetronome } from '../../audio/metronome.js';
import { soundEnabled } from '../../audio/synth.js';
import { keepScreenOn, releaseScreen } from '../../engine/wake-lock.js';
import {
  BPM_MIN, BPM_MAX, BEATS_PER_BAR_OPTIONS, SUBDIVISIONS, clampBpm, normalizeMetronome, addTap,
} from '../../core/rhythm.js';
import { store } from '../../state.js';
import { UI_TEXTS } from '../../data/concepts.js';

const REPEAT_DELAY_MS = 400;
const REPEAT_EVERY_MS = 70;

/** Botón − o + : un toque cambia 1 BPM; mantenerlo pulsado lo cambia rápido. */
function stepButton({ iconName, label, onStep }) {
  let delayTimer = null;
  let repeatTimer = null;
  const stopRepeat = () => {
    clearTimeout(delayTimer);
    clearInterval(repeatTimer);
    delayTimer = null;
    repeatTimer = null;
  };
  const btn = h('button', { type: 'button', class: 'btn btn--grey metro__step', 'aria-label': label }, icon(iconName));
  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    btn.setPointerCapture?.(e.pointerId);
    onStep();
    delayTimer = setTimeout(() => { repeatTimer = setInterval(onStep, REPEAT_EVERY_MS); }, REPEAT_DELAY_MS);
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) btn.addEventListener(ev, stopRepeat);
  btn.addEventListener('contextmenu', (e) => e.preventDefault()); // pulsación larga en el móvil
  // Con teclado (Intro o espacio) el clic llega sin puntero.
  btn.addEventListener('click', (e) => { if (e.detail === 0) onStep(); });
  return btn;
}

export function renderMetronome(view, params, nav) {
  let opts = normalizeMetronome(store.data.tools.metronome);
  let taps = [];
  let saveTimer = null;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.update((d) => { d.tools.metronome = { ...opts }; }), 300);
  };

  const bpmValue = h('output', { class: 'metro__bpm', 'aria-label': 'Tempo' }, String(opts.bpm));
  const slider = h('input', {
    type: 'range', class: 'slider metro__slider', min: String(BPM_MIN), max: String(BPM_MAX), step: '1',
    value: String(opts.bpm), 'aria-label': 'Tempo en BPM',
    onInput: (e) => setBpm(Number(e.target.value)),
  });
  const beatsBox = h('div', { class: 'metro__beats' });
  let dots = null;
  const drawDots = () => { dots = BeatDots(opts.beatsPerBar); render(beatsBox, dots); };

  const startLabel = h('span', {}, 'Empezar');
  const startIcon = h('span', { class: 'metro__start-icon' }, icon('play'));
  const startBtn = h('button', { type: 'button', class: 'btn btn--primary btn--block' }, startIcon, startLabel);

  const metronome = createMetronome({
    onPulse: ({ beat, kind }) => { if (kind !== 'sub') dots?.light(beat); },
    onStop: () => {
      dots?.clear();
      startLabel.textContent = 'Empezar';
      render(startIcon, icon('play'));
      releaseScreen();
    },
  });
  metronome.set(opts);

  function setBpm(value) {
    const bpm = clampBpm(value);
    opts = { ...opts, bpm };
    bpmValue.textContent = String(bpm);
    if (Number(slider.value) !== bpm) slider.value = String(bpm);
    metronome.set({ bpm });
    save();
  }

  const beatsGroup = h('div');
  const subGroup = h('div');
  const drawGroups = () => {
    render(beatsGroup, segmented({
      label: 'Tiempos por compás',
      value: opts.beatsPerBar,
      options: BEATS_PER_BAR_OPTIONS.map((n) => ({ value: n, label: String(n) })),
      onChange: (n) => { opts = { ...opts, beatsPerBar: n }; metronome.set({ beatsPerBar: n }); drawDots(); drawGroups(); save(); },
    }));
    render(subGroup, segmented({
      label: 'Subdivisión',
      value: opts.subdivision,
      options: SUBDIVISIONS.map((s) => ({ value: s.id, label: s.title })),
      onChange: (id) => { opts = { ...opts, subdivision: id }; metronome.set({ subdivision: id }); drawGroups(); save(); },
    }));
  };
  drawDots();
  drawGroups();

  const tapBtn = h('button', { type: 'button', class: 'btn btn--grey btn--block metro__tap' }, 'Marcar el tempo tocando aquí');
  const onTap = () => {
    const result = addTap(taps, performance.now());
    taps = result.taps;
    if (result.bpm) setBpm(result.bpm);
  };
  tapBtn.addEventListener('pointerdown', (e) => { if (e.button === 0) onTap(); });
  tapBtn.addEventListener('click', (e) => { if (e.detail === 0) onTap(); });

  startBtn.addEventListener('click', () => {
    if (metronome.running) { metronome.stop(); return; }
    if (!metronome.start()) return;
    startLabel.textContent = 'Parar';
    render(startIcon, icon('stop'));
    keepScreenOn();
  });

  renderScreen(view, {
    title: 'Metrónomo',
    nav,
    help: () => openConceptSheet('metronome'),
    className: 'metro',
    content: [
      !soundEnabled() && h('p', { class: 'notice' }, UI_TEXTS.soundOff),
      h('div', { class: 'metro__tempo' },
        stepButton({ iconName: 'minus', label: 'Bajar el tempo', onStep: () => setBpm(opts.bpm - 1) }),
        h('div', { class: 'metro__readout' }, bpmValue, h('span', { class: 'metro__unit' }, 'BPM')),
        stepButton({ iconName: 'plus', label: 'Subir el tempo', onStep: () => setBpm(opts.bpm + 1) }),
      ),
      h('div', { class: 'metro__range' }, h('span', {}, String(BPM_MIN)), slider, h('span', {}, String(BPM_MAX))),
      tapBtn,
      beatsBox,
      h('h2', { class: 'section-title' }, 'Tiempos por compás'),
      beatsGroup,
      h('h2', { class: 'section-title' }, 'Subdivisión'),
      subGroup,
      h('div', { class: 'metro__start' }, startBtn),
    ],
  });

  // Al salir de la pantalla: se para y se guarda.
  return () => {
    metronome.stop();
    releaseScreen();
    clearTimeout(saveTimer);
    store.update((d) => { d.tools.metronome = { ...opts }; });
  };
}
