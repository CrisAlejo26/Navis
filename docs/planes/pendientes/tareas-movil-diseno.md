# Tareas móvil: investigación de Taskia y decisiones de diseño

Fecha: 2026-10-05. Referencia principal solicitada por el usuario: `D:/Proyectos_personales/taskia/mobile`.
Método: skill `refero-design`, investigación del código de Tomtask (`taskia/mobile`) y del sistema visual existente de Navis. Refero MCP no está disponible; se han usado las referencias locales y las guías de interacción, accesibilidad y movimiento del skill. Agenda, calendario y filtros se implementan en la fase 2; editores, detalle y etiquetas en la fase 3. Estadísticas y avisos conservan sus fases del plan.

## Dirección

Una agenda móvil con tarjetas redondeadas, calendario interactivo, agrupación legible y acciones accesibles con una mano. Se preservan las proporciones y los gestos de Taskia y se aplican los tokens, sombras y tipografía de Navis. La firma del progreso es El Faro. Al empezar la fase 2 se verificó que `packages/theme/src/fonts.ts` ya define Poppins para móvil por petición del usuario; se conserva ese sistema vigente, sustituyendo la referencia antigua a Roboto del plan.

## Decisiones vinculadas a fuentes

Las rutas de Taskia de esta tabla son relativas a `taskia/mobile/src/`.

| Decisión                                                                      | Fuente                                                         | Adaptación en Navis                                                                     | Motivo                                                                        |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Tarjeta de radio 26, padding 15 y separación vertical 13                      | `components/tasks/task-card.tsx`                               | Superficie semántica y `listCardShadow`; sin crear otro sistema de elevación            | Conservar la silueta reconocible y el ritmo de la referencia                  |
| Título de 15 semibold, descripción de 13, hora de 12 a la derecha             | `components/tasks/task-card.tsx`                               | Poppins según el sistema móvil vigente, colores de texto por token, título multilínea   | Distinguir tarea, contexto y horario incluso a 375 px                         |
| Icono de etiqueta, chips compactos, tinte verde y título tachado al completar | `components/tasks/task-card.tsx`                               | Catálogo compartido de iconos sin cruces; estado expresado también mediante texto/icono | Paridad visual sin depender exclusivamente del color                          |
| Swipe con acciones rotuladas y pulsación larga de 350 ms para seleccionar     | `components/tasks/task-card.tsx`                               | Reutilizar `SwipeableRow`; confirmación de borrado y objetivos táctiles accesibles      | Las acciones deben ser claras y cómodas, también sin gesto                    |
| Lista por secciones, contadores y atrasadas destacadas                        | `components/tasks/tasks-screen.tsx`                            | `SectionList`, ancho máximo 480, padding horizontal 22; virtualización y paginación     | Evitar una pantalla genérica de filas y mantener fluidez                      |
| Vacío inicial y vacío por filtros distintos; esqueleto al cargar más          | `components/tasks/tasks-screen.tsx` y `task-card-skeleton.tsx` | Textos y acciones específicas para cada estado                                          | Explicar qué puede hacer el usuario sin confundir ausencia de datos con carga |
| Calendario con selección de día y progreso diario                             | `components/tasks/calendar-card.tsx`                           | Reutilizar `CalendarGrid` y `ProgressRing`; El Faro sustituye la llama                  | Conservar la lectura visual del cumplimiento con identidad Navis              |
| Filtros a pantalla completa con borrador y botón fijo «Aplicar (N)»           | `components/filters/filters-screen.tsx`                        | Safe area, espacio para CTA y teclado, restablecer, chips activos al volver             | Cambiar varios criterios sin alterar la lista antes de aplicar                |
| Azul `primary`, fondos y estados claro/oscuro por tokens                      | Plan §3 y `packages/theme`                                     | Sin paleta lavanda ni gradiente rosa añadidos                                           | Respetar el papel de cada color en Navis                                      |
| Animaciones de estado y gesto, sin decoración permanente                      | `refero-design/references/motion.md`                           | Reutilizar transiciones y respetar movimiento reducido                                  | El movimiento explica el cambio de estado                                     |

## Avisos: comportamiento observado y objetivo

Fuentes: `lib/notifications/plan-task.ts`, `lib/notifications/plan-reminders.ts` y el hook de respuesta a notificaciones de Taskia.

- Una tarea puntual puede avisar a la hora del recordatorio y a la hora programada. Si coinciden, se entrega un solo aviso. Las completadas y las que no tienen recordatorio habilitado no se programan.
- Para series simples, Taskia utiliza disparadores nativos diarios, semanales o mensuales cuando el intervalo es uno y no hay fin. Para otras reglas expande las seis siguientes ocurrencias. El modelo de Navis se amplía en la fase 5 antes de copiar estas capacidades.
- Un hábito puede tener recordatorio y aviso de su hora programada; se evita duplicar la misma hora. El contenido utiliza descripción o meta como contexto.
- Al tocar el aviso se abre el detalle de la tarea o del hábito, tanto con la app abierta como al arrancar desde cero.
- En Navis hay que cancelar y recalcular avisos al editar, completar, borrar o cambiar de iglesia; acotar por usuario/iglesia, comprobar permisos y zona horaria y reutilizar la infraestructura de notificaciones de notas y cuaderno.

La fase 1 persiste recordatorios y sus etiquetas y los incluye en las copias de seguridad. La entrega real, cancelación, reprogramación y navegación desde el aviso corresponden a la fase 6. No se considera verificada una notificación hasta verla entregada y abrir su detalle en Android.

## Puerta de calidad visual para las próximas fases

Comparar las pantallas renderizadas con los componentes de referencia, comprobando silueta de tarjeta, densidad, jerarquía, chips, swipe y CTA de filtros. Probar claro/oscuro, español/alemán, ancho 375 px y texto al 130 %, teclado, errores, vacío y carga. Las pantallas tienen que conservar estos rasgos concretos; una lista básica con un formulario no cumple la dirección solicitada.

## Revisión renderizada de la fase 2

Se compararon las pantallas Android de Navis con las proporciones y comportamientos del código de Tomtask, sin afirmar una comparación de capturas de ambas aplicaciones. Se probaron español/claro y alemán/oscuro a 375 dp, incluyendo texto al 130 %, teclado, búsqueda sin resultados, selección del calendario y acciones de tarjetas.

Correcciones de la revisión: cabecera compacta del mes y flechas a la derecha; día seleccionado con fondo azul y anillo blanco; contraste de iconos y etiquetas personalizado comprobado sobre su tinte (mínimo 4,5:1 antes de conservar el acento); texto alemán de búsqueda más corto; CTA de filtros visible sobre el teclado. Se conservan los radios 26, iconos 42, márgenes 22, sombras semánticas, chips compactos y fuentes de Tomtask.

Las acciones de completar/reabrir y eliminar también tienen botones accesibles en el detalle completo, que sustituye la hoja de acciones en la fase 3. El borrado pide confirmación y la agenda excluye las plantillas borradas; los lectores de histórico permanecen disponibles para estadísticas. La selección y el orden manual por pulsación larga quedan en la fase 5.

## Decisiones y revisión de la fase 3

Referencias investigadas: `components/tasks/edit-item-screen.tsx`, `item-detail-screen.tsx` y `components/sheet/category-sheet.tsx` de Tomtask. Se conservan el título editable grande, selector de tarea/hábito, prioridad mediante chips, estado explícito, recordatorio con fecha/hora y etiquetas y botón fijo Guardar. El detalle usa icono de 52 con radio 18, título de 26 y bloques de radio 26, con botones Editar y Completar/reabrir y borrado confirmado.

Las categorías se adaptan a las etiquetas del modelo Navis: vista previa de icono/color, nombre, paleta, color hexadecimal y catálogo compartido de 120 iconos, virtualizado y buscable por nombre y categoría en los seis idiomas. Los colores semánticos se resuelven según el tema y el texto de los chips mantiene contraste legible. Se reutilizan los selectores de fecha, hora, color y el marco del editor existente; el selector de hora se comparte con Cuaderno.

## Dirección bloqueada para la fase 4

| Decisión                                                                                  | Fuente                                                                 | Adaptación y papel                                                                                                                            |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Hoy: selector horizontal de días con progreso, tira de racha y selector de hábitos/tareas | Tomtask `home/home-screen.tsx`, `day-selector.tsx`, `streak-strip.tsx` | Poppins, márgenes 22, ancho 480 y tarjetas 26; El Faro sustituye la llama y la racha cuenta exclusivamente tareas, conforme al contrato Navis |
| Hábitos con meta visible y anillo de cumplimiento                                         | Tomtask `home/home-list.tsx`, modelo de hábitos Navis                  | Anillo con estado diario binario, sin inventar progreso numérico que no existe en el modelo; completar/reabrir la ocurrencia seleccionada     |
| Resumen de hoy con anillo, cifra de cumplimiento, barras y cuatro métricas                | Tomtask `stats/stats-screen.tsx`, `hero-card.tsx`, `stat-tile.tsx`     | Resumen destacado en azul semántico, sin gradiente pastel de Tomtask; barras y anillo reutilizan los componentes de Navis                     |
| Semana/mes y cifras separadas de tareas/hábitos                                           | Servicios `TasksStatsService` y `HabitsStatsService`, RFC 0018 D19     | Agregados compartidos, histórico preservado, racha solo de tareas; no mezclar hábitos en El Faro                                              |

La ruta principal abre Hoy; Listado y Estadísticas tienen navegación visible común. El inicio consume la misma expansión local de tareas y zona de iglesia.

## Revisión renderizada de la fase 4

Android en español/claro y alemán/oscuro, 375 dp y texto al 130 %. Se preservan las proporciones investigadas de Tomtask: selector de días 46, tarjeta 26, icono 42, resumen 32, anillo 92 y porcentaje 56. Las metas de hábitos están visibles y el anillo cambia una ocurrencia concreta; abrir el título lleva al detalle.

Correcciones del render: fechas de gráficas compactas día/mes, margen para el último punto, métricas que pasan a una columna cuando aumenta el texto, tira de 14 días visible completa, eje entero sin etiquetas duplicadas y tendencia con segmentos rectos para mantener el intervalo 0–100 %. Los hábitos no se incorporan a El Faro. Vacío filtrado con restablecer y estados de carga/error con componentes reales en una ruta temporal de QA, retirada tras la revisión.

Las cifras se contrastaron con respuestas reales de la API, en ambos motores, sobre la misma fixture local. El histórico incluye actividades borradas conforme a la API; por ello, el cumplimiento de la agenda activa de un día puede diferir del histórico de El Faro. El registro de QA conserva las capturas y la prueba reproducible.

Verificación renderizada en Android: claro/español y oscuro/alemán a 375 dp con texto al 130 %, títulos multilínea, chips de estado que pasan a otra línea y selector de iconos. La revisión detectó el pie Guardar detrás del teclado; se incorporó dentro del área que evita el teclado y se verificó guardar con el teclado abierto. Las capturas y los recorridos funcionales están en el registro de QA. Los recordatorios se guardan en la zona de la iglesia; la entrega de avisos continúa reservada para la fase 6.
# Fase 5 — referencia y decisiones (2026-10-06)

Corrección solicitada durante la implementación: el buscador sigue reutilizando `SearchField`/`TextField`, con centrado vertical nativo y altura estable al limpiar. El usuario rechazó los tintes del 12 % con bordes y sombras coloreados por resultar demasiado intensos, y después consideró insuficiente la separación con tintes del 5,5 %. Tras revisar las referencias públicas de Refero, las superficies quedan limitadas a azul suave (tareas), melocotón (prioridad alta) y menta (hábitos/completadas), derivadas de los tokens existentes al 9 % en claro y 14 % en oscuro. El borde neutro refuerza la separación con el fondo y no hay sombra. El acento de etiqueta/estado se conserva en el icono y los chips. El fondo sigue siendo sólido para impedir que las acciones de swipe se transparenten.

Referencias de color y elevación: [Tines en Refero](https://styles.refero.design/style/18e2c0b4-f29c-4e84-90b0-1d8066b59409), familias de superficies pastel y ausencia de sombras; [Going en Refero](https://styles.refero.design/style/3461e90e-35d2-4269-9f11-cbe935f0a3a2), tarjetas suaves de radio 24 y separación entre acento de acción y superficie. Son referencias de estilo web: no se presentan como pantallas móviles inspeccionadas. Se adapta únicamente el tratamiento de superficies; la silueta, tipografía y composición siguen la referencia de Tomtask.

### Estados de carga del módulo de tareas

Petición del usuario: organizar los skeletons de todos los componentes de la página de tareas. La referencia de estructura es cada componente real de Navis/Tomtask, conservando sus márgenes, iconos, anillos y distribución de información. Se reutiliza el componente `Skeleton`; no se sustituyen controles cuyo contenido ya se conoce.

| Región | Esqueleto vinculado a su contenido |
| --- | --- |
| Listado y paginación | Cabecera de sección, icono 42, título, descripción, chips y hora; dos tarjetas adicionales al cargar otra página |
| Hoy | Variante de hábito con anillo 48, objetivo/hora y etiquetas debajo; El Faro con icono, texto y 14 círculos |
| Calendario | Número de semanas calculado con `buildDateGrid`, siete columnas, separación y altura de celdas iguales al calendario real, incluida la escala de texto |
| Estadísticas | Hero con anillo 92, porcentaje, gráfico de barras, cuatro métricas adaptables, El Faro, desgloses, tendencia e histórico de 90 días |
| Series y orden | Regla, estado, próxima fecha y acciones de serie; ordinal, asa y botones de movimiento de orden |
| Detalle y editores | Cabecera y bloques del detalle; campos del editor y pie reservado para guardar; editor de etiquetas con muestras de color y selector de icono |
| Etiquetas y filtros | Filas de etiquetas y chips pendientes en filtros, etiquetas seleccionadas y selectores del editor |

Los skeletons se muestran en la región cuya consulta está pendiente. Los contadores no presentan ceros provisionales; las recargas con datos conservan el contenido. Una animación compartida sincroniza cada grupo, se cancela al desmontarlo y respeta movimiento reducido. Los bloques anuncian `common.loading`, señalan ocupación accesible y no reciben pulsaciones.

QA de esta corrección: 16 pruebas de componentes en 8 suites, TypeScript y ESLint sin errores ni advertencias en los componentes revisados. Inspección Android en claro y oscuro, con revisión a 375 dp y texto al 130 %. La ruta temporal de QA monta los componentes reales de carga y se retira al terminar; no representa consultas de red deliberadamente ralentizadas. Capturas conservadas en `.tools/tasks-skeleton-*.png`. La revisión corrigió el exceso de separación entre filas del calendario y verificó las métricas en una columna y el pie del editor reservado fuera del scroll.

La referencia principal continúa siendo Tomtask móvil: `components/tasks/recurrence-sheet.tsx`, `recurrence-weekdays.tsx`, `order-list.tsx` y `components/recurrences/recurrence-card.tsx`; sus reglas están en `types/recurrence.ts` y `lib/recurrence.ts`. La referencia secundaria es el editor y navegación de Navis aprobados en las fases 2–4. Implementación directa dentro de ese sistema, conforme a Refero Design.

| Decisión | Fuente | Adaptación |
| --- | --- | --- |
| Cinco formas de repetición, selección semanal de lunes a domingo, fin separado | Tomtask recurrence-sheet/types/recurrence | Frecuencias existentes y opciones estructuradas compartidas; no un texto RRULE editable |
| Tarjetas de series con estado, regla y acciones explícitas | Tomtask recurrence-card | Poppins, radio 26, icono 42, márgenes 22, azul semántico Navis; terminar exige confirmación |
| Orden manual de tareas mediante asa y ordinal | Tomtask order-list | Entrada por pulsación larga, arrastre y alternativa accesible para mover; guardar/cancelar borrador |
| Conservación del histórico al pausar/terminar | Navis D3/D18 y estadísticas verificadas | Periodos de pausa y fecha de terminación, sin borrar ocurrencias materializadas |
| Modelo equivalente en API, web y móvil | Plan §4b | Columnas iguales, migraciones SQLite/Postgres, contratos y expansión en shared; hábitos mantienen repetición simple |
