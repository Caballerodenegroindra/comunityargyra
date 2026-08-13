/* ============================================================
   ARGYRA — Utilidades de interfaz
   ============================================================
   Piezas que se repiten en todas las páginas: navegación,
   insignias, barras de progreso y escapado de texto.
   ============================================================ */

import { badgeTone, statusLabel } from './model.js';

/* ------------------------------------------------------------
   Escapar SIEMPRE lo que venga de la base de datos.
   Sin esto, un nombre con <script> se ejecutaría en la página.
   ------------------------------------------------------------ */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Solo dejamos pasar enlaces http(s): evita javascript: en href. */
export function safeUrl(url) {
  const value = String(url ?? '').trim();
  return /^https?:\/\//i.test(value) ? esc(value) : '';
}

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ------------------------------------------------------------
   Componentes en forma de texto HTML
   ------------------------------------------------------------ */
export function badge(status, kind = 'affiliate') {
  return `<span class="badge ${badgeTone(status)}">${esc(statusLabel(status, kind))}</span>`;
}

export function progress(value, label) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return `
    <div class="progress">
      <div class="progress__head">
        ${label ? `<span class="progress__label">${esc(label)}</span>` : '<span></span>'}
        <span class="progress__value">${safe}%</span>
      </div>
      <div class="progress__track" role="progressbar" aria-valuenow="${safe}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress__fill" style="width:${safe}%"></div>
      </div>
    </div>`;
}

/* Logo del afiliado, o su inicial si todavía no subió ninguno. */
export function avatar(name, url, large = false) {
  const cls = large ? 'avatar avatar--lg' : 'avatar';
  const src = safeUrl(url);
  return src
    ? `<img class="${cls}" src="${src}" alt="">`
    : `<div class="${cls}">${esc(String(name || '?').charAt(0).toUpperCase())}</div>`;
}

export function empty(title, hint = '') {
  return `<div class="card empty"><p>${esc(title)}</p>${hint ? `<p class="mt-sm">${esc(hint)}</p>` : ''}</div>`;
}

export function tags(keys, dict) {
  return (keys || []).map((k) => `<li class="tag">${esc(dict[k] || k)}</li>`).join('');
}

/* ------------------------------------------------------------
   Fechas de Firestore, que llegan como Timestamp
   ------------------------------------------------------------ */
export function formatDate(value) {
  if (!value) return '—';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(date);
}

/* ------------------------------------------------------------
   Navegación: marca el enlace de la página actual
   ------------------------------------------------------------ */
export function markActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.navbar__links a, .tabbar a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === page) link.classList.add('active');
  });
}

/* Lee un parámetro de la dirección, por ejemplo ?id=abc */
export function param(name) {
  return new URLSearchParams(location.search).get(name);
}

/* Deja un mensaje de error o de confirmación en un contenedor. */
export function notice(el, message, kind = 'error') {
  if (!el) return;
  el.innerHTML = message
    ? `<p class="notice notice--${kind}" role="alert">${esc(message)}</p>`
    : '';
}
