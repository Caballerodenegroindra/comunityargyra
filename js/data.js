/* ============================================================
   ARGYRA — Acceso a datos
   ============================================================
   Todo lo que lee o escribe en Firestore pasa por aquí, para no
   repetir consultas sueltas en cada página.
   ============================================================ */

import { db, storage, COL } from './firebase-config.js';
import { PUBLIC_STATUSES } from './model.js';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, getCountFromServer,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  ref, uploadBytes, getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const withId = (d) => ({ id: d.id, ...d.data() });

/* ============================================================
   AFILIADOS — grupos y comunidades
   ============================================================ */

export async function createAffiliate(data) {
  const ref_ = await addDoc(collection(db, COL.affiliates), {
    ownerUid: data.ownerUid,
    ownerNick: data.ownerNick,
    name: data.name,
    kind: data.kind,
    description: data.description,
    joinUrl: data.joinUrl || '',
    logoUrl: '',
    requestedAreas: data.requestedAreas,
    isAdminVerified: false,
    status: 'waiting',
    progress: 0,
    createdAt: serverTimestamp(),
  });
  return ref_.id;
}

export async function getAffiliate(id) {
  const snap = await getDoc(doc(db, COL.affiliates, id));
  return snap.exists() ? withId(snap) : null;
}

export async function getAffiliateByOwner(uid) {
  const snap = await getDocs(query(collection(db, COL.affiliates), where('ownerUid', '==', uid)));
  return snap.empty ? null : withId(snap.docs[0]);
}

/* Directorio público: solo los que ya pasaron la verificación. */
export function watchPublicAffiliates(callback) {
  const q = query(
    collection(db, COL.affiliates),
    where('status', 'in', PUBLIC_STATUSES),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(withId)));
}

/* Vista del equipo: incluye las solicitudes que aún no son públicas. */
export function watchAllAffiliates(callback) {
  const q = query(collection(db, COL.affiliates), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(withId)));
}

export async function getCurrentTurn() {
  const snap = await getDocs(
    query(collection(db, COL.affiliates), where('status', '==', 'in_progress')),
  );
  return snap.empty ? null : withId(snap.docs[0]);
}

/* Argyra acompaña a un afiliado por vez: antes de dar un turno
   nuevo comprobamos que no haya otro en curso. */
export async function setAffiliateStatus(id, status) {
  if (status === 'in_progress') {
    const current = await getCurrentTurn();
    if (current && current.id !== id) {
      throw new Error(`Ya hay un afiliado en proceso: ${current.name}. Márcalo como resuelto antes de dar un turno nuevo.`);
    }
  }
  return updateDoc(doc(db, COL.affiliates, id), { status });
}

export function verifyAffiliate(id, verified) {
  return updateDoc(doc(db, COL.affiliates, id), { isAdminVerified: verified });
}

export function updateAffiliate(id, data) {
  return updateDoc(doc(db, COL.affiliates, id), data);
}

export function deleteAffiliate(id) {
  return deleteDoc(doc(db, COL.affiliates, id));
}

/* ============================================================
   METAS — las fija el afiliado, el avance lo registra Argyra
   ============================================================ */

export async function createGoal({ affiliateId, title, description, assignedTo = '' }) {
  const ref_ = await addDoc(collection(db, COL.goals), {
    affiliateId, title, description, assignedTo,
    progress: 0,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await syncAffiliateProgress(affiliateId);
  return ref_.id;
}

export function watchGoals(affiliateId, callback) {
  const q = query(
    collection(db, COL.goals),
    where('affiliateId', '==', affiliateId),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(withId)));
}

export async function listGoals(affiliateId) {
  const snap = await getDocs(
    query(collection(db, COL.goals), where('affiliateId', '==', affiliateId)),
  );
  return snap.docs.map(withId);
}

/* El directorio público no puede recorrer las metas de todos, así
   que el promedio se copia dentro del afiliado. */
export async function syncAffiliateProgress(affiliateId) {
  const goals = await listGoals(affiliateId);
  const value = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0;
  return updateDoc(doc(db, COL.affiliates, affiliateId), { progress: value });
}

export async function updateGoalProgress(id, affiliateId, value) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  await updateDoc(doc(db, COL.goals, id), {
    progress: safe,
    status: safe === 0 ? 'pending' : safe === 100 ? 'completed' : 'in_progress',
    updatedAt: serverTimestamp(),
  });
  return syncAffiliateProgress(affiliateId);
}

export function updateGoal(id, data) {
  return updateDoc(doc(db, COL.goals, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGoal(id, affiliateId) {
  await deleteDoc(doc(db, COL.goals, id));
  return syncAffiliateProgress(affiliateId);
}

/* ============================================================
   SOLICITUDES — notes son los comentarios del equipo
   ============================================================ */

export async function createRequest({ userId, affiliateId }) {
  const ref_ = await addDoc(collection(db, COL.requests), {
    userId, affiliateId,
    status: 'pending',
    notes: '',
    createdAt: serverTimestamp(),
  });
  return ref_.id;
}

export function watchUserRequests(userId, callback) {
  const q = query(collection(db, COL.requests), where('userId', '==', userId));
  return onSnapshot(q, (snap) => callback(snap.docs.map(withId)));
}

export async function getRequestByAffiliate(affiliateId) {
  const snap = await getDocs(
    query(collection(db, COL.requests), where('affiliateId', '==', affiliateId)),
  );
  return snap.empty ? null : withId(snap.docs[0]);
}

export function setRequestNotes(id, notes) {
  return updateDoc(doc(db, COL.requests, id), { notes });
}

/* ============================================================
   USUARIOS
   ============================================================ */

export async function listUsers() {
  const snap = await getDocs(query(collection(db, COL.users), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data());
}

export function setUserStatus(uid, status) {
  return updateDoc(doc(db, COL.users, uid), { status });
}

export function updateUser(uid, data) {
  return updateDoc(doc(db, COL.users, uid), data);
}

/* ============================================================
   LABORATORIO — lo que Argyra construye
   ============================================================ */

export function watchProjects(callback) {
  const q = query(collection(db, COL.projects), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(withId)));
}

export async function getProject(id) {
  const snap = await getDoc(doc(db, COL.projects, id));
  return snap.exists() ? withId(snap) : null;
}

export async function createProject({ name, description, kind, status }) {
  const ref_ = await addDoc(collection(db, COL.projects), {
    name, description, kind, status,
    links: [], images: [], credits: [],
    createdAt: serverTimestamp(),
  });
  return ref_.id;
}

export function updateProject(id, data) {
  return updateDoc(doc(db, COL.projects, id), data);
}

export function deleteProject(id) {
  return deleteDoc(doc(db, COL.projects, id));
}

/* ============================================================
   IMÁGENES
   ============================================================ */

const MAX_BYTES = 3 * 1024 * 1024;

async function uploadImage(path, file) {
  if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
  if (file.size > MAX_BYTES) throw new Error('La imagen no puede pesar más de 3 MB.');

  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}

export async function uploadAffiliateLogo(affiliateId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const url = await uploadImage(`affiliates/${affiliateId}/logo.${ext}`, file);
  await updateDoc(doc(db, COL.affiliates, affiliateId), { logoUrl: url });
  return url;
}

export async function uploadProjectImage(projectId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const url = await uploadImage(`projects/${projectId}/${Date.now()}.${ext}`, file);
  const project = await getProject(projectId);
  await updateDoc(doc(db, COL.projects, projectId), {
    images: [...(project?.images || []), url],
  });
  return url;
}

/* ============================================================
   ESTADÍSTICAS — usa count() para no leer documentos enteros
   ============================================================ */

async function count(path, field, value) {
  const base = collection(db, path);
  const q = field ? query(base, where(field, '==', value)) : query(base);
  return (await getCountFromServer(q)).data().count;
}

export async function getStats() {
  const [users, affiliates, waiting, inProgress, completed, requests, projects] =
    await Promise.all([
      count(COL.users),
      count(COL.affiliates),
      count(COL.affiliates, 'status', 'approved'),
      count(COL.affiliates, 'status', 'in_progress'),
      count(COL.affiliates, 'status', 'completed'),
      count(COL.requests, 'status', 'pending'),
      count(COL.projects),
    ]);

  return {
    'Usuarios registrados': users,
    'Afiliados totales': affiliates,
    'En espera de turno': waiting,
    'En proceso': inProgress,
    'Resueltos': completed,
    'Solicitudes pendientes': requests,
    'Proyectos del Laboratorio': projects,
  };
}
