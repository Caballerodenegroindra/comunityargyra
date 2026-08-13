/* ============================================================
   Paso 3: crea la cuenta, la ficha del afiliado y la solicitud.
   ============================================================
   El formulario es largo y la gente sale a buscar el enlace de su
   grupo antes de terminarlo. Por eso todo lo escrito se guarda en
   este dispositivo y se recupera al volver. La contraseña NO se
   guarda nunca.
   ============================================================ */

import './page-shell.js';
import { esc, notice } from './ui.js';
import { SUPPORT_AREAS, SUPPORT_AREA_DESC } from './model.js';
import { registerUser, authErrorMessage } from './auth.js';
import { createAffiliate, createRequest } from './data.js';
import { validateRegister, paintErrors } from './validate.js';

const form   = document.getElementById('form');
const aviso  = document.getElementById('aviso');
const enviar = document.getElementById('enviar');
const limpiar = document.getElementById('limpiar');

const DRAFT_KEY = 'argyra_registro_borrador';
const GUARDADOS = ['name', 'description', 'joinUrl', 'nick', 'whatsapp', 'email'];

let kind = 'grupo';
const areas = new Set();

/* ------------------------------------------------------------
   Áreas de apoyo, cada una con su explicación
   ------------------------------------------------------------ */
const areasBox = document.getElementById('areas');

areasBox.innerHTML = `<ul class="area-list">${Object.entries(SUPPORT_AREAS)
  .map(([key, label]) => `
    <li>
      <button type="button" class="area" data-area="${esc(key)}" aria-pressed="false">
        <span class="area__box" aria-hidden="true">✓</span>
        <span>
          <span class="area__name">${esc(label)}</span>
          <span class="area__desc">${esc(SUPPORT_AREA_DESC[key] || '')}</span>
        </span>
      </button>
    </li>`).join('')}</ul>`;

areasBox.addEventListener('click', (event) => {
  const button = event.target.closest('[data-area]');
  if (!button) return;

  const key = button.dataset.area;
  const active = areas.has(key);

  if (active) areas.delete(key); else areas.add(key);
  button.classList.toggle('active', !active);
  button.setAttribute('aria-pressed', String(!active));

  saveDraft();
});

/* ------------------------------------------------------------
   Tipo: comunidad o grupo
   ------------------------------------------------------------ */
const tipoBox = document.getElementById('tipo');

tipoBox.addEventListener('click', (event) => {
  const button = event.target.closest('[data-kind]');
  if (!button) return;
  tipoBox.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  button.classList.add('active');
  kind = button.dataset.kind;
  saveDraft();
});

/* ------------------------------------------------------------
   Borrador: se guarda al escribir y se recupera al volver
   ------------------------------------------------------------ */
function saveDraft() {
  try {
    const data = Object.fromEntries(new FormData(form));
    const draft = { kind, areas: [...areas] };
    GUARDADOS.forEach((field) => { draft[field] = data[field] || ''; });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Sin almacenamiento disponible: el formulario sigue funcionando igual. */
  }
}

function loadDraft() {
  let draft;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return;
  }
  if (!draft) return;

  let restored = false;

  GUARDADOS.forEach((field) => {
    const input = form.elements[field];
    if (input && draft[field]) { input.value = draft[field]; restored = true; }
  });

  if (draft.kind) {
    kind = draft.kind;
    tipoBox.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.kind === kind);
    });
  }

  (draft.areas || []).forEach((key) => {
    areas.add(key);
    const button = areasBox.querySelector(`[data-area="${key}"]`);
    if (button) { button.classList.add('active'); button.setAttribute('aria-pressed', 'true'); }
    restored = true;
  });

  if (restored) {
    const note = document.createElement('div');
    note.className = 'draft-note';
    note.innerHTML = '<p class="notice notice--ok">Recuperamos lo que habías escrito antes.</p>';
    form.prepend(note);
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* nada que limpiar */ }
}

/* Guardar mientras se escribe, sin bloquear la escritura. */
let saveTimer;
form.addEventListener('input', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 400);
});

limpiar.addEventListener('click', () => {
  clearDraft();
  location.reload();
});

/* Aviso si intenta cerrar la pestaña con datos escritos sin enviar. */
let submitted = false;
window.addEventListener('beforeunload', (event) => {
  if (submitted) return;
  const data = Object.fromEntries(new FormData(form));
  const hasContent = GUARDADOS.some((f) => (data[f] || '').trim()) || areas.size > 0;
  if (!hasContent) return;
  event.preventDefault();
  event.returnValue = '';
});

loadDraft();

/* ------------------------------------------------------------
   Envío
   ------------------------------------------------------------ */
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

  if (!paintErrors(form, validateRegister(values))) {
    form.querySelector('.field__error:not(:empty)')?.scrollIntoView({ block: 'center' });
    return;
  }

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

    submitted = true;
    clearDraft();
    location.href = 'solicitud-enviada.html';
  } catch (error) {
    console.error('Registro:', error);

    /* Si la cuenta llegó a crearse, decirlo: si no, el usuario intenta
       de nuevo y se topa con "ese correo ya tiene una cuenta". */
    const extra = error.afterAccountCreated
      ? ' Tu cuenta sí se creó: entra desde "Ingresar" en vez de registrarte otra vez.'
      : '';

    notice(aviso, authErrorMessage(error) + extra);
    enviar.disabled = false;
    enviar.textContent = 'Crear solicitud';
  }
});
