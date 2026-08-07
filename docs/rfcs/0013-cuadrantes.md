# RFC 0013: Cuadrantes

- **Estado**: Borrador
- **Fecha**: 2026-08-07
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). Móvil, no — mismo criterio que en el resto de secciones de
  iglesia (RFC 0002 §8.7, RFC 0003 §7.9): el tipo, el esquema y los hooks se
  escriben compartidos; el JSX de una rejilla editable en React Native es otra
  pantalla y otro documento.
- **Depende de**: 0003 (creyentes: quiénes son las filas), 0008 (la iglesia
  como espacio de trabajo, permisos por rol) y, para exportar, 0009.
- **Se parece a**: el RFC 0010 en la forma de la barra lateral —subentradas,
  una por tabla, igual que las listas y los calendarios— y se separa de él en
  lo importante: **esto no sale a internet**. Es una herramienta de trabajo
  interno, no una publicación, y eso simplifica de raíz todo lo que en 0010
  ocupa media docena de decisiones (visibilidad, accesos, tarjeta de
  WhatsApp...).

## Problema

Cada iglesia lleva cuentas que no son ni el calendario, ni la ficha de un
creyente, ni una lista de personas para un cartel: **tablas de seguimiento**.
Quién ha ido a cada clase del instituto bíblico, quién ha leído qué libro este
año, quién estuvo en el retiro de marzo, cuántas veces ha pasado cada anciano
por la ronda de visitas. Hoy eso vive en un Excel aparte, con las columnas que
alguien decidió un día y que nadie más entiende, desconectado de quién es cada
persona en la aplicación —si cambia de teléfono, el Excel no se entera—.

La pregunta que esta sección tiene que responder es **«¿qué necesito anotar de
esta gente, y de qué forma quiero verlo?»**. No es una lista fija de columnas
que la aplicación ya decidió (como `believers`), ni un conjunto de personas
para publicar (como `lists`): es una tabla que **cada iglesia diseña a su
medida**, con las columnas que le hacen falta a ella y no a las demás.

## Alcance

**Entra:**

- Una sección nueva en el bloque de iglesia, con **una subentrada por tabla**,
  igual que el calendario y las listas (D1).
- Crear una tabla con su nombre y su color; borrarla, archivarla, reordenarla
  en la barra lateral.
- **Columnas a medida**: crearlas, nombrarlas, elegir su tipo de dato entre
  once (D5), reordenarlas y borrarlas. Ninguna tabla nace con las mismas
  columnas que otra, salvo la plantilla de serie (D16).
- **Filas que son creyentes**, añadidos explícitamente desde un buscador con
  los mismos filtros del listado de creyentes —labor, sede, don, estado— (D8),
  igual que se llena una lista (RFC 0010 D5).
- **Campos de creyente como columnas vivas**: al añadir una fila se elige qué
  datos de esa persona se quieren ver al lado —teléfono, sede, dones...— y esas
  columnas **no se copian, se consultan**: si el teléfono cambia en su ficha,
  cambia aquí (D9).
- **Cuatro formas de ver la misma tabla**: rejilla, fichas, agrupada y
  calendario (D12).
- **Filtros** sobre cualquier columna, propia o de creyente, con el operador
  que le corresponde a su tipo.
- Una **columna de recuento**: cuenta cuántas casillas de un grupo elegido
  están marcadas, sin que nadie tenga que sumarlo a mano (D6).
- Una tabla de serie, **«Asistencia a Instituto Bíblico»**, sembrada al crear
  la iglesia, como ejemplo funcionando y no como una pantalla vacía (D16).
- Exportar cualquier tabla en los cinco formatos del RFC 0009.
- Los textos, en los seis idiomas.

### Fuera de alcance

- **La app móvil**, por el motivo de siempre: una rejilla editable con
  columnas dinámicas es una pantalla que se diseña para el dedo desde cero, y
  no es esta entrega.
- **Publicar una tabla en un enlace público.** Es justo lo que separa esto de
  RFC 0010. Si algún día una iglesia quiere colgar «quién ha leído qué libro»
  en un enlace, es una funcionalidad que se pide y se diseña con las mismas
  decisiones de seguridad de las listas —no se improvisa aquí encima—.
- **Filas que no son creyentes.** Un ítem de inventario, una canción, una
  tarea: **una fila es un creyente**, exactamente el mismo límite que ya se
  puso en las listas y por el mismo motivo (RFC 0010, «Fuera de alcance»:
  «Listas de cosas que no son personas... el día que haga falta otra cosa será
  otra cosa»). Quien todavía no esté en creyentes se da de alta ahí, no se
  escribe un nombre suelto en una celda.
- **Fórmulas de verdad** (columnas calculadas a partir de una expresión
  arbitraria, tipo hoja de cálculo). Se cubre el caso que se ha pedido —contar
  casillas marcadas— con un tipo de columna dedicado (D6); una fórmula general
  es un intérprete de expresiones y un problema aparte.
- **Vistas guardadas y con nombre** (varias configuraciones de filtros por
  tabla, cada una memorizada). V1 es un filtro por sesión, como el resto de
  listados de la aplicación. Ver «Preguntas abiertas».
- **Colaboración en tiempo real sobre la misma celda.** Se edita como se edita
  cualquier formulario de la aplicación hoy: se guarda, se refresca. Dos
  personas editando la misma tabla a la vez no tienen indicación de presencia.
- **Historial de cambios de una celda.** Se guarda el valor actual, no quién lo
  cambió la semana pasada. Si hace falta auditoría, es una tabla de eventos
  aparte y un RFC propio.

## Vocabulario

| Término                 | Qué es                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **Cuadrante**           | Una tabla a medida de la iglesia: su nombre, sus columnas, sus filas                     |
| **Columna**             | Un campo de la tabla, con su nombre y su tipo de dato                                    |
| **Columna de creyente** | Una columna que no se rellena a mano: muestra un dato en vivo de la ficha de esa persona |
| **Fila**                | Un creyente dentro de un cuadrante, en una posición                                      |
| **Celda**               | El valor de una columna propia para una fila concreta                                    |
| **Recuento**            | Un tipo de columna que cuenta cuántas casillas de otras columnas están marcadas          |
| **La marea**            | El indicador de cuánto está relleno cada fila (§7.3)                                     |

## Cómo se llama la sección, y por qué

Se han mirado tres nombres:

- **«Cuadrantes»** (recomendado). En español de iglesia y de trabajo por
  turnos, un «cuadrante» ya significa exactamente esto: una tabla con nombres
  en las filas y algo que marcar en las columnas —el cuadrante de guardias, el
  cuadrante de limpieza—. Y tiene una segunda vida náutica de verdad: el
  cuadrante era el instrumento con el que se media la posición de un astro
  para saber dónde está el barco. Las dos lecturas apuntan al mismo sitio: una
  herramienta para situar a cada persona en una cuadrícula. No colisiona con
  ningún término que ya use la aplicación.
- **«Cuadernos»** — evoca el cuaderno de bitácora, encaja con el vocabulario
  náutico de la Regla 9 y con «una tabla por cada cosa que se quiere anotar».
  Se descarta con pena: «bitácora» ya está tomado dentro de creyentes (RFC
  0003, el historial de notas), y «cuaderno» al lado sonaría a la misma cosa
  sin serlo.
- **«Registros»** — el más exacto en abstracto y el más genérico en la barra
  lateral: es la palabra que usaría cualquier CRM. Es justo lo que la Regla 9
  pide evitar.

«Cuadrantes», en el bloque de iglesia, entre **Creyentes** y
**Comunicaciones**: viene después de creyentes porque sus filas dependen de
ellos, y antes de comunicaciones porque sigue siendo gestión de personas, no
mensajería.

## Investigación: cómo lo resuelven otros

### Productos de referencia

**Airtable** es, en su descripción técnica, una base de datos relacional con
una capa de hoja de cálculo encima: cada base tiene tablas, cada tabla campos
tipados —más de veinte tipos, desde texto y fecha hasta «vínculo a otro
registro», fórmula y _rollup_— y cada fila es un registro real, no una celda
suelta. La pista importante para este documento es la que remarca su propia
documentación para clones: **columnas y filas no son celdas independientes de
una hoja de cálculo**; son campos y registros de una base de datos, y tratarlo
como lo segundo desde el primer día evita rehacer el modelo más adelante.

**Notion** resuelve lo mismo con propiedades por página dentro de una base de
datos, y su punto fuerte es justo el que se pide aquí: **una sola tabla de
datos, varias vistas** —tablero, calendario, galería, lista— todas leyendo el
mismo conjunto de páginas y filtrando o agrupando de otra forma. La
consistencia entre vistas (los mismos datos, otra proyección) es lo que hace
que cambiar de vista no se sienta como cambiar de pantalla.

**Baserow** (código abierto, Postgres por debajo) es el que más cerca está de
la pila de este proyecto: vista de rejilla, kanban agrupado por un campo de
selección única, calendario por un campo de fecha y galería. Confirma que
**cuatro vistas con esa forma concreta** es un conjunto ya validado por un
producto que resuelve el mismo problema con la misma base de datos relacional
que usa Navis.

### Patrones técnicos encontrados

- **EAV (entidad-atributo-valor) para los campos personalizados** es el patrón
  que aparece una y otra vez cuando el esquema de una tabla lo decide quien la
  usa y no quien escribe el código: una tabla de columnas (metadatos: nombre,
  tipo, orden) y una tabla de celdas (`fila_id, columna_id, valor`), en vez de
  una columna real de SQL por cada campo que alguien invente. El precio que
  señalan los hilos técnicos es el esperado —una consulta que antes era una
  fila ahora es un `JOIN` o varias filas que se recomponen en memoria—, y a la
  escala de esta aplicación (tablas de una iglesia, no millones de filas) ese
  precio es barato y a cambio no hace falta una migración cada vez que alguien
  añade una columna.
- **Kanban se agrupa por un campo de selección única**, nunca por texto libre
  ni por múltiples valores: agrupar por algo que puede tener dos valores a la
  vez rompe la metáfora de columnas. Es la misma razón por la que aquí el
  recuento (D6) exige columnas de casilla y no de texto.
- **Calendario se pinta sobre un campo de fecha**, y cuando no hay ninguno en
  la tabla, el propio producto lo pide antes de ofrecer la vista en vez de
  enseñarla vacía.
- **La consistencia entre vistas es el requisito de UX que más se repite**:
  cambiar de vista no debe perder el filtro activo ni la selección. Aquí se
  resuelve igual que en el resto de la aplicación —el filtro vive en la URL
  (RFC 0003 D11)— y solo el **modo de vista** es una preferencia de quien
  mira, no del enlace.

### Conclusiones clave para Navis

- El modelo de datos va por **EAV explícito** (`board_columns` +
  `board_cells`), no por una columna JSON en la fila: es más fácil de filtrar
  igual en SQLite y en Postgres —el problema que ya avisa `CLAUDE.md` con
  otras columnas de motor mixto— y encaja con el resto del esquema, que ya usa
  tablas puente sin lógica (`list_grants`, `believer_gifts`) para todo lo que
  es «una relación con un valor».
- Las cuatro vistas eligen su forma **por el tipo de columna disponible**, no
  al azar: agrupada exige un `singleSelect`, calendario exige una `date`. Si
  la tabla no tiene ninguna, la vista se ofrece apagada con la razón, no
  escondida.
- Lo que Notion resuelve con «una fuente, varias proyecciones» es exactamente
  lo que ya hace `useTableQuery` en el resto de la aplicación con la
  paginación y los filtros en la URL: no hace falta un mecanismo nuevo, hace
  falta aplicarlo a datos con columnas dinámicas.
- Ningún producto de referencia intenta traer campos de otra tabla como copia:
  Airtable los trae por **vínculo a otro registro** y Notion por **relación**.
  Aquí el equivalente es no copiar los datos del creyente a la celda, sino
  mostrar su ficha en vivo (D9) — más simple que un tipo «vínculo» genérico,
  porque en Navis solo hay una entidad a la que vincular: el propio creyente
  de la fila.

## Solución propuesta

Un **cuadrante** es una tabla con nombre y color, propiedad de la iglesia. Se
crea vacía; se le añaden **columnas** (D5) y **filas** (D8). Cada fila es un
creyente. Cada columna propia guarda un valor por fila en una celda; cada
columna de creyente (D9) no guarda nada — lee el dato en vivo de su ficha.

```
Cuadrante «Asistencia a Instituto Bíblico»
┌──────────────────┬──────────┬─────────┬─────────┬─────────┬────────────┐
│ Creyente (fija)   │ Sede*    │ Clase 1 │ Clase 2 │ Clase 3 │ Asistencias│
├──────────────────┼──────────┼─────────┼─────────┼─────────┼────────────┤
│ Juan Carlos Ruiz  │ Elda     │   ☑     │   ☑     │   ☐     │     2      │
│ María Fernández   │ Alicante │   ☑     │   ☑     │   ☑     │     3      │
└──────────────────┴──────────┴─────────┴─────────┴─────────┴────────────┘
                     ↑ columna de creyente (D9, en vivo)     ↑ recuento (D6)
```

Se ve en cuatro formas (D12): la **rejilla** de arriba, en **fichas** (una
tarjeta por creyente con sus columnas en lista), **agrupada** (columnas por el
valor de un `singleSelect`, si la tabla tiene uno) y en **calendario** (una
celda por día, si la tabla tiene una columna `date`).

## Decisiones tomadas

### El cuadrante

- **D1 — Un cuadrante es de la iglesia, y va en subentradas de la barra
  lateral.** Mismo patrón que el calendario y las listas: `NavGroup` ya sabe
  pintar «una entrada, varias subentradas» (RFC 0002 D15, RFC 0010 D3). Solo
  hace falta añadir `'boards'` a la unión `NavChildren` de `lib/nav.ts` — cero
  líneas nuevas en `NavGroup` ni en `AppNav`.

- **D2 — El color es el dato, igual que en las listas.** `accent`, de
  `ACCENT_PALETTE`. Se propone uno sin usar al crear. Es lo que distingue un
  cuadrante de otro en la barra lateral y en el punto de color de su fila
  dentro de la ficha del creyente (D15).

- **D3 — El `slug` no cambia al renombrar.** Mismo motivo que en listas (RFC
  0010 D7): la ruta interna no se rompe si alguien renombra «Instituto» a
  «Instituto Bíblico 2026».

- **D4 — Borrar es lógico; archivar es un interruptor aparte.** `is_active`
  saca el cuadrante de la barra lateral sin perder sus datos —la asistencia
  del instituto del año pasado sigue consultable desde el listado de
  cuadrantes archivados—; borrar es `deleted_at`, con confirmación, y arrastra
  columnas, filas y celdas por cascada real (no son datos publicados, no hace
  falta el cuidado de D30 de las listas).

### Las columnas

- **D5 — Once tipos de dato, y ni uno más de los que se han pedido.**

  | Tipo           | Qué guarda                                                      | Se edita con                     |
  | -------------- | --------------------------------------------------------------- | -------------------------------- |
  | `text`         | Una línea de texto                                              | Campo de texto                   |
  | `longText`     | Texto largo, sin Markdown (misma razón que las notas, RFC 0003) | Área de texto                    |
  | `number`       | Un número                                                       | Campo numérico, `tabular-nums`   |
  | `date`         | Una fecha (`date`, no `timestamptz` — RFC 0003 D9)              | Selector de fecha                |
  | `checkbox`     | Sí / no                                                         | Casilla                          |
  | `singleSelect` | Una opción de una lista con color                               | Desplegable de etiquetas         |
  | `multiSelect`  | Varias opciones de una lista con color                          | Etiquetas que se encienden       |
  | `url`          | Un enlace                                                       | Campo de texto validado          |
  | `phone`        | Un teléfono                                                     | Campo de texto, enlace `tel:`    |
  | `email`        | Un correo                                                       | Campo de texto, enlace `mailto:` |
  | `count`        | Cuántas casillas de otras columnas están marcadas (D6)          | No se edita: se calcula          |

  Once y no más porque son los que cubren lo que se ha pedido —texto, número,
  fecha, opción única, opción múltiple, casilla, y los tres formatos de
  contacto que ya usan creyentes y listas—. Un tipo `currency` o `rating` se
  añade el día que alguien lo pida, sin tocar el resto: la lista vive en
  `packages/shared` y el `switch` que la interpreta ya tiene que cubrir un
  tipo desconocido con una excepción, así que añadir uno es una fila en una
  tabla y un caso en un `switch`, no un rediseño.

- **D6 — El recuento es un tipo de columna, no una fórmula.** Se pidió
  «número de días», «cantidad de clases», «asistencia» — la misma pregunta
  dicha de tres formas: **cuántas casillas están marcadas**. En vez de abrir la
  puerta a fórmulas arbitrarias (Alcance), hay un tipo `count` cuya
  configuración es una lista de columnas `checkbox` de la misma tabla; su
  valor **no se guarda**, se calcula al leer la fila sumando sus casillas
  marcadas — es una suma de cuatro o cinco valores por fila, no una consulta
  cara, y así no hay nada que desincronizar (a diferencia de `last_note_at`,
  RFC 0003 D4, que si se recalcula al vuelo sí sería caro por repetirse en
  cada fila de un listado grande; aquí son casillas de la propia fila, no un
  `MAX` sobre miles de notas).

  Añadir una columna `checkbox` nueva no actualiza los recuentos que ya
  existían **a menos que se la añada a su configuración**: contar solo lo que
  se ha dicho que se cuente, y no todo lo que se parezca, es lo que hace que
  un cuadrante pueda tener casillas que no son de asistencia (por ejemplo,
  «trajo la Biblia») sin que se cuelen en el total.

- **D7 — Las opciones de `singleSelect` y `multiSelect` llevan su color, del
  mismo `ACCENT_PALETTE` de siempre.** Es lo que hace que la vista agrupada
  (D12) tenga columnas que se distinguen de un vistazo, y no una paleta nueva
  que mantener.

### Las filas y la importación

- **D8 — Una fila es un creyente, añadido explícitamente.** Mismo límite y
  mismo motivo que las listas (RFC 0010 D2, D5): nada de texto suelto, nada de
  «todos los que tengan la labor X» actualizándose solo. Se añade desde un
  buscador con los filtros de siempre —labor, sede, don, estado— reutilizando
  **el mismo componente** que ya usa «Añadir miembros» en listas
  (`add-members-filters.tsx`, que no tiene nada de listas en su lógica: pide
  creyentes con `BelieversQuery`). Se traslada a `components/believers/` para
  que ninguna de las dos secciones dependa de la carpeta de la otra, y las dos
  lo importan de ahí.

  Quien todavía no esté en creyentes se da de alta ahí, desde el mismo
  diálogo — el patrón ya establecido en el selector de predicadores del
  calendario y repetido en listas.

- **D9 — Los campos de creyente son columnas en vivo, no copiadas.** Es la
  decisión que más se aparta de lo que se pidió en la conversación original
  («se va toda la información de los creyentes» sonaba a copiar), y se aparta
  a propósito: copiar el teléfono a una celda el día que se añade la fila deja
  ese teléfono **congelado** ahí, mientras la ficha real seguiría cambiando.
  Es justo el problema que ya resolvió esta base de código en RFC 0010 D2
  («cambiar un apellido lo cambia en las siete listas donde sale») aplicado
  aquí con un motivo más fuerte todavía: un cuadrante **no es una
  publicación** congelada a propósito como una lista compartida — es una
  herramienta de trabajo donde un dato viejo es simplemente un error.

  Al crear el cuadrante o al añadir la primera fila se elige qué campos de
  creyente **mostrar** como columnas, de una lista blanca cerrada — mismo
  mecanismo que la D16 de listas, pero aquí la motivación es de diseño y no de
  seguridad:

  | Campo disponible         | De dónde sale                                                          |
  | ------------------------ | ---------------------------------------------------------------------- |
  | Nombre                   | Siempre presente, no se puede quitar                                   |
  | Teléfono, correo         | `believer.phone`, `believer.email`                                     |
  | Sede                     | `believer.congregation` (nombre y color)                               |
  | Estado                   | `believer.status`                                                      |
  | Dones                    | `believer.gifts`                                                       |
  | Labores                  | `believer.ministries`                                                  |
  | Sonda                    | `daysWithoutNote` / `needsAttention` (RFC 0003)                        |
  | Llegada, sede de llegada | `arrivedAt`, `arrivalSite` (RFC 0012)                                  |
  | Lecturas e institutos    | `bibleReadings`, `vivenciasReadings`, `bibleInstituteTimes` (RFC 0012) |

  Estas columnas **no se pueden editar desde el cuadrante**: se editan en la
  ficha del creyente, con `believers.manage`. El cuadrante solo puede
  mostrarlas u ocultarlas, nunca escribir en ellas — evita el error de que
  alguien con `boards.manage` y sin `believers.manage` cambie el teléfono de
  alguien sin darse cuenta de que está editando la ficha real.

- **D10 — Quitar una fila no borra al creyente, ni al revés.** Quitar a Juan
  del cuadrante de instituto le borra sus celdas de ese cuadrante y nada más.
  Borrar a Juan de creyentes (borrado lógico) hace que desaparezca de todos
  los cuadrantes donde estuviera, con sus celdas intactas por si se
  recupera — mismo comportamiento que ya tienen las listas con
  `deleted_at` (RFC 0010 D16, último punto).

- **D11 — El orden de las filas es manual, como en las listas** (RFC 0010 D6):
  `position`, se arrastra o se mueve con botones de teclado.

### Las vistas

- **D12 — Cuatro vistas, cada una activa solo cuando la tabla la puede
  enseñar.**

  | Vista          | Qué hace                                                           | Exige                               |
  | -------------- | ------------------------------------------------------------------ | ----------------------------------- |
  | **Rejilla**    | Filas × columnas, edición en la propia celda. La vista por defecto | Nada                                |
  | **Fichas**     | Una tarjeta por creyente, sus columnas en lista                    | Nada                                |
  | **Agrupada**   | Columnas de tablero por el valor de un `singleSelect` elegido      | Al menos una columna `singleSelect` |
  | **Calendario** | Una celda del mes por cada valor de una columna `date` elegida     | Al menos una columna `date`         |

  Cuando falta el tipo de columna que una vista necesita, el conmutador la
  enseña **apagada con el motivo** («Crea una columna de fecha para ver el
  calendario»), nunca escondida sin explicación — es la misma idea de la
  Regla 9 §6 de que un hueco invita a hacer algo, no se disimula.

  Cuatro y no menos, porque es el conjunto exacto que ya usa esta aplicación
  en el módulo más parecido —las cuatro vistas de la bitácora de creyentes,
  RFC 0003 D17— y el que confirma la investigación (§ Baserow) como el juego
  mínimo que cubre spreadsheet, tarjetas, agrupación y tiempo.

- **D13 — El filtro va en la URL; la vista elegida, en `localStorage`.** Mismo
  reparto que en creyentes (RFC 0003 §7.2): una búsqueda concreta se comparte
  por enlace, y la forma de mirar es cosa de quien mira. Aquí se guarda **por
  cuadrante** (`navis.boardView.<boardId>`) y no en una única clave global,
  porque un cuadrante de asistencia quiere nacer en calendario y uno de
  seguimiento en rejilla — con una sola clave, elegir la vista en uno
  cambiaría la de todos.

- **D14 — La vista agrupada no permite arrastrar entre columnas en esta
  versión.** Cambiar de grupo arrastrando una tarjeta escribiría en la celda
  del `singleSelect` sin pasar por el formulario de edición, y las reglas de
  quién puede escribir qué (D9) se complican si el arrastre tiene que
  respetarlas. Se cambia de grupo abriendo la fila y editando el campo, como
  cualquier otra celda. Arrastrar es candidato a una versión futura.

### Filtros

- **D15 — Cada tipo de columna trae su propio operador, no un `contiene`
  universal.** Texto y texto largo, contiene; número, igual / distinto /
  mayor / menor / entre; fecha, antes / después / entre / vacía; casilla,
  marcada / sin marcar; selección única y múltiple, es una de [...]; los tres
  formatos de contacto, contiene, como el texto. Los campos de creyente (D9)
  filtran con la lógica que ya existe para creyentes — sede, don, labor,
  estado — sin reinventarla.

### La forma

- **D16 — Una tabla de serie: «Asistencia a Instituto Bíblico».** Sembrada al
  crear la iglesia (mismo patrón que las cinco listas de serie, RFC 0010 D4,
  y los siete dones, RFC 0003 D5): `BoardsService.ensureFor()` para iglesias
  nuevas, y una migración que la crea para las que ya existan. Columnas:
  nombre (fija), sede (de creyente, D9), tres columnas `checkbox` de ejemplo
  —«Clase 1», «Clase 2», «Clase 3»— y una columna `count` («Asistencias») que
  las cuenta. Nace vacía de filas: es un ejemplo que funciona desde el primer
  vistazo, no datos inventados de personas que no han venido a ninguna clase.

  La migración **escribe los nombres a mano**, sin importar ninguna
  constante — la misma trampa que ya deja escrito `CLAUDE.md` sobre
  `CreateRoles`: si mañana cambia el texto de una traducción, no debe cambiar
  lo que la migración siembra en una base de datos que ya existe.

- **D17 — Elemento firma: la marea.** En cada fila, una pista fina —el mismo
  lenguaje visual que la sonda de creyentes (RFC 0003 §7.3), pero con otro
  significado— que se llena según cuántas de las columnas propias de la fila
  tienen valor. Con una columna `count` en la tabla, la marea muestra en su
  lugar la proporción de ese recuento sobre el total de columnas que cuenta
  —es el caso más útil, y evita enseñar dos indicadores que dicen casi lo
  mismo—.

  Es lo que responde, de un vistazo por la tabla entera y sin abrir ninguna
  fila, a **«¿a quién le falta algo por rellenar?»** — el mismo tipo de
  pregunta que la sonda responde para «con quién no he hablado», llevada al
  terreno de una tabla que se está completando en vez de una relación que se
  está enfriando. `bg-muted` de fondo, relleno de `bg-primary` con
  `transform: scaleX()` al entrar (nunca `width`, Regla 9 §5), y sin pintarse
  en absoluto en una tabla sin columnas propias que valga la pena medir.

- **D18 — Nada de degradados ni de un icono por columna.** Los tipos de
  columna llevan su icono en la cabecera —es información, localiza el tipo de
  un vistazo—, pero las celdas van limpias: texto, número, casilla, etiqueta
  de color. Rejilla, fichas y agrupada comparten la paleta y los tokens de
  siempre; la única audacia de la pantalla es la marea (Regla 9 §4).

## Modelo de datos

### 6.1 `boards`

| Columna      | Tipo         | Notas                                     |
| ------------ | ------------ | ----------------------------------------- |
| `id`         | uuid         | `BaseEntity`                              |
| `church_id`  | uuid, índice | → `churches(id)` (D1)                     |
| `name`       | text         | Dato de la iglesia: no se traduce         |
| `slug`       | text         | Fijo desde el alta (D3)                   |
| `accent`     | text         | Token o `#rrggbb` (D2)                    |
| `position`   | int          | El orden en la barra lateral              |
| `is_active`  | bool         | Archivado: fuera de la barra, no se borra |
| `created_by` | uuid         | → `user(id)`                              |
|              |              | `created_at`, `updated_at`, `deleted_at`  |

Únicos, planos: `(church_id, slug)` y `(church_id, name)` — patrón de `gifts`.

### 6.2 `board_columns`

| Columna          | Tipo                  | Notas                                                                                                                  |
| ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`             | uuid                  |                                                                                                                        |
| `board_id`       | uuid, índice          | `ON DELETE CASCADE`                                                                                                    |
| `key`            | text                  | Fijo desde el alta, como el `slug` de una lista. Referencia estable para `count` (D6)                                  |
| `name`           | text                  | Editable en cualquier momento                                                                                          |
| `type`           | text                  | Uno de los once de D5                                                                                                  |
| `position`       | int                   | El orden de las columnas en la rejilla                                                                                 |
| `config`         | text (json), nullable | Opciones con color (`singleSelect`/`multiSelect`) o columnas a contar (`count`). Esquema por tipo, discriminado (§6.5) |
| `believer_field` | text, nullable        | Si no es `null`, es una columna de creyente (D9): el nombre del campo, de una lista blanca cerrada                     |
|                  |                       | `created_at`, `updated_at`, `deleted_at`                                                                               |

Único: `(board_id, key)`. Una columna con `believer_field` no lleva `config`
ni celdas: su valor se resuelve en `BoardRowsService` a partir del creyente de
la fila, nunca se guarda.

### 6.3 `board_rows`

| Columna       | Tipo         | Notas                                            |
| ------------- | ------------ | ------------------------------------------------ |
| `id`          | uuid         | Con id propio: es el padre de `board_cells` (D8) |
| `board_id`    | uuid, índice | `ON DELETE CASCADE`                              |
| `believer_id` | uuid, índice | → `believers(id)`. Una fila es un creyente (D8)  |
| `position`    | int          | El orden dentro del cuadrante (D11)              |
| `added_at`    | timestamp    |                                                  |
| `added_by`    | uuid         |                                                  |

Único: `(board_id, believer_id)` — un creyente no puede estar dos veces en el
mismo cuadrante. Índice `(believer_id)` aparte: es por donde se pregunta «¿en
qué cuadrantes está esta persona?», igual que en `list_members`.

### 6.4 `board_cells`

Solo para columnas **propias** (`believer_field IS NULL`).

| Columna      | Tipo           | Notas                                                     |
| ------------ | -------------- | --------------------------------------------------------- |
| `row_id`     | uuid           | Clave primaria compuesta, `ON DELETE CASCADE`             |
| `column_id`  | uuid           | Idem, `ON DELETE CASCADE`                                 |
| `value`      | text, nullable | El dato en crudo; su forma la decide `column.type` (§6.6) |
| `updated_at` | timestamp      |                                                           |
| `updated_by` | uuid           |                                                           |

Dos columnas de identidad y tres de valor: mismo patrón que `list_grants`
—«qué acceso abre qué lista»— aplicado a «qué vale esta columna en esta
fila». Sin fila para una celda vacía: una celda que nunca se ha escrito
**no existe**, no es una fila con `value = null` — así una tabla nueva con
cien filas no escribe mil celdas vacías de golpe.

### 6.5 La configuración de columna, tipada sin `any`

```ts
// packages/shared/src/schemas/boards.ts
export const BOARD_COLUMN_TYPES = [
  'text',
  'longText',
  'number',
  'date',
  'checkbox',
  'singleSelect',
  'multiSelect',
  'url',
  'phone',
  'email',
  'count',
] as const;

export type BoardColumnType = (typeof BOARD_COLUMN_TYPES)[number];

const selectOptionSchema = z.object({
  key: z.string(),
  label: z.string(),
  accent: accentSchema,
});

/** Discriminada por tipo: cada variante lleva solo lo que su tipo necesita. */
export const boardColumnConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('singleSelect'),
    options: z.array(selectOptionSchema),
  }),
  z.object({
    type: z.literal('multiSelect'),
    options: z.array(selectOptionSchema),
  }),
  z.object({
    type: z.literal('count'),
    countColumnIds: z.array(z.uuid()).min(1),
  }),
]);
// El resto de tipos no lleva configuración: no aparecen en la unión.

export type BoardColumnConfig = z.infer<typeof boardColumnConfigSchema>;

/** Los campos de creyente que se pueden mostrar como columna (D9), lista blanca. */
export const BOARD_BELIEVER_FIELDS = [
  'phone',
  'email',
  'congregation',
  'status',
  'gifts',
  'ministries',
  'probe', // la sonda: daysWithoutNote / needsAttention
  'arrivedAt',
  'arrivalSite',
  'bibleReadings',
  'vivenciasReadings',
  'bibleInstituteTimes',
] as const;

export type BoardBelieverField = (typeof BOARD_BELIEVER_FIELDS)[number];
```

### 6.6 Cómo se lee y se escribe una celda

`board_cells.value` es siempre `text | null`; lo que significa lo decide
`column.type`, y la conversión vive en **un solo sitio**
(`packages/shared/src/schemas/board-cell-value.ts`), con una función por
sentido — `parseCellValue`, `serializeCellValue` — para que ni la API ni la
web reinventen el formato:

```ts
export type CellValue =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'date'; value: string } // AAAA-MM-DD
  | { kind: 'checkbox'; value: boolean }
  | { kind: 'select'; value: string } // la `key` de la opción
  | { kind: 'multiSelect'; value: string[] }
  | { kind: 'empty' };

export function parseCellValue(
  type: BoardColumnType,
  raw: string | null,
): CellValue;
export function serializeCellValue(
  type: BoardColumnType,
  value: CellValue,
): string | null;
```

`multiSelect` se guarda como JSON de un array de `key`. `Array.isArray` sobre
el resultado de `JSON.parse` (que es `unknown`, Regla 10) se comprueba con un
predicado propio antes de tratarlo como `string[]`, exactamente como ya hace
la migración `CreateLists` con `queryRunner.query`.

## API

Todo bajo `ActiveChurchGuard`, `/api/v1/boards`.

| Método | Ruta                                      | Permiso         | Descripción                                         |
| ------ | ----------------------------------------- | --------------- | --------------------------------------------------- |
| GET    | `/boards`                                 | `boards.view`   | Los cuadrantes de la iglesia, activos primero       |
| POST   | `/boards`                                 | `boards.manage` | Crear                                               |
| GET    | `/boards/:id`                             | `boards.view`   | La ficha: columnas y filas ya resueltas             |
| PATCH  | `/boards/:id`                             | `boards.manage` | Nombre, color, activo                               |
| DELETE | `/boards/:id`                             | `boards.manage` | Borrado lógico, en cascada                          |
| GET    | `/boards/:id/export`                      | `boards.view`   | Las filas, según el RFC 0009                        |
| POST   | `/boards/:id/columns`                     | `boards.manage` | Crear columna propia o de creyente                  |
| PATCH  | `/boards/:id/columns/:columnId`           | `boards.manage` | Renombrar, cambiar configuración, reordenar         |
| DELETE | `/boards/:id/columns/:columnId`           | `boards.manage` | Borra la columna y sus celdas                       |
| POST   | `/boards/:id/rows`                        | `boards.manage` | Añadir creyentes de golpe (D8)                      |
| DELETE | `/boards/:id/rows/:rowId`                 | `boards.manage` | Quitar una fila                                     |
| PUT    | `/boards/:id/rows/order`                  | `boards.manage` | El orden entero, de una vez (D11)                   |
| PUT    | `/boards/:id/rows/:rowId/cells/:columnId` | `boards.manage` | Escribe una celda. 400 si la columna es de creyente |

`GET /boards/:id` devuelve ya resuelto lo que la interfaz necesita para
pintar cualquiera de las cuatro vistas sin una segunda vuelta: columnas
(propias y de creyente, en su `position`), filas con sus celdas propias
**y** sus campos de creyente ya calculados (D9), y los recuentos (D6) ya
sumados. Es la misma filosofía que `ListRowsService` (§ apartado siguiente):
tres o cuatro consultas que se juntan en el servicio, no un `JOIN` con
relaciones que empuje a TypeORM a la subconsulta `DISTINCT` que
`CLAUDE.md` ya avisa que exige `Postgres`.

`BoardRowsService.view()` sigue el patrón exacto de `ListRowsService`: pide
filas, pide creyentes por `In(...)`, pide sedes, pide celdas por `In(...)` y
lo junta en memoria, con el mismo cuidado con `deleted_at` por los dos lados
(D10).

## Interfaz

### 7.1 Rutas

| Ruta            | Qué es                                               |
| --------------- | ---------------------------------------------------- |
| `/boards`       | El listado de cuadrantes de la iglesia (portada)     |
| `/boards/:slug` | El cuadrante, con el conmutador de las cuatro vistas |

### 7.2 La portada

Paneles rellenos por cuadrante, del color de su `accent` — mismo lenguaje que
el tablón de listas (RFC 0010 D37/D38), y a propósito: son primos de familia,
y se nota. Cada panel enseña su nombre, cuántas filas tiene y un resumen de la
marea del conjunto («14 de 18 al día»).

### 7.3 La rejilla

`Table`/`TableRow`/`TableCell` de siempre, pero con **columnas dinámicas**: no
encaja en `DataTable`, que asume columnas fijas conocidas por la pantalla —
aquí las decide cada cuadrante en tiempo de ejecución. Se escribe un
componente propio, `BoardGrid`, que reutiliza las piezas de `components/ui/table`
y el patrón de esqueleto de carga de `DataTable`, pero genera sus cabeceras y
sus celdas a partir de `board.columns`.

Por debajo de `md`, la rejilla no se intenta encoger: se cae a la vista de
**fichas**, igual que la tabla de creyentes se cae a fichas por debajo de
`md` (RFC 0003 §7.4) — una rejilla de ocho columnas en 375 px no es legible
por mucho que se comprima.

Cada celda se edita **in situ**: un clic la convierte en su control —campo,
casilla, desplegable— y se guarda al perder el foco o al pulsar Intro, con un
`toast` solo si falla. Las columnas de creyente se ven con un fondo `bg-muted`
sutil y sin cursor de edición: se distinguen de las propias sin un candado
explícito, y al intentar tocarlas se ofrece el enlace a la ficha.

### 7.4 Fichas, agrupada y calendario

- **Fichas**: `grid gap-4 sm:grid-cols-2 xl:grid-cols-3`, cada tarjeta con el
  nombre, sus columnas de creyente elegidas y sus columnas propias en una
  lista de etiqueta/valor, con la marea al pie.
- **Agrupada**: una columna de tablero por cada opción del `singleSelect`
  elegido (D14), con las tarjetas de fichas dentro. Sin arrastrar (D14): un
  menú en la tarjeta para moverla de grupo.
- **Calendario**: el mes en cuadrícula, y en cada día las fichas de las filas
  cuya columna `date` elegida cae ahí — mismo lenguaje visual que la vista de
  calendario de la bitácora de creyentes (RFC 0003 §7.5).

### 7.5 Crear un cuadrante y sus columnas

Todo en `Dialog`. Crear: nombre y color. Dentro, dos acciones separadas:
**«Añadir columna»** (nombre, tipo — con su icono al lado en el desplegable
— y, según el tipo, sus opciones o las columnas a contar) y **«Añadir
creyentes»**, que abre el mismo buscador con filtros de D8 y, la primera vez,
pregunta qué campos de creyente mostrar (D9).

### 7.6 Los tres anchos

- **375 px**: fichas por defecto (la rejilla no se ofrece), filtros en
  `Drawer`, vista agrupada en columnas que se desplazan horizontalmente
  **dentro de su propio contenedor** (Regla 5 §3), nunca la página entera.
- **768 px**: rejilla disponible, con scroll horizontal propio si hay más
  columnas de las que caben — la página no se desplaza a lo ancho, la tabla sí
  dentro de su borde.
- **1280 px**: todo a la vista.

Comprobado con el alemán puesto: los nombres de columna son texto libre de
quien usa la aplicación, así que el ancho de columna se adapta al contenido
con un mínimo, no al revés.

### 7.7 Animación

Poca, con motivo (Regla 9 §5). Entrada de filas escalonada como en creyentes;
la marea se llena con `scaleX()` en la primera pintura; cambiar de vista es un
fundido de 150 ms. Todo apagado con `prefers-reduced-motion`.

## Textos

Sección nueva `boards.*` en los seis idiomas, mismo orden de claves en todos
(Regla 2 §5):

| Clave                            | es                                               |
| -------------------------------- | ------------------------------------------------ |
| `boards.title`                   | Cuadrantes                                       |
| `boards.create`                  | Crear cuadrante                                  |
| `boards.addColumn`               | Añadir columna                                   |
| `boards.addBelievers`            | Añadir creyentes                                 |
| `boards.columnType.text`         | Texto                                            |
| `boards.columnType.longText`     | Texto largo                                      |
| `boards.columnType.number`       | Número                                           |
| `boards.columnType.date`         | Fecha                                            |
| `boards.columnType.checkbox`     | Casilla                                          |
| `boards.columnType.singleSelect` | Selección única                                  |
| `boards.columnType.multiSelect`  | Selección múltiple                               |
| `boards.columnType.url`          | Enlace                                           |
| `boards.columnType.phone`        | Teléfono                                         |
| `boards.columnType.email`        | Correo                                           |
| `boards.columnType.count`        | Recuento                                         |
| `boards.believerField.*`         | Uno por campo de D9 («Teléfono», «Sonda»…)       |
| `boards.view.grid`               | Rejilla                                          |
| `boards.view.gallery`            | Fichas                                           |
| `boards.view.grouped`            | Agrupada                                         |
| `boards.view.calendar`           | Calendario                                       |
| `boards.view.groupedDisabled`    | Crea una columna de selección única para agrupar |
| `boards.view.calendarDisabled`   | Crea una columna de fecha para ver el calendario |
| `boards.readOnlyCell`            | Este dato viene de la ficha del creyente         |
| `boards.emptyRows`               | Todavía no hay nadie en este cuadrante           |
| `boards.tide`                    | Cuánto está relleno esta fila                    |

Y las traducciones reales en `en`, `fr`, `pt`, `de`, `it` — no relleno en
español (Regla 2 §5).

## Migraciones

Todas probadas en SQLite y en Postgres (Regla 4 §2):

1. **`CreateBoards`** — `boards`, `board_columns`, `board_rows`, `board_cells`
   con sus índices y sus claves compuestas.
2. **`AddBoardPermissions`** — añade `boards.view` y `boards.manage` a
   `PERMISSIONS` y siembra `role_permissions` para los roles de serie, mismo
   patrón que `AddListPermissions`.
3. **`SeedDefaultBoard`** — crea «Asistencia a Instituto Bíblico» para cada
   iglesia que ya exista, con sus columnas de ejemplo (D16). Nombres escritos
   a mano, no importados de `shared` (misma trampa que `CreateRoles`).

Y `BoardsService.ensureFor()`, llamado desde `ChurchesService` al crear una
iglesia — mismo patrón que `GiftsService.ensureFor()` y
`CongregationsService.ensureFor()`.

## Plan de archivos

### Nuevos

| Archivo                                                  | Propósito                                  |
| -------------------------------------------------------- | ------------------------------------------ |
| `packages/shared/src/schemas/boards.ts`                  | Tipos, `BOARD_COLUMN_TYPES`, esquemas zod  |
| `packages/shared/src/schemas/board-cell-value.ts`        | `parseCellValue` / `serializeCellValue`    |
| `apps/api/src/boards/board.entity.ts`                    |                                            |
| `apps/api/src/boards/board-column.entity.ts`             |                                            |
| `apps/api/src/boards/board-row.entity.ts`                |                                            |
| `apps/api/src/boards/board-cell.entity.ts`               |                                            |
| `apps/api/src/boards/boards.service.ts`                  | CRUD del cuadrante, `ensureFor()`          |
| `apps/api/src/boards/board-columns.service.ts`           |                                            |
| `apps/api/src/boards/board-rows.service.ts`              | Añadir/quitar filas, orden                 |
| `apps/api/src/boards/board-cells.service.ts`             | Escribir una celda, validar contra el tipo |
| `apps/api/src/boards/board-rows-view.service.ts`         | El `view()` que junta todo (§ API)         |
| `apps/api/src/boards/boards.controller.ts`               |                                            |
| `apps/api/src/boards/boards.module.ts`                   |                                            |
| `apps/api/src/boards/dto/*.dto.ts`                       | Uno por endpoint de escritura              |
| `apps/web/src/lib/boards/use-board-screen.ts`            | Filtro en la URL + vista en `localStorage` |
| `apps/web/src/components/boards/board-grid.tsx`          | La rejilla (§7.3)                          |
| `apps/web/src/components/boards/board-gallery.tsx`       |                                            |
| `apps/web/src/components/boards/board-grouped.tsx`       |                                            |
| `apps/web/src/components/boards/board-calendar.tsx`      |                                            |
| `apps/web/src/components/boards/board-cell.tsx`          | Una celda editable, según su tipo          |
| `apps/web/src/components/boards/board-tide.tsx`          | La marea (D17)                             |
| `apps/web/src/components/boards/column-dialog.tsx`       | Crear/editar columna                       |
| `apps/web/src/components/boards/board-dialogs.tsx`       |                                            |
| `apps/web/src/routes/boards.tsx`, `board-detail.tsx`     |                                            |
| `packages/api-client/src/hooks/use-boards.ts` (+ afines) | Hooks de TanStack Query                    |

### A modificar

| Archivo                                                 | Cambio                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/web/src/lib/nav.ts`                               | `NavChildren` gana `'boards'`, nueva entrada en `NAV_ITEMS`                        |
| `packages/shared/src/permissions.ts`                    | `boards.view`, `boards.manage`, módulo `boards`                                    |
| `packages/shared/src/role-permissions.ts`               | Qué rol de serie los lleva                                                         |
| `apps/api/src/churches/churches.service.ts`             | Llama a `BoardsService.ensureFor()` al crear iglesia                               |
| `apps/api/src/database/data-source.ts`                  | Registra las cuatro entidades nuevas (a mano, sin globs)                           |
| `apps/web/src/components/lists/add-members-filters.tsx` | Se mueve a `components/believers/believer-filters.tsx`; lo importan lists y boards |
| `packages/api-client/src/query-keys.ts`                 | `queryKeys.boards`                                                                 |
| `packages/i18n/src/locales/*.ts` (los seis)             | Sección `boards.*`                                                                 |

## Fases

1. **El modelo y la API.** Migraciones, entidades, esquemas de `shared` con
   sus tests (`parseCellValue`/`serializeCellValue`, sobre todo `multiSelect`
   y `count`), servicios y controlador. E2e en SQLite y Postgres.
2. **La rejilla en web.** `/boards` y `/boards/:slug` con la vista de rejilla,
   crear/editar columnas, añadir/quitar filas reutilizando el buscador movido
   de listas (D8). Hooks en `api-client`. Textos en los seis idiomas.
3. **Las otras tres vistas.** Fichas, agrupada, calendario, con sus estados
   apagados cuando falta el tipo de columna que necesitan (D12).
4. **La marea, la exportación y rematar.** El elemento firma (D17), el
   `/export` del RFC 0009, animaciones, los tres anchos, los dos temas, el
   alemán, e2e de Playwright, y actualizar `docs/ESTADO.md` y `CLAUDE.md`.

## Pruebas

| Qué                                                                                                | Dónde                        |
| -------------------------------------------------------------------------------------------------- | ---------------------------- |
| `parseCellValue`/`serializeCellValue`, los once tipos, límites                                     | `packages/shared`            |
| `multiSelect` con un `JSON.parse` inválido no revienta                                             | `packages/shared`            |
| Una columna `count` suma solo las que están en su configuración                                    | `board-cells.service.test`   |
| Borrar una columna `checkbox` la quita de los `count` que la usaban                                | `board-columns.service.test` |
| Un creyente de otra iglesia no se puede añadir como fila                                           | e2e de la API                |
| Quitar una fila no borra al creyente; borrar al creyente lo saca de la vista sin borrar sus celdas | e2e de la API                |
| Una columna de creyente no admite `PUT` en su celda (400)                                          | e2e de la API                |
| La vista agrupada se ofrece apagada sin `singleSelect`                                             | Playwright                   |
| La vista calendario se ofrece apagada sin `date`                                                   | Playwright                   |
| El filtro por columna propia usa el operador de su tipo                                            | e2e de la API                |
| La tabla de serie se siembra al crear una iglesia                                                  | e2e de la API                |
| El orden de filas se guarda entero con `PUT .../order`                                             | e2e de la API                |
| La marea no se pinta sin columnas propias que contar                                               | `board-tide.test.tsx`        |

## Riesgos y trampas

- **EAV es más lento de filtrar que una columna real**, y es un precio
  aceptado a conciencia (§ Investigación): a la escala de un cuadrante de una
  iglesia —decenas o cientos de filas, no millones— el coste es un `JOIN` más,
  no un problema de rendimiento. Si algún día una iglesia tiene un cuadrante
  de diez mil filas, la respuesta es paginar la rejilla, no rehacer el modelo.
- **`Array.isArray` sobre lo que sale de `JSON.parse` es `any`** (Regla 10):
  `multiSelect` se comprueba con un predicado propio antes de tratarlo como
  `string[]`, como ya hace `CreateLists`.
- **Padre e hijo de TypeORM no se importan entre sí** (`CLAUDE.md`):
  `BoardCell` referencia `BoardRow` y `BoardColumn` por nombre y con el tipo
  envuelto (`@ManyToOne('BoardRow', 'cells')`, `row: Relation<BoardRow>`).
- **Quitar una columna en SQLite recrea la tabla** y se lleva los índices por
  delante: se comprueba en los dos motores, y solo se recrean los que hagan
  falta (CLAUDE.md).
- **Mover `add-members-filters.tsx` toca dos módulos a la vez.** Se hace en un
  commit propio, antes de empezar la funcionalidad nueva, para que el `git
blame` de «esto cambió porque se movió» no se mezcle con «esto cambió porque
  se añadió algo».
- **Una tabla con muchas columnas rompe el ancho en 375 px** si la rejilla
  intenta encogerse: por eso no se ofrece rejilla por debajo de `md` (§7.3),
  igual que ninguna tabla de la aplicación lo hace (Regla 5 §2).

## Alternativas descartadas

- **Una columna JSON en `board_rows` en vez de `board_cells`.** Más simple de
  leer una fila entera, y peor para filtrar y ordenar igual en los dos motores
  —Postgres con `jsonb`, SQLite con `json_extract`, dos caminos que mantener
  para lo mismo—. El EAV explícito ya es el patrón de todas las relaciones con
  valor de este proyecto (`list_grants`, `believer_gifts`).
- **Copiar los datos de creyente a la celda al importar.** Es lo que se pidió
  literalmente y es lo que se descarta con más convicción (D9): un dato
  copiado en una herramienta de trabajo diario es un dato que miente en cuanto
  la ficha real cambia.
- **Fórmulas generales tipo hoja de cálculo.** Un intérprete de expresiones es
  un proyecto en sí mismo; el `count` (D6) resuelve el caso real que se ha
  pedido con una columna, no con un lenguaje.
- **Arrastrar tarjetas entre columnas en la vista agrupada.** Se aparca por la
  fricción de respetar D9 al escribir (D14), no porque no sea deseable — es la
  primera candidata de una versión futura.
- **Un tipo de columna «vínculo a otro creyente»** (para «invitado por»,
  «apadrinado por»). Se descarta de esta entrega por alcance, no por diseño:
  encajaría como un tipo doce que guarda un `believer_id` en vez de texto. Se
  deja escrito porque es la extensión más previsible.

## Criterios de aceptación

- [ ] Se crea un cuadrante con nombre y color, y aparece como subentrada en la
      barra lateral, reordenable.
- [ ] Se crean columnas de los once tipos, se reordenan y se borran.
- [ ] Se añaden creyentes como filas con los filtros de labor, sede, don y
      estado, y se pueden dar de alta desde el mismo diálogo.
- [ ] Al añadir filas se eligen qué campos de creyente mostrar, y esos campos
      reflejan la ficha real, no una copia — cambiar el teléfono de un
      creyente en su ficha lo cambia en el cuadrante sin volver a importar.
- [ ] Una columna de creyente no se puede editar desde el cuadrante.
- [ ] Una columna `count` suma exactamente las casillas que se le han
      indicado, y solo esas.
- [ ] Las cuatro vistas existen; agrupada y calendario se ofrecen apagadas con
      su motivo cuando falta el tipo de columna que necesitan.
- [ ] La vista elegida se recuerda por cuadrante; el filtro va en la URL.
- [ ] La marea se pinta cuando hay algo que medir y no se pinta cuando no.
- [ ] Un cuadrante se exporta en los cinco formatos del RFC 0009.
- [ ] La tabla de serie «Asistencia a Instituto Bíblico» existe al crear una
      iglesia, con sus columnas de ejemplo.
- [ ] Todos los textos están en los seis idiomas y se ven bien en claro y en
      oscuro, a 375, 768 y 1280 px, con el alemán puesto y sin scroll
      horizontal de página.
- [ ] `pnpm check` y `pnpm test:e2e` pasan; los e2e de la API, en los dos
      motores.

## Preguntas abiertas

- **¿Hacen falta vistas guardadas con nombre?** Hoy hay un filtro por sesión y
  cuatro modos de ver. Si con el uso real una iglesia quiere «la vista de los
  ancianos» guardada y compartida con su propio filtro, es una tabla
  `board_views` y una pantalla de gestión — no rompe nada de lo de aquí.
- **¿Un tipo de columna «vínculo a otro creyente»?** Ver Alternativas
  descartadas. Se añade el día que alguien pida «quién invitó a quién» de
  verdad.
- **¿Arrastrar en la vista agrupada?** Aparcado por D14; se retoma si el
  cambio de grupo abriendo la fila resulta demasiado lento en el uso real.
- **¿Debe un cuadrante poder clonarse** (mismas columnas, sin filas) para
  reusar «Instituto Bíblico» de un año a otro? No se ha pedido, y es una
  operación pequeña de añadir después: copiar `board_columns`, no
  `board_rows`.
