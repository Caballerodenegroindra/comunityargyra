/* Publicar proyectos: capturas, enlaces externos y créditos. */
import './page-shell.js';
import { esc, badge, notice } from './ui.js';
import { PROJECT_KIND, PROJECT_STATUS } from './model.js';
import { requireAuth } from './auth.js';
import {
  watchProjects, createProject, updateProject, deleteProject, uploadProjectImage,
} from './data.js';

const form  = document.getElementById('form');
const lista = document.getElementById('lista');

let kind = 'bot';
let status = 'in_progress';
let projects = [];

/* Selectores de tipo y estado del formulario */
function pillGroup(id, onPick) {
  document.getElementById(id).addEventListener('click', (event) => {
    const button = event.target.closest('.chip');
    if (!button) return;
    document.querySelectorAll(`#${id} .chip`).forEach((c) => c.classList.remove('active'));
    button.classList.add('active');
    onPick(button.dataset.kind || button.dataset.status);
  });
}

function render() {
  lista.innerHTML = projects.length === 0
    ? '<p class="small text-soft">Todavía no hay proyectos.</p>'
    : `<ul class="list">${projects.map((p) => `
        <li class="card">
          <div class="item-head">
            <div>
              <p>${esc(p.name)}</p>
              <p class="eyebrow mt-sm">${esc(PROJECT_KIND[p.kind] || p.kind)}</p>
            </div>
            ${badge(p.status, 'project')}
          </div>
          <p class="small text-soft mt-sm">${esc(p.description)}</p>

          <div class="btn-row mt-md">
            ${Object.entries(PROJECT_STATUS).filter(([s]) => s !== p.status).map(([s, label]) =>
              `<button class="btn btn--secondary btn--sm" data-estado="${esc(s)}" data-id="${esc(p.id)}">Marcar ${esc(label.toLowerCase())}</button>`
            ).join('')}
            <button class="btn btn--ghost btn--sm" data-borrar="${esc(p.id)}">Eliminar</button>
          </div>

          <div class="mt-md" style="border-top:1px solid var(--edge);padding-top:1rem">
            <p class="eyebrow">Capturas</p>
            <button class="btn btn--secondary btn--sm mt-sm" data-subir="${esc(p.id)}">Subir captura</button>
            <p class="field__hint">JPG o PNG, hasta 3 MB.</p>
            <input type="file" accept="image/*" hidden id="file-${esc(p.id)}" />
            <div id="errimg-${esc(p.id)}"></div>
            ${p.images?.length ? `<p class="mono mt-sm">${p.images.length} captura(s) publicada(s).</p>` : ''}
          </div>

          <div class="mt-md" style="border-top:1px solid var(--edge);padding-top:1rem">
            <p class="eyebrow">Enlaces externos</p>
            <input class="input" placeholder="Descargar" id="lbl-${esc(p.id)}" />
            <input class="input" placeholder="https://…" id="url-${esc(p.id)}" />
            <button class="btn btn--primary btn--sm mt-sm" data-enlace="${esc(p.id)}">Agregar enlace</button>
            ${p.links?.length ? `<ul class="tag-row mt-sm">${p.links.map((l) => `<li class="tag">${esc(l.label)}</li>`).join('')}</ul>` : ''}
          </div>

          <div class="mt-md" style="border-top:1px solid var(--edge);padding-top:1rem">
            <p class="eyebrow">Créditos</p>
            <input class="input" placeholder="Grupo Alpha" id="cred-${esc(p.id)}" />
            <button class="btn btn--primary btn--sm mt-sm" data-credito="${esc(p.id)}">Agregar</button>
            ${p.credits?.length ? `<ul class="tag-row mt-sm">${p.credits.map((c) => `<li class="tag">${esc(c)}</li>`).join('')}</ul>` : ''}
          </div>
        </li>`).join('')}</ul>`;
}

const session = await requireAuth({ adminOnly: true });
if (session) {
  pillGroup('tipo', (value) => { kind = value; });
  pillGroup('estado', (value) => { status = value; });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const name = (data.name || '').trim();
    if (!name) return;

    await createProject({ name, description: (data.description || '').trim(), kind, status });
    form.reset();
  });

  lista.addEventListener('click', async (event) => {
    const estado = event.target.closest('[data-estado]');
    if (estado) { await updateProject(estado.dataset.id, { status: estado.dataset.estado }); return; }

    const borrar = event.target.closest('[data-borrar]');
    if (borrar) { await deleteProject(borrar.dataset.borrar); return; }

    const subir = event.target.closest('[data-subir]');
    if (subir) {
      const id = subir.dataset.subir;
      const input = document.getElementById(`file-${id}`);

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          await uploadProjectImage(id, file);
        } catch (error) {
          notice(document.getElementById(`errimg-${id}`), error.message || 'No se pudo subir la imagen.');
        }
      };

      input.click();
      return;
    }

    const enlace = event.target.closest('[data-enlace]');
    if (enlace) {
      const id = enlace.dataset.enlace;
      const label = document.getElementById(`lbl-${id}`).value.trim();
      const url = document.getElementById(`url-${id}`).value.trim();
      if (!label || !url) return;

      const project = projects.find((p) => p.id === id);
      await updateProject(id, { links: [...(project?.links || []), { label, url }] });
      return;
    }

    const credito = event.target.closest('[data-credito]');
    if (credito) {
      const id = credito.dataset.credito;
      const value = document.getElementById(`cred-${id}`).value.trim();
      if (!value) return;

      const project = projects.find((p) => p.id === id);
      await updateProject(id, { credits: [...(project?.credits || []), value] });
    }
  });

  watchProjects((list) => { projects = list; render(); });
}
