// Utilidades de interfaz: creación de elementos y controles comunes.

/** h('div', { class: 'x', onClick: fn }, 'texto', otroNodo) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, children);
  return el;
}

/** Sustituye el contenido de `el`, ignorando hijos null/false (útil con `cond && nodo`). */
export function render(el, ...children) {
  el.replaceChildren();
  return append(el, children);
}

export function append(el, children) {
  for (const child of [children].flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/**
 * Control segmentado (botones con aria-pressed).
 * options: [{ value, label, ariaLabel? }]
 */
export function segmented({ label, options, value, onChange }) {
  const group = h('div', { class: 'segmented', role: 'group', 'aria-label': label });
  for (const opt of options) {
    group.append(h('button', {
      type: 'button',
      'aria-pressed': String(opt.value === value),
      'aria-label': opt.ariaLabel,
      onClick: () => { if (opt.value !== value) onChange(opt.value); },
    }, opt.label));
  }
  return group;
}

/** Fila de ajuste: etiqueta (y pista) a la izquierda, control a la derecha. */
export function settingRow({ label, hint, control, id }) {
  return h('div', { class: 'setting' },
    h('div', { id }, h('span', { class: 'setting__label' }, label), hint && h('span', { class: 'setting__hint' }, hint)),
    control,
  );
}

/** Etiqueta pequeña, p. ej. "Próximamente · Fase 2". */
export function badge(text) {
  return h('span', { class: 'badge' }, text);
}
