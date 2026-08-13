/* Panel del afiliado: su cuenta, su ficha, sus metas y los comentarios. */
import './page-shell.js';
import { esc, safeUrl, badge, progress, tags, formatDate, notice } from './ui.js';
import { SUPPORT_AREAS } from './model.js';
import { requireAuth, logout } from './auth.js';
import {
  getAffiliateByOwner, watchGoals, watchUserRequests,
  updateAffiliate, uploadAffiliateLogo,
} from './data.js';

const box = document.getElementById('panel');

const CUENTA = {
  pending: 'Ingresa al grupo de WhatsApp y menciona tu usuario para que el equipo te verifique.',
  approved: 'Tu cuenta está aprobada. Ya puedes trabajar en tu ficha y tus metas.',
  rejected: 'Tu solicitud fue rechazada. Escribe en el grupo para conocer los motivos.',
  suspended: 'Tu cuenta está suspendida. Contacta al equipo en el grupo oficial.',
};

const FICHA = {
  waiting: 'Tu ficha aún no es pública. Se publica cuando el equipo verifica tu administración.',
  verifying: 'El equipo está verificando tu administración por WhatsApp.',
  approved: 'Ya eres público y estás en la cola. Argyra acompaña a un afiliado por vez.',
  in_progress: 'Es tu turno: Argyra está trabajando contigo ahora mismo.',
  completed: 'Tu apoyo está resuelto. Tu ficha queda como historial público.',
};

const session = await requireAuth();
if (session) {
  const { account, profile } = session;
  const affiliate = await getAffiliateByOwner(account.uid).catch(() => null);

  box.innerHTML = `
    <h1>Hola, ${esc(profile?.nick || 'de nuevo')}</h1>
    <p class="lead small mt-sm">Tu ficha, tus metas y tu avance.</p>

    <div class="card-grid mt-lg">
      <div class="card">
        <p class="eyebrow">Tu cuenta</p>
        <div class="mt-sm">${badge(profile?.status || 'pending', 'user')}</div>
        <p class="small text-soft mt-sm">${esc(CUENTA[profile?.status] || '')}</p>
      </div>

      <div class="card">
        <p class="eyebrow">Tu ficha</p>
        ${affiliate ? `
          <p class="mt-sm">${esc(affiliate.name)}</p>
          <div class="mt-sm">${badge(affiliate.status)}</div>
          <p class="small text-soft mt-sm">${esc(FICHA[affiliate.status] || '')}</p>
          ${['approved','in_progress','completed'].includes(affiliate.status)
            ? `<a class="btn btn--secondary btn--sm mt-md" href="afiliado.html?id=${esc(affiliate.id)}">Ver ficha pública</a>`
            : ''}`
          : '<p class="small text-soft mt-sm">Todavía no registraste un grupo.</p>'}
      </div>
    </div>

    ${affiliate ? `
      <div class="card mt-md" id="datos"></div>
      <div class="card mt-md" id="metas"><p class="loading">Cargando metas…</p></div>` : ''}

    <div class="card mt-md" id="comentarios"><p class="loading">Cargando…</p></div>

    <button class="btn btn--ghost btn--sm mt-lg" id="salir">Cerrar sesión</button>`;

  document.getElementById('salir').addEventListener('click', async () => {
    await logout();
    location.href = 'index.html';
  });

  /* ---------- Datos públicos ---------- */
  if (affiliate) {
    const datos = document.getElementById('datos');

    const paint = (editing = false) => {
      datos.innerHTML = `
        <div class="item-head">
          <p class="eyebrow">Datos públicos</p>
          ${editing ? '' : '<button class="btn btn--ghost btn--sm" id="editar">Editar</button>'}
        </div>

        <div class="item-row mt-md">
          ${safeUrl(affiliate.logoUrl)
            ? `<img class="avatar" src="${safeUrl(affiliate.logoUrl)}" alt="">`
            : '<div class="avatar">—</div>'}
          <div class="item-row__body">
            <button class="btn btn--secondary btn--sm" id="subir">
              ${affiliate.logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>
            <p class="field__hint">JPG o PNG, hasta 3 MB.</p>
            <input type="file" accept="image/*" id="archivo" hidden />
            <div id="avisoLogo"></div>
          </div>
        </div>

        ${editing ? `
          <label class="field mt-md">
            <span class="field__label">Descripción</span>
            <textarea class="textarea" id="desc" rows="4">${esc(affiliate.description || '')}</textarea>
          </label>
          <label class="field">
            <span class="field__label">Enlace para unirse</span>
            <input class="input" id="url" value="${esc(affiliate.joinUrl || '')}" />
          </label>
          <div class="btn-row">
            <button class="btn btn--primary btn--sm" id="guardar">Guardar cambios</button>
            <button class="btn btn--ghost btn--sm" id="cancelar">Cancelar</button>
          </div>`
        : `
          <p class="small text-soft mt-md">${esc(affiliate.description || 'Sin descripción.')}</p>
          <p class="mono break-all mt-sm">${esc(affiliate.joinUrl || 'Sin enlace para unirse.')}</p>`}

        <ul class="tag-row mt-md">${tags(affiliate.requestedAreas, SUPPORT_AREAS)}</ul>`;

      const archivo = document.getElementById('archivo');
      document.getElementById('subir').addEventListener('click', () => archivo.click());

      archivo.addEventListener('change', async () => {
        const file = archivo.files?.[0];
        if (!file) return;
        try {
          affiliate.logoUrl = await uploadAffiliateLogo(affiliate.id, file);
          paint(editing);
        } catch (error) {
          notice(document.getElementById('avisoLogo'), error.message || 'No se pudo subir la imagen.');
        }
      });

      document.getElementById('editar')?.addEventListener('click', () => paint(true));
      document.getElementById('cancelar')?.addEventListener('click', () => paint(false));

      document.getElementById('guardar')?.addEventListener('click', async () => {
        affiliate.description = document.getElementById('desc').value.trim();
        affiliate.joinUrl = document.getElementById('url').value.trim();
        await updateAffiliate(affiliate.id, {
          description: affiliate.description,
          joinUrl: affiliate.joinUrl,
        });
        paint(false);
      });
    };

    paint(false);

    /* ---------- Metas ---------- */
    const metas = document.getElementById('metas');

    watchGoals(affiliate.id, (goals) => {
      const avg = goals.length
        ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length)
        : 0;

      metas.innerHTML = `
        <div class="item-head">
          <p class="eyebrow">Tus metas</p>
          <a class="btn btn--secondary btn--sm" href="metas.html">Gestionar metas</a>
        </div>
        <div class="mt-md">${progress(avg, 'Avance general')}</div>
        ${goals.length === 0
          ? '<p class="small text-soft mt-md">Todavía no fijaste metas. Son públicas desde que las creas.</p>'
          : `<ul class="list divided mt-md">${goals.map((g) => `
              <li>
                <div class="item-head">
                  <h3>${esc(g.title)}</h3>
                  ${badge(g.status, 'goal')}
                </div>
                ${g.assignedTo ? `<p class="mono mt-sm">Responsable: ${esc(g.assignedTo)}</p>` : ''}
                <div class="mt-sm">${progress(g.progress)}</div>
              </li>`).join('')}</ul>`}`;
    });
  }

  /* ---------- Comentarios del equipo ---------- */
  const comentarios = document.getElementById('comentarios');

  watchUserRequests(account.uid, (requests) => {
    const withNotes = requests.filter((r) => (r.notes || '').trim());

    comentarios.innerHTML = `
      <p class="eyebrow">Comentarios del equipo</p>
      ${withNotes.length === 0
        ? '<p class="small text-soft mt-sm">Sin comentarios por ahora. Aquí verás las respuestas de los líderes de Argyra.</p>'
        : `<ul class="list divided mt-md">${withNotes.map((r) => `
            <li>
              <p class="small">${esc(r.notes)}</p>
              <p class="mono mt-sm">${esc(formatDate(r.createdAt))}</p>
            </li>`).join('')}</ul>`}`;
  });
}
