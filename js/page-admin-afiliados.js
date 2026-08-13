/* Verificar administraciones, mover el turno y dejar comentarios. */
import './page-shell.js';
import { esc, badge, progress, tags, notice } from './ui.js';
import { KIND_LABELS, AFFILIATE_STATUS, SUPPORT_AREAS } from './model.js';
import { requireAuth } from './auth.js';
import {
  watchAllAffiliates, setAffiliateStatus, verifyAffiliate, updateAffiliate,
  getRequestByAffiliate, setRequestNotes,
} from './data.js';

const turnoBox = document.getElementById('turno');
const lista = document.getElementById('lista');

const FLOW = ['waiting', 'verifying', 'approved', 'in_progress', 'completed'];

let items = [];
let editing = null;
const notes = new Map();

function render() {
  const current = items.find((a) => a.status === 'in_progress');

  turnoBox.innerHTML = `
    <p class="eyebrow">Turno actual</p>
    <p class="mt-sm">${current ? esc(current.name) : 'Ningún afiliado en proceso.'}</p>
    <p class="mono mt-sm">Argyra acompaña a uno por vez. Para dar un turno nuevo, marca el actual como resuelto.</p>`;

  lista.innerHTML = items.length === 0
    ? '<p class="small text-soft">No hay afiliados registrados.</p>'
    : `<ul class="list">${items.map((a) => `
        <li class="card">
          <div class="item-head">
            <div>
              <p>${esc(a.name)}</p>
              <p class="eyebrow mt-sm">${esc(KIND_LABELS[a.kind] || a.kind)} · ${esc(a.ownerNick)}</p>
              <p class="mono break-all">${esc(a.ownerUid)}</p>
            </div>
            ${badge(a.status)}
          </div>

          <div class="mt-md">${progress(a.progress, 'Metas')}</div>
          <ul class="tag-row mt-md">${tags(a.requestedAreas, SUPPORT_AREAS)}</ul>

          ${editing === a.id ? `
            <label class="field mt-md">
              <span class="field__label">Nombre</span>
              <input class="input" id="name-${esc(a.id)}" value="${esc(a.name)}" />
            </label>
            <label class="field">
              <span class="field__label">Nick del administrador</span>
              <input class="input" id="nick-${esc(a.id)}" value="${esc(a.ownerNick)}" />
            </label>
            <div class="btn-row">
              <button class="btn btn--primary btn--sm" data-guardar="${esc(a.id)}">Guardar</button>
              <button class="btn btn--ghost btn--sm" data-cancelar="1">Cancelar</button>
            </div>`
          : `
            <div class="btn-row mt-md">
              <button class="btn btn--secondary btn--sm" data-verificar="${esc(a.id)}" data-valor="${a.isAdminVerified ? '0' : '1'}">
                ${a.isAdminVerified ? 'Quitar verificación' : 'Confirmar que administra'}
              </button>
              ${FLOW.filter((s) => s !== a.status).map((s) =>
                `<button class="btn btn--secondary btn--sm" data-estado="${esc(s)}" data-id="${esc(a.id)}">${esc(AFFILIATE_STATUS[s])}</button>`
              ).join('')}
              <button class="btn btn--secondary btn--sm" data-editar="${esc(a.id)}">Editar datos</button>
            </div>`}

          <div id="err-${esc(a.id)}"></div>

          <div class="mt-md" style="border-top:1px solid var(--edge);padding-top:1rem">
            <label class="field__label" for="nota-${esc(a.id)}">Comentario para el solicitante</label>
            <textarea class="textarea" id="nota-${esc(a.id)}" rows="3"
              placeholder="Lo que escribas aquí aparece en el panel del usuario.">${esc(notes.get(a.id) || '')}</textarea>
            <button class="btn btn--primary btn--sm mt-sm" data-nota="${esc(a.id)}">Guardar comentario</button>
          </div>
        </li>`).join('')}</ul>`;
}

const session = await requireAuth({ adminOnly: true });
if (session) {
  lista.addEventListener('click', async (event) => {
    const estado = event.target.closest('[data-estado]');
    if (estado) {
      try {
        await setAffiliateStatus(estado.dataset.id, estado.dataset.estado);
      } catch (error) {
        notice(document.getElementById(`err-${estado.dataset.id}`), error.message);
      }
      return;
    }

    const verificar = event.target.closest('[data-verificar]');
    if (verificar) {
      await verifyAffiliate(verificar.dataset.verificar, verificar.dataset.valor === '1');
      return;
    }

    const editar = event.target.closest('[data-editar]');
    if (editar) { editing = editar.dataset.editar; render(); return; }

    if (event.target.closest('[data-cancelar]')) { editing = null; render(); return; }

    const guardar = event.target.closest('[data-guardar]');
    if (guardar) {
      const id = guardar.dataset.guardar;
      await updateAffiliate(id, {
        name: document.getElementById(`name-${id}`).value.trim(),
        ownerNick: document.getElementById(`nick-${id}`).value.trim(),
      });
      editing = null;
      return;
    }

    const nota = event.target.closest('[data-nota]');
    if (nota) {
      const id = nota.dataset.nota;
      const texto = document.getElementById(`nota-${id}`).value;
      const request = await getRequestByAffiliate(id);
      if (!request) { nota.textContent = 'Sin solicitud asociada'; return; }
      notes.set(id, texto);
      await setRequestNotes(request.id, texto);
      nota.textContent = 'Comentario guardado';
      setTimeout(() => { nota.textContent = 'Guardar comentario'; }, 2500);
    }
  });

  watchAllAffiliates(async (list) => {
    items = list;
    /* Cargamos los comentarios existentes una sola vez por afiliado. */
    await Promise.all(items.map(async (a) => {
      if (notes.has(a.id)) return;
      const request = await getRequestByAffiliate(a.id).catch(() => null);
      notes.set(a.id, request?.notes || '');
    }));
    render();
  });
}
