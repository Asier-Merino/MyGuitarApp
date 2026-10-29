// Sección Teoría o Práctica (BUILD_PLAN 6.6.2): Sesión mezclada arriba y la lista de módulos.

import { h, button, list, listRow } from '../ui/components.js';
import { renderScreen } from './screen.js';
import { SECTIONS, sectionModules, moduleTitle, isAvailable } from '../data/modules.js';

export function renderSection(view, { section }, nav) {
  const info = SECTIONS[section];
  renderScreen(view, {
    title: info.title,
    nav,
    help: section,
    content: [
      button({ label: 'Sesión mezclada', iconName: 'star', variant: 'primary', href: `#/${section}/mezclada`, block: true }),
      h('h2', { class: 'section-title' }, 'Módulos'),
      list(sectionModules(section).map((mod) => listRow({
        href: `#/${section}/${mod.slug}`,
        iconName: mod.icon,
        title: moduleTitle(mod, section),
        subtitle: isAvailable(mod) ? null : 'Próximamente',
        muted: !isAvailable(mod),
      }))),
    ],
  });
}
