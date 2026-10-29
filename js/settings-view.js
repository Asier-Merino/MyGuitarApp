// Pantalla de ajustes (BUILD_PLAN 6.5): lista agrupada, cada opción con su control.
// Todo se guarda al momento.

import { h, button, segmented, settingRow, toggle, group } from './ui/components.js';
import { NoteLabel } from './ui/note-label.js';
import { renderScreen } from './screens/screen.js';
import { tuningRow, openTuningPicker } from './ui/tuning-picker.js';
import { confirmSheet } from './ui/help-sheet.js';
import { settings, store } from './state.js';
import { APP_NAME, APP_VERSION } from './version.js';
import { applyUpdate, checkForUpdate } from './pwa.js';
import { TUNINGS, getTuning } from './data/tunings.js';
import { UI_TEXTS } from './data/concepts.js';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

function exportFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `guitarseo-copia-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

async function exportProgress(setStatus) {
  const name = exportFileName();
  const file = new File([store.exportJSON()], name, { type: 'application/json' });
  try {
    // En el iPhone, el menú Compartir permite "Guardar en Archivos".
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Copia de ${APP_NAME}` });
      setStatus('Copia exportada.');
      return;
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  setStatus('Copia descargada.');
}

// Mensaje pendiente de mostrar tras volver a pintar la pantalla (p. ej. al importar).
let pendingStatus = null;

export function renderSettings(view, params, nav) {
  const s = settings.all();
  const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('status--error', isError);
  };
  if (pendingStatus) {
    setStatus(pendingStatus);
    pendingStatus = null;
  }

  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'sr-only',
    tabindex: '-1',
    'aria-hidden': 'true',
    onChange: async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      const ok = await confirmSheet({
        title: 'Importar copia',
        text: UI_TEXTS.importConfirm,
        confirmLabel: 'Importar',
      });
      if (!ok) return;
      const result = store.importJSON(await file.text());
      if (result.ok) {
        pendingStatus = 'Copia importada.';
        settings.reload(); // vuelve a pintar la pantalla
      } else {
        setStatus(result.error, true);
      }
    },
  });

  const updateBtn = button({
    label: 'Buscar actualización',
    onClick: async () => {
      updateBtn.disabled = true;
      setStatus('Buscando…');
      const result = await checkForUpdate();
      updateBtn.disabled = false;
      const messages = {
        none: 'Ya tienes la última versión.',
        local: 'En desarrollo local no se usan actualizaciones.',
        unsupported: 'Este navegador no permite buscar actualizaciones. Recarga la página.',
        error: 'No se pudo comprobar. ¿Hay conexión a internet?',
      };
      if (result === 'ready') {
        setStatus('Hay una versión nueva. Actualizando…');
        applyUpdate();
      } else {
        setStatus(messages[result], result === 'error');
      }
    },
  });

  const set = (key) => (value) => settings.set(key, value);

  renderScreen(view, {
    title: 'Ajustes',
    nav,
    help: 'settings',
    className: 'settings',
    content: [
      !store.persistent && h('p', { class: 'notice' }, UI_TEXTS.noStorage),

      group('Notación y aspecto',
        settingRow({
          label: 'Notación principal',
          hint: h('span', {}, `${UI_TEXTS.hints.notation} `, NoteLabel(6), ' · ', NoteLabel(10)),
          control: segmented({
            label: 'Notación principal',
            value: s.notation,
            options: [
              { value: 'es', label: 'ES', ariaLabel: 'Español' },
              { value: 'en', label: 'EN', ariaLabel: 'Inglés' },
            ],
            onChange: set('notation'),
          }),
        }),
        settingRow({
          label: 'Alteraciones',
          hint: UI_TEXTS.hints.accidentals,
          control: segmented({
            label: 'Alteraciones',
            value: s.accidentals,
            options: [
              { value: 'sharp', label: '♯', ariaLabel: 'Sostenidos' },
              { value: 'flat', label: '♭', ariaLabel: 'Bemoles' },
            ],
            onChange: set('accidentals'),
          }),
        }),
        settingRow({
          label: 'Tema',
          hint: UI_TEXTS.hints.theme,
          control: segmented({
            label: 'Tema',
            value: s.theme,
            options: [
              { value: 'dark', label: 'Oscuro' },
              { value: 'light', label: 'Claro' },
              { value: 'system', label: 'Auto', ariaLabel: 'Automático' },
            ],
            onChange: set('theme'),
          }),
        }),
      ),

      group('Mástil',
        settingRow({
          label: 'Orientación',
          hint: UI_TEXTS.hints.orientation,
          control: segmented({
            label: 'Orientación del mástil',
            value: s.fretboardOrientation,
            options: [
              { value: 'auto', label: 'Auto', ariaLabel: 'Automática' },
              { value: 'vertical', label: 'Vertical' },
              { value: 'horizontal', label: 'Horiz.', ariaLabel: 'Horizontal' },
            ],
            onChange: set('fretboardOrientation'),
          }),
        }),
        settingRow({
          label: 'Mostrar en los puntos',
          control: segmented({
            label: 'Mostrar en los puntos',
            value: s.fretboardLabels,
            options: [
              { value: 'notes', label: 'Notas' },
              { value: 'intervals', label: 'Intervalos' },
            ],
            onChange: set('fretboardLabels'),
          }),
        }),
      ),

      group('Sonido y voz',
        settingRow({ label: 'Sonido', control: toggle({ label: 'Sonido', checked: s.sound, onChange: set('sound') }) }),
        settingRow({
          label: 'Volumen',
          stacked: true,
          control: h('input', {
            type: 'range',
            class: 'slider',
            min: '0',
            max: '1',
            step: '0.05',
            value: String(s.volume),
            'aria-label': 'Volumen',
            disabled: !s.sound,
            // Se guarda al soltar, para no volver a pintar la pantalla mientras se arrastra.
            onChange: (e) => settings.set('volume', Number(e.target.value)),
          }),
        }),
        settingRow({
          label: 'Voz en Práctica',
          hint: UI_TEXTS.hints.voice,
          control: toggle({ label: 'Voz en Práctica', checked: s.voice, onChange: set('voice') }),
        }),
      ),

      group('Afinación',
        settingRow({
          label: 'Afinación por defecto',
          hint: UI_TEXTS.hints.defaultTuning,
          stacked: true,
          control: h('div', { class: 'list list--inset' }, tuningRow({
            tuning: getTuning(s.defaultTuning),
            label: 'Afinación por defecto',
            onClick: () => openTuningPicker({
              title: 'Afinación por defecto',
              allowed: TUNINGS,
              value: s.defaultTuning,
              onSelect: set('defaultTuning'),
            }),
          })),
        }),
        settingRow({
          label: 'Preguntar antes de cada ejercicio',
          control: toggle({ label: 'Preguntar la afinación antes de cada ejercicio', checked: s.askTuning, onChange: set('askTuning') }),
        }),
      ),

      group('Tus datos',
        h('p', { class: 'setting__hint data-note' }, UI_TEXTS.storageNote),
        h('div', { class: 'btn-row' },
          button({ label: 'Exportar copia', onClick: () => exportProgress(setStatus) }),
          button({ label: 'Importar copia', onClick: () => fileInput.click() }),
        ),
        h('div', { class: 'btn-row' },
          button({
            label: 'Borrar todo el progreso',
            variant: 'danger',
            onClick: async () => {
              const ok = await confirmSheet({
                title: 'Borrar todo el progreso',
                text: UI_TEXTS.clearConfirm,
                confirmLabel: 'Borrar',
                danger: true,
              });
              if (ok) setStatus(store.clearProgress() ? 'Progreso borrado.' : 'No se pudo borrar.');
            },
          }),
        ),
        fileInput,
      ),

      group('App',
        settingRow({ label: 'Versión', control: h('strong', {}, `v${APP_VERSION}`) }),
        settingRow({
          label: 'Actualizaciones',
          hint: isStandalone() ? 'Instalada en la pantalla de inicio.' : 'Abierta en el navegador.',
          control: updateBtn,
        }),
      ),

      status,
    ],
  });
}
