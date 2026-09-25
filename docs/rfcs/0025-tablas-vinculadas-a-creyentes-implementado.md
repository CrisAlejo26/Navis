# RFC 0025: Tablas vinculadas a creyentes

- **Estado**: Implementado en api y web. e2e de la API contra los dos motores
  (SQLite y Postgres) en 220/220; e2e de web con el selector y las celdas
  vinculadas.
- **Autor**: Cristian Alejandro Arroyave (con Claude)
- **Fecha**: 2026-09-24
- **Apps afectadas**: **api y web** (escritorio la hereda). Móvil, fuera de
  alcance — igual que el RFC 0021.
- **Depende de**: 0021 (tablas personalizadas, ya implementado) y 0003 (la
  entidad `believer`, que es de donde salen los datos).
- **Se parece a**: el RFC 0010 (Listas) en el gesto —añadir personas desde el
  listado de creyentes marcándolas—, pero llevado al modelo de columnas de la
  RFC 0021: aquí quien añade no copia datos, **enlaza**.

## Problema

La RFC 0021 lo dejó escrito en su sección de fuera de alcance: «Enlazar «quién
ha leído la Biblia» con la ficha de un creyente es una funcionalidad real y es
la siguiente pregunta que alguien va a hacer». Es la que llega ahora.

Hoy, quien quiere una tabla de creyentes —la lista de quién asistió al grupo
de oración, quién se apuntó al retiro, a quién llamar esta semana— tiene que
**reescribir a mano** los nombres, teléfonos y correos que ya están en la
base de datos. Y no una vez: cada tabla que monta vuelve a copiarlos. Cuando
a alguien le cambia el teléfono, hay que ir tabla por tabla.

Lo que pide el uso real es que una tabla personalizada pueda tomar sus filas
**del listado de creyentes** y, columna a columna, decidir qué dato de la
ficha rellena cada una —o ninguna, y se llena a mano—. Con un matiz que hay
que respetar: **cada tabla quiere una cosa distinta**. Una lleva solo los
nombres; otra el teléfono y el correo pero sin el nombre; y todas llevan
columnas propias que nadie va a rellenar por ti: una casilla de «ya avisé», un
texto de notas, una fecha.

## Alcance

Entra:

- Un ajuste por tabla: **vincular la tabla al listado de creyentes**. Es
  reversible y no toca las filas que ya hubiera.
- Con el ajuste puesto, el botón de «Nueva fila» pasa a ser **«Añadir
  creyentes»**: un buscador sobre el listado real, que trae los primeros
  **20** y un botón **«Ver más»** que va cargando más, con casillas para
  marcar varios y añadirlos de una vez —el mismo gesto que ya usa una lista
  (RFC 0010 D5), con búsqueda incluida para añadir a uno solo.
- **Un creyente, una vez por tabla.** Añadir a quien ya está dentro no
  duplica la fila: en el selector sale marcado y deshabilitado.
- En el mismo editor de columnas, cada columna gana un selector **«Rellenar
  con»**: un campo del creyente —nombre completo, teléfono, correo, sede,
  fecha de llegada…— o **«A mano»**, que es como están todas hoy.
- Las columnas vinculadas se **rellenan solas al añadir al creyente**, y
  muestran siempre el dato vivo: si le cambia el teléfono a alguien en su
  ficha, cambia en todas las tablas en las que aparece. Se pueden editar
  filas y columnas a mano igual que hasta ahora.
- Buscar, ordenar, filtrar y exportar **incluidas las columnas vinculadas**,
  en las tres vistas (cuadrícula, tablero, calendario) y en los cinco
  formatos de exportación.

### Fuera de alcance

- **La app móvil** (igual que el RFC 0021).
- **Vincular con cualquier otra cosa** que no sea el listado de creyentes:
  tareas, otra tabla, una labor. Notion tiene «relation» genérico; aquí el
  único origen que el problema pide es la gente de la iglesia, y un catálogo
  cerrado es lo que permite que la configuración sea un desplegable y no un
  constructor.
- **Varios creyentes por fila.** La relación es una por fila: una fila es una
  persona. El caso contrario (una fila con varios creyentes, tipo «grupo
  familiar») es otro modelo y otro RFC.
- **Etiquetas de creyentes, dones y labores como campos vinculables.** Son
  listas, no valores: traerlas convertiría cada celda en una subtabla. Si
  algún día se piden, son una extensión sobre el catálogo de campos.
- **Crear un creyente desde el selector.** El selector busca en el listado;
  crear fichas es trabajo de la sección de creyentes.
- **Historial o auditoría del dato vinculado.** La celda muestra lo que la
  ficha dice hoy, como el resto de la aplicación.

## Investigación: cómo lo resuelven otros

**Airtable** es la referencia que resuelve exactamente esto, y su manual
responde las dos preguntas que este RFC tiene que responder:

- **El valor vinculado es vivo, no una copia.** Un campo _lookup_ «trae
  información de una tabla a otra sin duplicarla, de forma que tu información
  está siempre al día en todas las tablas». Y su documentación de
  sincronización insiste en el mismo principio desde el otro lado: hay **una
  tabla fuente** y el resto mira hacia ella. Copiar el teléfono al añadir al
  creyente sería una _sync_ a mano sin mecanismo de sync: la siguiente
  actualización de la ficha deja los datos viejos en la tabla y nadie se
  entera. La conclusión para Navis es directa: la fila guarda el **enlace**,
  la celda se calcula al leer.
- **El picker de enlazar es búsqueda + selección múltiple**, con quien ya
  está enlazado visible pero no seleccionable. Es también el patrón que ya
  usa la propia Navis para las listas (`AddMembersDialog`, RFC 0010 D5):
  reutilizarlo no es copiar a otro producto, es seguir la convención interna
  (Regla 1).

**Notion** añade el matiz de configuración: la propiedad de relación se
declara **una vez, en la tabla**, y las demás columnas deciden individualmente
si miran al registro enlazado (con `lookup`) o se quedan como texto propio. Es
exactamente la separación que pide este RFC: el **origen** es un ajuste de la
tabla; el **relleno**, un ajuste de cada columna.

**Los directorios de productos SaaS** (la pantalla de audiencia de Delphi, la
de miembros de cualquier panel de administración) coinciden en el detalle que
exporta del selector: la gente se **marca y se añade en bloque**, con la
pertenencia ya existente señalada en el sitio —marcado y deshabilitado, nunca
escondido—, que es la decisión que ya tomó `AddMembersDialog` y se mantiene.

### Conclusiones para Navis

- **Enlace, no copia**: la fila guarda el identificador; los valores de las
  columnas vinculadas se calculan al leer (D5).
- **El selector ya existe en espíritu**: búsqueda + casillas + «quien ya está
  dentro sale marcado», con la única pieza nueva de un «Ver más» (D8).
- **La configuración vive donde se edita cada cosa**: el origen, en la ficha
  de la tabla; el relleno, en cada columna (D3).

## Solución propuesta

Sobre el modelo de la RFC 0021 —tablas, columnas, filas con JSON— tres
cambios pequeños y uno de fondo:

```
custom_tables            — gana `source`: nulo | 'believers'
  └── custom_table_columns — gana `believer_field`: nulo | campo del creyente
  └── custom_table_rows    — gana `believer_id`: uuid, nulo
```

1. **Activar el enlace** en la ficha de la tabla (`source = 'believers'`).
   «Nueva fila» se convierte en «Añadir creyentes».
2. **Vincular columnas**: en el editor de cada columna aparece «Rellenar con».
   Nada cambia hasta que alguien añada creyentes: las filas ya escritas
   siguen igual.
3. **Añadir creyentes**: selector con búsqueda, página de 20, «Ver más», y
   «Añadir (n)». Cada creyente añadido crea una fila; las columnas vinculadas
   nacen llenas, las demás vacías.
4. La celda vinculada se pinta como las demás pero no se edita: su valor es
   el de la ficha, ahora mismo.

## Decisiones tomadas

### La configuración

- **D1 — El enlace es un ajuste de la tabla, no un tipo nuevo de tabla.**
  `custom_tables.source`, texto nulo o `'believers'`. Una tabla sin enlace se
  comporta exactamente como hoy; una con enlace cambia solo el gesto de
  añadir filas. Apagarlo no borra nada: las filas enlazadas conservan su
  `believer_id` (invisible mientras no haya columnas vinculadas) y las
  columnas vinculadas vuelven a ser manuales.

- **D2 — El relleno es un ajuste de cada columna, no de la tabla.**
  `custom_table_columns.believer_field`, texto nulo o la clave del campo. Es
  lo que hace posible el caso que motiva esto: una tabla con solo el nombre,
  otra con teléfono y correo sin el nombre, y columnas a mano conviviendo con
  vinculadas en la misma tabla. El selector vive en el editor de la columna
  (`ColumnForm`), que ya es el sitio donde se decide todo lo demás de una
  columna.

- **D3 — El catálogo de campos vinculables es cerrado y va en `shared`.**
  No se refleja la entidad: se declara una lista explícita con el campo SQL
  del que sale cada valor y el tipo de columna con el que es compatible. Si
  mañana hay que añadir uno, se añade ahí y lo heredan API e interfaz:

    | Campo                 | De dónde sale                                   | Tipos de columna que lo aceptan |
    | --------------------- | ----------------------------------------------- | ------------------------------- |
    | `fullName`            | `first_name                                     |                                 | ' ' |     | last_name` | text |
    | `firstName`           | `first_name`                                    | text                            |
    | `lastName`            | `last_name`                                     | text                            |
    | `phone`               | `phone`                                         | phone, text                     |
    | `email`               | `email`                                         | email, text                     |
    | `status`              | `status` (la etiqueta, traducida en el cliente) | text                            |
    | `congregation`        | nombre de la sede, por `congregation_id`        | text                            |
    | `arrivedAt`           | `arrived_at` (día de calendario)                | date, text                      |
    | `lastNoteAt`          | `last_note_at`                                  | date, text                      |
    | `arrivalSite`         | `arrival_site`                                  | text                            |
    | `bibleReadings`       | `bible_readings`                                | number, text                    |
    | `vivenciasReadings`   | `vivencias_readings`                            | number, text                    |
    | `bibleInstituteTimes` | `bible_institute_times`                         | number, text                    |

    Las columnas de casilla, selección, URL, contraseña, moneda y texto largo
    no aceptan ningún campo: no hay en la ficha un dato que tenga sentido
    ahí, y no ofrecerlo evita un vínculo que se rompería al cambiar el tipo.

- **D4 — El tipo manda sobre el campo, no al revés.** El selector «Rellenar
  con» solo ofrece los campos compatibles con el tipo de la columna (D3). Si
  la columna es de teléfono, la lista ofrece «Teléfono»; si es texto, ofrece
  todos. No hay coerción de tipos en el servidor: el par campo-tipo válido se
  valida una vez en `shared` y se cumple en los dos lados.

- **D5 — La celda vinculada es viva: no se guarda en la fila.** Como en el
  `lookup` de Airtable («sin duplicar el dato, para que siempre esté al
  día»). La fila solo guarda `believer_id` y el valor manual de las columnas
  no vinculadas; el valor vinculado se calcula al leer la página, en el
  servicio (D6). Ventajas que pagan la decisión: cambiar el teléfono en la
  ficha actualiza todas las tablas sin código de sincronización; no hay dos
  copias que diverjan; y desvincular una columna no deja datos huérfanos,
  porque nunca hubo dato copiado.

- **D6 — Vincular una columna con valores escritos a mano no borra nada, y
  avisa.** Los valores que hubiera en el JSON de cada fila **se quedan**,
  quietos, pero dejan de mostrarse mientras la columna esté vinculada —el
  mismo trato que ya da D10 a la columna borrada—. Si se desvincula, vuelven
  a verse. El editor de columnas enseña el aviso al vincular; el servidor
  nunca borra la clave del JSON.

- **D7 — Filas ya escritas, sin creyente, sobreviven al enlace.** Una tabla
  puede haberse usado a mano antes de vincularla. Sus filas siguen ahí, con
  sus valores; sus celdas vinculadas se ven vacías (no hay de dónde
  sacarlas). Pueden borrarse, no editarse en las columnas vinculadas
  —que siguen sin dato—, y en la cuadrícula llevan la misma marca de
  «creyente retirado» que una fila cuyo creyente se dio de baja (D9).

### Añadir creyentes

- **D7 — Añadir es un lote marcado a mano, no un filtro que se rellena
  solo.** Igual que en las listas (RFC 0010 D5): se filtra o se busca, se
  marca a quien interesa —uno o veinte—, y «Añadir (n)» crea una fila por
  creyente. La pertenencia es la decisión de quien usa la tabla; el filtro es
  la herramienta para encontrar a la gente.

- **D8 — El selector pagina en 20 con «Ver más»**, como pide el caso de uso:
  el catálogo de una iglesia cabe en pantallas, pero no en una lista
  interminable. Es `GET /believers` con `page`/`limit`, acumulando páginas en
  el cliente con un `useInfiniteQuery` nuevo de `packages/api-client`
  —no existe todavía y es el sitio que le toca (Regla 1)—. Buscar resetea a
  la primera página: buscar y hojear son dos gestos que no se mezclan.

- **D9 — Un creyente no se repite en una tabla.** Índice único parcial
  `(table_id, believer_id)` con `WHERE deleted_at IS NULL` —el mismo patrón
  de los únicos parciales que ya usan `custom_tables` y `lists`—. El lote que
  llega con alguien repetido no falla: salta a los que ya están y crea el
  resto. En el selector, quien ya está dentro sale con su casilla marcada y
  deshabilitada, igual que en `AddMembersDialog`.

- **D10 — Quitar de la tabla es borrar la fila** (borrado lógico, como
  siempre). No hay «desenlazar conservando la fila»: si la fila existía solo
  por el creyente, borrarla es lo que se espera; si tenía columnas a mano
  escritas, el borrado ya pide confirmación como cualquier fila.

### Leer y escribir con el enlace puesto

- **D11 — La página de filas overlay las columnas vinculadas al devolverla.**
  La consulta de la página sigue siendo la de la tabla sola (D18 de la RFC
  0021, sin relaciones cargadas); después, para la página en memoria, se
  piden los creyentes de esos `believer_id` —de la iglesia, no borrados— y el
  mapper escribe el valor calculado bajo la `key` de cada columna vinculada,
  como si fuera un valor más del JSON. El cliente no distingue una celda
  vinculada de una manual salvo porque la columna viene marcada —lo que hace
  que la cuadrícula, el tablero, el calendario y el formulario de fila
  funcionen con una sola noción de «fila» (Regla 1).

- **D12 — Ordenar, filtrar y buscar por una columna vinculada se resuelve
  contra `believers`, no contra el JSON.** Con expresiones por motor que van
  a un helper nuevo junto a `database/json-field-sql.ts`:

    - **Orden**: una subconsulta escalar correlacionada en el `ORDER BY` —
      `(SELECT b.phone FROM believers b WHERE b.id = row.believer_id AND
b.deleted_at IS NULL)`—, con el `CAST` que pida el tipo (D15 de la RFC
      0021). La consulta de la página sigue tocando solo `custom_table_rows`
      en el `FROM`, con su `limit`/`offset`, y la trampa de `DISTINCT` de
      Postgres no llega a plantearse.
    - **Filtro**: `EXISTS (SELECT 1 FROM believers b WHERE b.id =
row.believer_id AND b.deleted_at IS NULL AND <condición>)`, con la
      condición traducida por el tipo de columna igual que los filtros de
      JSON.
    - **Búsqueda**: el `LIKE` de la fila (D16) **o** el término contra los
      campos de texto del creyente —`first_name`, `last_name`,
      `search_name`, `phone`, `email`—, dentro de un `EXISTS`. Buscar a
      «Juan» tiene que encontrarlo aunque el nombre esté en una columna
      vinculada.

    Volumen:cientos o pocos miles de filas por tabla — el argumento que ya
    justificó la paginación por desplazamiento en la RFC 0021 justifica
    aquí las subconsultas correlacionadas, sin índices ni planes nuevos.

- **D13 — Escribir en una celda vinculada se rechaza con 400.** El endpoint
  de fila valida, si la tabla está enlazada, que el cuerpo no toque la `key`
  de ninguna columna vinculada. Y si está enlazada, una fila nueva sin
  `believer_id` también se rechaza: con el enlace puesto, las filas entran
  por el selector. Es el mismo contracto que ya tiene el filtro que se
  valida contra las columnas reales (D30 de la RFC 0021): un dato imposible
  se rechaza, no se ignora.

- **D14 — La fila enlazada trae su creyente para poder abrirle la ficha.**
  El `CustomTableRowView` gana `believer: { id, name, photoKey? } | null`.
  La cuadrícula lo usa para el gesto que lo pide todo: el nombre vinculado
  es un enlace a la ficha del creyente. Para quien lleva la tabla es el
  camino corto a «¿quién es este?», y no cuesta un endpoint: sale del mismo
  lote de D11.

- **D15 — El creyente dado de baja deja la fila viva y marcada.** El borrado
  de creyentes es lógico y la fila no se toca: sus celdas vinculadas quedan
  vacías y la cuadrícula marca la fila con un aviso discreto —«creyente
  retirado»—, con la acción de quitarla de la tabla a un clic. Es lo
  contrario de la tentación de limpiar en cascada: quitar gente de una tabla
  de registro por una baja en la ficha sería perder el dato que la tabla
  estaba guardando (sus casillas, sus notas a mano).

### La forma

- **D16 — La firma de esta pieza es «la fila que llega llena».** Al añadir
  creyentes, las celdas vinculadas aparecen con una transición breve de
  entrada (opacidad y un desplazamiento de un par de píxeles), columna a
  columna con un escalonado de decenas de milisegundos: se ve que la tabla
  se rellenó sola. Sin degradados ni colores nuevos: el acento de la tabla
  (D32 de la RFC 0021) sigue siendo el único color, y el gesto respeta
  `prefers-reduced-motion` con la entrada que ya usan el resto de filas.

- **D17 — La celda vinculada se distingue por el gesto, no por una marca
  permanente.** En reposo se ve como cualquier celda; al pasar el ratón,
  quien es del enlace muestra el subrayado del enlace a la ficha (D14). Una
  insignia fija en cada celda —«vinculado»— multiplicaría el ruido de la
  cuadrícula para un dato que solo importa al editar: en el formulario de
  fila, el campo vinculado se enseña deshabilitado, con el valor actual y el
  texto «se rellena desde la ficha del creyente».

## Modelo de datos

### `custom_tables` (columna nueva)

| Columna  | Tipo       | Notas                                                                      |
| -------- | ---------- | -------------------------------------------------------------------------- |
| `source` | text, nulo | Nulo ⇒ tabla a mano, como hoy; `'believers'` ⇒ filas desde el listado (D1) |

### `custom_table_columns` (columna nueva)

| Columna          | Tipo       | Notas                                                          |
| ---------------- | ---------- | -------------------------------------------------------------- |
| `believer_field` | text, nulo | Campo del catálogo con el que se rellena, o nulo = a mano (D2) |

### `custom_table_rows` (columna e índice nuevos)

| Columna       | Tipo       | Notas                                                                                                             |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `believer_id` | uuid, nulo | Referencia **sin clave ajena**: se borra en lógico y la fila con sus columnas a mano sigue teniendo sentido (D15) |

Índice único parcial `(table_id, believer_id)` con
`WHERE deleted_at IS NULL AND believer_id IS NOT NULL`: un creyente, una vez
por tabla, sin contar las filas borradas (D9). Los `believer_id` nulos —
filas hechas a mano antes del enlace— quedan fuera.

### Lo que se comparte

En `packages/shared/src/schemas/custom-tables.ts`:

- `tableSourceSchema` (`null | 'believers'`) dentro de
  `customTableSchema` y de su esquema de edición.
- `believerFieldSchema`: el catálogo cerrado de D3, con su mapa
  `BELIEVER_FIELD_COLUMN_TYPES` para que la interfaz sepa qué ofrecer a cada
  tipo de columna y el servidor rechace el par imposible.
- Los esquemas de creación y edición de columna ganan `believerField`
  (nulo o clave del catálogo), validado contra D3.
- El esquema de fila gana `believerId` (uuid, opcional); el de añadir
  creyentes, `believerIds` (lista no vacía, con techo).
- `CustomTableRowView` gana `believer: { id, name, photoKey? } | null`.

## API

Cambios sobre las rutas que ya existen y un endpoint nuevo:

| Método | Ruta                              | Rol mínimo      | Cambio                                                                                 |
| ------ | --------------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| PATCH  | `/api/v1/tables/:id`              | `tables.manage` | Acepta `source` (D1)                                                                   |
| PATCH  | `/api/v1/tables/:id/columns/:cid` | `tables.manage` | Acepta `believerField`, validado contra el catálogo y el tipo (D4)                     |
| GET    | `/api/v1/tables/:id/believers`    | `tables.view`   | **Nuevo**: los identificadores ya enlazados, para marcarlos en el selector (D9)        |
| POST   | `/api/v1/tables/:id/believers`    | `tables.edit`   | **Nuevo**: `{ believerIds }` — crea las filas que falten, salta las ya dentro (D7, D9) |
| GET    | `/api/v1/tables/:id/rows`         | `tables.view`   | Devuelve las columnas vinculadas resueltas y `believer` por fila (D11, D14)            |
| POST   | `/api/v1/tables/:id/rows`         | `tables.edit`   | Con el enlace puesto, exige `believerId` y rechaza `data` de columnas vinculadas (D13) |
| PATCH  | `/api/v1/tables/:id/rows/:rid`    | `tables.edit`   | Ídem: rechaza tocar la `key` de una columna vinculada (D13)                            |
| GET    | `/api/v1/tables/:id/export`       | `tables.view`   | Sale con las columnas vinculadas resueltas, como en la cuadrícula (D11)                |

El `GET /believers` que ya existe sirve tal cual para el selector: `q`,
`page`, `limit` y los filtros que ya trae. No hay endpoint nuevo de catálogo.

### Lo que se reutiliza sin copiar

- `AddMembersFilters` (sede, estado, labor, don) para el selector —con
  reubicación a `components/believers/` si hace falta para no colgarlo de
  las listas (Regla 1).
- `BelieverPhoto`, `believerName`, el patrón de casillas deshabilitadas de
  `AddMembersDialog` (D9).
- `Paginated`, `paginationQuerySchema`, `DEFAULT_PAGE_SIZE` y
  `MAX_PAGE_SIZE` para el «Ver más» (D17 de la RFC 0021).
- `json-field-sql.ts` como familia para el helper nuevo de D12.

## Interfaz

- **Web**:
    - Ficha de tabla (`/tables/:slug`): el botón de nueva fila pasa a
      «Añadir creyentes» cuando la tabla está enlazada; abre el selector.
    - **Diálogo «Añadir creyentes»** (`components/tables/`): búsqueda con
      `SearchField`, filtros reutilizados, lista de 20 con **«Ver más»** al
      pie, casillas —marcadas y deshabilitadas si ya están dentro— y botón
      «Añadir (n)» pegado a la acción, abajo (Regla 5 §4).
    - Editor de tabla (`TableForm`): sección «Filas desde creyentes» con el
      interruptor (D1) y el texto que explica qué cambia.
    - Editor de columna (`ColumnForm`): «Rellenar con», solo si la tabla está
      enlazada, con los campos compatibles (D3) y el aviso de valores
      escritos a mano (D6).
    - Cuadrícula: celda vinculada enlaza a la ficha del creyente (D14); fila
      con creyente retirado lleva su aviso (D15); formulario de fila enseña
      los campos vinculados deshabilitados (D17).
    - Las tres vistas y la exportación: sin cambios de estructura, ahora con
      las columnas vinculadas resueltas (D11).
- **Móvil**: fuera de alcance.
- Textos nuevos en `packages/i18n`, sección `tables.*`.

### Claves i18n nuevas (referencia; las seis se completan al implementar)

| Clave                       | es                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `tables.linkBelievers`      | Filas desde creyentes                                                                 |
| `tables.linkBelieversHint`  | Las filas salen del listado de creyentes de la iglesia                                |
| `tables.addBelievers`       | Añadir creyentes                                                                      |
| `tables.searchBeliever`     | Buscar en el listado de creyentes                                                     |
| `tables.seeMore`            | Ver más                                                                               |
| `tables.boundTo`            | Rellenar con                                                                          |
| `tables.boundManual`        | A mano                                                                                |
| `tables.bindOverwriteHint`  | Los valores escritos a mano en esta columna dejarán de verse hasta que la desvincules |
| `tables.boundCellHint`      | Se rellena desde la ficha del creyente                                                |
| `tables.believerGone`       | Creyente dado de baja                                                                 |
| `tables.alreadyInTable`     | Ya está en la tabla                                                                   |
| `tables.boundFieldRequired` | Esa columna está vinculada y no se edita a mano                                       |

## Consideraciones

- **Privacidad**: las columnas vinculadas enseñan lo mismo que la ficha del
  creyente enseña a quien tiene `believers.view` dentro de la iglesia —el
  teléfono y el correo ya viajan por la aplicación—. No amplía quién ve qué:
  solo quién tiene `tables.view` ve su tabla, y lo que en ella esté vinculado
  viene del catálogo al que ya podía entrar. La contraseña de la tabla (D20
  de la RFC 0021) no se vincula a nada y sigue excluida por defecto.
- **Offline**: como el resto de la sección, sin comportamiento especial.
- **IA**: no usa el módulo `ai`.

## Pasos de implementación

1. **`packages/shared`**: `tableSourceSchema`, `believerFieldSchema`,
   `BELIEVER_FIELD_COLUMN_TYPES`, esquemas de tabla/columna/fila/añadir
   creyentes, y `believer` en `CustomTableRowView`.
2. **API — entidades y migración**: columnas e índice nuevo, con la
   migración a mano (las entidades se listan sin globs, CLAUDE.md).
3. **API — servicio de página**: overlay de D11, helper de D12 con sus tests
   contra los dos motores, guardas de escritura de D13.
4. **API — endpoints**: `believers` en lote, `source` y `believerField` en
   los PATCH, export resuelto.
5. **`packages/api-client`**: `useAddTableBelievers`, el `useBelieversInfinite`
   para el «Ver más», y `believerField` en las mutaciones de columna.
6. **Web — configuración**: interruptor en la ficha, «Rellenar con» en el
   editor de columna.
7. **Web — selector**: `AddBelieversDialog` con búsqueda, filtros, «Ver más»
   y lote.
8. **Web — cuadrícula y formulario**: celda enlazada, campos
   deshabilitados, aviso de baja.
9. **Animación**: la entrada escalonada de D16, con
   `prefers-reduced-motion`.
10. **i18n**: las claves de la tabla, en los seis locales, con `es.ts`
    definiendo el tipo.
11. **Tests** — ver plan de pruebas.

## Plan de pruebas

- **Unidad (`pnpm --filter @navis/api test`)**: el catálogo de campos y sus
  tipos compatibles; el overlay de D11 (fila con y sin creyente, creyente
  borrado); las condiciones de orden y filtro de D12 contra SQLite **y**
  Postgres —la trampa del `IN ('')` y la de los dos motores viven aquí—.
- **e2e de la API (`pnpm test:e2e`, los dos motores)**: activar y apagar el
  enlace; vincular y desvincular una columna con valores a mano (no se
  pierden, D6); añadir creyentes en lote con repetidos (D9); buscar, ordenar
  y filtrar por columna vinculada (D12); exportar con vinculadas (D11);
  rechazar escritura en celda vinculada (D13); fila que sobrevive a la baja
  del creyente (D15).
- **Web (`pnpm --filter @navis/web test`)**: el diálogo (busca, marca,
  «Ver más», deshabilita a los que ya están); el «Rellenar con» solo ofrece
  lo compatible y avisa al vincular; la cuadrícula no manda edición de celda
  vinculada.
- **e2e web**: un spec que enlaza una tabla, añade dos creyentes, comprueba
  las celdas llenas y la exportación — con el stub de
  `apps/web/e2e/servidor.ts` **actualizado** con `source` y
  `believerField`, que si no las piezas simplemente no se pintan (la trampa
  ya escrita en CLAUDE.md).
- **Antes de dar algo por terminado**: `pnpm check` y `pnpm test:e2e`, y en
  los dos temas, en móvil y escritorio, y en dos idiomas.

## Criterios de aceptación

- [x] Una tabla se vincula al listado de creyentes desde su ficha, y se
      desvincula sin perder filas ni valores escritos a mano.
- [x] El selector trae 20 creyentes con búsqueda y filtros, y «Ver más» carga
      las siguientes 20; buscar a alguien y añadirlo solo a él funciona.
- [x] Un creyente no aparece dos veces en la misma tabla, ni desde el lote ni
      desde la búsqueda.
- [x] Cada columna se configura en su editor: campo del creyente compatible
      con su tipo, o «A mano».
- [x] Las columnas vinculadas nacen llenas al añadir al creyente y siguen el
      dato vivo de la ficha.
- [x] Los valores escritos a mano antes de vincular sobreviven y vuelven al
      desvincular.
- [x] Buscar, ordenar, filtrar y exportar funcionan sobre columnas
      vinculadas, en cuadrícula, tablero y calendario.
- [x] Escribir en una celda vinculada se rechaza y se explica en la interfaz.
- [x] La fila marcada como «creyente dado de baja» se distingue y se puede
      quitar.
- [x] El nombre vinculado enlaza a la ficha del creyente.
- [x] Los seis idiomas compilan y la entrada animada respeta
      `prefers-reduced-motion`.
