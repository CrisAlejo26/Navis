# Cuaderno de la iglesia en móvil: plan de rediseño y cierre de paridad

Fecha: 2026-10-08. Alcance: `https://navis.officetools.es/journal` (RFC 0017 y 0020) en `apps/mobile`.
Referencia visual: Tomtask (`D:/Proyectos_personales/taskia/mobile`), ya destilada en
[`tareas-movil-diseno.md`](./tareas-movil-diseno.md). Implementación realizada en el árbol de trabajo por la petición «implementa». Estado y evidencia en [resultado de QA](../../qa/cuaderno-movil/resultado.md). Permanece pendiente de cierre: Maestro, verificaciones nativas restantes y confirmación visual.

## 0. Hallazgo que cambia el encargo

El cuaderno **ya existe en móvil** (commit `277730b`): SQLite local con esquema espejo, alta/edición/borrado, audios, recordatorios, estadísticas, listado con tres vistas, calendario, filtros y exportación a Markdown/imagen, con 12 tests de repositorio, 195 líneas de test de formulario y tests de directorio/calendario/resumen. Así que el plan **no es crear la sección**, sino:

1. **Demostrar** que la base de datos local es igual que la del servidor (hoy hay un test de paridad de _esquema_, no de _comportamiento_).
2. **Rediseñar** la interfaz al nivel Tomtask que ya tienen Tareas y Hábitos (el cuaderno quedó con otro lenguaje visual).
3. **Pagar la deuda** con las reglas del repositorio (3, 6, 10).
4. **Probar el flujo completo** con una capa e2e real, que en móvil hoy no existe.

> Si lo que querías era _crear_ la sección desde cero, avísame: no hace falta, pero el plan cambiaría.

## 1. Inventario verificado (lo que he leído, no supuesto)

| Pieza                                                                                   | Estado                                                                                                                            |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/local-journal-schema.ts`                                           | `journal_entries` y `journal_entry_audios`, con `mirror: 'JournalEntry' / 'JournalEntryAudio'`. Mismas columnas que las entidades |
| `apps/api/src/database/local-schema.parity.test.ts`                                     | Compara columnas local ↔ entidad TypeORM e incluye las dos tablas del cuaderno                                                    |
| `data/repos/journal-repo.ts` (259 l.), `journal-audios.ts`, `lib/journal/export.ts`     | CRUD, búsqueda sin acentos (`search_text`), filtros, orden, paginación, estadísticas, recordatorios, audios                       |
| `hooks/use-journal.ts`                                                                  | React Query, claves acotadas por iglesia y usuario, `syncNotifications` tras cada mutación                                        |
| `app/journal.tsx`, `app/journal/list.tsx`, `app/journal/[id].tsx`                       | Portada, listado y detalle ya enrutados; entrada «Cuaderno» en `lib/nav-mobile.ts`                                                |
| `components/journal/*` (20 ficheros)                                                    | Cover, Overview, Card, Directory, Calendar, Filters, Form, Detail, Audio, Editor…                                                 |
| Web: `apps/web/src/components/journal/*`, `routes/journal*.tsx`, `e2e/cuaderno.spec.ts` | Fuente de la funcionalidad y de los textos (`journal.*` en los seis idiomas)                                                      |
| E2E móvil                                                                               | **No existe** (ni Maestro ni Detox). La verificación hasta ahora: Jest + emulador a mano + capturas en `docs/qa/`                 |
| Herramientas locales                                                                    | `adb` y `emulator` en el PATH; `maestro` **no** está instalado                                                                    |

## 2. Brechas encontradas

### 2.1 Paridad de base de datos («exactamente igual»)

El esquema coincide columna a columna. Lo que **no** está garantizado hoy y es donde se rompen las copias entre web y móvil:

| Riesgo                                                                                                                                                                                       | Cómo se comprueba                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Formato de `occurred_at` (día `AAAA-MM-DD`, D5) y `remind_at` (instante ISO, D6) idénticos a lo que escribe la API                                                                           | Test que corre el mismo caso en API (SQLite) y en el repo móvil y compara el JSON de salida          |
| `search_text` calculado igual (NFD, sin diacríticos, minúsculas; título + anotación + aprendido)                                                                                             | Tabla de casos compartida (acentos, ñ, mayúsculas, vacíos) ejecutada contra las dos implementaciones |
| Semántica de borrado: la API usa `deleted_at` (BaseEntity); móvil también, pero hay que confirmar que **borrar una entrada oculta sus audios** en ambos y qué hace con los ficheros en disco | Test de repo + inspección de `deleteJournalEntry` (aún no leída entera)                              |
| Cambiar la fecha del recordatorio lo devuelve a pendiente (`remind_done_at = null`) igual que en `JournalEntriesService`                                                                     | Ya hay un test móvil; falta el gemelo contra la API para que no diverjan                             |
| Límites de validación (`title` 200, `annotation` 8000, `learned` 8000, `remindText` 500)                                                                                                     | Ya salen de `createEntrySchema` compartido; test que lo fija                                         |
| Estadísticas (tipo y mes) y `pendingReminders`                                                                                                                                               | Mismo conjunto de datos, mismo resultado que `journal-stats.ts` de la API                            |
| Copia de seguridad: el cuaderno entra y sale (`lib/backup`), incluidos los audios                                                                                                            | Test de ida y vuelta con audio                                                                       |

**Decisión técnica:** una sola suite de «contrato» en `packages/shared` (casos como datos) que consumen los dos runners. Así el día que alguien toque una regla en un lado, el otro test se pone rojo.

### 2.2 Diseño

El cuaderno usa una paleta escrita a mano (`#F4F6FF`, `#1E2340`, `#626B85`, `#383D55`, siete hex para los tipos) en `journal-theme.ts`, y estilos en línea con `fontWeight` suelto. Tareas ya se rehízo con tokens y Poppins por pesos. Consecuencias:

- Incumple la **Regla 3** (colores fuera de `themeColorsHex`) y no sigue el sistema de fuentes móvil vigente (la fuente se elige entera, no con `fontWeight`).
- La tarjeta tiene radio 22/16 y no la silueta Tomtask (26, padding 15, separación 13, acciones por deslizamiento).
- Sin `SwipeableRow`, sin lista por secciones con contadores, sin esqueleto de «cargar más».
- Filtros en `FilterSheet`/hoja, no a pantalla completa con borrador y «Aplicar (N)».

### 2.3 Tamaño de ficheros (Regla 6)

`journal-directory.tsx` 433 l., `journal-form.tsx` 357, `journal-detail.tsx` 347, `journal-overview.tsx` 224, `journal-card.tsx` 197. Se parten dentro del rediseño, no después.

### 2.4 Lo que no he podido confirmar (se mira en la Fase 0)

- Qué hace exactamente `journal-form.tsx` hoy (¿hoja o pantalla completa? ¿guarda con teclado abierto?).
- Si la exportación como imagen funciona en dispositivo real o solo está cableada.
- Que el calendario del cuaderno respeta movimiento reducido y texto al 130 %.
- Si las capturas de `docs/qa/` incluyen el cuaderno (hay carpetas para tablas y tareas, no para cuaderno).

## 3. Dirección de diseño

Principio: **Tomtask como silueta, Navis como materia.** Se conservan las proporciones del código de referencia y se visten con tokens, Poppins y vocabulario náutico/pastoral (Regla 9). Una audacia por pantalla.

| Decisión                                                                                                        | Fuente                                             | Adaptación en Navis                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tarjeta radio 26, padding 15, separación 13; título 15 semibold, extracto 13, fecha a la derecha                | `taskia/mobile/src/components/tasks/task-card.tsx` | Superficie por token + `listCardShadow`; título hasta 2 líneas; el tipo se lee por icono **y** texto (no solo color)                                                                             |
| Tinte suave por tipo (9 % claro / 14 % oscuro) con borde neutro y sin sombra de color                           | Decisión ya tomada en Tareas fase 5                | Siete tipos derivados de tokens existentes (`primary`, `success`, `warning`, `destructive`, `accent`…); **sin hex nuevos** salvo que se añadan en los cuatro sitios de `tokens.css` (Regla 3 §3) |
| Swipe con acciones rotuladas (Atender recordatorio / Editar / Borrar) + pulsación larga 350 ms para seleccionar | `task-card.tsx`                                    | Reutilizar `SwipeableRow`; las mismas acciones como botones accesibles en el detalle (el gesto nunca es la única vía)                                                                            |
| Lista por secciones **por mes** con contador; vacío inicial ≠ vacío por filtros; esqueleto al paginar           | `tasks-screen.tsx`, `task-card-skeleton.tsx`       | `SectionList` virtualizada, máx. 480, gutter 22; copia propia del cuaderno en los seis idiomas                                                                                                   |
| Filtros a pantalla completa con borrador, chips activos al volver y CTA fijo «Aplicar (N)»                      | `filters/filters-screen.tsx`                       | Tipo (7), ventana (7 d / 30 d / año / rango), «solo recordatorio pendiente»; CTA por encima del teclado                                                                                          |
| Editor: título grande editable, chips de tipo, fecha, recordatorio con fecha y hora, botón Guardar fijo         | `tasks/edit-item-screen.tsx`                       | Pantalla completa (no hoja): título, tipo, día, anotación, «lo aprendido» plegable, recordatorio, audios; Guardar dentro del área que evita el teclado                                           |
| Detalle: icono 52 radio 18, título 26, bloques radio 26, Editar/Atender/Borrar                                  | `item-detail-screen.tsx`                           | «Detalle primero, no editar» (preferencia ya fijada): el detalle se ve con el color del tipo; editar es un botón                                                                                 |
| Calendario con selección de día y resumen del día                                                               | `tasks/calendar-card.tsx`                          | Reutilizar `CalendarGrid`; puntos por tipo en cada día                                                                                                                                           |
| Resumen con anillo/barras y métricas                                                                            | `stats/stats-screen.tsx`, `stat-tile.tsx`          | Reutilizar `BarChart`, `ProgressRing`, `StatCard`; gráficas por tipo y por mes con `useChartWidth`                                                                                               |

**Elemento firma (uno):** el _rumbo_ del cuaderno — una estela/oleaje fina bajo la portada cuyo trazo se llena según las entradas del mes, adaptando `components/journal/oleaje.tsx` de la web (a leer en la Fase 0 antes de decidir). Todo lo demás, en voz baja. Sin degradados de relleno, sin emoji, sin cruces (Regla 7: ojo con iconos de tipo; revisar `git-branch-outline` y `alert-circle-outline`).

**Suelo de calidad (Regla 9 §5):** contraste en los dos temas, foco y etiquetas accesibles, `useReducedMotion`, solo `opacity`/`transform`, 375 px con alemán y texto al 130 %.

## 4. Pantallas y comportamiento

1. **Portada** (`/journal`): cabecera compacta, firma, tres cifras (entradas, pendientes, este mes), gráfica por tipo y por mes, «Recientes» (3) y accesos al listado y a «Pendientes». Botón principal **abajo y centrado** (Regla 5 §4), tamaño `lg`.
2. **Listado** (`/journal/list`): búsqueda con debounce, botón de filtros con contador, tres vistas (fichas / lista / calendario), secciones por mes, selección múltiple (pulsación larga) → exportar a Markdown, borrar varias con confirmación.
3. **Detalle** (`/journal/[id]`): color del tipo, fecha, autor, anotación completa, «lo aprendido», recordatorio (atender / reabrir), audios reproducibles, compartir (Markdown / imagen), editar, borrar con confirmación.
4. **Editor** (alta y edición, misma pantalla): validación con `createEntrySchema`/`updateEntrySchema`, errores por campo, grabar o adjuntar audio, borrador no perdido si se cierra por error (confirmación al descartar).
5. **Estados:** vacío, cargando (esqueleto), error con «Reintentar», sin permiso de gestión (solo lectura: sin botones de crear/editar/borrar), sin resultados por filtro con «Restablecer».
6. **Permisos y alcance:** todo acotado por `churchId` (hay tests de aislamiento; los nuevos hooks entran en `church-scope.static.test.ts`). Solo el dueño gestiona; un miembro lee.

## 5. Fases

Cada fase termina con `pnpm check`, y las que tocan UI con revisión en emulador (claro/oscuro, español/alemán, 375 dp, texto 130 %) y capturas en `docs/qa/cuaderno-movil/`.

### Fase 0 — Auditoría y línea base (sin tocar producción)

- Leer lo pendiente de §2.4 (`journal-form`, `journal-detail`, `oleaje.tsx`, `deleteJournalEntry`).
- Capturar el estado actual en emulador (antes) en ambos temas y dos idiomas.
- Listar los textos `journal.*` ya existentes en los seis idiomas y los que faltan para el rediseño.
- Salida: informe corto en `docs/qa/cuaderno-movil/linea-base.md`.

### Fase 1 — Contrato de paridad de datos

- Casos de contrato como datos en `packages/shared` (crear, editar, buscar, filtrar, ordenar, estadísticas, recordatorios, borrado con audios).
- Runners: Vitest sobre `JournalEntriesService` (API, SQLite) y Jest sobre `journal-repo` (móvil, SQLite real vía `test-support`).
- Añadir tablas nuevas, si las hubiera, a `ALL_TABLES` de `test-support.js`.
- Test de ida y vuelta de copia de seguridad con audio.
- **Cierra:** «la base de datos es igual» con evidencia, no por inspección de columnas.

### Fase 2 — Sistema visual del cuaderno (cimientos)

- Reemplazar `useJournalPalette` por tokens (`themeColorsHex`) + tintes derivados con `hexAlpha`; mapa de variantes por tipo en su propio fichero (`journal-kinds.ts`: icono, token, clave i18n).
- Fuente Poppins por pesos, sin `fontWeight` suelto.
- Componentes base: `JournalCard` (silueta Tomtask), `JournalCardSkeleton`, `JournalSectionHeader`, chip de tipo.
- Tests: contrato de props y accesibilidad (rol, etiqueta); comprobación estática de que no quedan hex en `components/journal/`.

### Fase 3 — Portada y listado

- Partir `journal-directory.tsx` (433 l.) en lista, cabecera, barra de búsqueda y hook `use-journal-screen`.
- `SectionList` por mes, swipe con acciones, selección múltiple, estados vacíos distintos.
- Filtros a pantalla completa con borrador y «Aplicar (N)».
- Portada con firma, cifras y gráficas.

### Fase 4 — Detalle y editor

- Detalle con color de tipo y bloques radio 26; atender/reabrir recordatorio; compartir; borrar con confirmación.
- Editor a pantalla completa con Guardar fijo sobre el teclado; descartar con confirmación; audios.
- Partir `journal-form.tsx` y `journal-detail.tsx` por debajo de ~150 líneas por pieza.

### Fase 5 — Calendario, recordatorios y avisos

- Calendario con puntos por tipo y resumen del día.
- Avisos: ya existe `syncNotifications`; verificar que atender, reabrir, editar y borrar cancelan y reprograman, y que el toque abre el detalle en frío y en caliente (patrón de la fase 6 de Tareas). Recordar: Expo Go no entrega avisos; hace falta compilación nativa.

### Fase 6 — Pruebas de extremo a extremo

Ver §6.

### Fase 7 — Pulido, accesibilidad y cierre

- Pasada con `design:accessibility-review` y la puerta de calidad visual de §3.
- Actualizar `CLAUDE.md` con las trampas nuevas que aparezcan y mover este plan a `implementados/`.

## 6. Estrategia de pruebas

| Capa                  | Qué prueba                                                                                                 | Herramienta                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Contrato de paridad   | Mismos casos en API y móvil, mismo resultado                                                               | Vitest + Jest sobre casos compartidos                                 |
| Repositorio           | CRUD, filtros, estadísticas, recordatorios, audios, aislamiento entre iglesias, migración repetible        | Jest + SQLite real (`test-support`)                                   |
| Componente            | Tarjeta, filtros, editor (validación, errores), detalle (permisos), vacíos/carga/error, selección múltiple | RNTL 14 (`render`/`fireEvent` asíncronos)                             |
| Integración de flujo  | Crear → aparece en listado → editar → buscar → atender recordatorio → borrar, con SQLite real y navegación | Jest con router simulado                                              |
| **E2E en emulador**   | El mismo recorrido, pulsando en la app real, en claro/oscuro y en dos idiomas, con capturas                | **Maestro** (YAML en `apps/mobile/.maestro/`) sobre el emulador de QA |
| Regresión estática    | Sin hex en `components/journal/`; hooks nuevos acotados por iglesia; ningún `any`                          | Tests estáticos como `church-scope.static.test.ts`                    |
| Calidad visual manual | Matriz de §7 con capturas en `docs/qa/cuaderno-movil/`                                                     | Emulador + adb                                                        |

**Sobre el e2e:** Maestro no está instalado. Es la opción con menos fricción para Expo (flujos declarativos, sin tocar el código nativo), pero añade una herramienta al proyecto. Alternativa sin dependencias nuevas: guiones `adb` + capturas, menos mantenibles. Propongo Maestro; **necesito tu visto bueno** antes de instalarlo.

Los flujos Maestro llevan `testID`/etiquetas accesibles estables; los datos de partida salen de `demo-data` o de un modo de sembrado de QA retirado al terminar (como la ruta temporal de la fase 4 de Tareas).

## 7. Matriz de verificación visual (Regla 11)

Pantallas: portada, listado (fichas / lista / calendario), filtros, detalle, editor, selección múltiple, vacío, vacío por filtros, carga, error, solo lectura.
Variantes: claro/oscuro × español/alemán × 375 dp × texto 130 % × teclado abierto en el editor y en la búsqueda × movimiento reducido activado.
Comprobar: sin elementos duplicados (dos cabeceras, dos flechas), nada cortado, objetivos táctiles ≥ 44 px, contraste en los tintes de los siete tipos.

## 8. Riesgos y decisiones abiertas

1. **Alcance del e2e**: Maestro (recomendado) frente a guiones `adb`. _Bloquea la Fase 6._
2. **Colores de los siete tipos**: si los tokens existentes no distinguen siete tonos con contraste suficiente, habrá que añadir tokens nuevos en los cuatro sitios de `tokens.css` y en `tokens.ts` (Regla 3 §3). Se decide en la Fase 2 con muestras reales en ambos temas.
3. **Modelo local-first**: el móvil guarda en SQLite y no sincroniza con el servidor en este plan; «igual» significa mismo esquema y mismo comportamiento, y copia de seguridad compatible. Si quieres sincronización en vivo con el servidor, es otro RFC.
4. **Audio y exportación a imagen** dependen de APIs nativas: se verifican en emulador/dispositivo, no solo en Jest (el CLAUDE.md ya avisa de los mocks de Reanimated y de `gifted-charts`).
5. **Fusión a `main`**: `git merge --ff-only` en local, sin PR (preferencia guardada), y solo cuando lo pidas.

## 9. Definición de terminado

- `pnpm check` verde; `pnpm --filter @navis/mobile exec expo-doctor` limpio; e2e de API y web sin regresiones.
- Contrato de paridad verde en API y móvil.
- Flujos Maestro verdes en el emulador de QA.
- Matriz de §7 revisada con capturas guardadas, y confirmación visual tuya antes de cerrar (Regla 11 §2).
- Ningún fichero de `components/journal/` muy por encima de 100 líneas, ningún `any`, seis idiomas completos.
