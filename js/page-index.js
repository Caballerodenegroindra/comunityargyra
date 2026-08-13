/* Portada: muestra quién tiene el turno, si hay alguien. */
import './page-shell.js';
import { esc } from './ui.js';
import { getCurrentTurn } from './data.js';

const slot = document.getElementById('turno');

try {
  const turn = await getCurrentTurn();
  if (turn) {
    slot.innerHTML = `
      <div class="section" style="padding-bottom:0">
        <p class="eyebrow">Turno actual</p>
        <div class="card mt-sm">
          <div class="item-head">
            <div>
              <p>${esc(turn.name)}</p>
              <p class="small text-soft mt-sm">
                Recibiendo apoyo ahora mismo. Argyra acompaña a un afiliado por vez.
              </p>
            </div>
            <a class="btn btn--secondary btn--sm" href="afiliado.html?id=${esc(turn.id)}">Ver avance</a>
          </div>
        </div>
      </div>`;
  }
} catch {
  /* Sin turno visible: la portada funciona igual. */
}
