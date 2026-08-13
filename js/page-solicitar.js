/* Paso 1: el botón se habilita solo al aceptar las reglas. */
import './page-shell.js';

const check = document.getElementById('acepto');
const button = document.getElementById('continuar');

check.addEventListener('change', () => { button.disabled = !check.checked; });
button.addEventListener('click', () => { location.href = 'programa.html'; });
