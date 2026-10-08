# Plan — Tareas y hábitos en Navis móvil, con la gestión de Tomtask

Estado: **fases 0–6 cerradas; la 7 (opcional) espera tu confirmación**. Fecha: 2026-10-08.
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

### Registro de fase 6 (2026-10-08)

- Avisos reales de tareas y hábitos con `expo-notifications`, sobre lo ya montado para notas y cuaderno: `activity-reminders-repo` (recordatorios activados de las membresías vigentes, solo del dueño; una tarea hecha deja de avisar salvo que sea una serie), `plan-activity-reminders` (pura, con tope de 50 y nombre de iglesia si hay varias) y un tipo de aviso nuevo `activity-reminder` con su destino `/tasks/detail`. Clave estable `navis:activity-reminder:<tipo>:<id>`: editar sustituye, borrar cancela.
- Ajustes: interruptor propio «Recordatorios de tareas y hábitos» (`taskReminders`), cuyo cambio resincroniza. Canal de Android genérico («Recordatorios», seis idiomas). Guardar una tarea o un hábito con recordatorio pide el permiso en ese momento y sincroniza; cualquier mutación de tareas resincroniza.
- Al tocar el aviso se valida (`prepareNotice`) que la actividad exista, sea del usuario y de esa iglesia, y se cambia de iglesia si hace falta antes de abrir el detalle.
- **Fallo encontrado en la prueba nativa y corregido** (afectaba también a notas): Android entrega las alarmas con una ventana de hasta ~2 min. Abrir la app dentro de ese margen sincronizaba, el plan ya no incluía el instante pasado y `reconcile` cancelaba un aviso a punto de sonar. Ahora no cancela lo vencido hace menos de 3 min (`DELIVERY_GRACE_MS`), con prueba de regresión que fallaba antes del arreglo.
- Verificado en Android real, compilación de desarrollo `org.navis.app` (no Expo Go), emulador `navis_tables_qa`: permiso pedido al guardar; alarma programada en `dumpsys alarm` a la hora elegida y movida al editar; aviso entregado con título de la tarea, cuerpo en español y canal `note-reminders-v1`; toque con la app en segundo plano y **con el proceso muerto** (arranque en frío) abre el detalle correcto. [Bandeja](../../qa/tareas-movil/aviso-bandeja.png), [arranque en frío](../../qa/tareas-movil/aviso-arranque-frio.png).
- Pruebas nuevas: planificador (13), repositorio con SQLite real (aislamiento por usuario/iglesia, hechas, series, borradas), sincronización de punta a punta con planificador en memoria (programar, mover, cancelar, interruptores, validar el toque, cambio de iglesia), `reconcile` y, de la fase 5, tarjeta de serie (5) y pantalla de orden (5).
- Limitación conocida: el recordatorio es 1:1 (RFC 0018 D10), un único instante. En una serie o un hábito diario suena **una vez**, a la hora guardada; repetirlo cada día exigiría proyectar ocurrencias y es decisión de modelo (Fase 7 o aparte). No verificado: iOS, ni la entrega con sonido (el emulador no suena).

### Registro de fase 5 (2026-10-08)

- Repetición avanzada compartida por API, web y móvil: semanal con días, mensual por día o por n-ésimo día de la semana (incluido «último») y fechas concretas, con fin nunca/fecha/cantidad. Esquema en `packages/shared` (`task-series`), migración `TaskSeriesAndOrder` y paridad en SQLite local (v16+). Series: pausar, reanudar y terminar conservan el histórico.
- Pantalla de series (`/tasks/series`) y de orden manual (`/tasks/order`). Revisión visual en Android real (`navis_tables_qa`), claro, 375 dp: [orden](../../qa/tareas-movil/orden.png), [arrastre](../../qa/tareas-movil/orden-arrastre.png), [repetición semanal](../../qa/tareas-movil/repeticion-semanal.png), [serie](../../qa/tareas-movil/serie.png), [serie pausada](../../qa/tareas-movil/serie-pausada.png).
- Corregido en la revisión: las filas de orden ocupaban dos líneas de más (ahora etiquetas y flechas comparten línea; caben 4,5 filas) y el número desalineaba los títulos (ancho fijo). La fila arrastrada se «levanta» con borde, sombra y escala, y Guardar se desactiva mientras se arrastra. La descripción de la serie decía «1 weeks»: con intervalo 1 se omite y con más se lee «Cada N semanas». El estado de la serie es un `Badge` compacto (antes un `Chip` seleccionable que parecía un botón). Vacío de series con texto propio (`tasks.seriesEmpty`) en los seis idiomas.
- Recorrido nativo: crear tarea semanal (lunes y jueves), verla en series, pausar (efecto inmediato), reanudar, cancelar el diálogo de terminar, arrastrar con pulsación larga y soltar en otra posición. `use-task-order.ts` y `task-order-header.tsx` salen de la pantalla (Regla 6); lint sin errores en `components/tasks`.
- Trampa de verificación: con enlaces profundos repetidos (`am start exp://…`) y Fast Refresh, la pantalla de series dejó de refrescarse tras pausar (el caché de la mutación no veía la consulta). No ocurre tras `force-stop` de Expo Go y un arranque limpio: reiniciar antes de dar por roto algo así.
- Pendiente de ver: alemán y oscuro de las pantallas de series y orden, y texto al 130 %.

### Registro de fase 4 (2026-10-06)

- Hoy como entrada de Tareas, con navegación común a Listado y Estadísticas; selector de día con progreso de tareas, El Faro y tira de 14 días. Hábitos con meta, hora, etiquetas y anillo diario para completar/reabrir. La racha sigue contando exclusivamente tareas, conforme al contrato de Navis.
- Estadísticas de 7/30 días, tareas/hábitos, resumen de hoy con anillo, tasa, barras, cuatro métricas, prioridades, etiquetas, tendencia y 90 días de El Faro. Cálculos compartidos con la API; el histórico borrado se conserva y la agenda muestra solo actividades activas.
- El inicio utiliza el mismo repositorio local de ocurrencias y la zona de la iglesia, incluyendo tareas puntuales y series sin materializar. Consultas y mutaciones acotadas por iglesia/usuario.
- Dirección Tomtask comprobada en Android: Poppins, márgenes 22, tarjetas 26, iconos 42, resumen 32/anillo 92 y cifra 56. Español/claro y alemán/oscuro a 375 dp y texto al 130 %. Se corrigieron fechas recortadas, métricas con palabras partidas, ejes duplicados al contar una sola ocurrencia y curvas que dibujaban porcentajes negativos. [Revisión y capturas](../../qa/tareas-movil/README.md).
- Prueba permanente de paridad con una misma fixture y respuesta completa esperada: semanas, prioridades, etiquetas, tendencias, racha actual/máxima y 90 días. Aislamiento y separación de hábitos; comparación con respuestas HTTP reales en SQLite y PostgreSQL.
- `pnpm check` y `pnpm build` completos. Móvil: 146 suites y 520 pruebas; scripts: 29 pruebas. API e2e: 225 pruebas por motor sobre bases aisladas. Sin nuevas dependencias ni migraciones. `expo-doctor`: 19/20; única incidencia, seis paquetes Expo con parches pendientes.
- Rutas temporales de QA retiradas. Repetición avanzada y orden manual siguen en la fase 5; entrega de avisos reales en la fase 6.

### Registro de fase 3 (2026-10-05)

- Alta y edición a pantalla completa de tareas y hábitos: título, descripción, meta, fecha, hora, prioridad, estado, repetición simple, etiquetas y recordatorio con fecha/hora y etiquetas propias. Se conserva la configuración avanzada existente al editar el texto de una serie.
- Detalle con icono 52, título 26, chips y bloques de radio 26 según Tomtask; botones para editar, completar/reabrir y borrar con confirmación. Gestión de etiquetas con vista previa, colores semánticos/personalizados y catálogo virtualizado de 120 iconos con búsqueda.
- Guardado transaccional de actividad, relaciones, recordatorio y estado; aislamiento por usuario/iglesia. Editar una actividad completada conserva su fecha de realización. Fechas de recordatorio interpretadas en la zona de la iglesia, con rechazo de horas inexistentes por cambio de horario.
- Android: creación, edición y borrado de tarea y hábito; completar/reabrir, confirmaciones, protección al salir con cambios y CRUD de etiquetas. Recordatorio y sus etiquetas guardados y visibles en el detalle. Español/claro y alemán/oscuro a 375 dp, texto al 130 %. Se corrigió Guardar tapado por el teclado en el marco compartido. [Capturas](../../qa/tareas-movil/README.md).
- `pnpm check` completo: 144 suites y 516 pruebas de móvil, más 29 pruebas de scripts. `pnpm build` pasa. E2E completos sobre bases aisladas: 224 pruebas en SQLite y 224 en PostgreSQL, migraciones al día. Tipos y pruebas afectadas repetidos tras la corrección final del teclado.
- Sin nuevas dependencias ni migraciones. La ruta temporal de QA se retira. Los recordatorios se persisten; su entrega real corresponde a la fase 6. Hoy y estadísticas quedan para la fase 4.

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
