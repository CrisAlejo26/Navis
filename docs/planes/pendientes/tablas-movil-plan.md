# Plan especializado — Tablas en Navis móvil

Estado: **implementación funcional realizada; QA ampliado pendiente**. Fecha: 2026-10-02.
Commit de salvaguarda previo al análisis: `ca94c05` — `chore(mobile): save card and swipe interaction updates`.

Resultado de ejecución: tres vistas independientes, CRUD y 12 tipos, relaciones con creyentes, filtros y exportación completa, SQLite local y backup portátil implementados. Typecheck correcto; lint sin errores (10 avisos previos); 118 suites móviles / 439 tests correctos. Restauración nativa Android de 2.087 filas con login y contraseña recuperados. [Capturas, decisiones y comprobaciones pendientes](../../qa/tablas-movil/README.md).

## 1. Objetivo y decisiones de alcance

Sustituir el placeholder de `apps/mobile/app/tables.tsx` por una sección nativa capaz de crear tablas y columnas, registrar filas y consultar los mismos conceptos de vista que la web: **cuadrícula, tablero y calendario**. Incluir las tablas vinculadas a creyentes, porque ya forman parte del comportamiento actual de la web.

Interpretación de «vistas de tablas»: la sección **Tablas personalizadas** de los RFC 0021 y 0025. El componente genérico `components/data-table` de web aporta patrones de búsqueda, orden y preferencias; migrar los listados de todas las demás secciones móviles queda fuera de este trabajo.

**Requisito explícito del usuario: las vistas son independientes.** Cada instancia de vista —incluidas dos vistas del mismo tipo— posee su propio estado, configuración y preferencias. Comparten únicamente identidad/estructura de tabla y filas. Modificar datos se refleja en las otras vistas; modificar la consulta o presentación de una vista no modifica ninguna otra. Un contenedor común aporta componentes visuales reutilizables, nunca un estado global de filtros u orden.

Decisión de arquitectura: **SQLite local**, siguiendo Listas y el resto de módulos móviles existentes. «Como la web» significa paridad de capacidades y semántica; no implica disponer automáticamente de los registros del servidor. No introducir una conexión API aislada dentro de esta pantalla. La sincronización de tablas será una extensión posterior del sistema de sincronización de la app; si se requiere compartir inmediatamente los mismos registros entre dispositivos, esa integración debe añadirse expresamente al alcance antes de ejecutar las fases de datos.

Este documento conserva la especificación y registra su ejecución. Las pantallas están implementadas en Expo/React Native; la evidencia y las limitaciones se encuentran en [el informe de QA](../../qa/tablas-movil/README.md). No se generaron diseños en Sleek.

## 2. Evidencia del repositorio y referencias

No existe `.codegraph/` en la raíz inspeccionada; el análisis se realizó con búsquedas y lectura de código. Refero MCP no está disponible en esta sesión: se aplica su metodología con referencias locales, guía de oficio y documentación primaria. No se atribuyen capturas o investigación visual a herramientas no utilizadas.

| Fuente inspeccionada                                                          | Evidencia                                                                                       | Consecuencia para la implementación                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/mobile/app/tables.tsx`                                                  | Solo contiene `PlaceholderScreen`                                                               | La feature necesita datos, rutas y UI; no basta con añadir un selector         |
| `apps/web/src/routes/table.tsx`, `components/tables/table-view-content.tsx`   | Cuadrícula base, vistas persistidas, acciones según permisos                                    | Mantener el modelo de vistas y separar editar filas de gestionar estructura    |
| `apps/web/src/components/tables/rows-grid.tsx`                                | Usa el sistema reutilizable de tabla y sus adaptadores                                          | Reutilizar contratos y funciones puras, construir renderizadores nativos       |
| `kanban-board.tsx`, `kanban-lane.tsx`                                         | Agrupación por selección única, filtros y carga por carril; cambio de estado modifica una celda | Paginación independiente; mover no reordena manualmente las filas              |
| `table-calendar-view.tsx`                                                     | Rango visible, columna de fecha y creación contextual                                           | Mantener rango y filtros; evitar que el límite de una página oculte registros  |
| `packages/shared/src/schemas/custom-table-views.ts`                           | `grid` es sintética; solo se crean `kanban` y `calendar`                                        | No persistir una cuarta vista móvil ni inventar una entidad de vista de lista  |
| `packages/shared/src/constants/table-column-types.ts`                         | 12 tipos, 30 columnas, 50 opciones, umbral de 6 para radios                                     | Formularios y límites derivados del catálogo compartido                        |
| `apps/mobile/src/hooks/use-lists.ts`, `data/repos/lists-context.ts`           | Contexto iglesia/usuario, consultas locales, propietario gestiona                               | Repositorio con autorización real y claves de caché acotadas                   |
| `packages/theme/src/fonts.ts`                                                 | La fuente vigente es **Roboto**                                                                 | No seguir la pareja tipográfica antigua descrita en planes históricos          |
| `apps/mobile/src/lib/ui/elevation.ts`                                         | Sombras semánticas y `listCardShadow` ya implementados                                          | Utilizarlas; no abrir un segundo sistema de sombras                            |
| `D:/Proyectos_personales/taskia/mobile/src/components/tasks/tasks-screen.tsx` | Lista virtualizada, carga incremental, márgenes e insets                                        | Lista eficiente y estados de carga diferenciados                               |
| Taskia `tasks/filters-bar.tsx`                                                | Botón fijo de filtros y chips desplazables                                                      | Acceso a filtros siempre visible, resumen de filtros en segunda fila           |
| Taskia `tasks/calendar-view.tsx`                                              | Mes seguido de panel del día seleccionado                                                       | Calendario móvil legible sin comprimir títulos en las celdas                   |
| Taskia `constants/shadows.ts`                                                 | Profundidad cromática con distintos roles                                                       | Adaptar jerarquía de profundidad a tokens Navis, sin copiar intensidad ni azul |
| `docs/planes/implementados/listas-y-pulido-visual-movil-implementacion.md`    | Identifica Tomtask/Taskia como referencia visual y confirma SQLite                              | Continuidad con la adaptación ya realizada en Navis                            |

**Referencias externas consultadas:** [interfaces móviles de Airtable](https://support.airtable.com/articles/2483653332-mobile-interfaces-in-airtable), [agrupación kanban](https://support.airtable.com/articles/9686375912-getting-started-with-airtable-kanban-views), [FlatList](https://reactnative.dev/docs/flatlist) y [ScrollView](https://reactnative.dev/docs/scrollview). Airtable respalda adaptar vistas y navegación al móvil; React Native distingue la renderización incremental de listas del montaje completo de ScrollView. Las medidas y gestos siguientes son decisiones propuestas para Navis, no medidas extraídas de esas fuentes.

## 3. Dirección visual fijada

**Referencia dominante:** Navis móvil actual, especialmente Listas y los componentes UI. **Aporte acotado de Tomtask/Taskia:** jerarquía táctil, filtros compactos, mes + agenda y profundidad cromática de acciones. **Aporte de la web:** significado del acento por tabla, columnas y estados, así como semántica funcional.

Preservar Roboto y su escala, superficies claro/oscuro, acento elegido por tabla, navegación existente y tarjetas ya pulidas. No adoptar Poppins, logotipo, colores de marca ni contenidos de tareas de Taskia. No añadir fondos decorativos, degradados o un nuevo FAB si el patrón de pantalla actual ya resuelve la acción principal.

| Decisión                                           | Fuente                                        | Regla de uso                                                                          |
| -------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Cabecera identificable por icono y acento de tabla | Web + `lists/list-header.tsx`                 | El acento identifica la tabla, no reemplaza colores semánticos de error               |
| Tarjetas con profundidad suave                     | Navis `listCardShadow` + Taskia               | Reservar sombras fuertes a acciones; cuadrícula con separadores, sin sombra por celda |
| Filtros accesibles + chips                         | Taskia `filters-bar.tsx`                      | Botón fijo; chips desplazables, sin ocultar el acceso principal                       |
| Calendario mes + agenda                            | Taskia `calendar-view.tsx` + Navis calendario | Celdas para fecha/indicador; agenda para contenido y acciones                         |
| Selector de vistas con nombres completos           | Web `views-tabs.tsx` + restricción móvil      | Hoja con lista cuando hay muchas vistas; no reducirlas a iconos ambiguos              |
| Componentes y tipografía actuales                  | `components/ui`, `packages/theme`             | Ampliar variantes existentes antes de duplicar primitivas                             |

Propuesta de geometría para validar en dispositivos: márgenes de 16 dp en teléfonos estrechos y 20–24 dp cuando haya espacio; separación de 8/12/16 dp; áreas de toque de al menos 48 dp en acciones independientes. Las filas de cuadrícula tendrán altura mínima de 52 dp y crecerán con fuente ampliada; nunca recortar texto usando altura fija. Radios y colores salen de variantes existentes.

## 4. Paridad funcional obligatoria

| Capacidad web                   | Adaptación móvil                                    | Criterio verificable                                                            |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| Tablón y configuración de tabla | Directorio, formulario, activar/desactivar y borrar | Nombre, icono y acento sobreviven al reinicio                                   |
| Columnas dinámicas              | Gestor y editor nativos                             | Renombrar conserva `key` y datos; borrar desactiva la columna                   |
| Cuadrícula                      | Rejilla horizontal con filas virtualizadas          | Todas las columnas activas consultables; orden y filtros sobre todo el conjunto |
| Tablero                         | Carriles desplazables y acción «Mover a…»           | Agrupa por selección única, consulta y pagina por carril                        |
| Calendario                      | Mes con conteos + agenda del día                    | Rango completo, conteos exactos y agenda paginada                               |
| Vistas guardadas                | Selector y editor                                   | Guardar filtros/orden explícitamente; cuadrícula base no eliminable             |
| Edición de filas                | Detalle y formulario generado                       | Los 12 tipos funcionan y los datos incompatibles se conservan                   |
| Columnas vinculadas             | Selector de creyentes y valores vivos               | Cambiar un teléfono en Creyentes actualiza búsqueda, filtros y exportación      |
| Exportación                     | Hoja de configuración y compartir archivo           | Mismos cinco formatos del RFC 0009, con filtros aplicados                       |
| Permisos                        | Política local con capacidades separadas            | Ocultar controles y rechazar escrituras no autorizadas en el repositorio        |

La visibilidad/anchura de columnas es una preferencia de presentación del dispositivo. El schema actual de `CustomTableView` no contiene columnas visibles: no afirmar que se sincronizan con una vista ni añadirles persistencia de servidor sin cambiar expresamente el contrato.

## 5. Pantallas e interacción detalladas

### 5.1 Directorio `/tables`

Cabecera con título «Tablas», buscador y acción «Nueva tabla» según capacidades. Lista virtualizada de tarjetas con icono, nombre, acento y descripción; abrir lleva al detalle por **id**, evitando depender de un slug que pueda cambiar. Reutilizar el estilo de `lists-screen.tsx` y las tarjetas actuales. No ejecutar una consulta de conteo por tarjeta: utilizar agregado único si se muestran totales.

Estados diferenciados: cargando, ninguna tabla, búsqueda sin coincidencias, iglesia no seleccionada, acceso perdido y error de lectura. El vacío inicial ofrece crear; el vacío filtrado ofrece limpiar la búsqueda. Las tablas desactivadas pueden verse en un filtro de administración y reactivarse.

### 5.2 Contenedor de detalle `/tables/[id]`

```text
←  [icono] Inventario                         ⋮
   Descripción breve
[ Cuadrícula ▾ ]                   [Nueva fila]
[ Buscar…                                    ]
[Filtros 2] [Ordenar] [Columnas]
[Estado: Disponible ×] [Importe > 50 ×]
──────────────────────────────────────────────
Contenido de la vista activa
```

Cabecera de identidad compacta; selector siempre accesible, búsqueda dentro de la tabla y acciones de configuración en menú. «Columnas» en la barra significa presentación; «Gestionar columnas» en el menú significa modificar el esquema. No mezclar ambos controles.

La hoja de vistas lista «Cuadrícula» y todas las vistas guardadas, agrupadas por tipo con etiqueta visible. «Nueva vista» disponible si hay una columna compatible. Explicar por qué Tablero o Calendario no se pueden crear. Permitir nombrar, renombrar y borrar vistas guardadas; selección activa con estado accesible.

Cada vista conserva un borrador de consulta durante la sesión, incluida su propia búsqueda. Los cambios temporales no sobrescriben la definición. Mostrar «Cambios sin guardar» y «Actualizar vista» solo a quien gestione. Al cambiar de vista, conservar su borrador en memoria; al volver a abrir la pantalla cargar la versión persistida y restablecer las búsquedas temporales. La búsqueda no se guarda dentro de `CustomTableView`.

### 5.2.1 Contrato de independencia de vistas

| Estado/configuración                                        | Ámbito y comportamiento                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Filtros, orden, nombre y columna de agrupación/fecha        | Propios de cada `viewId`; guardar afecta solo a esa vista                           |
| Búsqueda y borrador sin guardar                             | Propios de cada vista durante la sesión; no se heredan al seleccionar otra          |
| Columnas visibles, anchuras y presentación Filas/Cuadrícula | Preferencias locales por usuario/iglesia/tabla/**vista**, compatibles con su tipo   |
| Página, scroll y selección de fila                          | Propios de cada vista; restaurar al volver si siguen siendo válidos                 |
| Mes y día seleccionado                                      | Propios de cada instancia de calendario, incluso si comparten `dateColumn`          |
| Carril activo y páginas por carril                          | Propios de cada instancia de tablero, incluso si comparten `groupBy`                |
| Estado de carga/error                                       | Propio de cada consulta; un fallo en tablero no bloquea cuadrícula/calendario       |
| Filas y definición de columnas                              | Compartidas; cambios de datos invalidan consultas afectadas sin borrar preferencias |

La cuadrícula base usa una identidad estable sintética, por ejemplo `grid`, con el mismo aislamiento. Crear una vista nueva parte de valores propios; ofrecer explícitamente «Usar filtros y orden de esta vista» si se desea copiar la consulta inicial. Esa copia es una instantánea, nunca un enlace entre configuraciones. Borrar una vista elimina solo su definición/estado/preferencias; conserva las filas y las demás vistas.

Ejemplo de aceptación: «Pendientes» y «Completados» son dos tableros sobre la misma columna. Buscar y ordenar en Pendientes no cambia Completados ni Cuadrícula. «Entregas» y «Revisiones» mantienen meses distintos. Editar una fecha de una fila actualiza los calendarios correspondientes sin cambiar sus meses seleccionados.

Si se borra la vista activa, volver a Cuadrícula. Si su columna de agrupación/fecha desaparece o cambia de tipo, mostrar vista no disponible con acceso a Cuadrícula y a gestión; nunca un lienzo vacío.

### 5.3 Cuadrícula real

Conservar la lectura por columnas: no sustituirla automáticamente por tarjetas. En móvil estrecho, desplazamiento horizontal limitado al área de datos; cabecera de tabla y controles permanecen en el ancho del dispositivo. La primera columna no sensible funciona como identificador y puede fijarse; si solo hay contraseñas, usar una etiqueta de fila no sensible.

Prototipo técnico obligatorio: un único contenedor horizontal de la zona de tabla con `FlatList` vertical, cabecera y anchuras compartidas. Verificar ancho de contenido, alineación y fijación antes de extenderlo. Si se separa la columna fija, sincronizar desplazamiento vertical sin bucles y validar alturas variables. No crear un ScrollView horizontal por fila ni montar toda la tabla con `.map()`.

Anchuras iniciales propuestas: checkbox 72 dp, número/moneda 112 dp, fecha 144 dp y texto/selección 180 dp. Límites y preferencias por columna; texto largo muestra resumen y detalle. Pulsar fila abre su ficha; pulsar cabecera abre orden/acciones de esa columna. No iniciar edición inline general en la primera entrega: la edición completa vive en formulario nativo.

Opcional dentro de la misma vista base: presentación «Filas» con tarjetas para lectura accesible y fuente grande. Es una preferencia local, no una vista persistida nueva. Debe estar disponible como alternativa si la rejilla resulta difícil de usar con lector de pantalla.

### 5.4 Tablero

Carril de ancho aproximado 84 % del espacio útil en teléfono, con parte del siguiente visible y ajuste al finalizar el desplazamiento. Pantallas anchas muestran varios carriles con ancho máximo razonable. Cabecera: indicador de color de opción, nombre y **total filtrado**, no longitud de página.

Carriles vacíos visibles; carga inicial, siguiente página y error independientes. Montar carril actual y vecinos; no lanzar 50 consultas iniciales si una columna tiene 50 opciones. Tarjeta con primera columna no sensible, 2–3 campos de resumen y acceso al detalle.

Acción primaria de cambio de estado: menú «Mover a…» con selector de destino. Evitar `SwipeableRow` dentro del carrusel horizontal: sus gestos compiten. Arrastre entre carriles es una mejora posterior, condicionada a un prototipo fiable con Gesture Handler/Reanimated y alternativa accesible. La primera entrega ya permite mover sin arrastrar.

La web inspeccionada renderiza las opciones declaradas. Para filas sin opción o con una opción retirada, añadir un carril de recuperación «Sin asignar» en móvil como mejora explícita, o un acceso equivalente a esas filas. No ocultarlas silenciosamente. Los conteos de carriles deben cubrir el conjunto filtrado, incluyendo ese caso.

Al mover se modifica solo `groupBy`; conservar otros campos. Invalidar origen/destino y cuadrícula/calendario afectados después de guardar. Si el campo es vinculado, respetar exactamente las reglas de sobreescritura del RFC 0025; no permitir cambios que el contrato de columna prohíba.

### 5.5 Calendario

```text
[Vista: Entregas ▾]
‹             Octubre 2026                 ›
[Hoy]                        [Filtros 1]
L   M   X   J   V   S   D
… día + indicador/conteo, sin títulos largos …
──────────────────────────────────────────────
Viernes, 2 de octubre                12 filas
[Nombre de fila · hora si procede]       ›
[Nombre de fila · dato secundario]       ›
[Cargar más]
[Añadir en este día]
```

Reutilizar `calendar-grid.tsx`, `calendar-nav.tsx` y patrones de `calendar-month.tsx`. Hoy y día seleccionado son estados distintos. Al abrir: mes actual/día actual; al navegar de mes seleccionar un día válido del mes destino. Seleccionar fecha no abre un modal automáticamente: actualiza agenda inferior.

Consultar agregados por día para toda la rejilla visible y filas paginadas para el día elegido, con los mismos filtros. No descargar un mes completo para dibujar indicadores ni confiar en `MAX_PAGE_SIZE` como si fuese el total del mes. Las fechas sin valor quedan fuera del mes pero con acceso «Sin fecha» a su lista.

Crear desde agenda prellena `dateColumn`; fecha sin hora conserva `YYYY-MM-DD`. Fecha con hora utiliza la convención existente del schema y la zona del dispositivo para agrupar; probar cambios de horario y medianoche. No usar indiscriminadamente `toISOString().slice(0, 10)` para días locales.

### 5.6 Formularios de fila y detalle

Detalle muestra etiquetas y valores completos en orden de columna, acciones editar/borrar y tratamiento explícito de vinculaciones. Formulario largo en pantalla con teclado gestionado; hojas para selección de opciones/fechas, sin apilar varias hojas activas. Guardar tiene estado pendiente y bloqueo de doble envío. Atrás con cambios pide descartar; tras guardar se restaura la vista y contexto de procedencia.

| Tipo            | Control y reglas                                                                         |
| --------------- | ---------------------------------------------------------------------------------------- |
| `text`          | `TextField`, teclado normal, validación compartida                                       |
| `long_text`     | Multilínea con crecimiento controlado y acceso al texto completo                         |
| `number`        | Entrada decimal con negativos cuando proceda; parseo de coma/punto por locale            |
| `currency`      | Valor numérico sin formato en almacenamiento; presentación monetaria según configuración |
| `checkbox`      | `Checkbox` con etiqueta; distinguir falso, vacío y valor incompatible según schema       |
| `date`          | `DatePicker` y selector horario si la columna lo requiere                                |
| `single_select` | `RadioGroup` hasta 6 opciones; `Select` con búsqueda por encima                          |
| `multi_select`  | Casillas hasta 6; hoja multiselección buscable por encima                                |
| `email`         | Teclado email, sin capitalización ni autocorrección                                      |
| `phone`         | Teclado telefónico, conservar prefijos y formato permitido                               |
| `url`           | Teclado URL; apertura explícita, no dispararla al tocar fila                             |
| `password`      | `PasswordField`, oculto por defecto, revelado temporal y fuera de resúmenes              |

Valores incompatibles tras cambiar tipo: aviso por campo, valor original conservado y opción de corregirlo; guardar otro campo no debe convertir ni borrar el incompatible. No validar un formulario nuevo y uno histórico con una política que destruya datos antiguos.

### 5.7 Gestión de columnas y vistas

Columnas: lista ordenada con icono de tipo, etiqueta, indicador de vínculo y menú. Reordenar primero con subir/bajar accesibles; arrastre solo si se valida con componentes existentes. Guardar orden completo en transacción y comprobar que el conjunto de ids es exactamente el de columnas activas.

Editor: nombre, tipo, configuración por tipo, opciones con valores estables y colores, y «Rellenar con» para tablas vinculadas. `key` inmutable; etiquetas/opciones no son identificadores. Respetar 30 columnas y 50 opciones. Cambio de tipo avisa antes de aplicar; desactivar columna no limpia JSON de filas.

Nueva vista: nombre, tipo y columna compatible; filtros/orden propios, con copia inicial opcional y explícita desde la vista de origen. No ofrecer `multi_select` para agrupar kanban. La cuadrícula se sintetiza y no tiene acción de borrar. Gestionar tipos/columnas de una vista según el contrato real de creación/actualización; no mostrar opciones de edición que su schema no admite.

### 5.8 Creyentes vinculados

Origen de tabla `null | believers`; configuración independiente por columna mediante el catálogo compartido de campos. Selector de búsqueda paginado de 20 en 20, selección múltiple y contador; los ya vinculados aparecen marcados/deshabilitados. Índice único activo por tabla/creyente, además de validación de UI.

Reproducir las reglas de `table-believer-overlay.ts` y RFC 0025 para dato vivo, valor manual y desenlace; no inferirlas solo por el aspecto de la celda. El valor efectivo se calcula antes de buscar, filtrar y ordenar. Resolver por lote, nunca una consulta por fila/celda. La baja o pérdida de acceso a un creyente no rompe la tabla ni muestra datos de otra iglesia.

### 5.9 Exportar

Hoja con formato, columnas y alcance: todas las filas que cumplen búsqueda/filtros de la vista, independientemente de lo cargado en pantalla. Explicar el rango de calendario si está aplicado; en tablero exportar el conjunto filtrado de todos los carriles. Orden consistente con la vista.

Reutilizar utilidades de exportación móvil y contratos del RFC 0009, comprobando los cinco formatos reales antes de extenderlos. Iterar por lotes, permitir cancelar y evitar bloquear UI. Contraseñas excluidas por defecto; inclusión explícita con aviso y confirmación del número de valores sensibles. Exportar dato efectivo de campos vinculados. Restaurar/copiar un backup es distinto de exportar filas.

## 6. Contratos y persistencia local

### 6.1 Esquema

Crear esquema local fijo para `custom_tables`, `custom_table_columns`, `custom_table_rows` y `custom_table_views`, tomando campos/semántica de schemas y entidades vigentes. Sin DDL por tabla creada por el usuario. Filas guardan JSON; columnas tienen `key` estable; conservar `source`, `believer_field`, `believer_id`, opciones, posiciones y borrado lógico.

Añadir el esquema a `ALL_LOCAL_TABLES` y sus índices. `SCHEMA_VERSION` observado: **12**; usar la siguiente migración disponible al implementar, sin asumir que seguirá siendo 13. Índices por iglesia/tablas activas, hijos por `table_id`, posiciones y relación activa con creyente. Relacionar cada hijo con una tabla autorizada antes de leer/modificar; exigir mismo ámbito para creyentes.

Consultas parametrizadas. Las columnas SQL, rutas JSON y orden dinámico provienen de metadatos validados, nunca de texto libre interpolado. Confirmar JSON1 en SQLite de Expo y en el adaptador de tests. Pruebas sobre datos incompatibles y `null` deben mantener semántica equivalente a web.

### 6.2 Repositorios y hooks

API local propuesta, con tipos derivados de `@navis/shared`:

```ts
readTables(context, options);
readTable(context, tableId);
readTableViews(context, tableId);
readTableRows(context, tableId, query); // items + total + página
readCalendarCounts(context, tableId, query, range);
createTableRow(context, tableId, input);
updateTableRow(context, tableId, rowId, input);
```

Completar con CRUD de tablas/columnas/vistas, orden de columnas, enlazado de creyentes y exportación por lotes. Lectura, agregados y exportación comparten un constructor de consulta para no divergir en filtros/valores efectivos. El constructor no depende de React ni de componentes web.

Filtros basados en `RowFilter`, operadores y validación compartidos. Conjunción, búsqueda y orden se aplican **antes** de paginar. Orden numérico real para número/moneda; desempate estable por id. No filtrar solo las páginas cargadas. Password fuera de búsqueda, filtros y resumen.

Hooks móviles usan TanStack Query como los existentes, invocando repositorios locales. Clave completa de consultas de vista: `['local-tables', churchId, userId, tableId, viewId, resource, normalizedQuery]`; incluir carril o rango cuando cambian la consulta. Los metadatos compartidos de tabla/columnas tienen claves sin `viewId`. Preferencias persistidas con iglesia/usuario/tabla/**viewId**, versión y sanitización contra columnas/vistas existentes. Un controlador de estado por instancia de vista encapsula borrador, búsqueda y navegación; no almacenar un único `filters` o `sort` a nivel del detalle.

Cambiar iglesia o cuenta cancela consultas previas, desmonta formularios, borra borradores/revelados y restablece selección. Una respuesta tardía del ámbito anterior no puede alimentar la pantalla nueva. Invalidar también tablas vinculadas después de editar un creyente.

### 6.3 Capacidades

Representar `canView`, `canEditRows`, `canManageStructure` y `canExport` aunque inicialmente algunas coincidan. Resolver con política local vigente: membresía para lectura y propietario para gestión como Listas, verificándolo en repositorio. No prometer paridad de roles remotos si estos aún no existen localmente. Cuando llegue sincronización, adaptar política a `tables.view/edit/manage/export` sin cambiar props de componentes.

### 6.4 Contraseñas y backups: condición previa al CRUD completo

La clave del servidor no existe en móvil. Ocultar texto no cifra SQLite. Antes de habilitar `password`, validar una solución de cifrado autenticado recuperable compatible con el runtime real de Expo; clave local protegida por SecureStore y sobre de cifrado versionado. No inventar criptografía ni usar el hash de credenciales de Listas: un hash no permite revelar el valor.

Prototipo debe demostrar cifrar/descifrar, nonce único, fallo ante manipulación y recuperación tras reinicio. Si requiere dependencia nueva, justificarla por esa capacidad; revisar documentación vigente en esta fase.

Integrar backup/restore desde el comienzo: `BACKUP_TABLES` deriva hoy de `ALL_LOCAL_TABLES`, pero whitelist de columnas, orden de restauración y versiones requieren revisión. Un backup con ciphertext y sin clave portátil pierde contraseñas en otro dispositivo. Definir sobre de backup cifrado con secreto proporcionado al exportar/restaurar, o reutilizar un mecanismo recuperable equivalente si ya existe al implementar. Clave SecureStore sin exportar en JSON plano. **No considerar terminado el tipo contraseña mientras la restauración en otro dispositivo no esté verificada.**

## 7. Organización de implementación propuesta

Los nombres siguientes son archivos por crear; validar reutilización antes de cada creación. Mantener archivos por responsabilidad y límite de longitud del repositorio; evitar un `tables-screen.tsx` monolítico.

| Área                       | Ubicación                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entrada y detalle          | `apps/mobile/app/tables.tsx`, `app/tables/[id].tsx`                                                                                                          |
| Formulario/detalle de fila | Rutas hijas del detalle, adaptadas a la convención de Expo Router existente                                                                                  |
| UI específica              | `src/components/tables/`: directorio, cabecera, selector, cuadrícula, fila, kanban, carril, calendario, agenda, formularios, gestores, exportación           |
| Campos por tipo            | `src/components/tables/fields/`, usando componentes UI existentes                                                                                            |
| Datos                      | `src/data/repos/tables-context.ts`, `tables-reads.ts`, `tables-writes.ts`, `table-columns.ts`, `table-rows.ts`, `table-views.ts`, `table-believer-values.ts` |
| Consultas                  | `src/data/repos/table-query.ts` y módulos pequeños para filtros/orden                                                                                        |
| Hooks                      | `src/hooks/use-tables.ts`, `use-table-rows.ts`, `use-table-views.ts`, `use-table-capabilities.ts`                                                            |
| Presentación/estado        | `src/lib/tables/`: formato, estado de consulta, preferencias, límites, exportación y cifrado                                                                 |
| Persistencia               | `packages/shared/src/local-table-schema.ts`, integración en esquema local y migración móvil                                                                  |
| Traducciones               | `packages/i18n` en los seis idiomas; reutilizar claves `tables.*` existentes                                                                                 |

No importar componentes React DOM ni servicios TypeORM en móvil. Extraer una función a shared solo si hay dos consumidores reales y no arrastra dependencias de plataforma.

## 8. Fases ejecutables y puertas de salida

Dependencia principal: **0 → 1 → 2 → 3 → 4 → 5**; fases 6 y 7 sobre la base estable, fase 8 cierra paridad y fase 9 valida entrega. La ejecución deja cambios revisables, pruebas relevantes y capturas reales. No se creó ningún commit durante esta implementación.

### Fase 0 — Base de diseño y prototipos críticos

- [ ] Capturar Navis Listas y calendario en claro/oscuro; capturar Taskia si se puede ejecutar. Registrar fuentes junto al plan.
- [ ] Prototipar cuadrícula horizontal virtualizada con 30 columnas, columna fija y fuente grande; comprobar Android/iOS.
- [x] Prototipar carrusel de carriles con listas verticales y navegación atrás sin conflicto gestual.
- [x] Resolver cifrado y backup recuperable de contraseñas.
- [x] Confirmar convenciones de fecha, permisos locales, formatos de exportación y reglas de overlay vinculadas.

Salida: dirección visual fijada con capturas y decisiones técnicas demostradas. Si la columna fija no funciona bien, mantener cuadrícula horizontal sin fijación para el primer corte y documentarlo, preservando acceso a todos los datos.

### Fase 1 — Esquema, aislamiento y restauración

- [x] Cuatro entidades locales, índices y migración idempotente.
- [x] Incorporar backup, restore y fixtures al adaptador de tests.
- [x] Contexto/autorización y validación de padres/hijos por iglesia.
- [x] Probar base nueva, actualización desde v12, backup antiguo y backup nuevo.

Salida: datos aislados y restaurables antes de construir pantallas.

### Fase 2 — Motor de lectura y escritura

- [x] CRUD, soft delete, keys estables, orden transaccional y límites.
- [x] Compilador de consultas con filtros, orden, búsqueda, conteos y paginación.
- [x] Valores efectivos vinculados y consultas por lote.
- [x] Cifrado de celdas, incompatibilidades de tipo y validación de filas.

Salida: pruebas de repositorio demuestran semántica; no depender de UI para proteger datos.

### Fase 3 — Directorio y estructura

- [x] Sustituir placeholder y añadir rutas sin colisiones con navegación existente.
- [x] Crear/editar/desactivar tablas; configurar icono/acento/origen.
- [x] Gestionar columnas/opciones y orden; crear/seleccionar/renombrar/borrar vistas.
- [x] Estados vacíos, acceso y datos inválidos.

Salida: usuario puede montar una tabla desde cero y recuperarla tras reiniciar.

### Fase 4 — Cuadrícula, detalle y edición

- [x] Renderizadores de los 12 tipos, filas virtualizadas y presentación accesible.
- [x] Formulario generado, edición, borrado y navegación de regreso.
- [x] Selector de creyentes, filas únicas y datos vivos.
- [x] Anchuras/visibilidad local sanitizadas; errores y carga incremental.

Salida: tabla utilizable de extremo a extremo, incluyendo password y relaciones.

### Fase 5 — Filtros, orden y preferencias

- [x] Hoja por tipo de columna, chips eliminables y búsqueda con debounce propuesto de 250 ms.
- [x] Orden asc/desc con desempate, reset de páginas y petición obsoleta ignorada.
- [x] Borradores por vista, actualización explícita y recuperación cuando cambia el esquema.
- [x] Independencia entre dos vistas del mismo tipo: búsqueda, filtros, orden, preferencias, scroll y calendario/carriles separados.
- [x] Distinguir preferencia local de definición compartida de vista.

Salida: consulta y total consistentes incluso cuando la coincidencia está en páginas todavía no cargadas.

### Fase 6 — Kanban

- [x] Carriles paginados, totales, carga de vecinos y carriles vacíos.
- [x] Mover a otra opción, recuperación de no asignadas e invalidación coherente.
- [x] Accesibilidad y alternativa a gestos; filtros de vista.

Salida: mover una fila actualiza cuadrícula/tablero sin perder datos ni crear orden manual.

### Fase 7 — Calendario

- [x] Conteos por día para rango completo y agenda paginada independiente.
- [x] Navegación mensual, Hoy, día seleccionado y lista Sin fecha.
- [x] Creación con fecha contextual y filtros guardados.
- [x] Probar días vecinos, febrero bisiesto, medianoche y horario de verano.

Salida: ningún registro queda oculto por el tamaño de página del mes.

### Fase 8 — Exportación y cierre de paridad

- [x] Cinco formatos, selección de columnas, filtros y orden completos.
- [x] Exportación por lotes, cancelar, compartir y aviso de contraseñas.
- [x] Restaurar backup en instalación diferente y comprobar referencias/cifrado.
- [x] Completar traducciones y matriz de capacidades.

Salida: comprobar contra la matriz de §4, no solo contra las pantallas principales.

### Fase 9 — Verificación y entrega

- [x] Ejecutar typecheck, lint y tests apropiados con comandos prefijados por `rtk`; confirmar scripts vigentes antes de usarlos.
- [x] Regresión de Listas, Creyentes, calendario y cambio de iglesia/cuenta.
- [ ] Completar la matriz ampliada de QA nativo. Capturas y comparativa Android realizadas; detalle en el informe.
- [x] Documentar limitaciones reales. El plan permanece aquí hasta cerrar las comprobaciones ampliadas indicadas en el informe.

## 9. Matriz de pruebas y aceptación

| Riesgo                    | Prueba necesaria                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga entre ámbitos        | Dos iglesias, dos usuarios, ids ajenos para tabla/fila/columna/vista, operaciones y exportación rechazadas                                                                          |
| Pérdida de JSON histórico | Renombrar, reordenar, cambiar tipo y borrar columna conserva valor; edición parcial no limpia claves ocultas                                                                        |
| Orden erróneo             | Números negativos/decimales, moneda, vacío y valores incompatibles; orden estable entre páginas                                                                                     |
| Filtrar solo lo visible   | Coincidencias fuera de primera página; conteos y exportación corresponden al conjunto completo                                                                                      |
| Relaciones obsoletas      | Editar creyente modifica valor efectivo y resultados; duplicados bloqueados; vínculo ajeno rechazado                                                                                |
| Vistas inconsistentes     | Cambios temporales, guardar, reinicio, borrar vista activa, retirar columna, preferencias corruptas                                                                                 |
| Acoplamiento entre vistas | Dos tableros y dos calendarios de la misma tabla: filtros/orden/búsqueda/mes/carriles independientes; guardar o borrar una no altera otras; editar fila actualiza datos compartidos |
| Calendario truncado       | Mes con más filas que el límite de página y día con varias páginas; conteos exactos, sin duplicados                                                                                 |
| Kanban incompleto         | 50 opciones, carriles vacíos, opción retirada, mover y fallo de persistencia; no desaparece fila                                                                                    |
| Cifrado no recuperable    | DB sin plaintext, ciphertext manipulado, restart y restauración en otro dispositivo                                                                                                 |
| Backup incompatible       | Archivo anterior sin tablas, nuevo con tablas/vínculos, restauración atómica y referencias válidas                                                                                  |
| Gestos y teclado          | Scroll horizontal/vertical, volver atrás, selección, formulario largo, guardar visible con teclado                                                                                  |

Pruebas de comportamiento con Jest/Testing Library móvil y repositorios SQLite; ampliar auditoría de iglesia en `data/test-support/church-sql-audit.ts` y suites de aislamiento. No snapshots para fingir verificación visual.

QA visual: Android e iOS cuando estén disponibles; anchos 320, 375, 390/412 y 768 dp, vertical/horizontal, claro/oscuro, textos largos, alemán y fuente al 200 %. TalkBack/VoiceOver deben anunciar fila, columna, valor, fecha completa y estado seleccionado; el color nunca es la única señal.

Fixture de rendimiento propuesto: 2.000 filas, 30 columnas, 50 opciones y un mes con 500 registros. Confirmar virtualización, consultas acotadas, ausencia de búsquedas por celda y ausencia de crecimiento de memoria proporcional a todas las filas. Medir en dispositivo Android de gama media; registrar resultados y ajustar lotes a partir de evidencia, sin prometer tiempos antes de medir.

La entrega termina cuando las tres vistas son usables, los datos sobreviven a reinicio y restauración, el aislamiento y permisos se cumplen fuera de UI, y exportación/filtros no dependen de la página cargada. La documentación final debe decir expresamente que los datos son locales mientras no exista sincronización con la web.
