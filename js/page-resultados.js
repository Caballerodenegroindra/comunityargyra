/* Resultados: los afiliados cuyo apoyo ya se resolvió. */
import './page-shell.js';
import { renderDirectory } from './directory.js';

const resumen = document.getElementById('resumen');

renderDirectory({
  mount: '#lista',
  filter: (a) => a.status === 'completed',
  emptyTitle: 'Todavía no hay apoyos resueltos.',
  emptyHint: 'Aquí quedará el historial de cada acompañamiento terminado.',
  onData: (all, items) => {
    resumen.innerHTML = `
      <p class="eyebrow">Historial</p>
      <span class="stat__num">${items.length}</span>
      <p class="small text-soft mt-sm">
        ${items.length === 1 ? 'acompañamiento resuelto' : 'acompañamientos resueltos'}
        de ${all.length} ${all.length === 1 ? 'afiliado' : 'afiliados'} en total.
      </p>`;
  },
});
