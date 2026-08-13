/* Crear metas, registrar avance y asignar responsables. */
import './page-shell.js';
import { esc, badge, progress } from './ui.js';
import { requireAuth } from './auth.js';
import {
  watchAllAffiliates, watchGoals, createGoal,
  updateGoalProgress, updateGoal, deleteGoal,
} from './data.js';

const select = document.getElementById('afiliado');
const form   = document.getElementById('form');
const lista  = document.getElementById('lista');

let affiliateId = '';
let stopWatching = null;

function render(goals) {
  lista.innerHTML = goals.length === 0
    ? '<p class="small text-soft">Este afiliado todavía no tiene metas.</p>'
    : `<ul class="list">${goals.map((g) => `
        <li class="card">
          <div class="item-head">
            <h3>${esc(g.title)}</h3>
            ${badge(g.status, 'goal')}
          </div>
          ${g.description ? `<p class="small text-soft mt-sm">${esc(g.description)}</p>` : ''}
          <div class="mt-md">${progress(g.progress)}</div>

          <input type="range" min="0" max="100" step="5" value="${g.progress}"
            class="mt-sm" data-avance="${esc(g.id)}" aria-label="Avance de ${esc(g.title)}" />

          <label class="field mt-sm">
            <span class="field__label">Responsable</span>
            <input class="input" value="${esc(g.assignedTo || '')}"
              placeholder="Líder a cargo" data-responsable="${esc(g.id)}" />
          </label>

          <div class="btn-row">
            <button class="btn btn--secondary btn--sm" data-cumplir="${esc(g.id)}">Marcar cumplida</button>
            <button class="btn btn--ghost btn--sm" data-borrar="${esc(g.id)}">Eliminar</button>
          </div>
        </li>`).join('')}</ul>`;
}

const session = await requireAuth({ adminOnly: true });
if (session) {
  watchAllAffiliates((list) => {
    const previous = select.value;
    select.innerHTML = '<option value="">Elige un afiliado</option>' +
      list.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
    select.value = previous;
  });

  select.addEventListener('change', () => {
    affiliateId = select.value;
    if (stopWatching) { stopWatching(); stopWatching = null; }
    if (!affiliateId) { lista.innerHTML = ''; return; }
    stopWatching = watchGoals(affiliateId, render);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const title = (data.title || '').trim();
    if (!affiliateId || !title) return;

    await createGoal({ affiliateId, title, description: (data.description || '').trim() });
    form.reset();
  });

  lista.addEventListener('input', async (event) => {
    const range = event.target.closest('[data-avance]');
    if (range) await updateGoalProgress(range.dataset.avance, affiliateId, Number(range.value));
  });

  lista.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-responsable]');
    if (input) await updateGoal(input.dataset.responsable, { assignedTo: input.value.trim() });
  });

  lista.addEventListener('click', async (event) => {
    const cumplir = event.target.closest('[data-cumplir]');
    if (cumplir) { await updateGoalProgress(cumplir.dataset.cumplir, affiliateId, 100); return; }

    const borrar = event.target.closest('[data-borrar]');
    if (borrar) await deleteGoal(borrar.dataset.borrar, affiliateId);
  });
}
