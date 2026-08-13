/* Base de toda página: menú, enlace activo y botón de sesión. */
import './menu.js';
import { markActiveNav } from './ui.js';
import { paintSessionLink } from './auth.js';

markActiveNav();
paintSessionLink();
