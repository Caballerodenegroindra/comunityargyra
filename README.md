# Argyra Community Support

**Argyra es una comunidad madre.** Grupos y comunidades se afilian para recibir
acompañamiento en administración, organización, crecimiento, diseño, automatización,
moderación y actividades.

La plataforma tiene dos caras:

- **Pública.** La portada explica qué es Argyra. El directorio muestra cada afiliado con
  quién pidió el apoyo, qué pidió y en qué estado está. Cada afiliado tiene su ficha con
  descripción, enlace para unirse, metas y avance. El **Laboratorio** muestra lo que
  Argyra construye: bots, apps y sitios, terminados o en curso.
- **Privada.** El panel del afiliado gestiona su ficha y sus metas. El panel de Argyra
  verifica administraciones, mueve el turno, registra avances y publica proyectos.

**Argyra acompaña a un afiliado por vez.** El resto espera en la cola con su trabajo ya
definido y visible.

**Comunidad y grupo no son lo mismo**: una comunidad contiene varios grupos, un grupo es
uno solo.

---

## Tecnología

HTML, CSS y JavaScript sin compilar. **No hay build, no hay npm, no hay workflow.**
Se sube al repositorio y GitHub Pages lo publica tal cual.

Firebase se carga directo desde `gstatic.com` con módulos ES:

```js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
```

| Capa | Cómo |
| --- | --- |
| Páginas | HTML plano, una por sección |
| Estilos | `css/style.css`, un solo archivo |
| Lógica | módulos ES en `js/` |
| Autenticación | Firebase Authentication (correo y contraseña) |
| Base de datos | Cloud Firestore |
| Imágenes | Firebase Storage |
| Publicación | GitHub Pages |

---

## Estructura

```
argyra/
├── index.html                Portada
├── afiliados.html            Directorio público
├── afiliado.html             Ficha pública      (?id=…)
├── laboratorio.html          Proyectos de Argyra
├── proyecto.html             Ficha de proyecto  (?id=…)
├── solicitar.html            Paso 1: reglas y permisos
├── programa.html             Paso 2: información del programa
├── registro.html             Paso 3: alta de cuenta y ficha
├── solicitud-enviada.html    Confirmación y grupo de WhatsApp
├── ingresar.html             Acceso y recuperación
├── panel.html                Panel del afiliado
├── metas.html                Metas que fija el afiliado
├── admin.html                Estadísticas
├── admin-usuarios.html       Aprobar, rechazar, suspender, editar
├── admin-afiliados.html      Verificar, mover turno, comentar
├── admin-metas.html          Crear metas y registrar avance
├── admin-laboratorio.html    Publicar proyectos
├── 404.html
│
├── css/style.css             Sistema de diseño completo
├── js/
│   ├── firebase-config.js    Claves y nombres de colección
│   ├── model.js              Estados, áreas y etiquetas
│   ├── ui.js                 Insignias, progreso, escapado, navegación
│   ├── auth.js               Registro, ingreso, guardas de página
│   ├── data.js               Todas las consultas a Firestore
│   ├── validate.js           Validación de formularios
│   └── page-*.js             Un script por página
│
├── firestore.rules           Reglas de seguridad ← lo que protege de verdad
├── storage.rules
└── .nojekyll                 Evita que GitHub Pages procese el sitio
```

---

## Publicar

### 1. Subir a GitHub

Sube todos los archivos al repositorio, respetando las carpetas `css/`, `js/` y `assets/`.

> **Ojo con `.nojekyll`.** Los archivos que empiezan con punto suelen perderse al
> arrastrarlos. Si no aparece en el repo, créalo con **Add file → Create new file**,
> nombre `.nojekyll`, y déjalo vacío.

### 2. Activar Pages

**Settings → Pages → Source: Deploy from a branch → main → / (root)**

Es el modo simple, el mismo de cualquier sitio HTML. Cada push se publica en menos de un
minuto.

### 3. Autorizar el dominio en Firebase

**Authentication → Settings → Dominios autorizados → Agregar dominio**:

```
caballerodenegroindra.github.io
```

Sin este paso el ingreso falla con `auth/unauthorized-domain`.

### 4. Publicar las reglas

Las reglas no viajan con el sitio; se publican aparte, una sola vez:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Si prefieres no usar la terminal, pega el contenido de `firestore.rules` y
`storage.rules` en la consola de Firebase, en la pestaña **Reglas** de cada servicio.

---

## Crear el primer administrador

1. Regístrate por la web, como cualquier usuario.
2. Entra a **Firestore Database** en la consola de Firebase.
3. Abre la colección `users` y busca tu documento.
4. Cambia dos campos:
   - `role` → `admin`
   - `status` → `approved`

Desde ahí ya puedes entrar a `admin.html`.

---

## Modelo de datos

**users** — cuenta de quien administra.

```json
{ "uid": "", "nick": "", "email": "", "whatsapp": "", "role": "user", "status": "pending" }
```

**affiliates** — la ficha pública de cada grupo o comunidad.

```json
{
  "ownerUid": "", "ownerNick": "", "name": "", "kind": "grupo",
  "description": "", "joinUrl": "", "logoUrl": "",
  "requestedAreas": ["crecimiento"], "isAdminVerified": false,
  "status": "waiting", "progress": 0
}
```

**goals** — las metas que el afiliado quiere conseguir. Públicas desde que se fijan.

```json
{ "affiliateId": "", "title": "", "description": "", "progress": 0, "status": "pending", "assignedTo": "" }
```

**requests** — la solicitud. `notes` son los comentarios del equipo al solicitante.

```json
{ "userId": "", "affiliateId": "", "status": "pending", "notes": "" }
```

**projects** — el Laboratorio.

```json
{
  "name": "", "description": "", "kind": "bot", "status": "in_progress",
  "links": [{ "label": "Descargar", "url": "" }], "images": [], "credits": []
}
```

### Estados

| Afiliado | Significado | ¿Público? |
| --- | --- | --- |
| `waiting` | solicitud enviada, sin verificar | no |
| `verifying` | el equipo comprueba por WhatsApp | no |
| `approved` | aceptado, esperando turno | sí |
| `in_progress` | recibiendo apoyo ahora | sí |
| `completed` | apoyo resuelto | sí |

Usuario: `pending`, `approved`, `rejected`, `suspended`.
Meta y proyecto: `pending` / `in_progress` / `completed`.

### Datos copiados a propósito

`affiliates` guarda `ownerNick` y `progress` aunque vivan en otro lado. El directorio es
público y no puede leer `users` ni recorrer las metas de todos, así que esos dos valores
viajan dentro del afiliado. `progress` se recalcula solo cada vez que cambia una meta.

---

## Seguridad

> **Importante.** En un sitio estático no existe un servidor propio que filtre las
> peticiones. Las guardas de `panel.html` y `admin.html` son del navegador: **ocultan la
> interfaz, no los datos**. Toda la seguridad real está en `firestore.rules`, que se
> aplica en los servidores de Google y nadie puede saltarse.

Por eso las reglas de este proyecto son estrictas:

- Nadie puede escribir su propio `role` ni su propio `status`.
- El afiliado edita su ficha, pero no su estado ni su avance.
- Las metas las fija el afiliado; el avance solo lo registra un administrador.
- Las fichas en `waiting` no son visibles para el público.
- Las imágenes se limitan a 3 MB y a tipos `image/*`, en el navegador y en `storage.rules`.

Todo lo que viene de la base de datos se escapa antes de mostrarse (`esc()` en `ui.js`), y
solo se aceptan enlaces `http(s)` (`safeUrl()`), para que un nombre con código dentro no
pueda ejecutarse en la página.

### Sobre las claves de Firebase

Las claves en `js/firebase-config.js` son **públicas por diseño**: van dentro de cualquier
web que use Firebase y cualquiera puede verlas. No son una contraseña. Lo que protege los
datos son las reglas.

La que **sí** es secreta es la clave del **Admin SDK** (Cuentas de servicio). Esa nunca se
sube al repositorio.

---

## Probar en local

Los módulos ES no funcionan abriendo el archivo directamente. Levanta un servidor:

```bash
python3 -m http.server 8000
```

Y abre `http://localhost:8000`.

---

## Diseño

Mobile first. Gris metálico frío sobre carbón, con un único acento azul-violeta para todo
lo accionable. El logotipo lleva un destello metálico que lo recorre: es la firma de la
marca y el único elemento con movimiento. Tipografías Bricolage Grotesque (títulos),
IBM Plex Sans (texto) e IBM Plex Mono (estados y cifras).

Todos los tokens están al principio de `css/style.css`.

---

## Licencia

Proyecto privado de Argyra. Todos los derechos reservados.
