# Plannia — Hallazgos de testing (E2E + revisión)

Fecha: 2026-06-29

## 🟡 ABIERTO — `GET /recommend` devuelve 404 cuando no hay candidatos (debería ser 200 + lista vacía)

**Dónde:** `assignment` BC — `AssignmentController.getTopCandidates` retorna `ResponseEntity.notFound()` (404) cuando la lista de candidatos viene vacía.

**Síntoma:** el frontend (`assignmentService.getRecommendedCandidates`) trata cualquier `!response.ok` como error y lanza, así que el modal "Asignar tarea" muestra **"No se pudieron obtener candidatos para esta tarea"** (mensaje de ERROR) en lugar de un estado vacío claro tipo **"No hay candidatos disponibles para esta tarea"**. El front no puede distinguir "no hay candidatos" de "falló la llamada".

**Recomendación:** que `getTopCandidates` devuelva **200 con lista vacía** `[]` cuando no hay candidatos (reservar 404 para "tarea/equipo inexistente"). Así el front muestra el estado vacío correcto. Alternativa solo-front: tratar 404 como lista vacía en `getRecommendedCandidates`.

**Severidad:** baja (UX/semántica), no rompe funcionalidad.

---

## ✅ ARREGLADOS en esta ronda

- **CORS no permitía `PATCH`** → preflight 403 bloqueaba `completar asignación`, `max-hours`, `reduce-hours` desde el navegador. Fix: agregar `PATCH`/`OPTIONS` a los métodos CORS. (deployado)
- **`PUT /categories/{id}` → 500 (enmascarado como 401)** por `LazyInitializationException` al serializar `members`. Fix: inicializar la colección dentro de la transacción. (deployado)
- **Sign-in 401 con cuerpo vacío** → el front reventaba al parsear (`response.json()` sobre vacío) y mostraba *"Failed to execute 'json'... Unexpected end of JSON input"*. Fix: devolver `MessageResource("Credenciales inválidas")` en el 401. (commiteado en `main`, **pendiente de push + deploy**)

---

## 🔴 ABIERTO (frontend) — La UI de Notificaciones muestra datos MOCK, no las reales

**Dónde:** `AppLayout` (líder) y `MemberAppLayout` (miembro) hacen `const [notifs] = useState(initialNotifs)` con `initialNotifs` importado de `mockData`. `ProfileNotifications`/`NotificationsPage` renderizan esa lista mock. El servicio real **`notificationService`** (`getNotificationsByUserId`/`getAllNotifications`) **no lo usa nadie** (código muerto).

**Síntoma:** la **campanita** y la **página "Notificaciones"** (de líder y miembro) muestran avisos **hardcodeados**, nunca las notificaciones reales del backend — las mismas que sí disparan el correo. Un usuario jamás ve en la app la notificación real de "se te asignó la tarea #N".

**Fix (frontend):** cablear `notificationService.getNotificationsByUserId(user.id)` en `AppLayout`/`MemberAppLayout` (o `ProfileNotifications`) y reemplazar el `initialNotifs` mock. El backend ya expone todo (`GET /notifications/users/{userId}`).

**Severidad:** media-alta (la feature funciona en backend + email, pero es invisible dentro de la app).

---

## 🧹 LIMPIEZA / MENORES (frontend)

- **`AIAssignmentModal.tsx` es código muerto con datos mock** (candidatos 94%/78%/65% hardcodeados, importa `teamMembers` de `mockData`). No lo usa nadie; el flujo real va por `AssignMemberModal`. Conviene borrarlo para que no confunda.
- **`.env.local` con `VERCEL_OIDC_TOKEN` commiteado** — higiene de secretos (riesgo bajo, token de dev/corta vida).
- **Sin redirect a login al expirar el token** — UX menor.
- **Servicios duplicados**: `profileService` vs `memberProfileService` vs `userService` (mismos endpoints).
- **Bulk "Asignación IA"** hace N+1 llamadas client-side (`recommend`+`confirm` por tarea) en vez de usar `POST /auto/teams/{teamId}` (1 llamada, transaccional).

---

## ✉️ Notificaciones / Email — estado

- Las notificaciones **se registran** y se leen por API (`GET /notifications`, `GET /notifications/users/{id}`) — verificado.
- **El envío de correo REAL depende de `NOTIFICATIONS_EMAIL_TRANSPORT`** (App Setting de Azure):
  - `log` (default) → **NO envía**, solo loguea `[EMAIL-LOG]`.
  - `smtp` → envía real vía Resend (`SmtpEmailSender`), requiere `MAIL_PASSWORD` (API key Resend) y `NOTIFICATIONS_EMAIL_FROM`.
- **Pendiente:** verificar que un correo real llegue a una bandeja (requiere `transport=smtp` + un inbox a revisar).
