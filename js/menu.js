/* ============================================================
   ARGYRA — Menú desplegable
   ============================================================
   Un solo menú para todo el sitio, detrás de las tres rayas.
   Se cierra con el mismo botón, con Esc, o al elegir una opción.
   ============================================================ */

const button = document.getElementById('menu-btn');
const panel  = document.getElementById('menu');

if (button && panel) {
  const setOpen = (open) => {
    panel.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };

  button.addEventListener('click', () => {
    setOpen(!panel.classList.contains('open'));
  });

  /* Al elegir una opción el menú se va: en móvil, si no, tapa la página
     recién cargada durante un instante. */
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('open')) {
      setOpen(false);
      button.focus();
    }
  });
}
