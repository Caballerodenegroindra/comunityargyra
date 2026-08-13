/* El afiliado fija sus metas. El avance lo registra Argyra. */
import './page-shell.js';
import { esc, badge, progress, notice } from './ui.js';
import { requireAuth } from './auth.js';
import { getAffiliateByOwner, watchGoals, createGoal, deleteGoal } from './data.js';

const form  = document.getElementById('form');
const aviso = document.getElementById('aviso');
const lista = document.getElementById('lista');

const session = await requireAuth();
if (session) {
  const affiliate = await getAffiliateByOwner(session.account.uid).catch(() => null);

  if (!affiliate) {
    lista.innerHTML = '<div class="card empty"><p>Todavía no tienes una ficha registrada.</p></div>';
    form.querySelectorAll('input, button').forEach((el) => { el.disabled = true; });
  } else {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      notice(aviso, '');

      const data = Object.fromEntries(new FormData(form));
      const title = (data.title || '').trim();

      if (title.length < 3) {
        form.querySelector('[data-error="title"]').textContent = 'Escribe la meta.';
        return;
      }
      form.querySelector('[data-error="title"]').textContent = '';

      try {
        await createGoal({
          affiliateId: affiliate.id,
          title,
          description: (data.description || '').trim(),
        });
        form.reset();
      } catch {
        notice(aviso, 'No se pudo crear la meta. Revisa que tu cuenta esté aprobada.');
      }
    });

    watchGoals(affiliate.id, (goals) => {
      lista.innerHTML = goals.length === 0
        ? '<p class="small text-soft">Aún no fijaste ninguna meta.</p>'
        : `<ul class="list">${goals.map((g) => `
            <li class="card">
              <div class="item-head">
                <h3>${esc(g.title)}</h3>
                ${badge(g.status, 'goal')}
              </div>
              ${g.description ? `<p class="small text-soft mt-sm">${esc(g.description)}</p>` : ''}
              <div class="mt-sm">${progress(g.progress)}</div>
              ${g.progress === 0
                ? `<button class="btn btn--ghost btn--sm mt-sm" data-borrar="${esc(g.id)}">Eliminar</button>`
                : '<p class="mono mt-sm">Ya empezó: solo el equipo de Argyra puede modificarla.</p>'}
            </li>`).join('')}</ul>`;
    });

    lista.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-borrar]');
      if (!button) return;
      await deleteGoal(button.dataset.borrar, affiliate.id);
    });
  }
}
