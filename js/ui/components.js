// Utilidades de interfaz: creación de elementos y controles comunes (BUILD_PLAN 6.1).

import { icon } from './icons.js';

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
 * Botón físico (borde inferior que se hunde al pulsar). variant: 'grey' | 'primary' (ámbar, uno por pantalla)
 * | 'danger'. Si lleva `href` es un enlace con el mismo aspecto.
 */
export function button({ label, variant = 'grey', iconName, href, onClick, className, disabled, ariaLabel, block }) {
  const cls = ['btn', `btn--${variant}`, block && 'btn--block', className].filter(Boolean).join(' ');
  const content = [iconName && icon(iconName), label && h('span', {}, label)];
  if (href) return h('a', { class: cls, href, 'aria-label': ariaLabel }, content);
  return h('button', { type: 'button', class: cls, onClick, disabled, 'aria-label': ariaLabel }, content);
}

/** Botón redondo solo con icono (44×44). */
export function iconButton({ iconName, label, onClick, href, className }) {
  const cls = ['icon-btn', className].filter(Boolean).join(' ');
  if (href) return h('a', { class: cls, href, 'aria-label': label, title: label }, icon(iconName));
  return h('button', { type: 'button', class: cls, 'aria-label': label, title: label, onClick }, icon(iconName));
}

/**
 * Cabecera de las pantallas interiores (BUILD_PLAN 6.4): ← a la izquierda, título y "?".
 * onBack: vuelve atrás · onHelp: abre la ayuda (si falta, el hueco queda vacío).
 */
export function screenHeader({ title, onBack, onHelp, closeIcon = false }) {
  return h('header', { class: 'screen-header' },
    h('div', { class: 'screen-header__bar' },
      iconButton({ iconName: closeIcon ? 'close' : 'back', label: closeIcon ? 'Cerrar' : 'Volver', onClick: onBack }),
      h('h1', { class: 'screen-header__title' }, title),
      onHelp ? iconButton({ iconName: 'help', label: 'Ayuda', onClick: onHelp }) : h('span', { class: 'icon-btn-spacer' }),
    ),
  );
}

/**
 * Fila de lista con icono, texto, línea secundaria y chevron (BUILD_PLAN 6.1).
 * muted: módulo aún no construido (en gris). end: contenido a la derecha (p. ej. un número).
 */
export function listRow({ href, onClick, iconName, title, subtitle, muted = false, end, chevron = true }) {
  const content = [
    iconName && h('span', { class: 'row__icon' }, icon(iconName)),
    h('span', { class: 'row__text' },
      h('span', { class: 'row__title' }, title),
      subtitle && h('span', { class: 'row__subtitle' }, subtitle),
    ),
    end != null && h('span', { class: 'row__end' }, end),
    chevron && h('span', { class: 'row__chevron' }, icon('chevron', { size: 20 })),
  ];
  const cls = ['row', muted && 'row--muted'].filter(Boolean).join(' ');
  if (href) return h('a', { class: cls, href }, content);
  return h('button', { type: 'button', class: cls, onClick }, content);
}

export function list(rows) {
  return h('div', { class: 'list' }, rows);
}

/**
 * Control segmentado (botones con aria-pressed). La opción elegida lleva borde ámbar y ✓,
 * para no depender solo del color. options: [{ value, label, ariaLabel? }]
 */
export function segmented({ label, options, value, onChange, large = false }) {
  const group = h('div', { class: ['segmented', large && 'segmented--large'].filter(Boolean).join(' '), role: 'group', 'aria-label': label });
  for (const opt of options) {
    const pressed = opt.value === value;
    group.append(h('button', {
      type: 'button',
      'aria-pressed': String(pressed),
      'aria-label': opt.ariaLabel,
      onClick: () => { if (opt.value !== value) onChange(opt.value); },
    }, opt.label));
  }
  return group;
}

/** Interruptor (role="switch"): la bola cambia de lado, además del color. */
export function toggle({ label, checked, onChange }) {
  return h('button', {
    type: 'button',
    class: 'switch',
    role: 'switch',
    'aria-checked': String(checked),
    'aria-label': label,
    onClick: () => onChange(!checked),
  }, h('span', { class: 'switch__knob' }));
}

/** Fila de ajuste: etiqueta (y pista) a la izquierda, control a la derecha. */
export function settingRow({ label, hint, control, stacked = false }) {
  return h('div', { class: ['setting', stacked && 'setting--stacked'].filter(Boolean).join(' ') },
    h('div', { class: 'setting__text' },
      h('span', { class: 'setting__label' }, label),
      hint && h('span', { class: 'setting__hint' }, hint),
    ),
    control,
  );
}

/** Grupo con título pequeño y una tarjeta. */
export function group(title, ...children) {
  return h('section', { class: 'group' },
    title && h('h2', { class: 'group__title' }, title),
    h('div', { class: 'card' }, children),
  );
}

/** Dato grande con su etiqueta (Perfil). */
export function statTile(label, value) {
  return h('div', { class: 'stat' },
    h('span', { class: 'stat__value' }, value),
    h('span', { class: 'stat__label' }, label),
  );
}

/** Etiqueta pequeña, p. ej. "Próximamente". */
export function badge(text, variant) {
  return h('span', { class: ['badge', variant && `badge--${variant}`].filter(Boolean).join(' ') }, text);
}
