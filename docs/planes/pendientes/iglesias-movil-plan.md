# Varias iglesias en la app móvil — plan

- **Estado**: Fases 0–6 implementadas. Regresiones y paridad documentadas; validación Android y límites en [`iglesias-movil-fase-6.md`](iglesias-movil-fase-6.md). Los informes de Fases 0–5 conservan sus evidencias. Las decisiones de §10 siguen vigentes. Los criterios pendientes de verificación se indican en §11.
- **Fecha**: 2026-09-30
- **Apps afectadas**: mobile (y `packages/shared`, `packages/theme` e
  `packages/i18n` para lo que comparten con la web)
- **Referencias**: RFC 0008 (iglesias como espacios de trabajo; §8.3 es la
  parte de móvil que quedó pendiente), RFC 0024 (modo local y conexión al
  servidor), RFC 0015 (baja del dueño), la web (`church-switcher`, `church-menu`,
  `church-gate`, `ChurchesService`) y el código actual de `apps/mobile`.
- **Depende de**: nada. **Condiciona a**: RFC 0024 Fases 3 y 4 (migrar varias
  iglesias, no una), y a todo módulo nuevo del móvil (listas, tablas, tareas,
  cuaderno, chat), que nace ya acotado por iglesia.
- **Petición**: poder **crear varias iglesias, las que se necesiten**; que cada
  una tenga sus creyentes, listas y todo lo demás; y que **nunca se mezcle la
  información de una con la de otra** en ninguna página.

> **Por qué es un plan de auditoría y no solo de pantallas.** Hoy el móvil ya
> guarda `church_id` en casi todo, pero solo **una** iglesia es alcanzable por
> la interfaz, así que los fallos de aislamiento no se ven. En cuanto exista la
> segunda, cada función que trabaje por id suelto, cada clave de caché sin
> iglesia y cada estado en memoria pasa a ser una fuga. La §3 lista las que hay
> hoy, con fichero y función; las Fases 0 y 1 las cierran **antes** de que la
> interfaz deje crear la segunda.

---

## 1. Qué hace la web (la referencia)

| Pieza                   | Web                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Modelo                  | `Church` + `ChurchMember` (pertenencia explícita: sin fila, no hay acceso) y `profiles.active_church_id`   |
| Alta                    | `POST /churches`: crea la iglesia, al dueño como miembro y la deja **activa**. Sin límite (RFC 0008 D7)    |
| Edición                 | `PATCH /churches/:id`: nombre, ciudad, país, región, zona horaria. El `slug` **no** cambia con el nombre   |
| Cambio                  | `PUT /churches/active`, valida pertenencia. La respuesta trae el listado con la activa marcada             |
| Quién decide la activa  | **El servidor** (y la corrige si la guardada ya no vale). El cliente solo busca en la lista                |
| Selector                | La **placa** (emblema náutico + nombre) bajo el logo; menú con marca en la activa y «Añadir iglesia»       |
| Emblema                 | Icono náutico y tinte (1–6) derivados del **hash del id**: estable, sin columna ni migración               |
| Al cambiar              | Se invalidan **todas** las consultas y un aviso dice en cuál se está (sin él, una lista vacía parece rota) |
| Sin iglesia             | `ChurchGate`: pantalla de bienvenida bloqueante con nombre y ciudad                                        |
| Lo que **no** se acota  | Profecías, sueños y enseñanzas: son **de la persona** (`owner_id`), no de la iglesia                       |
| Borrar una iglesia      | **No existe** en la web. Solo desaparece por la baja de su dueño, con traspaso o borrado (RFC 0015)        |
| Lo que hay que respetar | Acotar **por defecto**: toda consulta de un módulo acotado nace con `church_id` (RFC 0008, «Riesgos»)      |

Lo que la web decide y aquí se copia tal cual: **el dato de cuál es la iglesia
activa vive en la base, no en la pantalla**, y **cambiar de iglesia es cambiar
de contexto entero**, no filtrar una lista.

## 2. Qué hay en el móvil hoy y qué está bien

- Casi todas las tablas locales llevan `church_id`: `congregations`,
  `believers`, `calendars`, `believer_notes`, `believer_tags`, `note_audios`,
  `meeting_patterns`, `meetings`, `ministries`, `gifts`, `tasks`, `tags`. Las que
  no (`believer_tag_links`, `pattern_phases`, `meeting_slots`,
  `meeting_slot_believers`, `believer_ministries`, `believer_gifts`,
  `task_occurrences`…) se acotan **por su padre**.
- Las tablas **personales** (`prophecies`, `prophecy_fulfillments`, `dreams`,
  `emotions`, `teachings`) llevan `owner_id` y ningún `church_id`: es lo correcto
  y se queda así (RFC 0004 D1).
- Muchos repositorios ya reciben `churchId` y lo ponen en el `WHERE`:
  `findBeliever`, `believersSummary`, `listNotes`, `findNote`, `createNote`, los
  catálogos, `calendarRange`, `calendarSummary`, `assignSlot`, `setMeetingSlots`.
  `assignSlot` es el modelo a imitar: comprueba que la persona **existe en esta
  iglesia** y que el patrón también (`«Esa persona no existe en esta iglesia»`).
- `createChurch` ya siembra lo que necesita una iglesia nueva: sede por defecto,
  dones, labores y el andamiaje del calendario.
- La copia de seguridad ya incluye **todas** las iglesias.
- Las claves de caché de los listados de creyentes, calendario y catálogos ya
  llevan `churchId`; las de profecías, sueños y enseñanzas llevan `ownerId`.

## 3. Auditoría: lo que se mezclaría con la segunda iglesia

Hallazgos leídos en el código (no supuestos). **Gravedad**: 🔴 muestra o toca
datos de otra iglesia · 🟠 se puede provocar desde una pantalla con un id ajeno
· 🟡 incoherencia de contexto.

### 3.1 Datos que se muestran mezclados

| #   | Dónde                                                                    | Qué pasa                                                                                                                                                                                               | Gravedad |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| A1  | `dashboard-repo.ts` `registeredBelievers()` y `app/(tabs)/index.tsx:129` | La **cifra grande del inicio** cuenta creyentes de todas las iglesias (`total={registered ?? data.believers.total}`). Es deliberado hoy («todas las iglesias locales»)                                 | 🔴       |
| A2  | `hooks/use-dashboard.ts` (`useRegisteredBelievers`)                      | La clave `['dashboard','registered-believers']` no lleva iglesia: tras cambiar, el caché serviría la cifra de la anterior (las demás claves de inicio, calendario, creyentes y catálogos sí la llevan) | 🔴       |
| A3  | `lib/calendar/active-calendar.ts` (`useActiveCalendarStore`)             | `calendarId` y `anchor` viven en memoria y **no dependen de la iglesia**: tras cambiar, el calendario elegido es de la otra (la pantalla cae al primero, pero el estado sigue sucio)                   | 🟡       |
| A4  | `lib/notifications/sync.ts:17` + `listPendingNoteReminders(churchId)`    | Solo se programan los avisos de la iglesia activa, y `reconcile` **cancela el resto**: trabajar en la B borra los recordatorios de la A                                                                | 🟡       |
| A5  | `lib/notifications/routes.ts`                                            | El aviso lleva `noteId` y abre `/believers/notes/[id]`; la pantalla busca con la iglesia **activa**: si el aviso es de otra, «no encontrada»                                                           | 🟡       |

### 3.2 Funciones que trabajan por id suelto (la iglesia no entra en el `WHERE`)

| #   | Función                                                                                | Riesgo                                                                                                                     | Gravedad |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| B1  | `calendar-repo.ts` `deleteCalendar(churchId, id)` y `deleteCongregation(churchId, id)` | El `churchId` solo sirve para contar «si es el último»; el `UPDATE … WHERE id = ?` borra **cualquier** iglesia             | 🟠       |
| B2  | `notes-repo.ts` `updateNote`, `deleteNote`, `deleteAudio`                              | `WHERE id = ?` sin iglesia; además `recomputeLastNote(believerId)` recalcula un creyente sin comprobar de quién es         | 🟠       |
| B3  | `notes-repo.ts` `noteCounts(believerId)`, `noteDays(believerId, …)`                    | Leen por creyente sin iglesia                                                                                              | 🟠       |
| B4  | `calendar-settings.ts` `deletePattern(id)`, `listPatterns(calendarId)`                 | Borran y listan por id de patrón/calendario                                                                                | 🟠       |
| B5  | `calendar-assignments.ts` `deleteMeeting(id)`                                          | Borra por id de reunión                                                                                                    | 🟠       |
| B6  | `calendar-slot-people.ts` `peopleBySlot`, `replaceSlotPeople`                          | Ayudantes internos por id de fase: seguros **solo** porque sus llamadores ya validaron la reunión. Hay que dejarlo escrito | 🟡       |
| B7  | `notes-repo.ts` `addAudio(noteId)`                                                     | Copia el `church_id` de la nota (bien), pero no comprueba que la nota sea de la iglesia activa                             | 🟡       |

### 3.3 Referencias que se escriben sin comprobar que son de la misma iglesia

Una etiqueta, un don o una sede de la iglesia A colgando de un creyente de la B
es una mezcla silenciosa: no revienta, pero el dato queda donde no debe.

| #   | Dónde                                                                                | Qué se guarda sin validar                                          |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| C1  | `believers-repo.ts` `replaceLinks(believerId, tabla, …, values)` (etiquetas y dones) | `tag_id` / `gift_id` tal cual llegan                               |
| C2  | `believers-repo.ts` `createBeliever`, `updateBeliever`, `setCongregation`            | `congregation_id` (por **confirmar** en F0 con el test)            |
| C3  | `notes-repo.ts` `createNote`, `updateNote`                                           | `gift_id`                                                          |
| C4  | `calendar-settings.ts` `createPattern` / `calendar-assignments.ts` `createMeeting`   | `calendar_id`, `congregation_id`, `pattern_id` (por **confirmar**) |

`assignSlot` y `setMeetingSlots` **sí** validan: son el patrón a generalizar.

### 3.4 Sesión y ciclo de vida

| #   | Dónde                                                        | Qué pasa                                                                                                                                                                     |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `app/(auth)/login.tsx`, `demo-data.ts` → `findChurchByOwner` | Devuelve la **más antigua** (`ORDER BY created_at ASC`): al volver a entrar, se pierde en cuál se trabajaba. La web la recuerda en la base                                   |
| D2  | `stores/local-session.ts`                                    | `churchId` vive solo en AsyncStorage. Un cierre de sesión la pierde y una copia restaurada puede dejarla apuntando a una iglesia que ya no existe                            |
| D3  | `app/(tabs)/_layout.tsx:25`                                  | Solo comprueba que `churchId` **no sea nulo**, no que la iglesia exista ni sea accesible: si no existe, todo sale vacío sin explicación                                      |
| D4  | `app/(auth)/_layout.tsx:13` + `church-setup.tsx`             | `church-setup` es el paso bloqueante del alta, y `(auth)/_layout` **expulsa a `(tabs)` a quien ya tiene iglesia**. Una pantalla «añadir otra» **no puede vivir en `(auth)`** |
| D5  | `church-repo.ts` `createChurch`                              | El país queda fijo en `'ES'`; en la web hay selector. Con varias iglesias (quizá de otro país) el calendario marcaría festivos equivocados                                   |
| D6  | `lib/backup/restore-backup.ts`                               | Una copia de un esquema anterior no trae membresías (cuando existan, §5.1): hay que repararlas al restaurar, como hacen las migraciones que siembran                         |
| D7  | Todo el móvil                                                | **No hay ninguna interfaz** para ver, crear ni cambiar de iglesia (RFC 0008 §8.3 sigue pendiente)                                                                            |

### 3.5 Lo que **no** es un fallo, aunque lo parezca

- **Profecías, sueños, enseñanzas**: siguen visibles al cambiar de iglesia. Son
  de la persona. Es el comportamiento correcto y debe quedar **probado**, porque
  un «arreglo» apresurado de aislamiento podría acotarlas por error.
- **Fotos y audios en disco** (`photos/<id>`, `audios/<id>`): los identificadores
  son únicos; no se pisan entre iglesias. (Solo importarían si algún día se
  borra una iglesia: §5.4.)
- **Catálogo de componentes y datos de prueba**: son del aparato, no de la
  iglesia; «sembrar» actúa sobre la activa y está bien.

## 4. El contrato: qué significa «no se mezcla»

Nueve invariantes. Cada fase los cita, y la Fase 0 los convierte en tests.

1. **I1 — Una sola iglesia activa por sesión**, guardada en la base
   (`local_user.active_church_id`), con la sesión como espejo para poder
   redirigir sin esperar a SQLite.
2. **I2 — Toda función de `src/data/repos` que toque una tabla acotada recibe
   `churchId` y lo pone en el `WHERE`** (directamente o por `JOIN` con su padre).
   Nada de ids sueltos.
3. **I3 — Lo que se escribe valida lo que referencia**: una etiqueta, don, sede,
   calendario, patrón, reunión, creyente o nota solo se enlaza si es **de la
   misma iglesia** que lo que se está escribiendo.
4. **I4 — Toda clave de caché de un módulo acotado lleva `churchId`.**
5. **I5 — Nada de estado en memoria o persistido de un módulo acotado
   sobrevive a un cambio de iglesia** (calendario elegido, ancla del tramo,
   filtros, pestañas, hojas abiertas).
6. **I6 — Cambiar de iglesia vuelve a la raíz**: no se queda una ficha de un
   creyente de la A abierta sobre la B.
7. **I7 — Lo personal no se acota** (`owner_id`): profecías, sueños,
   enseñanzas y sus catálogos se ven igual en todas las iglesias.
8. **I8 — Siempre se ve en qué iglesia se está**: el emblema de la activa está
   en la cabecera de cada pantalla acotada, no solo en ajustes.
9. **I9 — Una iglesia que no existe o no es accesible se corrige sola** al
   arrancar (se pasa a la primera accesible; sin ninguna, al alta), nunca se
   enseña vacío.

## 5. Diseño

### 5.1 Datos

- **`church_members` local**, espejo de la entidad de la API (`church_id`,
  `user_id`, más `id` y fechas de `BaseEntity`; la entidad real no tiene `joined_at`), para que «qué iglesias veo» sea **una sola consulta**
  —igual que en el servidor (RFC 0008 §5.3: «ninguna consulta necesita dos
  caminos»)— y para que la Fase 4 del RFC 0024 baje las membresías sin
  traducirlas. Se añade a `LOCAL_TABLES` con `mirror: 'ChurchMember'` y a la
  lista de entidades del test de paridad.
- **`local_user.active_church_id`** (texto, nulo), con el mismo nombre que
  `profiles.active_church_id` de la web.
- **Migración 11** de `db.ts`: crea la tabla si falta, inserta una fila de
  membresía por cada iglesia con su `owner_id` (quien la creó es miembro, como
  en la API) y deja `active_church_id` = la única/primera. Idempotente, con
  `CREATE INDEX IF NOT EXISTS` para sus índices (trampa de `CLAUDE.md`).
- **Reparación tras restaurar** (`repairChurchAccess(db)`): inserta las
  membresías que falten a partir de `owner_id` y anula `active_church_id` si ya
  no apunta a una iglesia accesible. La llama `restoreBackup` al terminar, y el
  arranque (I9), porque una copia de un esquema anterior no las trae.
- `createChurch` inserta la membresía del dueño **en la misma transacción**.

### 5.2 Capa de acceso: que acotar sea lo fácil

- **`data/church-scope.ts`** (un fichero, una responsabilidad):
  `assertInChurch(db, tabla, id, churchId)` —lanza `not-found` (nunca `403`: aquí
  no hay quien lo distinga y el mensaje es el mismo)— y `assertAllInChurch` para
  listas. Las tablas permitidas van en una unión de literales, no en un `string`
  (Regla 10).
- **Firmas**: `deleteNote(noteId, believerId, churchId)`,
  `deleteCalendar(churchId, id)` con `WHERE id = ? AND church_id = ?`, etc. Las
  tablas sin `church_id` (`pattern_phases`, `meeting_slots`, `believer_tag_links`…)
  se acotan con `WHERE … IN (SELECT id FROM padre WHERE church_id = ?)`.
- **`useActiveChurchId()`**: un hook que devuelve el `churchId` **o redirige**
  (I9). Los hooks de datos dejan de repetir `session?.churchId` con `enabled`.
- **Un test estático** (`church-scope.static.test.ts`) recorre las cadenas SQL
  de `src/data/repos` y falla si una sentencia toca una tabla acotada sin
  `church_id` ni `JOIN` a su padre, salvo lista de excepciones con su motivo
  (las personales). Es lo que pide el RFC 0008 («un test que recorra los
  repositorios»): el siguiente módulo que alguien escriba ya nace vigilado.

### 5.3 Cambiar de iglesia: una sola función, en este orden

`switchChurch(churchId)` en un hook (`use-switch-church.ts`), y **nadie más**
toca `session.churchId`:

1. Validar membresía (`assertAccessible`); si no, abortar sin cambiar nada.
2. `queryClient.cancelQueries()` — lo que vuela de la iglesia vieja no debe
   aterrizar en la nueva.
3. Escribir `local_user.active_church_id`, **luego** `session.setChurch` (la base
   manda; la sesión es espejo).
4. Reiniciar el estado de módulos acotados: `useActiveCalendarStore.reset()` y
   cualquier otro que aparezca (I5).
5. `queryClient.removeQueries` de los prefijos acotados (no `clear()`: no avisa a
   las pantallas montadas, lo aprendimos con la copia de seguridad) +
   `invalidateQueries()`.
6. `router.dismissAll()` y volver a `/(tabs)` (I6).
7. Reprogramar avisos (`syncNotifications`) y mostrar el aviso
   «Ahora trabajas en {{name}}» (la web lo hace: sin él, un cambio con la lista
   vacía parece que no ha hecho nada).

### 5.4 Ciclo de vida de una iglesia

| Acción                         | Móvil                                                                                                                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Crear** (las que haga falta) | Nueva pantalla **`app/church/new.tsx`**, fuera de `(auth)` (D4). Mismo formulario que `church-setup` (nombre, ciudad) más **país**, que por defecto sale de la región del dispositivo y si no, `ES` (DC5). Sin límite (DC9). Al crear queda **activa**, como en la web |
| **Primera iglesia**            | `church-setup` se queda como está: el paso bloqueante del alta                                                                                                                                                                                                         |
| **Editar**                     | Ya existe (`settings/church`): edita la **activa**. Sin cambios, salvo que el título lleve su nombre                                                                                                                                                                   |
| **Cambiar**                    | Hoja `ChurchSwitcherSheet` (§5.5); misma en todas las entradas                                                                                                                                                                                                         |
| **Eliminar**                   | **Fuera de alcance** (decisión DC3). La web no lo tiene. Si se quiere, plan aparte: no hay claves ajenas locales (se borra todo a mano), hay que borrar sus audios y fotos del disco, y avisar de que no se deshace                                                    |

### 5.5 Interfaz

- **Emblema de la iglesia** (la «placa» del RFC 0008): el mismo hash del id que
  la web. **La función sube a `packages/shared`** (`churchEmblem(id) → { icon,
tint }`, sin depender de lucide ni de Ionicons) y cada app la mapea a su
  familia de iconos (Regla 1: se comparte el cálculo, no el JSX). Los doce
  iconos náuticos de la web se mapean a Ionicons revisando que **ninguno se lea
  como cruz** (Regla 7 §6), y los tintes `--church-1…6` se añaden a
  `tokens.ts` y `tokens.native.css` en claro y en oscuro (Regla 3; hoy solo
  están en `tokens.css`).
- **`ChurchBadge`**: emblema + nombre, pulsable. Aparece en la cabecera de
  **Inicio, Calendario y Creyentes** (I8) y en «Más». Es el elemento firma de la
  función (Regla 9): lo único de esas cabeceras que cambia al cambiar de iglesia.
- **`ChurchSwitcherSheet`** (sobre `BottomSheet`): lista de iglesias con marca en
  la activa, ficha corta (ciudad) y «Añadir iglesia» al final. Con una sola
  iglesia igualmente se ofrece (siempre se pueden crear más).
- **Ajustes → «La iglesia»**: la fila «Datos de la iglesia» ya está; se añade
  «**Mis iglesias**» (`settings/churches`, con el número y la lista completa y
  los mismos gestos).
- **Sin iglesia accesible** (I9): `church-setup`. Nunca una pantalla vacía.
- Textos: sección `church.*` en los **seis idiomas** (`switch`, `switched`,
  `mine`, `add`, `created`, `current`, `noneTitle`…). Se reutilizan las que la
  web ya tiene.
- Movimiento: entrada de la hoja y fundido del emblema al cambiar, solo
  `opacity` y `transform`, con `reduced-motion` respetado (Regla 9 §5).

### 5.6 Avisos

- **Se programan los avisos de todas las iglesias del usuario**, no solo la
  activa (decisión DC2): quien atiende dos iglesias no debe perder un recordatorio
  por estar mirando la otra. `listPendingNoteReminders(userId)` recorre sus
  membresías.
- Con más de una iglesia, el texto del aviso **nombra la iglesia**
  («Luis — Iglesia Norte»), para no confundirlas en la bandeja.
- El tope de avisos pendientes (`MAX_PENDING = 50`) es **del sistema**, no de
  cada iglesia: se reparte entre todas ordenando por fecha, los más próximos
  primero (DC11).
- El `data` del aviso gana `churchId`. Al tocarlo: si no es la activa, se pasa a
  ella con `switchChurch` (§5.3) y **después** se abre la nota (A5).

### 5.7 Copia de seguridad

Ya exporta todas las iglesias. Cambia solo: incluir `church_members` (automático,
sale de `ALL_LOCAL_TABLES`), la reparación posterior (§5.1) y **una prueba con
dos iglesias**: exportar, vaciar, restaurar y comprobar que cada una recupera lo
suyo y que la activa sigue siendo válida.

### 5.8 Módulos que vienen (listas, tablas, tareas, cuaderno, chat)

Regla de entrada: **nacen con `church_id`, con repo que lo exige, con clave de
caché que lo lleva y con un caso en el test de aislamiento**. Quien lo olvide lo
ve fallar (el test estático de §5.2). Las **listas** son las más delicadas de la
web (enlaces públicos): allí la iglesia es el dueño de la lista y el token
público no cambia esa regla.

## 6. Fases

Cada fase es entregable por separado y deja la app funcionando. **Una fase cada
vez y solo con permiso explícito.** Las dos primeras **no añaden interfaz**: por
eso se hacen antes de poder crear la segunda iglesia.

### Fase 0 — La red de seguridad (tests primero, sin tocar código de producción)

- Fixture **`seedTwoChurches()`** en `data/test-support`: dos iglesias del mismo
  dueño, con datos del **mismo tipo y nombres marcados** (`N-Luis`/`S-Luis`,
  calendarios, sedes, etiquetas, dones, notas con audio, reuniones con fases).
- **`church-isolation.test.ts`**: para cada función pública de los repos de
  §3.2–§3.3, una comprobación desde la iglesia A con ids de la B: las lecturas
  no devuelven nada de B; las escrituras **lanzan o no cambian ninguna fila** de
  B. Uno por hallazgo (A1, B1–B7, C1–C4), con el comentario de qué protege
  (Regla 4 §5).
- **`church-scope.static.test.ts`** (§5.2).
- Resultado esperado: **fallan exactamente los hallazgos de §3** (así se sabe que
  prueban el fallo, no que pasan porque sí). Confirmar aquí los «por confirmar»
  (C2, C4).

### Fase 1 — Cerrar las fugas de los repositorios

- `data/church-scope.ts` (`assertInChurch`, `assertAllInChurch`).
- Firmas y `WHERE` de B1–B7; validación de referencias de C1–C4.
- **A1**: fuera `registeredBelievers` y `useRegisteredBelievers`; el hero usa
  `data.believers.total` de la activa. Se actualiza el comentario de
  `dashboard-repo.ts` (hoy defiende lo contrario); ningún test lo cita, así que
  se añade el de la cifra del inicio.
- Claves de caché con `churchId` (A2) en `use-believers`, `use-dashboard`,
  `use-calendar`, `use-catalog`; `noteCounts`/`noteDays` incluidos.
- **Criterio**: los tests de la Fase 0 pasan; `pnpm check` en verde.

### Fase 2 — Datos: membresía e iglesia activa

- Migración 11; `church_members` en el esquema compartido y en la paridad con la
  API; `active_church_id` en `local_user`; `test-support.js` (`ALL_TABLES`).
- `data/repos/church-access.ts`: `listMyChurches(userId)`, `setActiveChurch`,
  `resolveActiveChurch(userId)` (la guardada si sigue siendo accesible, si no la
  primera, si no `null`), `repairChurchAccess(db)`.
- `createChurch` inserta la membresía y acepta país; `login` y `demo-data` usan
  `resolveActiveChurch`; `(tabs)/_layout` valida existencia (D3, I9).
- `restoreBackup` llama a `repairChurchAccess`.
- **Tests**: migración con datos previos, resolución de la activa (accesible,
  borrada, ninguna), reparación tras restaurar una copia sin membresías.

### Fase 3 — Cambiar de iglesia

- `use-switch-church.ts` con la secuencia de §5.3 y su test (orden de pasos,
  aborto si no hay membresía, reseteo de estados).
- `useActiveCalendarStore.reset()`; `useActiveChurchId()`.
- **Criterio**: test del hook con dos iglesias: tras cambiar, ninguna consulta
  acotada devuelve datos de la anterior (I4, I5, I6).

### Fase 4 — Interfaz

- `churchEmblem` en `packages/shared` (con test) y tokens de tinte en
  `packages/theme` (claro/oscuro, `tokens.ts` + `tokens.native.css`).
- `ChurchBadge`, `ChurchSwitcherSheet`, `settings/churches`, `church/new`,
  y la placa en las cabeceras de Inicio, Calendario, Creyentes y «Más».
- Claves `church.*` en los seis idiomas.
- Países por región del dispositivo (DC5) con su fallback.
- **Verificación en emulador** (§7), en claro y oscuro, a 375 px y con alemán.

### Fase 5 — Avisos y copia de seguridad

- Avisos de todas las iglesias, con el nombre cuando hay varias y `churchId` en
  el `data`; tocar un aviso de otra iglesia cambia y luego abre (A4, A5).
- Prueba de copia con dos iglesias (§5.7).
- Trampas nuevas a `CLAUDE.md` (cambiar de iglesia no es filtrar; `clear()` vs
  `removeQueries`; `(auth)` expulsa; dónde vive la activa).

### Fase 6 — Cierre y paridad

- Recorrido completo de §7 con dos iglesias **y** con tres.
- Actualizar la RFC 0008 (la parte de móvil deja de estar pendiente) y anotar en
  la RFC 0024 Fases 3 y 4 que hay que migrar **N iglesias** (hoy dice «usar esa o
  crear otra»): cada una con sus datos y su membresía.

## 7. Verificación en el emulador (Regla 11)

Datos: tres iglesias (**Norte**, **Sur**, **Este**), cada una con creyentes,
notas (alguna con audio), etiquetas, dones, sedes, calendarios, reuniones con
fases y recordatorios. Los nombres llevan la marca de su iglesia (`N-`, `S-`,
`E-`) para que una fuga **se lea a simple vista**.

| Pantalla / acción                                         | Qué tiene que pasar al cambiar de Norte a Sur                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Inicio: cifra grande, tarjetas, atención, notas, gráficos | Todo cuenta solo lo de Sur. La cifra grande **no** suma las tres                                        |
| Calendario: tramo, reuniones, resumen, balance            | Solo reuniones y sedes de Sur; el calendario elegido vuelve al primero de Sur                           |
| Calendario → configurar: patrones y sedes                 | Solo los de Sur; borrar uno de Sur no toca Norte                                                        |
| Creyentes: lista, búsqueda, filtros, contadores           | Solo los de Sur; los filtros ofrecen las etiquetas y dones de Sur                                       |
| Ficha de un creyente, sus notas, audios, contadores       | Se cierra al cambiar de iglesia; abrir uno de Sur no muestra etiquetas de Norte                         |
| Catálogos (dones, labores, etiquetas)                     | Solo los de Sur; crear uno con el nombre de otro de Norte **no** choca                                  |
| Ajustes → Datos de la iglesia, Mis iglesias               | Edita Sur; las otras no cambian. La placa dice Sur                                                      |
| Profecías, sueños, enseñanzas                             | **Idénticos** en las tres (son personales)                                                              |
| Avisos: recordatorios de Norte y Sur                      | Suenan **los dos**; el de Norte nombra la iglesia; tocarlo estando en Sur cambia a Norte y abre su nota |
| Cerrar sesión y volver a entrar                           | Entra en **Sur** (la última), no en Norte (la más antigua)                                              |
| Cerrar la app y abrirla                                   | Sigue en Sur                                                                                            |
| Exportar copia, vaciar, restaurar                         | Las tres iglesias vuelven con lo suyo; la activa es válida                                              |
| Restaurar una copia sin la iglesia activa                 | Pasa a la primera accesible, sin pantallas vacías                                                       |
| Crear una iglesia nueva                                   | Queda activa, sembrada (sede, dones, labores, calendarios), sin datos de las otras                      |
| Las seis lenguas, claro/oscuro, 375 px                    | La placa y la hoja caben; sin scroll horizontal; foco y `reduced-motion`                                |

## 8. Reglas del proyecto que este plan toca

- **Regla 1**: el emblema sube a `packages/shared` (se comparte el cálculo, no el
  JSX); `ChurchSwitcherSheet` reutiliza `BottomSheet` y `SettingsRow`. No se
  crea un sistema nuevo de listas ni de hojas.
- **Regla 2**: `church.*` en los seis idiomas, sin claves construidas al vuelo;
  el alemán es la prueba de ancho de la placa.
- **Regla 3**: tintes en `tokens.ts` **y** `tokens.native.css`, en claro y
  oscuro; el emblema activo con contraste y la apagada distinguible.
- **Regla 4**: los tests de la Fase 0 se escriben **antes** y deben fallar; los
  de regresión llevan comentario de qué protegen.
- **Regla 5**: hoja con objetivos ≥44 px, «Añadir iglesia» al alcance del
  pulgar, formulario con teclado.
- **Regla 6**: ficheros ≤100 líneas; `church-access.ts`, `church-scope.ts`,
  `use-switch-church.ts` y cada componente de la placa son ficheros aparte. Los
  repos que hoy pasan de 100 (`believers-repo`, `calendar-*`) no crecen: lo
  nuevo entra en ficheros propios.
- **Regla 7**: ningún emblema que se lea como cruz (se mira en pantalla antes de
  darlo por bueno, como hizo la web con `ShipWheel`).
- **Regla 9**: la placa es el elemento firma; una sola por cabecera.
- **Regla 10**: sin `any`; las tablas de `assertInChurch` son una unión de
  literales; lo que sale de `queryRunner`-like (`db.getAllAsync`) se comprueba.
- **Regla 11**: cada fase se recorre en el emulador con la matriz de §7.

## 9. Riesgos y trampas

- **Cambiar de iglesia no es filtrar.** Si solo se cambia el `churchId` y no se
  hace la secuencia de §5.3, quedan pantallas montadas con datos de la anterior
  (`invalidateQueries` no basta si una consulta ya está en vuelo).
- **`queryClient.clear()` no avisa a las pantallas montadas**: por eso
  `removeQueries` + `invalidateQueries` (la copia de seguridad lo demostró).
- **`(auth)/_layout` expulsa a quien ya tiene iglesia**: la pantalla de «añadir»
  vive en `app/church/`, no en `(auth)`.
- **Un test que pasa sin haber fallado no prueba nada**: la Fase 0 termina con
  los tests en rojo **a propósito**.
- **Sin claves ajenas locales**: nada se borra en cascada. Por eso eliminar una
  iglesia queda fuera (DC3) y cualquier futuro borrado es manual y completo.
- **Reconocer «personal» vs «acotado»**: al añadir `assertInChurch` no se toca
  `prophecies`, `dreams` ni `teachings`; el test de aislamiento comprueba que
  siguen visibles (I7).
- **`featured_tag_id`**: la columna heredada de `believers` todavía se usa (la
  copia ya la incluye, `LEGACY_COLUMNS`); al tocar `believers-repo` en la Fase 1
  no se «limpia» de paso.
- **Migración 11 en bases con datos**: se prueba con la base demo (20 creyentes)
  y con una copia restaurada, en el emulador y en Jest.

## 10. Decisiones tomadas

Se tomaron con un criterio único: **lo más seguro para los datos pastorales
primero, y lo más parecido a la web después**, porque la web ya resolvió estos
mismos casos y el RFC 0024 exige que el móvil y el servidor hablen igual. Cada
una lleva su motivo y qué se descartó. Si alguna no te convence, se cambia aquí
antes de empezar y el resto del plan se ajusta (no hay otras dependencias
ocultas).

| #    | Decisión                                                                                                 | Motivo                                                                                                                                                                                 | Descartado                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| DC1  | **`church_members` y `active_church_id` en la base local** (espejo de la API)                            | «Qué iglesias veo» es **una** consulta, como en el servidor (RFC 0008 §5.3); las Fases 3 y 4 del RFC 0024 bajan membresías sin traducirlas; y es lo que hace el resto de la paridad    | Deducirlas de `owner_id`: una tabla menos hoy, pero otro camino de resolución que en la API |
| DC2  | **Avisos de todas las iglesias del usuario**, con el nombre de la iglesia cuando hay varias              | Quien atiende dos iglesias no debe perder un recordatorio por mirar la otra; es una promesa («recuérdame»), no un filtro de pantalla                                                   | Solo la activa: trabajar en la B borra los avisos de la A                                   |
| DC3  | **Eliminar iglesia: fuera de alcance**                                                                   | La web no lo tiene; es irreversible; no hay claves ajenas locales (habría que borrar a mano cada tabla, sus audios y sus fotos); y el RFC 0015 lo trata como «baja del dueño»          | Borrado con confirmación: se hace, si se pide, en un plan propio con exportación previa     |
| DC4  | **La placa de la iglesia en Inicio, Calendario y Creyentes, más «Más» y Ajustes**                        | El invariante I8 (siempre se ve en cuál se está) es la mejor defensa contra mezclar sin darse cuenta; en una pantalla que enseña datos de una iglesia, cuesta una fila y evita errores | Solo Inicio y Ajustes: alguien puede olvidar en cuál está y anotar en la equivocada         |
| DC5  | **País de una iglesia nueva = región del dispositivo** si es un país válido; si no, `ES`                 | Un calendario con el país equivocado marca festivos ajenos; el dispositivo es la mejor pista y es editable después                                                                     | `ES` fijo (hoy): mal para quien lleva una iglesia en otro país                              |
| DC6  | **Al volver a entrar, la última iglesia activa**                                                         | Es lo que hace la web (la activa vive en la base); la más antigua hace perder el sitio                                                                                                 | Siempre la primera                                                                          |
| DC7  | **Lo personal (profecías, sueños, enseñanzas) sigue sin iglesia**                                        | RFC 0004 D1: son de la persona; acotarlas las haría desaparecer al cambiar de iglesia                                                                                                  | Colgarlas de la iglesia: contradice el RFC y la web                                         |
| DC8  | **Tests de aislamiento antes que código** (Fase 0) y **sin interfaz hasta cerrar las fugas** (Fases 0–1) | Con una sola iglesia alcanzable los fallos no se ven; un test que nunca falló no prueba nada; y la interfaz que permite la segunda iglesia es lo que las activa                        | Hacer la interfaz primero y «arreglar después»                                              |
| DC9  | **Sin límite de iglesias y nombres repetibles** (el `slug` se hace único solo)                           | RFC 0008 D7 («el pastor crea las que necesite») y la web permite dos con el mismo nombre; prohibirlo solo desplaza el problema                                                         | Límite por plan o nombre único                                                              |
| DC10 | **Cambiar de iglesia sin pedir confirmación**, con aviso «Ahora trabajas en X»                           | El cambio no pierde nada (no hay formularios abiertos: la placa solo está en pantallas raíz) y la confirmación se vuelve ruido; el aviso es lo que evita creer que no pasó nada        | Diálogo de confirmación en cada cambio                                                      |
| DC11 | **Los 50 avisos pendientes se reparten entre todas las iglesias, por fecha** (los más próximos primero)  | El tope es del sistema (iOS corta en 64), no de cada iglesia; ordenar por fecha evita que una iglesia con muchas notas deje sin hueco a la otra                                        | Un cupo fijo por iglesia: desperdicia hueco                                                 |
| DC12 | **Un solo emblema para web y móvil**: el cálculo sube a `packages/shared`; cada app elige su icono       | Regla 1: se comparte el cálculo, no el JSX; el mismo id da el mismo tinte en web, móvil y escritorio                                                                                   | Un hash propio del móvil: la misma iglesia saldría de otro color en cada aparato            |

**Consecuencias que ya están reflejadas en el plan**: la Fase 2 incluye la
migración 11 y la reparación tras restaurar (DC1); la Fase 5 los avisos de todas
las iglesias con `churchId` en el `data` (DC2, DC11); no hay fase de borrado
(DC3); la Fase 4 pone la placa en cuatro sitios (DC4) y crea `church/new` con
país por región (DC5); el inicio de sesión usa `resolveActiveChurch` (DC6); los
tests de la Fase 0 incluyen «lo personal no cambia» (DC7).

## 10.1 Mejoras añadidas al revisar el plan entero

Cosas que no estaban pedidas pero que el análisis pide para cumplir «no se
mezcla» de verdad:

- **Copia de seguridad con varias iglesias probada de punta a punta** en el
  emulador (exportar, vaciar, restaurar), no solo en Jest; ya lo hizo el ajuste
  anterior con una iglesia, y dos es donde se rompería.
- **La iglesia activa se comprueba al arrancar** y no solo al entrar (I9): una
  copia restaurada, una migración o un borrado manual pueden dejar el `churchId`
  de la sesión apuntando a nada.
- **El test estático (§5.2) es obligatorio para los módulos futuros**: el
  siguiente repositorio que alguien escriba sin `church_id` falla en CI antes de
  llegar a un teléfono.
- **Un apartado de «trampas» en `CLAUDE.md`** al cerrar cada fase, como se hace
  en el resto del proyecto.
- **Sin cambios en la web ni en la API**: todo lo que hace falta ya existe allí
  (`churches`, `church_members`, `active_church_id`); el móvil se alinea con
  ellas, no las modifica.

## 11. Criterios de aceptación

- [x] Se pueden crear tantas iglesias como se quiera, cada una sembrada y activa
      al crearse.
- [x] Con tres iglesias, **ninguna pantalla** enseña un dato de otra: la matriz
      de §7 recorrida entera, con las marcas `N-`/`S-`/`E-`.
- [x] La cifra grande del inicio es de la iglesia activa.
- [x] Los tests de aislamiento (Fase 0) y el test estático pasan, y **fallaron
      antes** de la Fase 1.
- [x] Ningún repositorio acotado acepta un id suelto; toda referencia escrita se
      valida contra la iglesia.
- [x] Cambiar de iglesia vuelve a la raíz, vacía el estado acotado y avisa en
      cuál se está; la activa se recuerda al cerrar sesión y al cerrar la app.
- [x] Una copia con varias iglesias se restaura completa y una sin la activa se
      corrige sola.
- [ ] Los recordatorios de todas las iglesias suenan y el de otra iglesia abre
      su nota tras cambiar.
- [x] Profecías, sueños y enseñanzas se ven iguales en todas.
- [x] Los seis idiomas, claro y oscuro, 375 px, alemán, teclado y `reduced-motion`.
- [x] `pnpm check` en verde, migración probada sobre la base demo y sobre una
      copia restaurada, y lo que no se pudo probar dicho expresamente.

**Verificación pendiente:** los avisos se entregaron y abrieron correctamente
en Android, con sonido predeterminado configurado; falta escuchar el sonido en
un teléfono físico. iOS no se probó. El recorrido de dos y tres iglesias,
búsquedas, filtros, borrado y edición está documentado, junto a las regresiones
SQLite y los límites, en el
[informe de Fase 6](iglesias-movil-fase-6.md).
