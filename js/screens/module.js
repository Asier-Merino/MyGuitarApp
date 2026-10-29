// Pantalla de un módulo (BUILD_PLAN 6.6.3). En Teoría, con lección: Aprender y Consulta arriba
// y la lista de ejercicios debajo. En Práctica (y en Oído), solo la lista de ejercicios.

import { h, list, listRow, badge } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { renderScreen } from './screen.js';
import { getModule, moduleTitle, moduleExercises } from '../data/modules.js';
import { store } from '../state.js';

function tile({ href, title, text, featured, tag }) {
  return h('a', { class: ['btn', 'btn--grey', 'tile', featured && 'tile--featured'].filter(Boolean).join(' '), href },
    h('span', { class: 'tile__title' }, title),
    text && h('span', { class: 'tile__text' }, text),
    tag,
  );
}

export function renderModule(view, { section, module: slug }, nav) {
  const mod = getModule(slug);
  const exercises = moduleExercises(section, slug);
  const withLesson = section === 'teoria' && mod.lesson;
  const lessonDone = Boolean(store.data.lessons[slug]);

  renderScreen(view, {
    title: moduleTitle(mod, section),
    nav,
    help: withLesson ? 'moduleTheory' : 'modulePractice',
    content: [
      withLesson && h('div', { class: 'tiles' },
        tile({
          href: `#/teoria/${slug}/aprender`,
          title: 'Aprender',
          featured: !lessonDone,
          tag: lessonDone
            ? badge('Completada ✓')
            : badge('Recomendado antes de empezar', 'amber'),
        }),
        tile({ href: `#/teoria/${slug}/consulta`, title: 'Consulta', text: mod.reference }),
      ),
      h('h2', { class: 'section-title' }, 'Ejercicios'),
      exercises.length
        ? list(exercises.map((ex) => listRow({ href: `#/${section}/${slug}/${ex.slug}`, title: ex.title, subtitle: ex.description })))
        : h('p', { class: 'empty' }, icon('info', { size: 20 }), h('span', {}, `Los ejercicios de este módulo llegan en la Fase ${mod.phase}.`)),
    ],
  });
}
