/* Paso 2: las áreas salen del modelo, con su descripción. */
import './page-shell.js';
import { esc } from './ui.js';
import { SUPPORT_AREAS, SUPPORT_AREA_DESC } from './model.js';

document.getElementById('areas').innerHTML = Object.entries(SUPPORT_AREAS)
  .map(([key, label]) => `
    <li>
      <h3>${esc(label)}</h3>
      <p class="small text-soft mt-sm">${esc(SUPPORT_AREA_DESC[key] || '')}</p>
    </li>`)
  .join('');
