# Revisión visual de tareas móvil — fases 2 y 3

2026-10-05. Capturas de la aplicación Android de Navis, en el emulador dedicado `navis_tables_qa`; datos locales demo. La referencia visual es el código de Tomtask en `D:/Proyectos_personales/taskia/mobile`, contrastado con los tokens vigentes de Navis mediante el skill `refero-design`.

| Captura                                         | Condiciones                            | Comprobación                                                                  |
| ----------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| [Agenda](./agenda.png)                          | Español, claro, 375 dp                 | Poppins, tarjetas radio 26, iconos 42, hora, chips, tinte y sombra por estado |
| [Calendario](./calendario.png)                  | Español, claro, 375 dp                 | Mes compacto, selección azul, anillo y El Faro para días cumplidos            |
| [Agenda oscura](./agenda-oscura-de.png)         | Alemán, oscuro, 375 dp, texto al 130 % | Búsqueda completa, textos ampliados, contraste de iconos y chips              |
| [Calendario oscuro](./calendario-oscuro-de.png) | Alemán, oscuro, 375 dp, texto al 130 % | Jerarquía del mes, anillos, navegación y selección                            |
| [Filtros y teclado](./filtros-teclado-de.png)   | Alemán, oscuro, 375 dp, texto al 130 % | Botón «Aplicar (0)» visible sobre el teclado                                  |
| [Sin coincidencias](./sin-coincidencias-de.png) | Alemán, oscuro, 375 dp, texto al 130 % | Estado vacío filtrado con acción de restablecer                               |

Se verificaron completar una ocurrencia y actualizar contadores, cancelar y confirmar un borrado, aplicar filtros sin coincidencias y restablecer la agenda. Los tests cubren además paginación combinada, aislamiento, filtros con borrador, selección del calendario, vacío inicial, error con reintento y conservación del histórico tras borrar.

La comparación se hace contra los componentes fuente de Tomtask; no se dispone de una captura paralela de esa aplicación. Se conservan sus proporciones e interacciones, adaptando colores y El Faro a Navis. Los avisos reales requieren la fase 6 y todavía no se han entregado desde esta agenda.

## Fase 3

| Captura                                     | Condiciones                            | Comprobación                                                     |
| ------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| [Editor](./editor.png)                      | Español, claro, 375 dp                 | Título grande, descripción, fecha, repetición y Guardar fijo     |
| [Detalle](./detalle.png)                    | Español, claro, 375 dp                 | Icono 52, título 26, estados, etiquetas, recordatorio y acciones |
| [Detalle oscuro](./detalle-oscuro-de.png)   | Alemán, oscuro, 375 dp, texto al 130 % | Chips que envuelven, jerarquía y bloques de radio 26             |
| [Editor y teclado](./editor-teclado-de.png) | Alemán, oscuro, 375 dp, texto al 130 % | Guardar visible y operativo con teclado abierto                  |
| [Recordatorio](./recordatorio-de.png)       | Alemán, oscuro, 375 dp, texto al 130 % | Fecha, hora, zona de iglesia y etiquetas propias                 |
| [Gestor de etiquetas](./etiquetas-de.png)   | Alemán, oscuro, 375 dp, texto al 130 % | Icono, color semántico y nombres ampliados                       |
| [Selector de iconos](./iconos-de.png)       | Alemán, oscuro, 375 dp, texto al 130 % | Catálogo virtualizado, búsqueda y selección visible              |

Recorridos nativos: crear tarea y verla en la agenda; editar título, prioridad y estado; guardar fecha/hora y etiqueta del recordatorio y leerlos en el detalle; crear hábito con meta, editar, completar/reabrir y borrar. Crear etiqueta, elegir color e icono, renombrar y borrar con confirmación. Cancelar y confirmar el borrado de una tarea; cancelar la salida del editor con cambios. Se retiraron los datos de prueba creados y la ruta temporal de estilos.

La revisión corrigió el pie Guardar detrás del teclado incorporándolo dentro del área que evita el teclado. Se guardó una tarea con el teclado abierto después de corregirlo. Logcat no mostró errores ni advertencias de React Native durante estos recorridos. Las pruebas de repositorio cubren además transacciones completas, cambios de etiquetas reflejados en la agenda, aislamiento, fechas de realización conservadas y rechazo de ocurrencias inválidas. Los cambios de horario se prueban con Madrid y Bogotá.
