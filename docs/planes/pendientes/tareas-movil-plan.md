# Plan — Tareas y hábitos en Navis móvil, con la gestión de Tomtask

Estado: **fases 0, 1 y 2 cerradas; fase 3 pendiente de autorización**. Fecha: 2026-10-05.
Referencias: RFC 0018 (modelo y web), `D:/Proyectos_personales/taskia` (web) y `taskia/mobile` (Habit Land, la referencia de estilos y botones).

Investigación y dirección visual: [tareas-movil-diseno.md](./tareas-movil-diseno.md). Las fases 2–6 conservan el alcance del plan, incluyendo notificaciones reales.

## 0. Lo primero: tablas y notas ya están hechas

Tablas y Cuaderno quedaron guardados, junto con todo el contenido staged, en `277730b`, como pidió el usuario. `pnpm check` pasó y el árbol quedó limpio antes de empezar tareas. El commit `c130b90` retiró los bloqueos de los hooks locales de commit y documentó las validaciones manuales, para permitir commits desde Visual Studio. Estas secciones no se rehacen.

## 1. Punto de partida (lo que hay)

| Capa                                       | Estado hoy                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API + web                                  | Completo (RFC 0018): tareas, hábitos, etiquetas, ocurrencias, racha (El Faro), estadísticas, Hoy / Estadísticas / Listado                                  |
| `packages/shared`                          | Esquemas zod de tareas, hábitos, etiquetas y consultas; catálogo de iconos; `local-schema.ts` ya declara `tasks`, `tags`, `task_tags`, `task_occurrences`  |
| Lógica de repetición, racha y estadísticas | **Vive en `apps/api/src/tasks/`** (`task-recurrence.ts`, `habit-recurrence.ts`, `task-stats.ts`, `tasks-streak.service.ts`): el móvil no la puede importar |
| Móvil                                      | `app/tasks.tsx` es una pantalla puente; `TodayTasksCard` del inicio lee `dashboard-repo`. No hay repo, hook ni UI de tareas                                |
| Local sin esquema                          | **Faltan** en SQLite: hábitos, ocurrencias de hábito, recordatorios y sus etiquetas                                                                        |

Decisión heredada de Listas y Tablas: **SQLite local, sin API ni sync** (la sync de todo el móvil es una extensión posterior). «Igual que Tomtask» significa paridad de capacidades y de aspecto, no datos compartidos con el servidor.

## 2. Qué hace Tomtask y qué cubre ya el modelo de Navis

Inventario de `taskia/mobile` (lo que se quiere tener) frente al modelo RFC 0018.

| Función de Tomtask                                                                                                                                                                                   | ¿Modelo Navis?                                            | Plan                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------- |
| Lista agrupada (fecha, estado, prioridad, categoría), carga por scroll, cabecera con pendientes/hechas                                                                                               | Parcial                                                   | Fase 2                |
| Calendario mensual con día seleccionado y llama por día cumplido                                                                                                                                     | Parcial (web tiene calendario)                            | Fase 2                |
| Filtros en pantalla completa: tipo, texto, rango de fechas, estados, prioridades, categorías, etiquetas, ocultar hechas, recurrente/recordatorio (tres estados), orden, agrupar; botón «aplicar (N)» | Parcial                                                   | Fase 2                |
| Tarjeta con icono de etiqueta, chips, hora, tinte por estado, swipe (completar / borrar)                                                                                                             | Sí                                                        | Fase 2                |
| Modo seleccionar y ordenar a mano (pulsación larga, arrastre, número de orden)                                                                                                                       | **No** (no hay orden manual)                              | Fase 5                |
| Crear/editar en pantalla completa, detalle, selector de estado                                                                                                                                       | Sí (3 estados fijos)                                      | Fase 3                |
| Recordatorio con fecha y hora                                                                                                                                                                        | Sí (1:1, RFC 0018 D10)                                    | Fase 3 + 6            |
| Repetición: diaria, semanal con días, mensual por día, mensual por «n-ésimo weekday», fechas concretas; fin nunca/fecha/cantidad                                                                     | **Parcial**: solo diaria, semanal y mensual con intervalo | Fase 5                |
| Pantalla de series recurrentes (pausar, editar plantilla, terminar)                                                                                                                                  | **No**                                                    | Fase 5                |
| Hoy: selector de día, tira de racha, hábitos con anillo                                                                                                                                              | Sí (El Faro)                                              | Fase 4                |
| Estadísticas: tarjeta héroe, losetas, gráfico de barras                                                                                                                                              | Sí (web)                                                  | Fase 4                |
| Hábitos (meta, progreso, racha)                                                                                                                                                                      | Sí                                                        | Fase 4                |
| Estados personalizados (columnas Kanban) y flujos de trabajo con color                                                                                                                               | **No**                                                    | Fase 7, opcional      |
| Alarma de límite para una tarea «en progreso», fecha límite aparte de la planificada                                                                                                                 | **No**                                                    | Fase 7, opcional      |
| Seguimiento de tiempo por flujo (web de Taskia)                                                                                                                                                      | **No**                                                    | Fuera, salvo petición |
| Widget Android, bloqueo con PIN, ajustes de acento                                                                                                                                                   | No aplica a Navis                                         | Fuera                 |

**Decisión que necesito de ti** (§8): las filas «No» cambian el modelo de Navis (web y API incluidos). Propongo **no tocar el modelo** salvo la repetición avanzada y el orden manual, que son las que se notan a diario, y dejar estados/flujos/límite como fase opcional.

## 3. Estilo: qué se toma de Tomtask y qué no

Se adapta, no se copia: Regla 9 y Regla 7 mandan.

- **Se toma**: tarjeta de 26 px de radio con sombra suave, tinte por estado (verde = hecha, color del estado si no es «pendiente»), `MiniChip` con color, hora a la derecha, cabeceras de sección con contador y color de aviso en «atrasadas», lista virtualizada con esqueleto al cargar más, botón fijo de filtros con fila de chips activos, pantalla de filtros con borrador y botón «aplicar (N)», swipe con etiquetas, estado vacío distinto para «nada creado» y «los filtros no dejan pasar nada».
- **No se toma**: la paleta lavanda `#4B6BFB`/gradiente rosa (el azul es el token `primary`), el icono de gato, la llama como firma (El Faro ya es la firma de Navis, RFC 0018 D19), ningún icono con forma de cruz. Se conserva Poppins en móvil: `packages/theme/src/fonts.ts` ya la establece por petición del usuario para corresponder a Tomtask.
- **Profundidad**: `listCardShadow` y la elevación semántica de `lib/ui/elevation.ts`; nada de un segundo sistema de sombras.
- Todo en claro y oscuro con tokens y `themeColorsHex`; los iconos de etiqueta salen del catálogo `task-icons` con un mapa clave → Ionicons en fichero propio (sin cruces).

## 4. Arquitectura

1. **Subir a `packages/shared`** (Regla 1: lo usan API y móvil): expansión de repetición (`taskAppliesOn`, `habitAppliesOn`, `monthsBetween`), cálculo de racha y estadísticas (`task-stats`, `habit-stats`). La API pasa a importarlas desde ahí; sus tests se mudan con ellas. Es el primer commit y no cambia comportamiento.
2. **Esquema local**: añadir hábitos, `habit_occurrences`, `task_reminders`, `habit_reminders` y sus tablas de etiquetas a `local-schema.ts` con su test de paridad con las entidades de la API; migración local transaccional (patrón `tables-migration.ts`) y entrada en `ALL_TABLES` de `test-support.js`.
3. **Repositorios** `tasks-repo` / `habits-repo` / `tags-repo` en `data/repos/` con contexto iglesia + usuario (`tasks-context.ts`), validando referencias y filtrando por `owner_id` y `church_id` en cada método. Ocurrencias materializadas al tocarlas (D3). Lecturas paginadas con `limit/offset` y relaciones pedidas aparte (trampa de Postgres, aquí por coherencia).
4. **Hooks** `use-tasks.ts`, `use-habits.ts`, `use-tags.ts` con claves de caché acotadas por iglesia y usuario; el cambio de iglesia retira las consultas acotadas (`useSwitchChurch`).
5. **Estado de filtros**: solo local y por pantalla (zustand, no persiste datos), como en Tomtask; los filtros son del móvil, no del modelo.
6. **UI** en `components/tasks/` (≤ 100 líneas por fichero, hook + vista) y rutas finas en `app/tasks/`. Se reutilizan `SwipeableRow`, `FilterSheet`, `Chip`, `ProgressRing`, `BarChart`, `CalendarGrid`, `BottomSheet`, `AppBar`, `HeroScene`, `EmptyState`, `Skeleton` antes de crear nada.
7. **Backup**: las tablas nuevas entran en el formato de copia (`backup-format.ts`) y en la restauración, con su test.
8. **Seed demo** idempotente de tareas, hábitos y etiquetas, como Listas.
9. **i18n**: sección `tasks.*` ya existe en `es.ts`; las claves nuevas, en los seis idiomas y revisadas con alemán a 375 px.

## 4b. Regla de esquema: una sola base de datos, web y móvil

Para poder sincronizar sin conflictos, **el esquema local es copia exacta del de la API**: mismos nombres de tabla y de columna, mismos tipos y misma anulabilidad, y la misma semántica de borrado (lógico con `deleted_at`, con `is_active` o físico, como lo haga la entidad). Nada de columnas ni tablas exclusivas del móvil, salvo la cuenta local. Todo cambio de modelo se hace primero en la API y la web, y el móvil lo copia. Lo vigila `apps/api/src/database/local-schema.parity.test.ts`, que ya cubre también Tablas y Cuaderno. Las tablas nuevas de esta sección (hábitos, ocurrencias, recordatorios) entran en ese test desde la Fase 1.

## 5. Fases

Cada fase termina verde en `pnpm check` y con verificación en emulador (Regla 11) antes de pasar a la siguiente; **solo avanzo con tu permiso entre fases**.

| Fase                              | Contenido                                                                                                                                                                                                             | Hecho cuando                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **0** Cierre                      | Revisar y commitear Tablas y Cuaderno (§0)                                                                                                                                                                            | árbol limpio, check verde                                                 |
| **1** Cimientos                   | §4.1–4.4, 4.7: lógica a `shared`, esquema local, repos, hooks, backup; tests de aislamiento entre iglesias y de ocurrencias                                                                                           | tests de repo + paridad con la API verdes, sin UI                         |
| **2** Listado                     | Pantalla Listado: lista agrupada y paginada, calendario con llama, barra de filtros, pantalla de filtros, tarjeta con swipe, vacíos y carga                                                                           | recorrido completo en emulador, claro/oscuro, 375 px, alemán              |
| **3** Crear, editar, detalle      | Formulario a pantalla completa (título, descripción, fecha, hora, prioridad, estado, etiquetas con icono y color, recordatorio), detalle con color, borrar con confirmación, gestor de etiquetas                      | alta → aparece → se edita → se borra, en los dos motores de test          |
| **4** Hoy y estadísticas          | Hoy con selector de día, El Faro y tira de racha, hábitos con anillo; Estadísticas; tarjeta del inicio al repo local                                                                                                  | cifras idénticas a las de la API sobre los mismos datos (test de paridad) |
| **5** Repetición avanzada y orden | Semanal con días, mensual por día / por n-ésimo weekday, fechas concretas; pantalla de series (pausar, editar, terminar); modo ordenar a mano. **Esta fase amplía el modelo y exige cambio equivalente en API y web** | migración en SQLite y Postgres, e2e de API                                |
| **6** Avisos                      | Recordatorios de tareas y hábitos con `expo-notifications`, sobre lo ya hecho para notas de creyentes y cuaderno; recompilar nativo para probar entrega                                                               | aviso real en emulador, toque abre el detalle                             |
| **7** Opcional                    | Estados personalizados y flujos, fecha límite y alarma de «en progreso»                                                                                                                                               | solo si lo confirmas                                                      |

## 6. Riesgos y trampas conocidas

### Registro de fase 2 (2026-10-05)

- Agenda combinada de tareas y hábitos con paginación global, grupos por fecha/estado/prioridad/etiqueta, búsqueda, contadores y calendario mensual con selección y progreso diario (El Faro).
- Tarjetas conforme a las referencias de Tomtask: Poppins, radio 26, icono 42, hora a la derecha, chips, tintes por estado y sombras semánticas. Swipe para completar/reabrir y borrar; hoja con botones como alternativa accesible al gesto.
- Filtros de pantalla completa con borrador, previsualización «Aplicar (N)», rango validado, tipo, texto, estados, prioridades, etiquetas, recordatorio/repetición en tres estados, completadas, orden y agrupación. Chips removibles al volver; vacío inicial, vacío filtrado, esqueleto y errores con reintento.
- Datos demo idempotentes solo en el contexto solicitado; consultas y caché acotadas por iglesia/usuario. Las actividades borradas desaparecen de la agenda y los lectores de histórico conservan los datos para estadísticas.
- Android real en el emulador dedicado: completar una ocurrencia actualiza pendientes/hechas; borrar con cancelación y confirmación actualiza la agenda; filtros con cero coincidencias, restablecer, calendario y teclado. Español/claro y alemán/oscuro, 375 dp y texto al 130 %. Ruta temporal de QA retirada. [Capturas y revisión](../../qa/tareas-movil/README.md).
- `pnpm check` completo y `pnpm build` pasan. Móvil: 140 suites y 505 pruebas; scripts: 29 pruebas. API y esquema no se modifican en esta fase; se mantienen los e2e SQLite/PostgreSQL de la fase 1.
- Alta, edición, detalle completo y gestor de etiquetas siguen en la fase 3. Hoy/estadísticas en la 4; selección y orden manual en la 5; entrega real de notificaciones en la 6.

### Registro de fase 1 (2026-10-05)

- Repetición, racha actual y agregados de estadísticas extraídos a `packages/shared`; API y móvil consumen las mismas funciones, sin cambiar las reglas existentes.
- SQLite v16: hábitos, ocurrencias, recordatorios, etiquetas de recordatorios y caché de racha máxima. Los ocho esquemas nuevos reproducen las entidades de API y están cubiertos por el test de paridad.
- Repositorios con contexto de usuario/iglesia, validación de membresía y referencias, transacciones, filtros y paginación; ocurrencias materializadas solo al cambiar estado. El auditor estático de consultas incluye las tablas nuevas.
- Hooks de consulta/mutación y retirada de caché al cambiar de iglesia. Copias de seguridad con las tablas nuevas; restauración compatible con copias anteriores sin esas tablas.
- Android, emulador dedicado `navis_tables_qa`: migración real 15 → 16 y prueba con `expo-sqlite` de alta/edición/lectura de tareas y hábitos, recordatorio conservado tras editar, estado idempotente y borrado con historial. Resultado nativo: PASS. Ruta temporal de QA retirada después de verificar.
- E2E de API sobre bases aisladas: 224 pruebas en SQLite y 224 en PostgreSQL, con migraciones aplicadas desde cero. `pnpm build` pasó.
- `pnpm check` completo pasó: formato, lint sin errores, tipos, tests del workspace y 29 pruebas de scripts. En móvil: 134 suites y 493 pruebas verdes. Extracción de lógica guardada en `refactor(shared): compartir repeticion racha y estadisticas de tareas`.
- `expo-doctor`: 19/20 comprobaciones; única incidencia, desfases de patch previos en Expo, Constants y Router. No se cambiaron dependencias como parte de esta fase.
- No hay UI nueva en esta fase ni programación de notificaciones todavía; se ha investigado y documentado el comportamiento de Taskia para implementarlo en las fases previstas.

- Tablas del repo sin `church_id` solo para profecías, sueños y enseñanzas: las de tareas **sí** llevan `church_id` **y** `owner_id`.
- `date` locales: usar `formatDay` / helpers de `iso-day.ts`, no `toISOString().slice(0,10)`.
- Reanimated en Jest: cada animación nueva (swipe, llama, anillo) puede pedir ampliar el mock de `jest.setup.js`.
- `packages/theme` e `i18n` se leen desde `dist` en `tsc`/Jest: recompilarlos tras tocar claves o tokens.
- `apps/mobile` no se previsualiza en web: todo se prueba en Jest y en emulador.
- `react-native-gifted-charts` se mockea en tests; las gráficas nuevas reutilizan `BarChart` y `ProgressRing` (SVG propio).
- Mover la lógica de repetición a `shared` toca la API: correr e2e de API contra Postgres.

## 7. Verificación (Reglas 4 y 11)

`pnpm check`, `pnpm build`, `pnpm test:e2e` (si se toca API/web), `expo-doctor`; migraciones en `DB_DRIVER=sqlite` y `postgres`; en emulador, flujo completo con datos creados de verdad, claro/oscuro, español y alemán, texto al 130 %, vacío/carga/error. Lo que no pueda ejecutar aquí se declara y te pido que lo mires.

## 8. Preguntas abiertas

1. **Notas**: ¿te refieres al Cuaderno (ya hecho) o a algo nuevo?
2. **Alcance de «mismas funciones»**: ¿basta con Fases 1–6, o quieres también estados personalizados/flujos y alarma de límite (Fase 7)? ¿Y el seguimiento de tiempo de la web de Taskia?
3. **Modelo compartido**: ¿ampliar API y web con la repetición avanzada y el orden manual (Fase 5) para que web y móvil sigan iguales?
4. **Sync**: ¿se mantiene local sin servidor como Listas y Tablas?
