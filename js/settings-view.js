// Pantalla de ajustes (BUILD_PLAN 6.5). Las opciones de mástil, sonido y voz
// se añadirán en las fases que las usan.

import { h, render, segmented, settingRow } from './ui/components.js';
import { NoteLabel } from './ui/note-label.js';
import { settings, store } from './state.js';
import { APP_VERSION } from './version.js';
import { applyUpdate, checkForUpdate } from './pwa.js';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

function exportFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `myguitarapp-progreso-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

async function exportProgress(setStatus) {
  const name = exportFileName();
  const json = store.exportJSON();
  const file = new File([json], name, { type: 'application/json' });
  try {
    // En el iPhone, el menú Compartir permite "Guardar en Archivos".
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Progreso de MyGuitarApp' });
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

export function renderSettings(container) {
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
      if (!confirm('Importar sustituirá tu progreso y tus ajustes actuales. ¿Continuar?')) return;
      const result = store.importJSON(await file.text());
      if (result.ok) {
        pendingStatus = 'Progreso importado.';
        settings.reload(); // vuelve a pintar la pantalla
      } else {
        setStatus(result.error, true);
      }
    },
  });

  const updateBtn = h('button', {
    type: 'button',
    class: 'btn',
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
  }, 'Buscar actualización');

  const preview = h('span', { class: 'setting__hint' }, 'Ejemplo: ', NoteLabel(6), ' · ', NoteLabel(10));

  render(container, 
    h('h1', {}, 'Ajustes'),

    !store.persistent && h('p', { class: 'notice' },
      'Este navegador no permite guardar datos: los ajustes y el progreso se perderán al cerrar la app.'),

    h('section', { class: 'settings-group', 'aria-labelledby': 'g-notation' },
      h('h2', { id: 'g-notation' }, 'Notación'),
      h('div', { class: 'card' },
        settingRow({
          label: 'Notación principal',
          hint: 'La otra se muestra en pequeño al lado.',
          control: segmented({
            label: 'Notación principal',
            value: s.notation,
            options: [
              { value: 'es', label: 'ES', ariaLabel: 'Español (Do, Re, Mi)' },
              { value: 'en', label: 'EN', ariaLabel: 'Inglés (C, D, E)' },
            ],
            onChange: (v) => settings.set('notation', v),
          }),
        }),
        settingRow({
          label: 'Alteraciones',
          hint: 'Para notas sin tonalidad, como en el mástil.',
          control: segmented({
            label: 'Alteraciones',
            value: s.accidentals,
            options: [
              { value: 'sharp', label: '♯', ariaLabel: 'Sostenidos' },
              { value: 'flat', label: '♭', ariaLabel: 'Bemoles' },
            ],
            onChange: (v) => settings.set('accidentals', v),
          }),
        }),
        h('div', { class: 'setting' }, preview),
      ),
    ),

    h('section', { class: 'settings-group', 'aria-labelledby': 'g-look' },
      h('h2', { id: 'g-look' }, 'Apariencia'),
      h('div', { class: 'card' },
        settingRow({
          label: 'Tema',
          hint: 'El oscuro es cómodo para practicar con poca luz.',
          control: segmented({
            label: 'Tema',
            value: s.theme,
            options: [
              { value: 'system', label: 'Sistema' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ],
            onChange: (v) => settings.set('theme', v),
          }),
        }),
      ),
    ),

    h('section', { class: 'settings-group', 'aria-labelledby': 'g-progress' },
      h('h2', { id: 'g-progress' }, 'Progreso'),
      h('div', { class: 'card' },
        h('p', { class: 'setting__hint' },
          'Tu progreso se guarda solo en este dispositivo. Haz una copia de vez en cuando.'),
        h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn', onClick: () => exportProgress(setStatus) }, 'Exportar'),
          h('button', { type: 'button', class: 'btn', onClick: () => fileInput.click() }, 'Importar'),
          h('button', {
            type: 'button',
            class: 'btn btn--danger',
            onClick: () => {
              if (!confirm('¿Borrar todo el progreso? Los ajustes se conservan. No se puede deshacer.')) return;
              setStatus(store.clearProgress() ? 'Progreso borrado.' : 'No se pudo borrar.', false);
            },
          }, 'Borrar progreso'),
        ),
        fileInput,
      ),
    ),

    h('section', { class: 'settings-group', 'aria-labelledby': 'g-app' },
      h('h2', { id: 'g-app' }, 'App'),
      h('div', { class: 'card' },
        settingRow({ label: 'Versión', control: h('strong', {}, `v${APP_VERSION}`) }),
        settingRow({
          label: 'Actualizaciones',
          hint: isStandalone() ? 'Instalada en la pantalla de inicio.' : 'Abierta en el navegador.',
          control: updateBtn,
        }),
      ),
    ),

    status,
  );
}
