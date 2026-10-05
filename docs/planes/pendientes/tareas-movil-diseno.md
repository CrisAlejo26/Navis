# Tareas móvil: investigación de Taskia y decisiones de diseño

Fecha: 2026-10-05. Referencia principal solicitada por el usuario: `D:/Proyectos_personales/taskia/mobile`.
Método: skill `refero-design`, investigación del código de Taskia y del sistema visual existente de Navis. Refero MCP no está disponible; se han usado las referencias locales y las guías de interacción, accesibilidad y movimiento del skill. Este documento fija la dirección para las fases de UI; no implica que esas pantallas estén implementadas.

## Dirección

Una agenda móvil con tarjetas redondeadas, calendario interactivo, agrupación legible y acciones accesibles con una mano. Se preservan las proporciones y los gestos de Taskia y se aplican los tokens, sombras y tipografía definidos para esta sección en Navis. La firma del progreso es El Faro.

## Decisiones vinculadas a fuentes

Las rutas de Taskia de esta tabla son relativas a `taskia/mobile/src/`.

| Decisión                                                                      | Fuente                                                         | Adaptación en Navis                                                                     | Motivo                                                                        |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Tarjeta de radio 26, padding 15 y separación vertical 13                      | `components/tasks/task-card.tsx`                               | Superficie semántica y `listCardShadow`; sin crear otro sistema de elevación            | Conservar la silueta reconocible y el ritmo de la referencia                  |
| Título de 15 semibold, descripción de 13, hora de 12 a la derecha             | `components/tasks/task-card.tsx`                               | Roboto según el plan, colores de texto por token, título multilínea                     | Distinguir tarea, contexto y horario incluso a 375 px                         |
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
