/* Solo grupos: un grupo es uno solo, no contiene otros. */
import './page-shell.js';
import { renderDirectory } from './directory.js';

renderDirectory({
  mount: '#lista',
  filter: (a) => a.kind === 'grupo',
  emptyTitle: 'Todavía no hay grupos afiliados.',
  emptyHint: 'Si administras un grupo, puedes enviar tu solicitud hoy mismo.',
});
