# Revisión visual de tareas móvil — fase 2

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
