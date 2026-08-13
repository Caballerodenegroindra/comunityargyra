/* Aprobar, rechazar, suspender y editar usuarios. */
import './page-shell.js';
import { esc, badge, formatDate } from './ui.js';
import { requireAuth } from './auth.js';
import { listUsers, setUserStatus, updateUser } from './data.js';

const lista = document.getElementById('lista');
const ACCIONES = [
  ['approved', 'Aprobar'],
  ['rejected', 'Rechazar'],
  ['suspended', 'Suspender'],
  ['pending', 'Restablecer'],
];

let users = [];
let filter = 'all';
let editing = null;

function render() {
  const visible = users.filter((u) => filter === 'all' || u.status === filter);

  lista.innerHTML = visible.length === 0
    ? '<p class="small text-soft">No hay usuarios con ese estado.</p>'
    : `<ul class="list">${visible.map((u) => `
        <li class="card">
          <div class="item-head">
            <div>
              <p>${esc(u.nick)}</p>
              <p class="mono break-all mt-sm">${esc(u.email)} · ${esc(u.whatsapp)}</p>
              <p class="mono">Alta: ${esc(formatDate(u.createdAt))}</p>
            </div>
            ${badge(u.status, 'user')}
          </div>

          ${editing === u.uid ? `
            <label class="field mt-md">
              <span class="field__label">Nick</span>
              <input class="input" id="nick-${esc(u.uid)}" value="${esc(u.nick)}" />
            </label>
            <label class="field">
              <span class="field__label">WhatsApp</span>
              <input class="input" id="wa-${esc(u.uid)}" value="${esc(u.whatsapp)}" />
            </label>
            <div class="btn-row">
              <button class="btn btn--primary btn--sm" data-guardar="${esc(u.uid)}">Guardar</button>
              <button class="btn btn--ghost btn--sm" data-cancelar="1">Cancelar</button>
            </div>`
          : `
            <div class="btn-row mt-md">
              ${ACCIONES.filter(([s]) => s !== u.status).map(([s, label]) =>
                `<button class="btn btn--secondary btn--sm" data-estado="${esc(s)}" data-uid="${esc(u.uid)}">${esc(label)}</button>`
              ).join('')}
              <button class="btn btn--secondary btn--sm" data-editar="${esc(u.uid)}">Editar</button>
            </div>`}
        </li>`).join('')}</ul>`;
}

async function load() {
  users = await listUsers();
  render();
}

const session = await requireAuth({ adminOnly: true });
if (session) {
  document.getElementById('filtros').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    document.querySelectorAll('#filtros .chip').forEach((c) => c.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter;
    render();
  });

  lista.addEventListener('click', async (event) => {
    const estado = event.target.closest('[data-estado]');
    if (estado) {
      await setUserStatus(estado.dataset.uid, estado.dataset.estado);
      await load();
      return;
    }

    const editar = event.target.closest('[data-editar]');
    if (editar) { editing = editar.dataset.editar; render(); return; }

    if (event.target.closest('[data-cancelar]')) { editing = null; render(); return; }

    const guardar = event.target.closest('[data-guardar]');
    if (guardar) {
      const uid = guardar.dataset.guardar;
      await updateUser(uid, {
        nick: document.getElementById(`nick-${uid}`).value.trim(),
        whatsapp: document.getElementById(`wa-${uid}`).value.trim(),
      });
      editing = null;
      await load();
    }
  });

  await load();
}
