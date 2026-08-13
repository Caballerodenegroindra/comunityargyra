/* Acceso y recuperación de contraseña. */
import './page-shell.js';
import { notice, param } from './ui.js';
import { login, recoverPassword, authErrorMessage } from './auth.js';
import { validateLogin, paintErrors } from './validate.js';

const form   = document.getElementById('form');
const aviso  = document.getElementById('aviso');
const entrar = document.getElementById('entrar');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  notice(aviso, '');

  const data = Object.fromEntries(new FormData(form));
  const values = {
    email: (data.email || '').trim().toLowerCase(),
    password: data.password || '',
  };

  if (!paintErrors(form, validateLogin(values))) return;

  entrar.disabled = true;
  entrar.textContent = 'Entrando…';

  try {
    await login(values.email, values.password);
    location.href = param('siguiente') || 'panel.html';
  } catch (error) {
    notice(aviso, authErrorMessage(error));
    entrar.disabled = false;
    entrar.textContent = 'Entrar';
  }
});

document.getElementById('recuperar').addEventListener('click', async () => {
  const email = (new FormData(form).get('email') || '').trim().toLowerCase();

  if (!email) {
    notice(aviso, 'Escribe tu correo para enviarte el enlace de recuperación.');
    return;
  }

  try {
    await recoverPassword(email);
    notice(aviso, 'Te enviamos un enlace para restablecer la contraseña.', 'ok');
  } catch (error) {
    notice(aviso, authErrorMessage(error));
  }
});
