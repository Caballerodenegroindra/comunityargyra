/* En proceso: quién tiene el turno ahora y quién espera detrás. */
import './page-shell.js';
import { esc } from './ui.js';
import { renderDirectory } from './directory.js';

const turno = document.getElementById('turno');

renderDirectory({
  mount: '#lista',
  filter: (a) => a.status === 'in_progress' || a.status === 'approved',
  emptyTitle: 'No hay afiliados en la cola.',
  emptyHint: 'Cuando alguien sea aceptado aparecerá aquí con su avance.',
  onData: (all) => {
    const current = all.find((a) => a.status === 'in_progress');
    const waiting = all.filter((a) => a.status === 'approved').length;

    turno.innerHTML = `
      <p class="eyebrow">Turno actual</p>
      ${current
        ? `<div class="item-head mt-sm">
             <div>
               <p>${esc(current.name)}</p>
               <p class="small text-soft mt-sm">Recibiendo apoyo ahora mismo.</p>
             </div>
             <a class="btn btn--secondary btn--sm" href="afiliado.html?id=${esc(current.id)}">Ver avance</a>
           </div>`
        : '<p class="mt-sm text-soft">Ningún afiliado en proceso en este momento.</p>'}
      <p class="mono mt-md">${waiting} esperando turno · Argyra acompaña a uno por vez.</p>`;
  },
});
