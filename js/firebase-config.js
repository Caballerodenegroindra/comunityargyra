/* ============================================================
   ARGYRA — Conexión con Firebase
   ============================================================
   El SDK se carga directo desde gstatic: no hace falta instalar
   ni compilar nada. Estas claves son públicas por diseño; lo que
   protege los datos son las reglas de firestore.rules.
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage }    from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBt3eYWRVRKLStif9yRSXvfy1Y_MY6j2BY',
  authDomain: 'argyra301.firebaseapp.com',
  projectId: 'argyra301',
  storageBucket: 'argyra301.firebasestorage.app',
  messagingSenderId: '228330172121',
  appId: '1:228330172121:web:3b6f831a59b6025a7b18c8',
};

export const app     = initializeApp(FIREBASE_CONFIG);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

/* Enlace de invitación al grupo oficial de Argyra.
   Cámbialo por el tuyo cuando lo tengas. */
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/';

/* Nombres de colección en un solo lugar. */
export const COL = {
  users:      'users',
  affiliates: 'affiliates',
  goals:      'goals',
  requests:   'requests',
  projects:   'projects',
};
