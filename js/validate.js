/* ============================================================
   ARGYRA — Validación de formularios
   ============================================================
   Se valida en el navegador para dar mensajes claros, y otra vez
   en firestore.rules, que es donde la validación cuenta de verdad.
   ============================================================ */

const NICK     = /^[A-Za-zÁÉÍÓÚÑáéíóúñ0-9 ._-]+$/;
const PASSWORD = /^[A-Za-z0-9]+$/;
const WHATSAPP = /^\+[1-9]\d{7,14}$/;
const EMAIL    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL      = /^https?:\/\/.+/i;

export function validateRegister(v) {
  const e = {};

  if (v.nick.length < 3) e.nick = 'El nick debe tener al menos 3 caracteres.';
  else if (v.nick.length > 24) e.nick = 'El nick no puede superar los 24 caracteres.';
  else if (!NICK.test(v.nick)) e.nick = 'Usa solo letras y números, sin emojis ni símbolos.';

  if (v.name.length < 3) e.name = 'Escribe el nombre de tu grupo o comunidad.';
  else if (v.name.length > 60) e.name = 'El nombre es demasiado largo.';

  if (v.description.length < 20) e.description = 'Cuenta en pocas líneas de qué trata. Mínimo 20 caracteres.';
  else if (v.description.length > 400) e.description = 'La descripción no puede superar los 400 caracteres.';

  if (v.joinUrl && !URL.test(v.joinUrl)) e.joinUrl = 'Escribe un enlace válido, empezando por https://';

  if (!v.requestedAreas.length) e.requestedAreas = 'Elige al menos un área de apoyo.';

  if (!WHATSAPP.test(v.whatsapp)) e.whatsapp = 'Incluye el código de país, por ejemplo +5491122334455.';

  if (!EMAIL.test(v.email)) e.email = 'Escribe un correo válido.';

  if (v.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres.';
  else if (!PASSWORD.test(v.password)) e.password = 'Usa solo letras y números.';
  else if (!/[A-Za-z]/.test(v.password)) e.password = 'Incluye al menos una letra.';
  else if (!/[0-9]/.test(v.password)) e.password = 'Incluye al menos un número.';

  if (v.password !== v.confirm) e.confirm = 'Las contraseñas no coinciden.';

  return e;
}

export function validateLogin(v) {
  const e = {};
  if (!EMAIL.test(v.email)) e.email = 'Escribe un correo válido.';
  if (!v.password) e.password = 'Escribe tu contraseña.';
  return e;
}

/* Pinta los errores junto a cada campo y devuelve si todo está bien. */
export function paintErrors(form, errors) {
  form.querySelectorAll('[data-error]').forEach((slot) => { slot.textContent = ''; });
  Object.entries(errors).forEach(([field, message]) => {
    const slot = form.querySelector(`[data-error="${field}"]`);
    if (slot) slot.textContent = message;
  });
  return Object.keys(errors).length === 0;
}
