// Inicio (BUILD_PLAN 6.6.1): Perfil y Ajustes como iconos, logo y cuatro botones grandes.
// "Continuar" (único botón ámbar) y la racha aparecen cuando haya historial (Fase 1B).

import { h, render, iconButton } from '../ui/components.js';
import { icon, logo } from '../ui/icons.js';
import { APP_NAME } from '../version.js';

const MENU = [
  { href: '#/teoria', iconName: 'theory', title: 'Teoría', subtitle: 'Sin guitarra' },
  { href: '#/practica', iconName: 'guitar', title: 'Práctica', subtitle: 'Guitarra en mano' },
  { href: '#/afinaciones', iconName: 'tuningFork', title: 'Afinaciones', subtitle: 'Ver las afinaciones' },
  { href: '#/glosario', iconName: 'glossary', title: 'Glosario', subtitle: 'Todos los conceptos' },
];

export function renderHome(view) {
  render(view,
    h('div', { class: 'home' },
      h('div', { class: 'home__top' },
        iconButton({ iconName: 'user', label: 'Perfil', href: '#/perfil', className: 'icon-btn--amber' }),
        iconButton({ iconName: 'settings', label: 'Ajustes', href: '#/ajustes', className: 'icon-btn--amber' }),
      ),
      h('div', { class: 'home__brand' },
        logo({ size: 76 }),
        h('h1', { class: 'home__name' }, APP_NAME),
      ),
      h('nav', { class: 'home__menu', 'aria-label': 'Secciones' },
        MENU.map((item) => h('a', { class: 'btn btn--grey menu-btn', href: item.href },
          h('span', { class: 'menu-btn__icon' }, icon(item.iconName, { size: 30 })),
          h('span', { class: 'menu-btn__text' },
            h('span', { class: 'menu-btn__title' }, item.title),
            h('span', { class: 'menu-btn__subtitle' }, item.subtitle),
          ),
        )),
      ),
    ),
  );
}
