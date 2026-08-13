/* Solo comunidades: las que contienen varios grupos dentro. */
import './page-shell.js';
import { renderDirectory } from './directory.js';

renderDirectory({
  mount: '#lista',
  filter: (a) => a.kind === 'comunidad',
  emptyTitle: 'Todavía no hay comunidades afiliadas.',
  emptyHint: 'Una comunidad reúne varios grupos bajo una misma administración.',
});
