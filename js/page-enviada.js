/* Confirmación: enlaces al grupo oficial de WhatsApp. */
import './page-shell.js';
import { WHATSAPP_GROUP_URL } from './firebase-config.js';

const wa = document.getElementById('wa');
const wab = document.getElementById('wab');
const copiar = document.getElementById('copiar');

wa.href = WHATSAPP_GROUP_URL;
wab.href = WHATSAPP_GROUP_URL.replace('https://chat.whatsapp.com/', 'whatsapp://chat?code=');

copiar.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(WHATSAPP_GROUP_URL);
    copiar.textContent = 'Enlace copiado';
    setTimeout(() => { copiar.textContent = 'Copiar enlace'; }, 2500);
  } catch {
    copiar.textContent = 'No se pudo copiar';
  }
});
