// Inicio (BUILD_PLAN 6.6.1): Perfil y Ajustes como iconos, logo, racha, "Continuar" (único
// botón ámbar, solo si hay historial), cuatro botones grandes y la fila Herramientas.

import { h, render, iconButton } from '../ui/components.js';
import { icon, logo } from '../ui/icons.js';
import { APP_NAME } from '../version.js';
import { store } from '../state.js';
import { practiceTotals, currentStreak } from '../core/history.js';
import { lastPlayedExercise } from '../engine/rounds.js';
import { exercisePath, exerciseModuleTitle } from '../engine/exercise-registry.js';
import { levelTitle, streakText } from '../engine/quiz-runner.js';

const MENU = [
  { href: '#/teoria', iconName: 'theory', title: 'Teoría', subtitle: 'Sin guitarra' },
  { href: '#/practica', iconName: 'guitar', title: 'Práctica', subtitle: 'Guitarra en mano' },
  { href: '#/afinaciones', iconName: 'tuningFork', title: 'Afinaciones', subtitle: 'Ver las afinaciones' },
  { href: '#/glosario', iconName: 'glossary', title: 'Glosario', subtitle: 'Todos los conceptos' },
];

/** Herramientas sueltas para tocar (6.6.1). Admite más botones sin rediseñar el Inicio. */
const TOOLS = [
  { href: '#/metronomo', iconName: 'metronome', title: 'Metrónomo' },
];

/** "Continuar": abre la preparación del último ejercicio hecho, con su nivel y afinación. */
function continueButton() {
  const last = lastPlayedExercise();
  if (!last) return null;
  const { exercise } = last;
  const level = store.data.setups[exercise.id]?.level ?? last.entry.level;
  return h('a', { class: 'btn btn--primary continue-btn', href: `#${exercisePath(exercise)}` },
    h('span', { class: 'continue-btn__icon' }, icon('play')),
    h('span', { class: 'continue-btn__text' },
      h('span', { class: 'continue-btn__title' }, 'Continuar'),
      h('span', { class: 'continue-btn__subtitle' }, `${exerciseModuleTitle(exercise)} · ${exercise.title} · ${levelTitle(level)}`),
    ),
  );
}

export function renderHome(view) {
  const history = store.data.history;
  const practiced = practiceTotals(history).days > 0;
  render(view,
    h('div', { class: 'home' },
      h('div', { class: 'home__top' },
        iconButton({ iconName: 'user', label: 'Perfil', href: '#/perfil', className: 'icon-btn--amber' }),
        iconButton({ iconName: 'settings', label: 'Ajustes', href: '#/ajustes', className: 'icon-btn--amber' }),
      ),
      h('div', { class: 'home__brand' },
        logo({ size: 76 }),
        h('h1', { class: 'home__name' }, APP_NAME),
        practiced && h('p', { class: 'home__streak' }, `Racha: ${streakText(currentStreak(history))}`),
      ),
      continueButton(),
      h('nav', { class: 'home__menu', 'aria-label': 'Secciones' },
        MENU.map((item) => h('a', { class: 'btn btn--grey menu-btn', href: item.href },
          h('span', { class: 'menu-btn__icon' }, icon(item.iconName, { size: 30 })),
          h('span', { class: 'menu-btn__text' },
            h('span', { class: 'menu-btn__title' }, item.title),
            h('span', { class: 'menu-btn__subtitle' }, item.subtitle),
          ),
        )),
      ),
      h('section', { class: 'home__tools', 'aria-labelledby': 'tools-title' },
        h('h2', { class: 'section-title', id: 'tools-title' }, 'Herramientas'),
        h('div', { class: 'tools' }, TOOLS.map((t) => h('a', { class: 'btn btn--grey tool-btn', href: t.href },
          h('span', { class: 'tool-btn__icon' }, icon(t.iconName)),
          h('span', {}, t.title),
        ))),
      ),
    ),
  );
}
