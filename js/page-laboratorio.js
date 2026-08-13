/* El Laboratorio: proyectos construidos por Argyra. */
import './page-shell.js';
import { esc, safeUrl, badge, empty } from './ui.js';
import { PROJECT_KIND } from './model.js';
import { watchProjects } from './data.js';

const lista = document.getElementById('lista');

function card(p) {
  const cover = safeUrl(p.images?.[0]);
  return `
    <li class="card card--flat">
      ${cover ? `<img class="thumb" src="${cover}" alt="">` : ''}
      <div style="padding:1.25rem">
        <div class="item-head">
          <a href="proyecto.html?id=${esc(p.id)}">${esc(p.name)}</a>
          ${badge(p.status, 'project')}
        </div>
        <p class="eyebrow mt-sm">${esc(PROJECT_KIND[p.kind] || p.kind)}</p>
        <p class="small text-soft clamp-3 mt-sm">${esc(p.description)}</p>
        <a class="small" style="display:inline-block;margin-top:1rem" href="proyecto.html?id=${esc(p.id)}">Ver proyecto</a>
      </div>
    </li>`;
}

watchProjects((projects) => {
  lista.innerHTML = projects.length
    ? `<ul class="list card-grid">${projects.map(card).join('')}</ul>`
    : empty('Todavía no hay proyectos publicados.');
});
