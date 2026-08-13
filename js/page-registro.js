/* Paso 3: crea la cuenta, la ficha del afiliado y la solicitud. */
import './page-shell.js';
import { esc, notice } from './ui.js';
import { SUPPORT_AREAS } from './model.js';
import { registerUser, authErrorMessage } from './auth.js';
import { createAffiliate, createRequest } from './data.js';
import { validateRegister, paintErrors } from './validate.js';

const form   = document.getElementById('form');
const aviso  = document.getElementById('aviso');
const enviar = document.getElementById('enviar');

let kind = 'grupo';
const areas = new Set();

/* Tipo: comunidad o grupo */
document.getElementById('tipo').addEventListener('click', (event) => {
  const button = event.target.closest('[data-kind]');
  if (!button) return;
  document.querySelectorAll('#tipo .chip').forEach((c) => c.classList.remove('active'));
  button.classList.add('active');
  kind = button.dataset.kind;
});

/* Áreas de apoyo */
const areasBox = document.getElementById('areas');
areasBox.innerHTML = Object.entries(SUPPORT_AREAS)
  .map(([key, label]) => `<button type="button" class="chip" data-area="${esc(key)}">${esc(label)}</button>`)
  .join('');

areasBox.addEventListener('click', (event) => {
  const button = event.target.closest('[data-area]');
  if (!button) return;
  const key = button.dataset.area;
  if (areas.has(key)) { areas.delete(key); button.classList.remove('active'); }
  else { areas.add(key); button.classList.add('active'); }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  notice(aviso, '');

  const data = Object.fromEntries(new FormData(form));
  const values = {
    nick: (data.nick || '').trim(),
    name: (data.name || '').trim(),
    description: (data.description || '').trim(),
    joinUrl: (data.joinUrl || '').trim(),
    whatsapp: (data.whatsapp || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    password: data.password || '',
    confirm: data.confirm || '',
    requestedAreas: [...areas],
  };

  if (!paintErrors(form, validateRegister(values))) return;

  enviar.disabled = true;
  enviar.textContent = 'Creando solicitud…';

  try {
    const user = await registerUser({
      nick: values.nick,
      email: values.email,
      whatsapp: values.whatsapp,
      password: values.password,
    });

    const affiliateId = await createAffiliate({
      ownerUid: user.uid,
      ownerNick: values.nick,
      name: values.name,
      kind,
      description: values.description,
      joinUrl: values.joinUrl,
      requestedAreas: values.requestedAreas,
    });

    await createRequest({ userId: user.uid, affiliateId });

    location.href = 'solicitud-enviada.html';
  } catch (error) {
    notice(aviso, authErrorMessage(error));
    enviar.disabled = false;
    enviar.textContent = 'Crear solicitud';
  }
});
