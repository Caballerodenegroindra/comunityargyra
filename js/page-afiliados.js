/* Directorio público de afiliados, con filtros. */
import './page-shell.js';
import { esc, badge, progress, avatar, empty, tags } from './ui.js';
import { KIND_LABELS, SUPPORT_AREAS } from './model.js';
import { watchPublicAffiliates } from './data.js';

const lista = document.getElementById('lista');
let items = null;
let filter = 'todos';

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

function render() {
  if (items === null) return;

  const visible = items.filter((a) => {
    if (filter === 'todos') return true;
    if (filter === 'comunidad' || filter === 'grupo') return a.kind === filter;
    return a.status === filter;
  });

  lista.innerHTML = visible.length
    ? `<ul class="list">${visible.map(card).join('')}</ul>`
    : empty('No hay afiliados en esta vista.', 'El tuyo puede ser el primero: envía tu solicitud y verifica tu grupo.');
}

document.getElementById('filtros').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  document.querySelectorAll('#filtros .chip').forEach((c) => c.classList.remove('active'));
  button.classList.add('active');
  filter = button.dataset.filter;
  render();
});

watchPublicAffiliates((list) => { items = list; render(); });
