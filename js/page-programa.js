/* Paso 2: lista las áreas desde el modelo, para no duplicar texto. */
import './page-shell.js';
import { esc } from './ui.js';
import { SUPPORT_AREAS } from './model.js';

document.getElementById('areas').innerHTML = Object.values(SUPPORT_AREAS)
  .map((label) => `<li class="tag">${esc(label)}</li>`)
  .join('');
