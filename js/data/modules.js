// Secciones y módulos de la app (BUILD_PLAN 1 y 6.6.2), sin DOM.
// `phase`: fase en la que se construye. Mientras no esté construido, se muestra como "Próximamente".

export const SECTIONS = Object.freeze({
  teoria: Object.freeze({ id: 'teoria', title: 'Teoría', subtitle: 'Sin guitarra' }),
  practica: Object.freeze({ id: 'practica', title: 'Práctica', subtitle: 'Guitarra en mano' }),
});

export const SECTION_IDS = Object.freeze(Object.keys(SECTIONS));

export const LEVELS = Object.freeze([
  { id: 'basico', title: 'Básico' },
  { id: 'intermedio', title: 'Intermedio' },
  { id: 'avanzado', title: 'Avanzado' },
].map(Object.freeze));

export const LEVEL_IDS = Object.freeze(LEVELS.map((l) => l.id));

const m = (slug, props) => Object.freeze({ slug, lesson: false, reference: null, ...props });

export const MODULES = Object.freeze([
  m('notas', { title: 'Notas del mástil', icon: 'note', phase: 2, lesson: true, reference: 'El mástil con todas las notas' }),
  m('acordes', { title: 'Acordes abiertos', practiceTitle: 'Acordes abiertos (con rasgueo)', icon: 'chord', phase: 3, lesson: true, reference: 'Biblioteca de acordes' }),
  m('oido', { title: 'Oído', icon: 'ear', phase: 4 }),
  m('tonalidad', { title: 'Escala y tonalidad', icon: 'scale', phase: 5, lesson: true, reference: 'Escala y acordes de cada tonalidad' }),
  m('blues', { title: 'Blues y slide', icon: 'blues', phase: 6, lesson: true, reference: 'Cajas y 12 compases' }),
  m('caged', { title: 'CAGED', icon: 'caged', phase: 7, lesson: true, reference: 'Explorador de las 5 formas' }),
  m('calentamiento', { title: 'Calentamiento', icon: 'warmup', phase: 3 }),
]);

/** Orden de los módulos en cada sección (BUILD_PLAN 6.6.2). */
export const SECTION_MODULES = Object.freeze({
  teoria: Object.freeze(['notas', 'acordes', 'oido', 'tonalidad', 'blues', 'caged']),
  practica: Object.freeze(['calentamiento', 'notas', 'acordes', 'oido', 'tonalidad', 'blues', 'caged']),
});

/** Fase en la que llega la sesión mezclada. */
export const MIXED_SESSION_PHASE = 8;

/**
 * Ejercicios previstos (BUILD_PLAN 8). Solo nombre y frase de la preparación: el ejercicio
 * en sí (con howTo, concepts, check y why) se registra en su fase. `tunings` sigue 7.6.
 */
const x = (module, section, slug, title, description, { tunings = 'standard', phase }) =>
  Object.freeze({ id: `${module}.${section}.${slug}`, module, section, slug, title, description, tunings, phase });

export const PLANNED_EXERCISES = Object.freeze([
  x('notas', 'teoria', 'que-nota', '¿Qué nota es?', 'Se ilumina un traste y respondes qué nota es.', { phase: 2 }),
  x('notas', 'teoria', 'encuentrala', 'Encuéntrala', 'Te piden una nota en una cuerda y la tocas en el mástil.', { phase: 2 }),
  x('notas', 'teoria', 'todas-en-una-cuerda', 'Todas en una cuerda', 'Encuentras todas las posiciones de una nota en una cuerda, del traste 0 al 12.', { phase: 2 }),
  x('notas', 'teoria', 'octavas', 'Octavas', 'Ves una nota marcada en el mástil y tocas su octava con la forma correcta.', { phase: 2 }),
  x('notas', 'teoria', 'unisonos', 'Unísonos', 'Ves un punto marcado y tocas la misma nota exacta en la cuerda indicada.', { tunings: 'any', phase: 2 }),
  x('notas', 'teoria', 'rellena', 'Rellena el mástil', 'Completas una cuerda vacía, del traste 0 al 12.', { phase: 2 }),
  x('notas', 'teoria', 'contrarreloj', 'Contrarreloj', 'Todos los aciertos que puedas en 60 segundos.', { phase: 2 }),
  x('notas', 'practica', 'todas-las-cuerdas', 'Nota por todas las cuerdas', 'La app dice una nota y la tocas en las 6 cuerdas antes de que acabe el tiempo.', { phase: 2 }),
  x('notas', 'practica', 'cuerda-a-cuerda', 'Cuerda a cuerda', 'Eliges una cuerda y la app dice notas al azar para que las toques.', { phase: 2 }),
  x('notas', 'practica', 'paseo-octavas', 'Paseo de octavas', 'La app dice una nota y la tocas; después, su octava.', { phase: 2 }),
  x('notas', 'practica', 'unisonos', 'Unísonos', 'La app dice un punto del mástil; lo tocas y después su unísono en la cuerda de al lado.', { tunings: 'any', phase: 2 }),
]);

export function getModule(slug) {
  return MODULES.find((mod) => mod.slug === slug) ?? null;
}

export function moduleTitle(mod, section) {
  return (section === 'practica' && mod.practiceTitle) || mod.title;
}

export function sectionModules(section) {
  return (SECTION_MODULES[section] ?? []).map(getModule);
}

export function moduleExercises(section, slug) {
  return PLANNED_EXERCISES.filter((e) => e.section === section && e.module === slug);
}

export function getPlannedExercise(section, slug, exerciseSlug) {
  return PLANNED_EXERCISES.find((e) => e.section === section && e.module === slug && e.slug === exerciseSlug) ?? null;
}

/** Última fase construida: lo de fases posteriores se muestra como "Próximamente". */
export const BUILT_THROUGH_PHASE = 1;

export const isAvailable = (item) => item.phase <= BUILT_THROUGH_PHASE;
