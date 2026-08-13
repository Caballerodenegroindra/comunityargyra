/* Ficha de un proyecto: enlaces, capturas y créditos. */
import './page-shell.js';
import { esc, safeUrl, badge, formatDate, param } from './ui.js';
import { PROJECT_KIND } from './model.js';
import { getProject } from './data.js';

const box = document.getElementById('ficha');
const id = param('id');

const project = id ? await getProject(id).catch(() => null) : null;

if (!project) {
  box.innerHTML = `
    <div class="card empty">
      <p>No encontramos este proyecto.</p>
      <a class="btn btn--secondary mt-md" href="laboratorio.html">Volver al Laboratorio</a>
    </div>`;
} else {
  document.title = `${project.name} — Argyra`;

  const links = (project.links || [])
    .filter((l) => safeUrl(l.url))
    .map((l) => `<a class="btn btn--primary" href="${safeUrl(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
    .join('');

  const images = (project.images || [])
    .filter(safeUrl)
    .map((src) => `<img src="${safeUrl(src)}" alt="Captura de ${esc(project.name)}">`)
    .join('');

  const credits = (project.credits || [])
    .map((c) => `<li class="tag">${esc(c)}</li>`)
    .join('');

  box.innerHTML = `
    <p class="eyebrow">${esc(PROJECT_KIND[project.kind] || project.kind)}</p>
    <div class="btn-row mt-sm" style="align-items:center">
      <h1>${esc(project.name)}</h1>
      ${badge(project.status, 'project')}
    </div>
    <p class="mono mt-sm">Publicado el ${esc(formatDate(project.createdAt))}</p>

    <p class="lead mt-lg">${esc(project.description)}</p>

    ${links ? `<div class="btn-row mt-lg">${links}</div>` : ''}
    ${images ? `<div class="gallery mt-lg">${images}</div>` : ''}

    ${credits ? `
      <div class="card mt-lg">
        <p class="eyebrow">Créditos</p>
        <p class="small text-soft mt-sm">Este proyecto existe gracias al aporte de:</p>
        <ul class="tag-row mt-md">${credits}</ul>
      </div>` : ''}

    <p class="mt-lg"><a href="laboratorio.html">← Volver al Laboratorio</a></p>`;
}
