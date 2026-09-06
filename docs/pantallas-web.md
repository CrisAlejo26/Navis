# Inventario de pantallas y modales — app web

Listado de referencia de **todo lo que existe hoy en `apps/web`**: pantallas
(rutas), sub-pantallas anidadas y los modales/hojas que cuelgan de cada una.
Sale de `apps/web/src/router.tsx` (las rutas), `apps/web/src/lib/nav.ts` (los
grupos de la navegación) y de los ficheros `*-dialog.tsx` / `*-sheet.tsx` /
`*-form.tsx` de `apps/web/src/components/`.

Se hace **antes** de seguir tocando el diseño de la app móvil: es el mapa de
lo que móvil tiene que llegar a cubrir (hoy, la mayoría son pantallas puente),
y evita rediseñar dos veces la misma sección por no saber que ya existía.

Convención: `→` es una ruta anidada de la misma sección; `◇` es un modal,
hoja o diálogo de confirmación que se abre **encima** de la pantalla, no una
ruta nueva.

---

## Fuera de sesión / arranque de la instalación

No llevan `AppLayout` (sin barra lateral ni selector de iglesia):

| Ruta               | Página               | Qué es                                                            |
| ------------------ | -------------------- | ----------------------------------------------------------------- |
| `/login`           | `LoginPage`          | Acceso                                                            |
| `/register`        | `RegisterPage`       | Alta de cuenta                                                    |
| `/forgot-password` | `ForgotPasswordPage` | Pide el enlace de recuperación (RFC 0023)                         |
| `/reset-password`  | `ResetPasswordPage`  | Fija la contraseña nueva desde ese enlace (RFC 0023)              |
| `/setup`           | `SetupPage`          | Alta del primer administrador, solo si la instalación está vacía  |
| `/welcome`         | `WelcomePage`        | Crear la primera iglesia, con sesión pero sin ninguna todavía     |
| `/no-access`       | `NoAccessPage`       | Sesión válida pero el rol no abre ninguna pantalla                |
| `/lists/s/:token`  | `PublicListPage`     | Página **pública** de una lista compartida, sin sesión (RFC 0010) |
| `/l/:token`        | _(redirect)_         | Red de seguridad si el proxy no resuelve `/l/` en el servidor     |

---

## Layout autenticado (`AppLayout`)

Todo lo de abajo vive dentro de `/`, protegido por `ProtectedRoute` +
`ChurchGate` (sesión y una iglesia activa elegida). La barra lateral
(`AppLayout`, `components/app-nav.tsx`) lleva además, transversal a toda
pantalla:

- ◇ **`SidebarDialogs`** — alta/edición/borrado rápido de un calendario, una
  lista o una tabla desde el propio selector de la barra (`CalendarForm`,
  `ListForm`, `TableForm`, y sus tres `Delete*Dialog`).
- ◇ **`CreateChurchDialog`** / **`EditChurchDialog`** — crear una iglesia
  nueva o renombrar la activa, desde el selector de iglesia de la cabecera.

### General (no dependen de la iglesia activa)

#### Panel — `/` — `DashboardPage` (RFC 0001)

El resumen de RFC 0001: creyentes, quién pide atención, próximos eventos,
notas recientes, tareas de hoy, composición de la iglesia y actividad
semanal. Sin modales propios (cada tarjeta enlaza a su sección).

#### Profecías — `/prophecies` — `PropheciesPage` (RFC 0004)

- → `/prophecies/list` — `PropheciesListPage`: el listado completo, filtrable.
- → `/prophecies/:id` — `ProphecyPage`: la ficha de una profecía.
- ◇ `ProphecyForm` (crear/editar), `MarkFulfilledDialog` + `FulfillmentForm`
  (marcar cumplida), `DeleteFulfillmentDialog`, `DeleteProphecyDialog`,
  `PropheciesExportDialog`.

#### Sueños — `/dreams` — `DreamsPage` (RFC 0005)

- → `/dreams/list` — `DreamsListPage`.
- → `/dreams/:id` — `DreamPage`.
- ◇ `DreamForm` (crear/editar, con `emotions-manager.tsx` para las emociones
  asociadas y `EmotionForm` para darlas de alta), `FulfillDialog`,
  `DeleteDreamDialog`, `DreamsExportDialog`.

#### Enseñanzas — `/teachings` — `TeachingsPage` (RFC 0022)

- → `/teachings/list` — `TeachingsListPage`.
- → `/teachings/:id` — `TeachingPage`: título + editor de texto enriquecido
  (Tiptap).
- ◇ `TeachingForm`, `DeleteTeachingDialog`.

### La iglesia (dependen de la iglesia activa)

#### Calendario — `/calendar/:slug?` — `CalendarPage` (RFC 0002)

- → `/calendar/:slug/settings` — `CalendarSettingsPage`: sedes y patrones de
  reunión de ese calendario.
- ◇ En la ficha: `AddMeetingDialog` (`PreacherPicker` incluido), `ShareSheet`
  (compartir la programación de la semana).
- ◇ En ajustes (`CalendarSettingsDialogs`): `CalendarForm` (renombrar/borrar
  con `DeleteCalendarDialog`), `CongregationForm` + `DeleteCongregationDialog`,
  `PatternForm` + `DeletePatternDialog`.

#### Listas compartidas — `/lists` — `ListsPage` (RFC 0010)

- → `/lists/:slug` — `ListPage`: ficha de una lista (miembros, accesos,
  estadísticas, la «estela» de visitas).
- → `/lists/s/:token` — `PublicListPage` (pública, fuera del layout — ver
  arriba).
- ◇ En el tablón: `ListForm`, `DeleteListDialog` (vía `SidebarDialogs`).
- ◇ En la ficha (`ListDialogs`): `AddMembersDialog`, edición (`ListForm`),
  `ListExportDialog`, borrado (`DeleteListDialog`).
- ◇ Sueltos en la ficha: `BulkGrantDialog` (conceder acceso a varios de
  golpe), `MemberNoteDialog`, `ViewerDetailDialog` (quién ha visto la lista
  pública y cuándo).

#### Tablas — `/tables` — `TablesPage` (RFC 0021)

- → `/tables/:slug` — `TablePage`: cuadrícula, tablero o calendario según el
  tipo de tabla.
- ◇ En el tablón: `TableForm`, `DeleteTableDialog` (vía `SidebarDialogs`).
- ◇ En la ficha (`TableDialogs`): editar (`TableForm`), `ColumnsDialog`
  (`ColumnForm` para cada columna), vistas (`ViewForm`), `TableExportSheet`,
  `ConfirmDialog` genérico para borrar una vista.
- ◇ Fila de datos: `RowForm`.

#### Creyentes — `/believers` — `BelieversPage` (RFC 0003)

- → `/believers/:id` — `BelieverPage`: ficha con bitácora de notas.
- → `/believers/gifts` — `GiftsPage` (catálogo de dones).
- → `/believers/ministries` — `MinistriesPage` (catálogo de labores).
- → `/believers/tags` — `BelieverTagsPage` (catálogo de etiquetas).
- ◇ `BelieverForm` (alta/edición), `DeleteBelieverDialog`,
  `BelieversExportDialog`.
- ◇ En la ficha: `NoteForm` (añadir/editar nota de bitácora),
  `DeleteNoteDialog`.
- ◇ En los catálogos: `GiftForm` + `DeleteGiftDialog`, `MinistryForm` +
  `DeleteMinistryDialog`, `BelieverTagForm` + `DeleteBelieverTagDialog`.

#### El cuaderno — `/journal` — `JournalPage` (RFC 0017)

- → `/journal/list` — `JournalListPage`.
- → `/journal/:id` — `JournalEntryPage` (RFC 0020: ficha rediseñada, con
  audio).
- ◇ `EntryForm`, `DeleteEntryDialog`.

#### Tareas y hábitos — `/tasks` — `TasksPage` (RFC 0018)

- → `/tasks/stats` — `TasksStatsPage` (El Faro: la racha).
- → `/tasks/list` — `TasksListPage`.
- ◇ `TaskForm`, `HabitForm`, `TagForm` dentro de `TagsManagerDialog`
  (gestor de etiquetas), `OccurrenceDetailDialog` (una ocurrencia del
  calendario de tareas).

#### Comunicaciones — `/communications` — `CommunicationsPage` (RFC 0016)

Maestro-detalle: dos columnas en escritorio, una vista cada vez en móvil.

- → índice (`ConversationEmptyPage`): hueco vacío de escritorio sin
  conversación abierta.
- → `/communications/:channelId` — `ConversationPage`.
- ◇ `NewConversationDialog`, `ForwardMessageDialog`, `ChannelMenuDialogs`
  (limpiar historial / salir del grupo, dos confirmaciones).

#### Usuarios y roles — `/users` — `UsersPage`

- ◇ `UserDialogs` (agrupa `CreateUserDialog`, `EditUserDialog`,
  `SetPasswordDialog`, `DeleteUserDialog`).
- ◇ `RoleDialog`, `DeleteRoleDialog`.

### Ajustes y cuenta (sin bloque de navegación)

| Ruta               | Página           | Qué es                                                        |
| ------------------ | ---------------- | ------------------------------------------------------------- |
| `/settings`        | `SettingsPage`   | Perfil (`ProfileForm`), cuenta (`AccountForm`), tema, idioma  |
| `/settings/access` | `ListAccessPage` | Directorio de accesos a listas compartidas de toda la iglesia |

---

## Solo desarrollo

| Ruta   | Página    | Qué es                                                                                                                 |
| ------ | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/lab` | `LabPage` | Muestrario de piezas de interfaz que solo se ven un instante (hoy, los esqueletos de carga). No está en la navegación. |

---

## Transversales

Aparecen en más de una pantalla y no son de ninguna sección en concreto:

- **`ConfirmDialog`** (`components/ui/confirm-dialog.tsx`) — la confirmación
  genérica («esto no se puede deshacer»), reutilizada por media docena de
  borrados en vez de que cada uno monte la suya.
- **`Dialog`** (`components/ui/dialog.tsx`) — el primitivo sobre el que se
  montan todos los `*-dialog.tsx` de arriba.
- **`ExportSheet`** (`components/export/export-sheet.tsx`) — la hoja de
  exportación (formato, columnas) que reutilizan `PropheciesExportDialog`,
  `DreamsExportDialog`, `BelieversExportDialog`, `ListExportDialog` y
  `TableExportSheet`.

---

## Números

- **~30 rutas** (contando anidadas), de las cuales **8** son públicas o de
  arranque (fuera de sesión/iglesia).
- **~47 modales/hojas** con nombre propio, más **~26 formularios** (`*-form.tsx`)
  que viven dentro de esos modales o inline en su ficha.
- **13 entradas** en la navegación principal (`nav.ts`): 4 en «General», 8 en
  «La iglesia», y Ajustes sin bloque.

## Qué falta en móvil, a la fecha de este documento

Todo lo de arriba, salvo Panel (RFC 0001, implementado, ver
`docs/navegacion-movil-plan.md`) y la navegación misma. Las 5 pestañas +
menú «Más» ya dan acceso a las 13 entradas, pero **cada una sigue siendo una
pantalla puente** (`PlaceholderScreen`) sin ninguna de las sub-pantallas ni
modales listados aquí — esas se implementan cuando le toque el turno a cada
RFC en móvil (`implementar-rfc`), no de golpe.
