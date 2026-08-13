/* ============================================================
   ARGYRA — Directorio de afiliados
   ============================================================
   Comunidades, grupos, en proceso y resultados son la misma lista
   con distinto criterio. Esta función la dibuja en cualquier página.
   ============================================================ */

import { esc, badge, progress, avatar, empty, tags } from './ui.js';
import { KIND_LABELS, SUPPORT_AREAS } from './model.js';
import { watchPublicAffiliates } from './data.js';

function card(a) {
  return `
    <li class="card">
      <div class="item-row">
        ${avatar(a.name, a.logoUrl)}
        <div class="item-row__body">
          <div class="item-head">
            <a class="truncate" href="afiliado.html?id=${esc(a.id)}">${esc(a.name)}</a>
            ${badge(a.status)}
          </div>
          <p class="eyebrow mt-sm">${esc(KIND_LABELS[a.kind] || a.kind)} · solicitó ${esc(a.ownerNick)}</p>
          ${a.description ? `<p class="small text-soft clamp-2 mt-sm">${esc(a.description)}</p>` : ''}
        </div>
      </div>
      <ul class="tag-row mt-md">${tags(a.requestedAreas, SUPPORT_AREAS)}</ul>
      <div class="mt-md">${progress(a.progress, 'Metas cumplidas')}</div>
    </li>`;
}

/**
 * Dibuja el directorio dentro de un contenedor.
 *
 * @param {object} options
 * @param {string} options.mount    Selector del contenedor.
 * @param {Function} [options.filter] Qué afiliados mostrar.
 * @param {string} [options.emptyTitle]
 * @param {string} [options.emptyHint]
 * @param {Function} [options.onData] Recibe la lista completa, por si la
 *                                    página quiere mostrar un resumen.
 */
export function renderDirectory({ mount, filter, emptyTitle, emptyHint, onData }) {
  const box = document.querySelector(mount);
  if (!box) return;

  watchPublicAffiliates((all) => {
    const items = filter ? all.filter(filter) : all;

    box.innerHTML = items.length
      ? `<ul class="list">${items.map(card).join('')}</ul>`
      : empty(
          emptyTitle || 'No hay afiliados en esta vista.',
          emptyHint || 'El tuyo puede ser el primero: envía tu solicitud y verifica tu grupo.',
        );

    if (onData) onData(all, items);
  });
}
