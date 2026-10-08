# Cuaderno móvil: auditoría y referencias

2026-10-08. La implementación se autoriza con la petición «implementa» del plan.

El editor existente ya es un Modal de pantalla completa, con confirmación de descarte. Guardar estaba en la cabecera; se mueve al pie dentro del área que evita el teclado. La exportación de imagen usa ViewShot y elimina el PNG temporal tras compartir. Esto requiere comprobación nativa.

La API no reiniciaba los recordatorios al cambiar fecha y no cargaba los audios antes del borrado lógico en cascada. El móvil usaba un extracto de 240 caracteres frente al extracto compartido, meses enero–diciembre frente a últimos doce meses, y distinto desempate, ventanas y escape de búsqueda. El contrato compartido fija estos casos.

El borrado de entradas conserva ficheros de audio en disco para acompañar sus filas borradas lógicamente. El borrado explícito de un audio sí elimina su fichero. Los backups incluyen las dos tablas y los binarios.

Referencias leídas: Tomtask `src/components/tasks/task-card.tsx`, `src/components/filters/filters-screen.tsx`; Navis TaskCard, SwipeableRow, CalendarGrid, BarChart, StatCard, ProgressRing y el oleaje web.

| Decisión                                       | Fuente              | Papel                               |
| ---------------------------------------------- | ------------------- | ----------------------------------- |
| Radio 26, padding 15, separación 13, título 15 | Tarjeta Tomtask     | Silueta de las entradas             |
| Borrador y Aplicar con contador en el pie      | Filtros Tomtask     | No cambiar el listado hasta aplicar |
| Poppins y tintes 9/14 %                        | Tareas Navis y plan | Continuidad visual y temas          |
| Dos trazos finos de oleaje                     | Cuaderno web y plan | Única firma; progreso del mes       |
| Icono 52 y bloques 26                          | Plan de detalle     | Lectura antes de edición            |

Se conservan estas referencias como dirección de implementación con `refero-design`. No se añaden colores ni imágenes. Los siete tipos tienen icono y texto además de color.

El emulador dedicado arrancó, pero su cliente mostró «Unable to load script» antes de poder capturar el estado original. No hay capturas de antes verificadas. Se reinició Metro con `--clear`; la conexión nativa se recuperó con adb reverse del puerto guardado 8082 al de Metro 8081. No se atribuye esa pantalla de error al diseño.

Textos: los seis idiomas ya contienen título, tipos, formulario, audios, permisos, filtros, estadísticas y descarte. Se añaden textos específicos de aplicar con contador, eliminación múltiple y vacío filtrado.
