/* Ficha pública de un afiliado: descripción, metas y avance. */
import './page-shell.js';
import { esc, safeUrl, badge, progress, avatar, tags, formatDate, param } from './ui.js';
import { KIND_LABELS, SUPPORT_AREAS } from './model.js';
import { getAffiliate, watchGoals } from './data.js';

const box = document.getElementById('ficha');
const id = param('id');

function notFound() {
  box.innerHTML = `
    <div class="card empty">
      <p>No encontramos este afiliado.</p>
      <a class="btn btn--secondary mt-md" href="afiliados.html">Volver al directorio</a>
    </div>`;
}

if (!id) {
  notFound();
} else {
  const affiliate = await getAffiliate(id).catch(() => null);

  if (!affiliate) {
    notFound();
  } else {
    document.title = `${affiliate.name} — Argyra`;

    box.innerHTML = `
      <div class="item-row">
        ${avatar(affiliate.name, affiliate.logoUrl, true)}
        <div class="item-row__body">
          <p class="eyebrow">${esc(KIND_LABELS[affiliate.kind] || affiliate.kind)}</p>
          <h1 class="mt-sm">${esc(affiliate.name)}</h1>
          <div class="btn-row mt-sm" style="align-items:center">
            ${badge(affiliate.status)}
            <span class="mono">Afiliado desde ${esc(formatDate(affiliate.createdAt))}</span>
          </div>
        </div>
      </div>

      ${affiliate.description ? `<p class="lead mt-lg">${esc(affiliate.description)}</p>` : ''}
      ${safeUrl(affiliate.joinUrl)
        ? `<a class="btn btn--primary mt-md" href="${safeUrl(affiliate.joinUrl)}" target="_blank" rel="noopener">Unirse a ${esc(affiliate.name)}</a>`
        : ''}

      <div class="card mt-lg">
        <p class="eyebrow">Apoyo solicitado</p>
        <p class="small text-soft mt-sm">Lo pidió <span style="color:var(--silver)">${esc(affiliate.ownerNick)}</span></p>
        <ul class="tag-row mt-md">${tags(affiliate.requestedAreas, SUPPORT_AREAS)}</ul>
      </div>

      <div class="card mt-sm" id="metas">
        <p class="loading">Cargando metas…</p>
      </div>

      <p class="mt-lg"><a href="afiliados.html">← Volver al directorio</a></p>`;

    const metas = document.getElementById('metas');

    watchGoals(id, (goals) => {
      const done = goals.filter((g) => g.status === 'completed').length;

      metas.innerHTML = `
        <div class="item-head">
          <p class="eyebrow">Metas</p>
          <span class="mono">${done} de ${goals.length} cumplidas</span>
        </div>
        <div class="mt-md">${progress(affiliate.progress, 'Avance general')}</div>
        ${goals.length === 0
          ? '<p class="small text-soft mt-md">Todavía no fijó metas. Aparecerán aquí en cuanto las defina.</p>'
          : `<ul class="list divided mt-md">${goals.map((g) => `
              <li>
                <div class="item-head">
                  <h3>${esc(g.title)}</h3>
                  ${badge(g.status, 'goal')}
                </div>
                ${g.description ? `<p class="small text-soft mt-sm">${esc(g.description)}</p>` : ''}
                <div class="mt-sm">${progress(g.progress)}</div>
              </li>`).join('')}</ul>`}`;
    });
  }
}
