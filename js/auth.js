/* ============================================================
   ARGYRA — Autenticación
   ============================================================
   Reglas del proyecto:
   - Toda cuenta nueva nace con estado "pending".
   - El rol y el estado NUNCA los escribe el navegador: las
     reglas de Firestore lo impiden aunque alguien lo intente.
   - El primer administrador se crea a mano en la consola.
   ============================================================ */

import { auth, db, COL } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export async function registerUser({ nick, email, whatsapp, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, COL.users, credential.user.uid), {
    uid: credential.user.uid,
    nick,
    email,
    whatsapp,
    role: 'user',
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function recoverPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, COL.users, uid));
  return snap.exists() ? snap.data() : null;
}

export function updateProfile(uid, data) {
  return updateDoc(doc(db, COL.users, uid), data);
}

/* ------------------------------------------------------------
   Espera a saber si hay sesión y devuelve cuenta + perfil.
   Se usa al abrir cualquier página que dependa del usuario.
   ------------------------------------------------------------ */
export function currentUser() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, async (account) => {
      stop();
      if (!account) return resolve({ account: null, profile: null });
      try {
        resolve({ account, profile: await getProfile(account.uid) });
      } catch {
        resolve({ account, profile: null });
      }
    });
  });
}

/* ------------------------------------------------------------
   Guarda de página. Manda a ingresar si no hay sesión, y al
   panel si se pide zona de administración sin ser admin.

   Importante: esto solo esconde la interfaz. La protección real
   de los datos está en firestore.rules, que corre en los
   servidores de Google y nadie puede saltarse.
   ------------------------------------------------------------ */
export async function requireAuth({ adminOnly = false } = {}) {
  const { account, profile } = await currentUser();

  if (!account) {
    location.replace(`ingresar.html?siguiente=${encodeURIComponent(location.pathname.split('/').pop())}`);
    return null;
  }

  if (adminOnly && profile?.role !== 'admin') {
    location.replace('panel.html');
    return null;
  }

  return { account, profile };
}

/* Cambia el botón de la barra según haya sesión o no. */
export function paintSessionLink() {
  const slot = document.querySelector('[data-session-slot]');
  if (!slot) return;

  onAuthStateChanged(auth, async (account) => {
    if (!account) {
      slot.textContent = 'Ingresar';
      slot.setAttribute('href', 'ingresar.html');
      return;
    }
    const profile = await getProfile(account.uid).catch(() => null);
    slot.textContent = 'Mi panel';
    slot.setAttribute('href', profile?.role === 'admin' ? 'admin.html' : 'panel.html');
  });
}

/* Traduce los errores de Firebase a algo que se entienda. */
export function authErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Ingresa con tu contraseña.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/weak-password': 'La contraseña es demasiado corta.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu red e inténtalo otra vez.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase. Avisa al equipo de Argyra.',
  };
  return messages[error?.code] || 'Algo salió mal. Inténtalo de nuevo en unos minutos.';
}
