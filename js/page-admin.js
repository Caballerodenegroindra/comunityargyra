/* Estadísticas del panel de Argyra. */
import './page-shell.js';
import { esc } from './ui.js';
import { requireAuth, logout } from './auth.js';
import { getStats } from './data.js';

const box = document.getElementById('stats');

const session = await requireAuth({ adminOnly: true });
if (session) {
  document.getElementById('salir').addEventListener('click', async () => {
    await logout();
    location.href = 'index.html';
  });

  try {
    const stats = await getStats();
    box.innerHTML = Object.entries(stats)
      .map(([label, value]) => `
        <div class="card">
          <p class="eyebrow">${esc(label)}</p>
          <span class="stat__num">${esc(value)}</span>
        </div>`)
      .join('');
  } catch {
    box.innerHTML = '<p class="notice notice--error">No se pudieron cargar las estadísticas.</p>';
  }
}
