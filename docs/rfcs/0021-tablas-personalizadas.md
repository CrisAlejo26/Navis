# RFC 0021: Tablas personalizadas

- **Estado**: Borrador
- **Autor**: Cristian Alejandro Arroyave (con Claude)
- **Fecha**: 2026-08-13
- **Apps afectadas**: **api y web** (escritorio la hereda). Móvil, fuera de
  alcance — igual que Listas y el cuaderno.
- **Depende de**: 0008 (la iglesia como espacio de trabajo: `church_id` y
  permisos por rol) y **0009 (exportar)**, del que sale gratis la exportación
  en los cinco formatos.
- **Se parece a**: el RFC 0010 (Listas) en la forma —subentradas en la barra
  lateral, reutilizando `NavGroup` tal cual (D3 de aquel RFC)— y al RFC 0018
  (Tareas y hábitos) en el fondo: las dos son **constructores**, pantallas
  donde quien usa la aplicación define la forma de sus propios datos en vez de
  rellenar una que ya viene fija. Se separa de Listas en lo importante: esto
  no es gente, es cualquier cosa que se quiera llevar en una tabla, y no sale
  a internet.

## Problema

En una iglesia se lleva la cuenta de muchas cosas que no son personas ni
reuniones y que hoy no tienen sitio en la aplicación: quién ha leído la Biblia
esta semana, qué se ha prestado del almacén y a quién, el inventario del
sonido, las peticiones de oración con su seguimiento, los turnos de limpieza.
Cada una de esas cosas se lleva hoy en una hoja de cálculo suelta, en un
cuaderno de papel o en la memoria de quien la organiza, y ninguna vive donde
vive el resto del trabajo pastoral.

No se puede modelar cada una de estas necesidades como una funcionalidad
propia de Navis —eso es exactamente lo que dice la Regla 1 que no se haga: no
se abstrae por si acaso, y no se puede prever de antemano cada tabla que a
alguien se le va a ocurrir necesitar—. Lo que hace falta es lo contrario de
una funcionalidad cerrada: una **superficie en blanco** donde cualquiera
pueda declarar su propia estructura —un nombre, unas columnas, un tipo de dato
por columna— y a partir de ahí tenga gratis lo que ya tiene cualquier otra
lista de la aplicación: una pantalla que se ve bien, que pagina en vez de
ahogarse cuando crece, y que se exporta.

## Alcance

Entra:

- Una sección nueva en el bloque de iglesia: **Tablas**, con **una subentrada
  por tabla**, igual que Listas y el calendario (RFC 0010 D3).
- Crear una tabla con su nombre, un icono y un color.
- Añadir columnas, con su **nombre visible** y su **tipo de dato**: texto
  corto, texto largo, número, moneda, fecha (con u sin hora), casilla,
  selección única, selección múltiple, correo, teléfono, URL y contraseña.
  El listado completo y su justificación está en «Los tipos de columna».
- **Reordenar** las columnas arrastrando, y **renombrarlas**, sin perder ni un
  dato ya escrito.
- **Cambiar el tipo** de una columna después de tener filas, y **borrarla**,
  sin que eso borre las filas enteras.
- Añadir, editar y borrar filas, con un formulario que se genera solo a partir
  de las columnas de esa tabla.
- **Carga perezosa**: la tabla no trae todas sus filas de golpe. Se pagina, con
  el mismo patrón que ya usa el listado de creyentes.
- Buscar dentro de una tabla, y ordenar por cualquiera de sus columnas.
- **Varias formas de ver la misma tabla** —cuadrícula, tablero y calendario— y
  **filtros que se generan solos** a partir de las columnas que esa tabla
  tenga de verdad, sin una lista fija de campos que filtrar. Ver «Vistas y
  filtros».
- Exportar las filas visibles —con los filtros y la vista activa aplicados—
  en los cinco formatos del RFC 0009, sin escribir un escritor nuevo.
- Los textos de la interfaz —los fijos, no lo que cada iglesia escriba—, en
  los seis idiomas.

### Fuera de alcance

- **La app móvil.** Como el cuaderno y tareas y hábitos.
- **Adjuntos.** Guardar un fichero por celda es otra pieza —almacenamiento por
  ámbito, límite de tamaño, previsualización— y no la pide el caso de uso que
  dispara este RFC. Cuando haga falta, se apoya en `AudioStorageService` /
  `ImageStorageService`, que ya resuelven «un fichero por iglesia» (CLAUDE.md).
- **Columnas calculadas, fórmulas, `rollup` o `lookup`.** Es la parte de
  Airtable y Notion que más superficie tiene y la que menos pide el problema
  de este RFC: aquí se **registra** un dato, no se **calcula** uno. Si algún
  día hace falta un total, se calcula en la interfaz sobre las filas que ya
  están cargadas.
- **Campos de relación** entre una tabla y otra, o entre una tabla y los
  creyentes. Cada tabla es independiente. Enlazar «quién ha leído la Biblia»
  con la ficha de un creyente es una funcionalidad real y es la siguiente
  pregunta que alguien va a hacer, pero acoplaría este RFC al modelo de
  creyentes y lo convertiría en otra cosa.
- **Publicar una tabla en un enlace público**, al estilo de las Listas. Una
  tabla puede llevar datos sensibles por columna (una contraseña, un número de
  teléfono privado) y no tiene el filtrado campo a campo que la Regla D16 del
  RFC 0010 exige para publicar. Si algún día se pide, es una extensión sobre
  este modelo y no parte de él.
- **Colaboración en tiempo real** (dos personas editando la misma fila a la
  vez). No lo tiene ninguna pantalla del proyecto todavía.
- **Plantillas de tabla** de serie («asistencia», «inventario»…). Se podrían
  añadir después sembrando `custom_tables` como se siembran hoy las cinco
  listas, pero no son parte de este RFC: sin datos de uso real, adivinar qué
  plantillas hacen falta es la abstracción por si acaso que prohíbe la Regla 1.

## Investigación: cómo lo resuelven otros

### Productos de referencia

**Airtable** y **Notion** son el catálogo mental de cualquiera que vaya a usar
esto, y los dos coinciden en algo que no es obvio hasta que se mira: **no
existen dos tipos separados «radio» y «lista desplegable»**. Hay un único tipo
de campo, «selección única», y la interfaz decide cómo pintarlo según cuántas
opciones tenga y dónde se esté editando —en la fila expandida, unas pocas
opciones se ven como botones; en una celda estrecha, como un desplegable—. Lo
mismo con la selección múltiple. Es una simplificación deliberada: menos tipos
que aprender, y la forma de pintar es un detalle de la pantalla, no una
decisión que el usuario tenga que tomar al crear la columna. Este RFC copia
esa idea (ver «Los tipos de columna»).

**Baserow** y **NocoDB** son las dos alternativas abiertas más citadas, y
difieren justo en el punto que le importa a este RFC: NocoDB se conecta a una
base de datos que ya existe y le pone una capa de hoja de cálculo encima —cada
tabla del usuario es una tabla SQL real, creada con DDL en caliente—; Baserow
gestiona su propio Postgres y también crea una tabla real por cada tabla de
usuario. Los dos pagan el mismo precio por esa flexibilidad: el motor tiene
que soportar `CREATE TABLE` y `ALTER TABLE` dinámicos como operación normal de
la aplicación, con todo lo que eso implica en permisos, migraciones y
compatibilidad de motor. Es exactamente lo que la sección siguiente explica
por qué no encaja en Navis.

### Patrones técnicos encontrados

La pregunta de fondo —cómo se guarda algo cuyas columnas no se conocen hasta
que el usuario las escribe— tiene tres respuestas conocidas, y las tres están
bien documentadas con sus costes:

- **EAV** (entidad-atributo-valor: una fila por cada valor de cada celda) da
  la flexibilidad máxima al precio más alto: escrituras lentas —cada fila del
  usuario son N filas de la tabla EAV—, y consultas que combinan varias
  columnas se vuelven cadenas de auto-`JOIN`. La literatura la describe sin
  matices: es peor que JSONB en casi cualquier medida cuando se compara
  directamente.
- **JSONB** (todos los valores de una fila en una sola columna de tipo
  documento) es el término medio: cada fila de usuario sigue siendo **una**
  fila de verdad, se puede indexar con GIN si hace falta buscar dentro, y el
  coste que se paga es que la base de datos no impone el tipo de cada campo
  —eso lo valida la aplicación—. Es el patrón recomendado para «una entidad
  central estable con extensiones impredecibles», que es exactamente esta
  situación: la fila es estable (una tabla de usuario, con sus metadatos), lo
  impredecible es qué columnas tiene.
- **Una tabla SQL real por tabla de usuario** (lo que hacen Baserow y NocoDB)
  es el enfoque de mayor fidelidad y el de mayor coste operativo: hace falta
  DDL dinámico, índices que se crean sobre la marcha, y un plan de consultas
  que se degrada con estadísticas sesgadas cuando una tabla crece mucho. Es lo
  que un producto que **es** una base de datos necesita hacer; no lo que hace
  falta para que una iglesia lleve una lista de asistencia.

Sobre **renombrar y reordenar columnas** sin perder datos, la respuesta que da
la documentación de herramientas de migración (EF Core, Rails, Laravel,
Prisma) es unánime y es una advertencia, no una receta: un `ALTER TABLE` que
cambia el tipo de una columna SQL real **descarta lo que había**, y la
práctica recomendada para no perder nada es crear la columna nueva al lado,
copiar y migrar dato a dato, y retirar la vieja. Es una operación cara incluso
en un modelo pensado para eso. En un modelo JSONB, en cambio, «renombrar» y
«reordenar» **no tocan un solo dato**: son una fila de metadatos que cambia,
como se explica en la siguiente sección.

Sobre **paginación**, la comparación entre desplazamiento (`OFFSET`) y cursor
es consistente en toda la bibliografía: el cursor gana en rendimiento a
escala grande porque no tiene que recorrer las filas que descarta, pero pierde
la navegación directa a una página («ir a la página 7») y el número total de
resultados, que sí da el desplazamiento. La recomendación general es cursor
para listas que crecen sin límite (un muro de noticias); desplazamiento
cuando el volumen es acotado y la persona quiere saber cuánto hay y moverse
por él.

### Conclusiones clave para Navis

- **JSONB por fila de usuario, no EAV y no tablas SQL reales.** Es la única de
  las tres opciones que no exige DDL dinámico —imposible de encajar con el
  patrón de Navis de migraciones fijas y `DataSource` único (CLAUDE.md)— y no
  paga el coste de escritura de EAV.
- **Separar la etiqueta de la clave interna**, como ya hace `List.slug`
  (RFC 0010 D7): si la clave con la que se guarda el valor en el JSON no
  cambia al renombrar la columna, renombrar deja de ser una migración y pasa a
  ser una actualización de una fila de metadatos.
- **Airtable y Notion no separan «radio» de «lista desplegable»**: es un solo
  tipo, «selección única», con una forma de pintarse que decide el número de
  opciones. Menos tipos que enseñar y menos decisiones que tomar al crear una
  columna.
- **El volumen de una iglesia no es el de un producto SaaS multi-tenant.**
  Cientos o pocos miles de filas por tabla, no millones. Eso hace que la
  paginación por desplazamiento —la que ya usa el listado de creyentes— sea la
  elección correcta por consistencia (Regla 1), no cursor: aquí gana más la
  navegación directa y el total que la ventaja de rendimiento que el cursor
  solo demuestra a escala mucho mayor.
- **Cambiar el tipo de una columna con filas ya escritas no puede ser
  silencioso.** La bibliografía de migraciones SQL avisa de pérdida de datos
  al cambiar un tipo; en un modelo JSONB no hay pérdida automática porque no
  hay `ALTER TABLE`, pero sí puede haber valores que ya no encajan con el tipo
  nuevo, y eso hay que decírselo a quien lo hizo, no esconderlo.

## Solución propuesta

Una **tabla** es, para quien la usa, justo lo que suena: un nombre, un icono,
un color, y una rejilla de columnas y filas. Por dentro son tres piezas:

```
custom_tables            — la tabla: nombre, icono, color, orden
  └── custom_table_columns  — la definición de cada columna: etiqueta, tipo, orden
  └── custom_table_rows     — cada fila: un blob JSON con un valor por columna
```

El flujo de quien la crea:

1. **«Nueva tabla»** desde la sección, como «Nueva lista». Nombre, icono,
   color. Se crea vacía, sin columnas.
2. **Añadir columnas**, una a una: nombre y tipo. Cada una nace al final; se
   arrastra para reordenar (igual que los miembros de una lista, RFC 0010 D6,
   pero con `PUT` de golpe en vez de posición a posición: ver «API»).
3. **Añadir filas** con un botón que abre un formulario generado a partir de
   las columnas, en su orden, con el control que le toca a cada tipo.
4. La tabla se pagina sola en cuanto pasa de una página de filas; buscar y
   ordenar por columna no piden recargar el resto de la pantalla.
5. Renombrar una columna, cambiarle el tipo o borrarla son acciones sobre su
   definición, nunca sobre las filas ya escritas —ver «Las columnas» más
   abajo para qué pasa con el dato cuando el tipo deja de encajar.

## Decisiones tomadas

### La tabla

- **D1 — Una tabla es de la iglesia, no de la cuenta.** Como las Listas
  (RFC 0010 D1) y a diferencia de Tareas y hábitos: llevar la asistencia a la
  lectura de la Biblia es un trabajo de la congregación, no de quien lo anota,
  y quien lo cubra de baja tiene que poder seguir viéndolo. Lleva `church_id`,
  `ActiveChurchGuard` y permisos de rol.

- **D2 — Subentradas en la barra lateral, reutilizando lo que ya existe.**
  `NavGroup` (RFC 0010 D3) recibe una tercera clase de hijos: `NavChildren`
  pasa de `'calendars' | 'lists'` a `'calendars' | 'lists' | 'tables'`. Ni una
  línea nueva en `AppNav` ni en `NavGroup`; es la prueba de que aquel diseño
  estaba bien puesto.

- **D3 — Se llama «Tablas», sin adjetivo.** Es lo que alguien va a decir en
  voz alta —«voy a montar una tabla para la asistencia»—, es corto en los seis
  idiomas (`Tables`, `Tableaux`, `Tabelas`, `Tabellen`, `Tabelle`: ninguno se
  acerca al límite de 240 px que le costó el nombre a Listas, RFC 0010 «Cómo
  se llama la sección»), y no colisiona con nada: «Listas» ya es gente,
  «Cuaderno» ya es notas, «Tablas» queda libre para «cualquier otra cosa».

- **D4 — El icono sale del catálogo que ya existe, sin copiarlo.**
  `TASK_ICON_CATALOG` (RFC 0018 §7.1, `packages/shared/src/constants/task-icons.ts`)
  tiene 120 iconos en 12 categorías —trabajo, estudio, espiritual, hogar,
  salud, finanzas, familia, naturaleza, tecnología, viajes, comida, tiempo— y
  ninguna es específica de una tarea: sirven igual para nombrar una tabla. Se
  reutiliza el catálogo entero y su `icon-map.ts` de renderizado en web
  (Regla 1: nada se copia si ya existe y sirve). Si algún día hace falta un
  icono que hoy no está, se añade ahí y lo heredan las dos pantallas.

- **D5 — El color sale de `ACCENT_PALETTE`,** igual que listas, sedes, dones y
  labores (RFC 0010 D37). Se propone uno sin usar al crear la tabla.

- **D6 — Apagar no es borrar.** `is_active`, igual que `List.isActive`: una
  tabla apagada sale de la barra pero conserva sus columnas y sus filas. El
  borrado es lógico (`deleted_at`, `BaseEntity`).

### Las columnas

- **D7 — Cada columna tiene una `key` que no cambia, y una etiqueta que sí.**
  Es el mismo patrón que el `slug` de una lista (RFC 0010 D7), aplicado a una
  columna en vez de a una tabla entera: la `key` se genera una vez —a partir
  del nombre, con sufijo si choca— al crear la columna, y es la clave con la
  que se guarda su valor dentro del JSON de cada fila. **Renombrar una
  columna es escribir una fila de metadatos nueva; no toca ni una fila de
  datos.** Es la respuesta directa al problema que la bibliografía de
  migraciones SQL señala como el más caro de resolver (ver «Investigación»):
  aquí no hace falta resolverlo, porque nunca llega a plantearse.

- **D8 — Reordenar es arrastrar, y se manda de golpe.** Mismo patrón que el
  orden de los miembros de una lista (RFC 0010 D6): arrastre nativo
  (`draggable`, sin librería —es la trampa que ya evitó `member-row.tsx`, y
  aquí se sigue igual, Regla 1—), con botones de subir/bajar por teclado
  porque arrastrar no es accesible por sí solo. El resultado se manda entero
  con `PUT /tables/:id/columns/order`, igual que `PUT /lists/:id/order`.

- **D9 — Cambiar el tipo no borra nada, y avisa cuando algo deja de encajar.**
  Como no hay una columna SQL real que reconstruir, cambiar el tipo de
  «texto» a «fecha» no dispara ningún `ALTER TABLE`: es, otra vez, una fila de
  metadatos. Lo que sí puede pasar es que un valor que ya estaba escrito no
  tenga sentido con el tipo nuevo —«ayer» no es una fecha ISO—. Esos valores
  **no se tocan ni se borran**: se guardan tal cual estaban, y la fila que los
  tiene se marca al leerla como «no encaja con el tipo actual», con el valor
  en crudo visible y editable a mano. Es el punto medio entre las dos malas
  respuestas: perder el dato (lo que hace un `ALTER TABLE` real) o fingir que
  siempre ha sido válido.

- **D10 — Borrar una columna es borrado lógico, y no borra las filas.**
  `is_active = false` en la definición; el valor sigue en el JSON de cada
  fila, sin usarse ni mostrarse. Igual que apagar una tabla (D6): quien borra
  una columna por error no ha perdido nada, y si algún día hiciera falta
  recuperar filas exportadas de antes del borrado, el dato sigue estando.

- **D11 — Selección única y selección múltiple son un tipo cada una, y la
  forma de pintarse depende de cuántas opciones tengan.** Es la simplificación
  que copian Airtable y Notion (ver «Investigación»): no hay un tipo «radio»
  y otro «lista desplegable» por separado. Con **seis opciones o menos**, el
  formulario pinta botones de radio (o casillas, en la múltiple); con más,
  un desplegable de búsqueda, reutilizando `combobox-listbox.tsx`, que ya
  existe. Quien pidió «radiobox» lo tiene: es lo que ve en cuanto crea una
  columna de selección única con pocas opciones, sin tener que elegirlo aparte.

- **D12 — Límites, para que la pantalla no se rompa sola.** Como referencia de
  Airtable y Baserow, que imponen límites parecidos por plan: **30 columnas**
  por tabla y **50 opciones** por columna de selección. No hay límite en el
  número de tablas ni de filas —para eso está la paginación—.

### Las filas

- **D13 — El valor de cada fila se guarda en una columna `text` con JSON,
  igual en los dos motores.** Como `List.publicFields` (RFC 0010 §6.1): no se
  usa el tipo nativo `jsonb` de TypeORM, que se comporta distinto en Postgres
  y SQLite, sino `text` con `JSON.stringify` al escribir y **validación con
  zod** al leer —nunca un `JSON.parse` a pelo, que devuelve `any` (Regla 10).
  Es exactamente el patrón que ya usa el proyecto para «lo impredecible
  dentro de una fila estable», y aquí se aplica dos veces: una a las opciones
  y la configuración de cada columna, y otra a los valores de cada fila.

- **D14 — Sin orden manual de filas.** A diferencia de los miembros de una
  lista (RFC 0010 D6), aquí no hay arrastrar para reordenar. El motivo es que
  las dos cosas no conviven: arrastrar para fijar un orden a mano solo
  funciona si se ve la tabla entera, y esto es justo lo que la carga perezosa
  evita a propósito. En su lugar, se ordena **por una columna**, ascendente o
  descendente —por defecto, la fecha de creación, la más reciente primero—,
  igual que ya hace el listado de creyentes con su `sort`/`order`.

- **D15 — Ordenar por una columna dinámica es una comparación con casting,
  no un texto plano.** El JSON se guarda como texto, así que extraer «el
  valor de la columna X» y ordenarlo pide una expresión SQL distinta en cada
  motor: `data::jsonb ->> 'clave'` en Postgres, `json_extract(data, '$.clave')`
  en SQLite. Es la misma familia de trampa que ya resuelven
  `database/date-sql.ts` y `database/iso-day.ts` (CLAUDE.md), y se resuelve
  igual: un helper nuevo, `database/json-field-sql.ts`, con sus tests contra
  los dos motores (Regla 4). Y hay que **convertir según el tipo declarado de
  la columna** antes de ordenar: un número guardado como texto ordena «10»
  antes que «2» si no se convierte a numérico primero. Fecha y texto ordenan
  bien como texto porque `AAAA-MM-DD` ya lo hace (RFC 0002 §5.5); número y
  moneda necesitan `CAST`; casilla se trata como texto `'true'`/`'false'`.

- **D16 — Buscar es un `LIKE` sobre el texto entero de la fila.** Como `data`
  es la misma columna `text` en los dos motores, `WHERE LOWER(data) LIKE
LOWER('%término%')` funciona igual en SQLite y en Postgres sin ninguna rama
  por motor. No hay índice detrás —a esta escala (cientos o pocos miles de
  filas por tabla, ver «Investigación») no hace falta—, y si algún día una
  tabla creciera mucho más, ahí está el `GIN` sobre JSONB que menciona la
  bibliografía, ya con el motor decidido (D17) y sin tocar la forma de la API.

### Carga perezosa

- **D17 — Paginación por desplazamiento, igual que creyentes, no cursor.** La
  investigación es clara en que el cursor gana a escala de millones de filas;
  el volumen real aquí es el de una iglesia, no el de una red social. Se
  reutiliza `Paginated<T>`, `paginationQuerySchema`, `DEFAULT_PAGE_SIZE` (5) y
  `MAX_PAGE_SIZE` (100) de `packages/shared`, y el componente `<Pagination />`
  que ya usan creyentes y tareas: no hay una sola pieza nueva de infraestructura
  de paginación, solo un servicio de página nuevo con las mismas piezas
  (Regla 1).

- **D18 — Sin relaciones cargadas en la consulta paginada.** La trampa ya está
  escrita en `CLAUDE.md`: con relaciones cargadas, `take`/`skip` de TypeORM
  pasan a una subconsulta con `DISTINCT` y Postgres exige que todo lo que se
  ordena esté en la lista de selección. Como aquí no hay relaciones que cargar
  —el valor de cada celda ya está en la propia fila, dentro de `data`— esta
  trampa en concreto no debería morder, pero el patrón de `BelieversPageService`
  se copia igual: consulta de la tabla sola, `offset`/`limit`, `getManyAndCount`.

- **D19 — «Perezosa» quiere decir «no todo de golpe», no «desplazamiento
  infinito».** Con el volumen de este RFC, una página de 25 o 50 filas
  (`DEFAULT_PAGE_SIZE`/`MAX_PAGE_SIZE`) sostenida con TanStack Query y
  `placeholderData` para no parpadear al cambiar de página cubre lo que pide
  «carga perezosa»: la pantalla nunca tiene en memoria ni en el DOM más que
  una página. No hace falta una librería de virtualización —no hay ninguna
  en el proyecto (Regla 1: no se añade una dependencia para un segundo caso
  que no existe)— porque el DOM nunca crece más allá del tamaño de página.

### Las contraseñas

- **D20 — Un campo de tipo contraseña no es una credencial de acceso: es un
  dato que alguien quiere guardar y volver a leer.** Es distinto de
  `list_viewers.password_hash` (RFC 0010 D24), que es un hash de un solo
  sentido para autenticar. Aquí el caso de uso es otro —«la contraseña del
  router del salón», «la clave del portal del proveedor»— y quien lo escribe
  necesita poder **volver a verla**. Un hash no sirve para eso.

- **D21 — Se cifra, no se hashea, con una clave derivada de
  `BETTER_AUTH_SECRET`.** AES-256-GCM, con la clave derivada por HKDF con una
  etiqueta propia (`'table-field-secret'`), el mismo patrón de «una etiqueta,
  sin variable de entorno nueva» que ya usa la cookie de acceso a listas
  (RFC 0010 D23). El valor cifrado vive dentro del mismo JSON de la fila, en
  la clave de esa columna; solo esa celda se cifra, no la fila entera, porque
  el resto de columnas sigue necesitando ordenarse y buscarse en claro (D15,
  D16).

- **D22 — Oculto por defecto, con un gesto explícito para verla.** En la
  tabla y en el formulario, la celda se pinta con puntos; un botón la
  descifra y la enseña, sin pedir contraseña de la cuenta otra vez —quien ya
  ve esa tabla puede ver esa celda—. Es una comodidad de referencia, no una
  bóveda.

- **D23 — Se excluye de la exportación por defecto, con un aviso explícito
  para incluirla.** Exportar una tabla que tiene una columna de tipo
  contraseña abre un aviso —«Este archivo va a llevar 3 contraseñas en texto
  claro»— antes de generarlo, el mismo tratamiento que RFC 0010 D29 le da a
  la hoja de credenciales: es el único otro sitio del proyecto donde una
  contraseña sale a un fichero, y sale con el mismo cuidado.

### Vistas y filtros

- **D24 — Una vista es una forma guardada de mirar la tabla, no una copia de
  los datos.** `custom_table_views`: nombre, tipo (`grid` | `kanban` |
  `calendar`), filtros, orden y qué columnas se ven. Es de la tabla y no de
  quien la mira —igual que la tabla es de la iglesia y no de la cuenta
  (D1)—: si alguien monta un tablero por estado, lo ve todo el que abra esa
  tabla, no solo quien lo creó. La vista **de cuadrícula por defecto** existe
  siempre y no se puede borrar; las demás se añaden y se quitan.

- **D25 — Solo tres tipos de vista, y dos de ellos piden una columna
  concreta para existir.** Se para en tres a propósito, en vez de copiar el
  catálogo entero de Airtable (que además tiene formulario, `rollup` y
  galería): cada una resuelve una pregunta real de las que ya aparecen en el
  problema de este RFC, y ninguna se añade «porque la tiene el otro
  producto» (Regla 1 §4, «abstraer por si acaso»).

  | Vista          | Para qué sirve                                        | Requisito                               |
  | -------------- | ----------------------------------------------------- | --------------------------------------- |
  | **Cuadrícula** | La tabla entera, paginada (D17–D19)                   | Ninguno; es la que siempre existe       |
  | **Tablero**    | Agrupar por estado —peticiones de oración, turnos—    | Al menos una columna de selección única |
  | **Calendario** | Ver las filas por su fecha —asistencia, seguimientos— | Al menos una columna de fecha           |

  Si la tabla no tiene ninguna columna de selección única, el tablero no se
  ofrece como opción; lo mismo el calendario sin una columna de fecha. No es
  una limitación que haya que explicar: la vista que no tiene sentido con las
  columnas que hay, directamente no aparece.

- **D26 — El tablero no rompe la carga perezosa: cada columna del tablero
  pagina por su cuenta.** La tentación de un tablero es traer todas las filas
  de una vez para repartirlas en carriles, y es justo lo que D19 prohíbe. En
  su lugar, cada carril —cada opción de la columna de selección elegida— es
  **su propia página**: se piden por separado, con su propio «cargar más», y
  el carril nunca tiene en memoria más filas de las que se han pedido para
  él. Arrastrar una tarjeta de un carril a otro es un `PATCH` a esa fila que
  cambia el valor de la columna, no un reordenamiento de posiciones (D14
  sigue sin orden manual).

- **D27 — El calendario solo carga el mes visible.** Igual que el tablero, no
  trae la tabla entera: pide las filas cuya columna de fecha cae dentro del
  mes en pantalla, con el mismo rango que ya resuelve `RangeQuery` del
  calendario de programaciones (RFC 0002). Cambiar de mes es una petición
  nueva con el rango siguiente, no una carga más grande.

- **D28 — Los filtros se generan a partir de las columnas activas de esa
  tabla, no de una lista fija.** Es la misma idea que ya usa la página
  pública de una lista para sus filtros (RFC 0010 D42), llevada al modelo de
  columnas dinámicas: la barra de filtros se calcula recorriendo
  `custom_table_columns` y le pone a cada una el control que le toca por
  tipo. Añadir una columna nueva añade su filtro solo; borrarla (D10) lo
  quita solo. Nadie mantiene una lista de filtros a mano.

  | Tipo de columna                                 | Filtro                                                              |
  | ----------------------------------------------- | ------------------------------------------------------------------- |
  | Texto corto, texto largo, correo, teléfono, URL | Contiene                                                            |
  | Número, moneda                                  | Entre (mínimo, máximo)                                              |
  | Fecha                                           | Entre (desde, hasta), con atajos («hoy», «esta semana», «este mes») |
  | Casilla                                         | Sí / no / cualquiera                                                |
  | Selección única, selección múltiple             | Elegir entre las opciones definidas                                 |
  | Contraseña                                      | Sin filtro (D29)                                                    |

- **D29 — La contraseña no se puede filtrar.** Ni siquiera «contiene»:
  filtrar un campo cifrado exigiría descifrar cada fila para compararla, y
  convertiría la barra de filtros en una vía para tantear un valor cifrado a
  fuerza bruta, byte a byte, sin ni siquiera pasar por la pantalla de revelar
  (D22). Es la misma familia de decisión que ya excluye la contraseña de la
  exportación por defecto (D23).

- **D30 — Los filtros viajan en la consulta de la página, no en una petición
  aparte.** `GET /tables/:id/rows` gana un parámetro `filters`, una lista de
  `{ columnKey, operator, value }` codificada en la URL y **validada contra
  las columnas reales de esa tabla** antes de tocar la base de datos: un
  filtro sobre una columna que no existe o con un operador que no le
  corresponde a su tipo se rechaza con 400, no se ignora en silencio. Por
  dentro, cada filtro se traduce a una condición con el mismo helper de D15
  (`database/json-field-sql.ts`), que ya sabe convertir cada tipo al SQL que
  le toca en cada motor.

### La forma

- **D31 — Una firma, no cinco.** Regla 9 §4: el elemento que se recuerda de
  esta sección es **la rejilla que se construye sola** — al añadir una columna,
  la cabecera crece con una transición breve y el formulario de la fila
  siguiente ya trae el campo nuevo en su sitio. No hay degradado de fondo ni
  iconografía decorativa (Regla 9 §2).

- **D32 — El color de la tabla no es un detalle: es lo que evita que la
  pantalla se quede en blanco.** Mismo principio que Listas (RFC 0010 D37,
  Regla 9 §2: «el color dice de qué se está hablando», no un degradado de
  relleno), pero aquí se lleva más lejos porque hay más superficie que
  cubrir —el tablón de `/tables`, la cabecera de la ficha, la cabecera de la
  cuadrícula, los carriles del tablero— y una tabla sin apenas datos es
  justo el caso donde más se nota el blanco:

  - El **tablón** (`/tables`) pinta cada tabla como un panel **relleno** con
    su acento (D5), no una tarjeta en `bg-card` con un borde: es el mismo
    criterio que ya usa el tablón de Listas.
  - La **cabecera de la ficha** lleva el acento de fondo, con el icono (D4)
    grande y el nombre encima, igual que la cabecera de una lista.
  - En la **cuadrícula**, la fila de cabeceras de columna lleva un tinte del
    acento —no blanco puro ni `bg-card` plano— y la columna por la que se
    está ordenando se marca con el acento sólido, no con una raya gris.
  - En el **tablero**, cada carril lleva el color de su propia opción (D28:
    `options[].color`, del mismo `ACCENT_PALETTE`), así que un tablero por
    estado se lee de un vistazo por color antes de leer una sola palabra.
  - El **estado vacío** —una tabla sin filas todavía— no es el genérico de
    `EmptyState` a secas: lleva el acento de la tabla de fondo y la
    invitación a crear la primera fila en su color, para que una tabla
    recién creada no se vea como un error de carga.

  Esta decisión es la respuesta directa al pedido de que estas pantallas «no
  tengan tanto blanco»: aquí se resuelve subiendo la ocupación del acento por
  tabla (D5), no añadiendo un degradado decorativo que la Regla 9 §2 prohíbe.

- **D33 — De `md` para arriba, tabla; por debajo, fichas.** Se reutiliza
  `<DataTable />` tal cual (Regla 5 §2): con columnas dinámicas, la tabla
  puede necesitar desplazamiento horizontal dentro de su propio contenedor
  —ya lo resuelve el componente—, y las fichas de móvil muestran la primera
  columna como título y el resto como pares etiqueta-valor, igual que ya
  hace cualquier ficha de la aplicación.

## Modelo de datos

### `custom_tables`

| Columna      | Tipo         | Notas                                      |
| ------------ | ------------ | ------------------------------------------ |
| `id`         | uuid         | `BaseEntity`                               |
| `church_id`  | uuid, índice | → `churches(id)` (D1)                      |
| `name`       | text         | «Asistencia a la lectura»                  |
| `slug`       | text         | Fijo desde el alta, como en listas (D7)    |
| `icon`       | text         | Clave de `TASK_ICON_CATALOG` (D4)          |
| `accent`     | text         | Token o `#rrggbb`, `accentSchema` (D5)     |
| `position`   | int          | Orden en la barra lateral                  |
| `is_active`  | bool         | Apagada sale de la barra, no se borra (D6) |
| `created_by` | text         | Identificador de Better Auth               |
|              |              | `created_at`, `updated_at`, `deleted_at`   |

Únicos, planos: `(church_id, slug)` y `(church_id, name)` — el mismo patrón
que `lists` y `gifts`.

### `custom_table_columns`

| Columna     | Tipo                  | Notas                                                                |
| ----------- | --------------------- | -------------------------------------------------------------------- |
| `id`        | uuid                  |                                                                      |
| `table_id`  | uuid, índice          | → `custom_tables(id)`, `ON DELETE CASCADE`                           |
| `key`       | text                  | Estable desde el alta, como el `slug` de una lista (D7)              |
| `label`     | text                  | Lo que se ve; se renombra libremente                                 |
| `type`      | text                  | Uno de los doce tipos («Los tipos de columna»)                       |
| `position`  | int                   | Orden de la columna (D8)                                             |
| `required`  | bool                  | Si el formulario exige un valor                                      |
| `options`   | text (json), nullable | Para selección única/múltiple: `[{ value, label, color? }]`          |
| `config`    | text (json), nullable | Ajustes propios del tipo: decimales, moneda, si la fecha lleva hora… |
| `is_active` | bool                  | Borrado lógico; no se pierde el valor en las filas (D10)             |
|             |                       | `created_at`, `updated_at`                                           |

Único: `(table_id, key)`.

### `custom_table_rows`

| Columna      | Tipo                | Notas                                            |
| ------------ | ------------------- | ------------------------------------------------ |
| `id`         | uuid                |                                                  |
| `table_id`   | uuid, índice        | → `custom_tables(id)`, `ON DELETE CASCADE`       |
| `data`       | text (json)         | `{ [columnKey]: valor }`, validado con zod (D13) |
| `created_by` | text                |                                                  |
| `created_at` | timestamp, índice   | Orden por defecto (D14)                          |
| `updated_at` | timestamp           |                                                  |
| `deleted_at` | timestamp, nullable |                                                  |

Índice compuesto `(table_id, created_at DESC)`: es la consulta de la página
por defecto.

### `custom_table_views`

| Columna       | Tipo           | Notas                                            |
| ------------- | -------------- | ------------------------------------------------ |
| `id`          | uuid           |                                                  |
| `table_id`    | uuid, índice   | → `custom_tables(id)`, `ON DELETE CASCADE`       |
| `name`        | text           | «Por estado», «Este mes»                         |
| `type`        | text           | `grid` \| `kanban` \| `calendar` (D25)           |
| `group_by`    | text, nullable | La `key` de la columna de selección, en `kanban` |
| `date_column` | text, nullable | La `key` de la columna de fecha, en `calendar`   |
| `filters`     | text (json)    | `[{ columnKey, operator, value }]` (D28, D30)    |
| `sort_by`     | text, nullable | `key` de la columna; nulo ⇒ `created_at` (D14)   |
| `sort_order`  | text           | `asc` \| `desc`                                  |
| `position`    | int            | Orden de las pestañas de vista                   |
|               |                | `created_at`, `updated_at`                       |

La vista de cuadrícula por defecto **no tiene fila**: se sintetiza en el
cliente (`type: 'grid'`, sin filtros) y no se puede borrar (D24). Borrar la
tabla se lleva sus vistas por `ON DELETE CASCADE`, sin borrado lógico —una
vista sin su tabla no significa nada, a diferencia de una fila de datos.

### Lo que se comparte

En `packages/shared/src/schemas/custom-tables.ts`: `customTableSchema`,
`customTableColumnSchema`, `columnTypeSchema` (los doce tipos, en inglés como
`ListVisibility`: son internos y la interfaz los traduce), y los esquemas de
creación y edición de tabla, columna y fila. En `custom-table-row-value.ts`,
un validador **por tipo de columna**: la forma que valida un `text` no es la
que valida un `number` ni la que valida un `single_select` con sus opciones
vigentes — es el mismo espíritu que ya separa `publicListSchema` del resto
(RFC 0010 §6.7): cada forma se valida con el esquema que le toca, nunca con
`unknown` suelto.

## Los tipos de columna

| Tipo               | Clave interna   | Control en el formulario                            | Notas                                                              |
| ------------------ | --------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| Texto corto        | `text`          | `Input`                                             |                                                                    |
| Texto largo        | `long_text`     | `Textarea`                                          |                                                                    |
| Número             | `number`        | `Input type=number`                                 | `config.decimals`                                                  |
| Moneda             | `currency`      | `Input type=number` con símbolo                     | `config.currency` (ISO 4217)                                       |
| Casilla            | `checkbox`      | `Checkbox`                                          | Sí/no                                                              |
| Fecha              | `date`          | `Input type=date`, o `datetime-local` si lleva hora | `config.includeTime`; reutiliza `isoDateSchema`/`reminderAtSchema` |
| Selección única    | `single_select` | Radios (≤6 opciones) o `combobox-listbox` (D11)     |                                                                    |
| Selección múltiple | `multi_select`  | Casillas (≤6) o combobox multi (D11)                |                                                                    |
| Correo             | `email`         | `Input type=email`                                  | Formato validado                                                   |
| Teléfono           | `phone`         | `Input type=tel`                                    |                                                                    |
| URL                | `url`           | `Input type=url`                                    |                                                                    |
| Contraseña         | `password`      | `Input type=password` con botón de revelar          | Cifrado (D20–D23)                                                  |

## API

| Método | Ruta                               | Rol mínimo      | Descripción                                                             |
| ------ | ---------------------------------- | --------------- | ----------------------------------------------------------------------- |
| GET    | `/api/v1/tables`                   | `tables.view`   | Las tablas de la iglesia                                                |
| POST   | `/api/v1/tables`                   | `tables.manage` | Crea una tabla                                                          |
| GET    | `/api/v1/tables/:id`               | `tables.view`   | Ficha, con sus columnas                                                 |
| PATCH  | `/api/v1/tables/:id`               | `tables.manage` | Nombre, icono, color, estado                                            |
| DELETE | `/api/v1/tables/:id`               | `tables.manage` | Borrado lógico                                                          |
| POST   | `/api/v1/tables/:id/columns`       | `tables.manage` | Añade una columna                                                       |
| PATCH  | `/api/v1/tables/:id/columns/:cid`  | `tables.manage` | Renombra, cambia tipo u opciones (D9)                                   |
| PUT    | `/api/v1/tables/:id/columns/order` | `tables.manage` | El orden entero, de una vez (D8)                                        |
| DELETE | `/api/v1/tables/:id/columns/:cid`  | `tables.manage` | Borrado lógico de la columna (D10)                                      |
| GET    | `/api/v1/tables/:id/rows`          | `tables.view`   | Página de filas: `page`, `limit`, `sort`, `order`, `q`, `filters` (D30) |
| POST   | `/api/v1/tables/:id/rows`          | `tables.edit`   | Añade una fila                                                          |
| PATCH  | `/api/v1/tables/:id/rows/:rid`     | `tables.edit`   | Edita una fila                                                          |
| DELETE | `/api/v1/tables/:id/rows/:rid`     | `tables.edit`   | Borrado lógico de la fila                                               |
| GET    | `/api/v1/tables/:id/views`         | `tables.view`   | Las vistas guardadas de la tabla (D24)                                  |
| POST   | `/api/v1/tables/:id/views`         | `tables.manage` | Crea una vista de tablero o calendario                                  |
| PATCH  | `/api/v1/tables/:id/views/:vid`    | `tables.manage` | Cambia nombre, filtros u orden de la vista                              |
| DELETE | `/api/v1/tables/:id/views/:vid`    | `tables.manage` | Borra la vista (nunca la de cuadrícula)                                 |
| GET    | `/api/v1/tables/:id/export`        | `tables.view`   | Las filas, con la vista y los filtros activos (D23)                     |

Tres permisos, no dos: `tables.view`, `tables.edit` (añadir y editar filas, no
tocar la estructura) y `tables.manage` (crear tablas, tocar columnas). Separa
«quien lleva la asistencia cada domingo» de «quien decide qué columnas tiene
la tabla», que son personas distintas en la mayoría de las iglesias.

## Interfaz

- **Web**:
  - `/tables` — el tablón, un panel **relleno** por tabla, con su acento
    (D32), como `/lists`.
  - `/tables/:slug` — la ficha: cabecera con acento de fondo (D32), pestañas
    de vista (cuadrícula + las guardadas, D24), barra de filtros calculada
    sobre las columnas activas (D28), la vista elegida, botón de exportar.
  - Un diálogo de columnas: lista arrastrable, con «Añadir columna» al pie.
  - Un formulario de fila, generado a partir de las columnas activas, en su
    orden — el mismo patrón de «montar con `key` cuando los datos llegan
    tarde» que ya usa `ProphecyForm` (CLAUDE.md), para editar una fila
    existente.
  - Un diálogo de vista nueva: nombre, tipo (solo se ofrecen los que la tabla
    puede soportar, D25) y, según el tipo, la columna de agrupación o de
    fecha.
- **Móvil**: fuera de alcance (ver «Fuera de alcance»).
- Textos nuevos en `packages/i18n`, sección `tables.*`, con `nav.tables` para
  la barra lateral.

### Claves i18n nuevas (referencia; las seis se completan al implementar)

| Clave                            | es                                                         |
| -------------------------------- | ---------------------------------------------------------- |
| `nav.tables`                     | Tablas                                                     |
| `tables.title`                   | Tablas                                                     |
| `tables.newTable`                | Nueva tabla                                                |
| `tables.newColumn`               | Nueva columna                                              |
| `tables.newRow`                  | Nueva fila                                                 |
| `tables.columnType.text`         | Texto corto                                                |
| `tables.columnType.longText`     | Texto largo                                                |
| `tables.columnType.number`       | Número                                                     |
| `tables.columnType.currency`     | Moneda                                                     |
| `tables.columnType.checkbox`     | Casilla                                                    |
| `tables.columnType.date`         | Fecha                                                      |
| `tables.columnType.singleSelect` | Selección única                                            |
| `tables.columnType.multiSelect`  | Selección múltiple                                         |
| `tables.columnType.email`        | Correo                                                     |
| `tables.columnType.phone`        | Teléfono                                                   |
| `tables.columnType.url`          | URL                                                        |
| `tables.columnType.password`     | Contraseña                                                 |
| `tables.mismatch`                | No encaja con el tipo actual                               |
| `tables.exportPasswordWarning`   | Este archivo incluirá {{count}} contraseñas en texto claro |
| `tables.view.grid`               | Cuadrícula                                                 |
| `tables.view.kanban`             | Tablero                                                    |
| `tables.view.calendar`           | Calendario                                                 |
| `tables.newView`                 | Nueva vista                                                |
| `tables.filters.title`           | Filtros                                                    |
| `tables.filters.clear`           | Quitar filtros                                             |
| `tables.filters.contains`        | Contiene                                                   |
| `tables.filters.between`         | Entre                                                      |
| `tables.filters.today`           | Hoy                                                        |
| `tables.filters.thisWeek`        | Esta semana                                                |
| `tables.filters.thisMonth`       | Este mes                                                   |
| `tables.filters.noneForType`     | Este tipo de columna no se puede filtrar                   |

## Consideraciones

- **Privacidad**: una tabla puede llevar datos sensibles según lo que cada
  iglesia decida guardar en ella —de ahí el tipo contraseña y su cifrado
  (D20–D23)—. No hay publicación externa (ver «Fuera de alcance»): todo lo
  que hay en una tabla se queda dentro de la iglesia y de quien tenga
  `tables.view`.
- **Offline**: como el resto de pantallas de la iglesia, sin comportamiento
  especial sin conexión más allá de lo que ya da la PWA para lo ya cargado.
- **IA**: no usa el módulo `ai` de la API. Es dato estructurado que la persona
  introduce a mano.

## Alternativas descartadas

- **EAV.** Descartado por coste de escritura y de consulta (ver
  «Investigación»): cada fila de usuario serían N filas EAV, y filtrar por
  varias columnas a la vez son varios auto-`JOIN`.
- **Una tabla SQL real por tabla de usuario** (el enfoque de Baserow y
  NocoDB). Exige DDL dinámico, que no encaja con el patrón de migraciones
  fijas de TypeORM ni con el `DataSource` único del proyecto (CLAUDE.md), y
  paga un coste operativo —índices sobre la marcha, planes de consulta que se
  degradan— que no está justificado por el volumen real de una iglesia.
- **Tipo nativo `jsonb` de TypeORM en vez de `text` con JSON manual.** Se
  descarta por la misma razón que ya llevó a `List.publicFields` a ser
  `text`: el tipo nativo no se comporta igual en SQLite que en Postgres, y el
  proyecto ya tiene una convención asentada para esto (Regla 1: seguir el
  patrón que ya hay).
- **Paginación por cursor.** Es mejor a escala de millones de filas; a escala
  de una iglesia, la paginación por desplazamiento que ya usa el listado de
  creyentes da lo mismo con menos código nuevo y con la ventaja de «ir a la
  página X» y el total, que aquí sí importan (D17).
- **Radio y selección desplegable como dos tipos distintos.** Se descarta
  siguiendo a Airtable y Notion (D11): es la misma decisión —una lista de
  opciones— con dos formas de pintarse, no dos decisiones de modelado.
- **Hashear la contraseña** en vez de cifrarla. No sirve para el caso de uso:
  quien la escribe necesita volver a leerla, y un hash es de un solo sentido
  por diseño (D20).
- **Copiar el catálogo de vistas completo de Airtable** (con formulario,
  `rollup` y galería). Se para en cuadrícula, tablero y calendario (D25)
  porque son las tres que resuelven una pregunta real del problema de este
  RFC; añadir las demás sin un caso de uso concreto es la abstracción por si
  acaso que prohíbe la Regla 1.
- **Una lista fija de filtros por tabla, mantenida a mano.** Se descarta en
  favor de calcularla desde las columnas activas (D28), por el mismo motivo
  que ya decidió la página pública de una lista (RFC 0010 D42): una lista
  fija se desincroniza en cuanto alguien añade o borra una columna.
- **Un degradado o una ilustración de fondo para «quitar el blanco».** Es
  justo lo que la Regla 9 §2 nombra como relleno decorativo. Se resuelve
  subiendo la ocupación del acento por tabla (D32), que además informa —dice
  de qué tabla se está hablando— en vez de solo decorar.

## Preguntas abiertas

- **¿Hace falta un tipo «relación con creyentes»?** Es la pregunta más
  probable que llegue en cuanto esto se use de verdad — «asistencia» pide de
  forma natural enlazar cada fila con una persona de creyentes. Se ha dejado
  fuera a propósito (ver «Fuera de alcance») porque acoplarlo desde el
  principio habría cambiado el modelo entero; si llega, es una extensión
  sobre `custom_table_columns` con un tipo `believer_reference` que guarda un
  `believer_id` en vez de un valor plano.
- **¿Plantillas de tabla de serie?** Ver «Fuera de alcance»: sin datos de uso
  real, no hay base para elegir cuáles.
- **¿Un límite de tablas por iglesia?** Hoy no hay ninguno, igual que Listas.
  Si el volumen real lo pidiera, es un número en una constante.

## Criterios de aceptación

- [ ] Se crea una tabla con nombre, icono y color, y aparece como subentrada
      en la barra lateral (D2, D3).
- [ ] Se añaden columnas de los doce tipos, se reordenan arrastrando y se
      renombran sin perder ningún valor ya escrito (D7, D8).
- [ ] Cambiar el tipo de una columna con filas existentes no borra ningún
      valor; los que no encajan se marcan y siguen editables (D9).
- [ ] Borrar una columna oculta el dato en las filas existentes sin borrarlo
      (D10).
- [ ] Se añaden, editan y borran filas con el formulario generado a partir de
      las columnas activas.
- [ ] Las filas se cargan por páginas, con búsqueda y orden por columna, y el
      listado de creyentes sigue funcionando igual (Regla 1: sin regresión).
- [ ] Ordenar por una columna de tipo número o moneda ordena numéricamente, no
      alfabéticamente, en los dos motores (D15).
- [ ] Una columna de tipo contraseña se guarda cifrada, se oculta por defecto
      en tabla y formulario, y exportar avisa antes de incluirla en claro
      (D20–D23).
- [ ] Se crea una vista de tablero agrupada por una columna de selección
      única, y otra de calendario sobre una columna de fecha; ninguna de las
      dos se ofrece en una tabla que no tenga la columna que le hace falta
      (D25).
- [ ] Los carriles del tablero y el mes del calendario cargan solo lo que
      corresponde a ese carril o a ese mes, no la tabla entera (D26, D27).
- [ ] La barra de filtros de una tabla cambia sola al añadir o borrar una
      columna, sin tocar código (D28).
- [ ] Un filtro sobre una columna que no existe, o con un operador que no le
      corresponde a su tipo, se rechaza con 400 (D30).
- [ ] El tablón, la ficha, la cabecera de la cuadrícula y los carriles del
      tablero llevan el acento de la tabla o de la opción de forma visible;
      ninguna pantalla de esta sección se queda en blanco con pocos datos
      (D32).
- [ ] Los textos fijos de la pantalla están en los seis idiomas.
- [ ] La pantalla funciona en los dos temas y a 375 px, con el idioma más
      largo (Reglas 3 y 5).
- [ ] `pnpm check` y `pnpm test:e2e` pasan, con las migraciones probadas en
      SQLite y en Postgres (Regla 4).
