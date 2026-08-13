/* ============================================================
   ARGYRA — Vocabulario del dominio
   ============================================================
   Estados, áreas y etiquetas. Todo el texto que ve el usuario
   sale de aquí, para que no se contradiga entre páginas.
   ============================================================ */

/* Una comunidad contiene muchos grupos; un grupo es uno solo. */
export const KIND_LABELS = {
  comunidad: 'Comunidad',
  grupo: 'Grupo',
};

/* Recorrido de un afiliado. Los tres últimos son públicos. */
export const AFFILIATE_STATUS = {
  waiting:     'En revisión',
  verifying:   'Verificando',
  approved:    'En espera',
  in_progress: 'En proceso',
  completed:   'Resuelto',
};

export const PUBLIC_STATUSES = ['approved', 'in_progress', 'completed'];

export const USER_STATUS = {
  pending:   'Pendiente',
  approved:  'Aprobado',
  rejected:  'Rechazado',
  suspended: 'Suspendido',
};

export const GOAL_STATUS = {
  pending:     'Pendiente',
  in_progress: 'En proceso',
  completed:   'Cumplida',
};

export const PROJECT_STATUS = {
  in_progress: 'En curso',
  completed:   'Terminado',
};

export const PROJECT_KIND = {
  bot:  'Bot',
  app:  'App',
  web:  'Web',
  otro: 'Otro',
};

/* Áreas de apoyo que el afiliado solicita al registrarse. */
export const SUPPORT_AREAS = {
  administracion: 'Administración',
  organizacion:   'Organización',
  crecimiento:    'Crecimiento',
  diseno:         'Diseño',
  automatizacion: 'Automatización',
  moderacion:     'Moderación',
  actividades:    'Actividades',
};

/* Qué hace Argyra en cada área. Se usa en la portada, en la página del
   programa y en el formulario, para que la explicación no se contradiga. */
export const SUPPORT_AREA_DESC = {
  administracion: 'Ordenamos roles y permisos, definimos quién decide qué y dejamos por escrito cómo se resuelven los conflictos.',
  organizacion:   'Estructuramos temas, canales y horarios para que nadie tenga que adivinar dónde va cada cosa.',
  crecimiento:    'Formas sanas de sumar miembros y de que se queden: bienvenida, actividades y seguimiento real.',
  diseno:         'Perfil, descripción, logo e identidad visual para que tu grupo se entienda en cinco segundos.',
  automatizacion: 'Lo repetitivo deja de hacerse a mano: bienvenidas, avisos, respuestas y moderación básica.',
  moderacion:     'Reglas claras, criterios parejos y un equipo que sabe qué hacer cuando algo se desborda.',
  actividades:    'Dinámicas, retos y eventos con un calendario que se sostiene en el tiempo.',
};

/* Tono de color de cada estado, para las insignias. */
const TONES = {
  waiting: '', verifying: 'wait', pending: 'wait', approved: 'wait',
  in_progress: 'prog', completed: 'done',
  rejected: 'stop', suspended: 'stop',
};

export function badgeTone(status) {
  return TONES[status] ? `badge--${TONES[status]}` : '';
}

/* Traduce un estado a texto legible según de qué se trate. */
export function statusLabel(status, kind = 'affiliate') {
  const dicts = {
    affiliate: AFFILIATE_STATUS,
    user: USER_STATUS,
    goal: GOAL_STATUS,
    project: PROJECT_STATUS,
  };
  return (dicts[kind] || {})[status] || status;
}
