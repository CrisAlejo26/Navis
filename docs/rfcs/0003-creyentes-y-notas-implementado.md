# RFC 0003: Creyentes, su historial y el aviso de inactividad

- **Estado**: **Implementado** (API y web). Reescrito el 2026-08-04 sobre la
  primera versión, que describía otra cosa
- **Fecha**: 2026-08-03 · reescrito e implementado el 2026-08-04
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). La app móvil queda fuera de esta versión — §7.9
- **Depende de**: [0008](./0008-iglesias-como-espacios-de-trabajo.md) (iglesias
  y permisos) y del **núcleo mínimo de creyentes** que adelantó la
  [0002](./0002-calendario-de-programaciones.md) §6, que este documento
  continúa

## Problema

El trabajo pastoral no es tener una lista de personas: es **acordarse de
ellas**. Quién está pasando un mal momento, quién contó un sueño que le
inquieta, a quién no se ve desde marzo, de qué se habló la última vez.

Eso hoy vive en la cabeza de quien pastorea, y la cabeza tiene un límite: con
treinta hermanos se aguanta, con ciento treinta no. Lo que se pierde no es un
dato, es una persona — la que lleva dos meses sin que nadie la llame y nadie se
ha dado cuenta.

La pregunta que esta pantalla tiene que responder de un vistazo no es «¿quién
está en la iglesia?». Es **«¿con quién no he hablado?»**.

## Alcance

**Entra:**

- La ficha completa de cada hermano sobre la tabla `believers` que ya existe:
  nombre, teléfono, sede, **estado**, **dones espirituales** y el **margen de
  aviso**.
- El **historial de notas**, de seis tipos, cada una con su fecha.
- El **aviso de inactividad**: si pasan más de _N_ días sin escribir nada de
  esa persona, la pantalla lo dice y se ve desde lejos.
- El **catálogo de dones** de la iglesia, editable, con siete de serie.
- El listado, con **paginación en el servidor**, dos formas de verlo y filtros
  en la URL; y las **cuentas** por estado y de quién pide atención.
- API, web y escritorio, con los textos en los seis idiomas.

**No entra, y por qué:**

- **La app móvil.** Igual que en la RFC 0002 (§8.7): la forma de esta pantalla
  se asienta primero en web, y la pestaña nativa entra después sin rehacer nada
  —el hook y el tipo se comparten, el JSX no (Regla 1 §2).
- **Notas privadas.** Ver D10: se explica qué cuesta añadirlas y por qué no
  ahora.
- **Correo, fecha de nacimiento, dirección y familia.** No se han pedido y cada
  columna que nadie rellena es una columna que estorba en el formulario. La
  fecha de nacimiento volverá cuando el panel de métricas (RFC 0001) quiera los
  cumpleaños; entonces es una columna, no un rediseño.
- **Foto.** No hay fotos que subir. (El almacenamiento de ficheros sí acabó
  entrando, con los audios de D18; una foto de perfil se apoyaría en él, pero
  sigue sin pedirla nadie.)
- **Notificaciones.** El aviso es una señal **en pantalla**, y el recordatorio
  de una nota (D16) también. Mandar un correo o un push cuando vence sigue
  siendo la RFC 0006.
- **Donativos y contabilidad.** Mezclar dinero con acompañamiento pastoral
  cambia el perfil de riesgo del producto y merece su propio documento.

## Vocabulario

El mismo en el código, en la interfaz y en las traducciones:

| Término      | Qué es                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| **Creyente** | Una persona de la iglesia. En la copia, «hermano» y «hermana»             |
| **Estado**   | Dónde está hoy: activo, nuevo, inactivo o trasladado                      |
| **Don**      | Un don espiritual del catálogo de la iglesia: «sanidad», «discernimiento» |
| **Nota**     | Una entrada del historial, con su tipo y su fecha                         |
| **Bitácora** | El historial completo de un hermano, leído hacia atrás                    |
| **Margen**   | Los días que pueden pasar sin nota antes de que salte el aviso            |
| **La sonda** | El indicador que enseña cuánto margen queda con esa persona (§7.3)        |
| **Atención** | El estado de quien ha agotado su margen: «pide atención»                  |

En inglés, dentro del código: `believer`, `status`, `gift`, `note`, `kind`,
`occurredAt`, `alertAfterDays`, `lastNoteAt`.

Sobre «creyentes» y «hermanos»: la **sección** se sigue llamando «Creyentes»
—ya está en la navegación y traducida a los seis idiomas—, y la **copia** dice
«hermanos y hermanas» donde suena natural en una frase. No se genera el género
por persona: no se guarda, y adivinarlo por el nombre falla justo con quien
menos gracia le hace.

## Decisiones tomadas

- **D1 — La ficha continúa la tabla `believers`; no crea otra.** El núcleo
  mínimo (RFC 0002 §6) ya tiene nombre, teléfono, sede y labores, y ya lo usa
  el calendario. Aquí se le añaden columnas.

- **D2 — `status` sustituye a `is_active`.** Cuatro estados: `activo`, `nuevo`,
  `inactivo`, `trasladado`. Tener un booleano **y** un estado sería tener dos
  fuentes de verdad que se desincronizan a la primera; el calendario pasa a
  filtrar por `status IN ('activo','nuevo')`, que es lo que ya quería decir.
  `nuevo` no es decoración: quien acaba de llegar es justo a quien más caro
  sale perder de vista.

- **D3 — El aviso es un número de días por persona.** `alertAfterDays`, con 30
  de serie y **`null` para apagarlo**. Un solo significado por columna: nada de
  «0 quiere decir sin aviso». No hay un valor por iglesia todavía —eso sería
  una columna en `churches` y una pantalla de ajustes— y el día que haga falta
  se añade sin tocar nada de esto.

- **D4 — `lastNoteAt` es una columna derivada, y a propósito.** La alternativa
  es un `MAX(occurred_at)` correlacionado en cada fila de cada listado, que es
  justo la consulta que más veces se hace. Se recalcula en **un solo sitio**
  —`NotesService`, al crear, al cambiar la fecha y al borrar— y nunca se
  escribe a mano desde otro servicio.

- **D5 — Los dones son un catálogo por iglesia con siete de serie que no se
  borran.** De serie: profecía, imposición de manos, bautismo con el Espíritu
  Santo, sanidad, echar fuera demonios, sabiduría y discernimiento. Se pueden
  **renombrar y desactivar** —el vocabulario es de cada iglesia—, pero no
  borrar: son el suelo común. Los que añada la iglesia sí se borran. Mismo
  patrón que las sedes: nombre, color y orden (RFC 0002 §5.1).

- **D6 — El nombre de un don no se traduce.** Es dato de la iglesia, como el
  nombre de una sede o el de un rol. Lo que sí va en los seis idiomas es todo
  lo que lo rodea: «Dones», «Añadir don», «De serie» (Regla 2 §6).

- **D7 — Seis tipos de nota**, y el tipo es texto validado contra una constante
  de `shared`: `seguimiento`, `testimonio`, `sueno`, `vision`, `experiencia`,
  `don`. Como los ministerios (RFC 0002 §6.2): un tipo que dejara de existir
  deja de proponerse, no rompe el historial.

- **D8 — Una nota de tipo «don» apunta al don y lo añade a la ficha.** Anotar
  que alguien recibió el don de sanidad y que su ficha lo enseñe son **la misma
  acción**, no dos. Es lo único que enlaza la bitácora con la ficha, y es lo
  que hace que las etiquetas de dones tengan fecha y contexto en vez de
  aparecer de la nada.

- **D9 — La fecha de la nota es `date`, no `timestamptz`.** Lo que pasó el 14
  de julio pasó el 14 de julio en cualquier huso; en cuanto se convierte a un
  instante aparece el desfase de un día. Es la misma decisión de la RFC 0002
  §5.5.

- **D10 — En esta entrega las notas no son privadas.** Quien tiene
  `believers.view` en esa iglesia las ve todas. Es una decisión consciente y
  discutible: la alternativa —una columna `is_private` y el autor como único
  lector— se cuela en **todas** las consultas, en los contadores y en
  `lastNoteAt`, y multiplica los casos de prueba. La columna se puede añadir
  después sin rehacer nada; lo que no se puede es tenerla a medias. Mientras
  tanto, en Consideraciones queda escrito quién ve qué.

- **D11 — Paginación en el servidor en el listado; «ver más» en la bitácora.**
  El scroll infinito en el listado rompe el botón de atrás y esconde el «cuántos
  hay», que es una de las cuentas que se piden. La bitácora sí se lee hacia
  atrás y ahí un «Ver más» explícito es lo natural — y funciona con teclado,
  que un observador de scroll no.

- **D12 — La ficha es una ruta, no un panel lateral.** `/believers/:id` se
  comparte por enlace, se abre en otra pestaña y tiene sitio para un historial
  largo. El panel lateral del calendario está bien para un día; para una
  bitácora de diez años, no.

- **D13 — Notas, dones y estados cuelgan de los permisos `believers.*`.** No se
  añade un módulo de permisos nuevo: `believers.view` entra y lee,
  `believers.manage` escribe. Los roles ya son configurables por iglesia (RFC 0008) y ahí es donde se afina quién hace qué.

- **D14 — La búsqueda se hace contra una columna normalizada.** `search_name`
  guarda el nombre completo en minúsculas y **sin acentos**, calculado en el
  servicio al guardar. Así «jesus» encuentra «Jesús» **igual en Postgres y en
  SQLite**, sin depender de `unaccent` ni de `pg_trgm`, que en SQLite no
  existen. Es una columna barata y un `LIKE` con índice.

- **D15 — El cuerpo de una nota son dos campos, no uno, y no hay título.** Una
  conversación pastoral tiene dos mitades: **lo que me contó** y **la
  indicación dada**. Se guardan separadas porque se releen separadas —«¿qué le
  dije la última vez?» es una pregunta distinta de «¿qué le pasaba?»—, y porque
  una lista que enseñe solo una de las dos columnas sigue siendo útil. El
  `title` que proponía la primera versión se retira: lo que encabeza una nota
  en la bitácora es su tipo y su fecha, y pedir además un titular era pedir
  trabajo que nadie iba a hacer. La migración no lo tira: el título que ya
  existiera encabeza el texto.

- **D16 — El recordatorio lleva día y hora, y vive en la nota.** Un interruptor
  abre `remind_at`, `remind_text` y `remind_done_at`. Lleva hora porque un
  recordatorio pastoral es «el martes antes del culto», no «el martes». Va en
  la propia nota y no en una tabla aparte porque siempre es _de_ algo que se
  habló; sin la nota no significa nada. **Al vencer se ve en la aplicación**:
  mandar un correo o un push es la RFC 0006 y trae su propia infraestructura.

- **D17 — La bitácora tiene cuatro vistas.** Bitácora (hacia atrás, agrupada
  por meses), lista densa, fichas y calendario del año. Las tres primeras
  listan notas de formas distintas; **la cuarta es la que enseña lo que no
  hay**, que es justo la pregunta de esta sección: un año en cuadraditos deja
  ver los tres meses seguidos en los que nadie escribió nada. La forma elegida
  se recuerda en `navis.notesView`, como la del listado: es preferencia de
  quien mira, no del enlace.

- **D18 — Los audios van a disco, no a la base de datos.** Una nota admite
  audios grabados en la propia aplicación (`MediaRecorder`) o adjuntados. El
  fichero vive bajo `UPLOADS_PATH` —un volumen en Docker— y la fila solo guarda
  su ficha. Un audio de dos minutos es un mega: dentro de la base engordaría
  cada volcado sin dar nada a cambio. **El nombre del fichero lo pone el
  servidor**, nunca el cliente. El precio, escrito para que no se olvide: la
  carpeta entra **aparte** en las copias de seguridad.

- **D19 — La búsqueda de la bitácora se resuelve en el servidor.** La bitácora
  se pagina de veinte en veinte, así que filtrar en el cliente solo encontraría
  lo ya traído. Busca contra lo que contó, la indicación y el recordatorio.

### Preguntas abiertas

- **¿Hace falta un margen por defecto de la iglesia?** Hoy son 30 días
  escritos en `shared`. Si al usarlo se ve que cada iglesia quiere el suyo, es
  una columna en `churches` y un campo en sus ajustes.
- **¿Y las notas privadas?** Ver D10. Se decide con la RFC 0004, que es donde
  la privacidad es el eje y no un extra.

## Modelo de datos

### 5.1 `believers` — lo que se le añade

```
Believer                          (ya existe; RFC 0002 §6)
├── id, church_id, congregation_id, first_name, last_name, phone, user_id
├── ministries → BelieverMinistry[]
│
├── status: text                  — activo | nuevo | inactivo | trasladado   (NUEVO)
├── search_name: text             — nombre completo en minúsculas y sin acentos (NUEVO, D14)
├── alert_after_days: int | null  — el margen. null = sin aviso              (NUEVO, D3)
├── last_note_at: date | null     — derivado de la última nota               (NUEVO, D4)
├── ← BelieverGift[]                                                          (NUEVO)
└── ← BelieverNote[]                                                          (NUEVO)

(se retira `is_active`: lo sustituye `status` — D2)
```

`status` es texto y no un `enum` de base de datos: en SQLite no hay tipo
`enum`, y un `enum` de Postgres se cambia con una migración por cada valor
nuevo. La lista vive en `packages/shared` y se valida ahí, que es donde la
comparten los cuatro clientes.

```ts
// packages/shared/src/schemas/believers.ts
export const BELIEVER_STATUSES = [
  'activo',
  'nuevo',
  'inactivo',
  'trasladado',
] as const;

/** A quién se le puede programar un turno: los que siguen viniendo (D2). */
export const SCHEDULABLE_STATUSES = ['activo', 'nuevo'] as const;

/** Los días de margen de serie. Sin él, cualquiera se pierde de vista (D3). */
export const DEFAULT_ALERT_AFTER_DAYS = 30;
```

### 5.2 `gifts` y `believer_gifts` — los dones

```
Gift                              — el catálogo de la iglesia (D5)
├── id: uuid
├── church_id → Church(id)
├── name: text                    — «sanidad», «discernimiento»
├── accent: text                  — token o #rrggbb, como las sedes
├── position: int                 — el orden en que se listan
├── is_system: boolean            — de serie: no se borra
├── is_active: boolean            — apagado deja de proponerse, sin perder historial
└── UNIQUE (church_id, name)

BelieverGift                      — quién tiene cuál
├── believer_id → Believer(id)
├── gift_id → Gift(id)
└── UNIQUE (believer_id, gift_id)
```

`believer_gifts` es la misma forma que `believer_ministries`: tabla puente con
las columnas de `BaseEntity` y un índice único. Se resuelve igual —se borra y
se vuelve a escribir el juego entero— porque son cuatro filas y el índice ya
impide repetir.

Los siete de serie se siembran con la migración para las iglesias que ya
existen, y para las que se creen después con **`GiftsService.ensureFor()`**,
que es el mismo patrón que `CongregationsService.ensureFor()` (RFC 0002): una
iglesia nueva no puede nacer sin catálogo, y resolverlo en el servicio evita
invertir la dependencia entre módulos.

El color sale de `ACCENT_PALETTE`, la misma paleta ampliada de las sedes: son
dieciséis tonos que ya cumplen contraste en claro y en oscuro (Regla 3), y
tener dos paletas es tener una que se queda vieja.

### 5.3 `believer_notes` — la bitácora

```
BelieverNote
├── id: uuid
├── church_id → Church(id)        — denormalizado, ver abajo
├── believer_id → Believer(id)
├── kind: text                    — seguimiento | testimonio | sueno | vision |
│                                   experiencia | don                        (D7)
├── occurred_at: date             — cuándo pasó, no cuándo se escribió       (D9)
├── told: text                    — lo que me contó. Lo único obligatorio    (D15)
├── advice: text | null           — la indicación dada                       (D15)
├── gift_id → Gift(id) | null     — obligatorio si kind = 'don'              (D8)
├── remind_at: timestamptz | null — cuándo acordarse. Con hora               (D16)
├── remind_text: text | null      — de qué acordarse                         (D16)
├── remind_done_at: ts | null     — cuándo se dio por atendido               (D16)
├── author_id → user(id) | null   — quién la escribió
├── ← NoteAudio[]                                                            (D18)
└── created_at / updated_at / deleted_at

NoteAudio                         — el fichero vive en disco; esto es su ficha
├── id, church_id, note_id
├── storage_key: text             — lo pone el servidor, nunca el cliente
├── mime_type: text               — audio/webm, audio/mp4, audio/ogg…
├── size_bytes: int               — tope 25 MB
├── duration_seconds: int | null  — si el navegador lo supo medir
└── recorded: boolean             — grabado aquí, o adjuntado ya hecho

ÍNDICES  (believer_id, occurred_at DESC)   — la bitácora
         (church_id, occurred_at DESC)     — las cuentas de la cabecera
         (church_id, remind_at)            — los recordatorios pendientes
```

`church_id` está duplicado a propósito: las cuentas de la cabecera y el filtro
de «pide atención» se resuelven sin unir con `believers`, y el guard de iglesia
activa comprueba una columna en vez de una relación. Es la misma decisión que
en `believer_ministries`, y el precio —mantenerlo al crear— se paga en un solo
sitio.

**Nada de Markdown.** Que el texto lleve negritas no lo necesita nadie y
complica el editor justo donde más se escribe.

**Los ficheros no van en la base de datos** (D18). Viven bajo `UPLOADS_PATH`,
que en Docker es un volumen, organizados por iglesia
(`<uploads>/<churchId>/<uuid>.<ext>`): el día que haya que exportar o borrar una
entera es una carpeta y no una consulta. Y **entran aparte en las copias de
seguridad**, que es el precio de tenerlos fuera.

### 5.4 Cómo se calcula el aviso

```
transcurridos = hoy − (last_note_at ?? fecha de alta)
margen        = alert_after_days
pide atención = margen !== null && transcurridos > margen
```

Sin ninguna nota se cuenta **desde el alta**, no desde el infinito: dar a
alguien de alta y no escribir nada en dos meses es exactamente el caso que hay
que ver.

Se calcula en el servidor —en la consulta del listado y en el resumen— y
también en el cliente para pintar la sonda. La regla vive en `shared`, una vez:

```ts
export function daysWithoutNote(believer: Believer, today: Date): number;
export function needsAttention(believer: Believer, today: Date): boolean;
```

## API

Todo bajo `ActiveChurchGuard`, como el resto de la iglesia activa.

| Método | Ruta                                  | Permiso            | Descripción                                 |
| ------ | ------------------------------------- | ------------------ | ------------------------------------------- |
| GET    | `/api/v1/believers`                   | `believers.view`   | Listado paginado, con filtros y orden       |
| GET    | `/api/v1/believers/summary`           | `believers.view`   | Las cuentas de la cabecera                  |
| POST   | `/api/v1/believers`                   | `believers.manage` | Alta                                        |
| GET    | `/api/v1/believers/:id`               | `believers.view`   | La ficha, con dones y sede                  |
| PATCH  | `/api/v1/believers/:id`               | `believers.manage` | Editar, incluidos estado, dones y margen    |
| DELETE | `/api/v1/believers/:id`               | `believers.manage` | Borrado lógico                              |
| PATCH  | `/api/v1/believers/congregation`      | `believers.manage` | Pone la misma sede a varios de una vez      |
| GET    | `/api/v1/believers/:id/notes`         | `believers.view`   | La bitácora, paginada y buscable (D19)      |
| GET    | `/api/v1/believers/:id/notes/days`    | `believers.view`   | Qué días tienen notas (la vista calendario) |
| POST   | `/api/v1/believers/:id/notes`         | `believers.manage` | Añadir nota                                 |
| PATCH  | `/api/v1/believers/:id/notes/:noteId` | `believers.manage` | Editar                                      |
| DELETE | `/api/v1/believers/:id/notes/:noteId` | `believers.manage` | Borrado lógico                              |
| GET    | `/api/v1/gifts`                       | `believers.view`   | El catálogo de la iglesia                   |
| POST   | `/api/v1/gifts`                       | `believers.manage` | Añadir uno                                  |
| PATCH  | `/api/v1/gifts/:id`                   | `believers.manage` | Renombrar, recolorear, activar o desactivar |
| DELETE | `/api/v1/gifts/:id`                   | `believers.manage` | Solo los que **no** son de serie (D5)       |
| POST   | `…/notes/:noteId/audios`              | `believers.manage` | Sube un audio grabado o adjuntado (D18)     |
| GET    | `/api/v1/audios/:id`                  | `believers.view`   | Lo descarga, si es de esta iglesia          |
| DELETE | `…/notes/:noteId/audios/:audioId`     | `believers.manage` | Lo quita y borra su fichero del disco       |

Las notas cuelgan de su creyente en la ruta (`/believers/:id/notes/:noteId`) y
no de una raíz `/notes`: así el alcance se comprueba una vez, al resolver el
creyente, y no hay forma de tocar la nota de otra iglesia.

### 6.1 `GET /believers` — la consulta

| Parámetro        | Valores                                       |
| ---------------- | --------------------------------------------- |
| `page`, `limit`  | Los de siempre (`paginationQuerySchema`)      |
| `search`         | Contra `search_name`, sin acentos (D14)       |
| `status`         | Repetible: `?status=activo&status=nuevo`      |
| `congregationId` | Una sede                                      |
| `giftId`         | Un don                                        |
| `attention`      | `true` deja solo a quien ha agotado su margen |
| `sort`           | `name` · `status` · `lastNote` · `createdAt`  |
| `order`          | `asc` · `desc`                                |

Respuesta: el `Paginated<BelieverListItem>` de siempre. El elemento del listado
lleva ya calculado lo que la fila necesita, para que la interfaz no vuelva a
pedir nada:

```ts
interface BelieverListItem extends Believer {
  status: BelieverStatus;
  alertAfterDays: number | null;
  lastNoteAt: string | null; // AAAA-MM-DD
  daysWithoutNote: number;
  needsAttention: boolean;
  gifts: Gift[]; // el don entero: nombre y color, para pintar la etiqueta
  notesCount: number;
}
```

**`sort=lastNote` es el orden interesante**: «quién lleva más sin que le
escriban». Los que no tienen ninguna nota van **primero**, no últimos
(`ORDER BY last_note_at ASC NULLS FIRST`; en SQLite, `NULL` ya ordena primero
en ascendente, así que el `NULLS FIRST` se pone solo en Postgres y se prueba en
los dos).

### 6.2 `GET /believers/summary`

```json
{
  "total": 128,
  "byStatus": { "activo": 96, "nuevo": 9, "inactivo": 18, "trasladado": 5 },
  "needsAttention": 6,
  "newThisMonth": 3
}
```

Una sola consulta con `COUNT` agrupado más dos condicionales. Es lo que
alimenta las cuentas de las pastillas de filtro (§7.2), así que se pide con el
listado y se invalida con él.

### 6.3 `POST /believers/:id/notes`

```json
{
  "kind": "don",
  "occurredAt": "2026-07-14",
  "told": "Pidió oración por su espalda",
  "advice": "Oramos por él y quedó bien",
  "giftId": "…",
  "remindAt": "2026-08-12T19:00",
  "remindText": "Preguntarle cómo sigue"
}
```

- `kind` se valida contra la constante; `giftId` es **obligatorio si y solo si**
  `kind === 'don'`, y se comprueba que ese don sea de esta iglesia.
- Al guardar, en la misma transacción: se escribe la nota, se recalcula
  `last_note_at` del creyente y, si es de tipo `don`, se le añade el don a la
  ficha si no lo tenía.
- Al borrar o al mover la fecha de una nota, se recalcula `last_note_at`. El
  don **no** se le quita: borrar la nota de cuando lo recibió no es dejar de
  tenerlo.

### 6.4 Errores

Los del filtro de siempre. Los propios de aquí:

| Situación                       | Código | Mensaje                                         |
| ------------------------------- | ------ | ----------------------------------------------- |
| Nota de tipo `don` sin `giftId` | 400    | «Elige qué don recibió»                         |
| Borrar un don de serie          | 400    | «Los dones de serie no se borran; desactívalos» |
| Don o creyente de otra iglesia  | 404    | «Esa persona no está en esta iglesia»           |
| Dos dones con el mismo nombre   | 400    | «Ya hay un don con ese nombre»                  |
| Recordatorio sin día y hora     | 400    | «El recordatorio necesita día y hora»           |
| Adjunto que no es un audio      | 400    | «Ese fichero no es un audio»                    |
| Audio de más de 25 MB           | 400    | «El audio es demasiado largo»                   |

## Interfaz

### 7.1 La dirección

Una pantalla de personas es de las que más fácil se quedan en plantilla:
círculo con iniciales, tabla gris, «+ Añadir» arriba a la derecha y cuatro
tarjetas de números encima. Aquí no (Regla 9), y el material para evitarlo lo
da la propia pregunta: esto **no es una agenda de contactos**, es un cuaderno
de a bordo. Lo que se quiere leer de un vistazo no es «quién está», es **con
quién se ha perdido el hilo**.

- **Elemento firma: la sonda** (§7.3). En una nave, la sonda mide cuánta agua
  queda bajo la quilla. Aquí mide **cuánto margen queda con esa persona**: una
  pista fina que se va llenando según pasan los días desde la última nota y que
  se desborda cuando se agota. Es un dato, no un adorno, y es lo único de la
  pantalla que se recuerda.

- **La cabecera es una frase, no un panel de indicadores.** «128 hermanos · 9
  nuevos este mes · **6 piden atención**». Cuatro tarjetas con un número grande
  y una etiqueta pequeña es exactamente la salida por defecto (Regla 9 §2), y
  además las cuentas se usan **para filtrar**, no para mirarlas: viven en las
  pastillas (§7.2), que llevan su número dentro. La métrica es la navegación.

- **Sin avatares.** No hay fotos, y un círculo con iniciales de color al azar
  es relleno que además compite con el color del don y con el de la sonda. En
  esta pantalla el color tiene un sitio: la sonda. El nombre sostiene la fila
  él solo.

- **Tipografía con saltos de verdad**: el nombre a 15 px en peso medio, la sede
  y el teléfono a 12 px en `muted`, los dones a 11 px, y todos los números con
  `tabular-nums` para que las columnas no bailen al paginar.

- **El estado nunca es solo un color**: pastilla con punto **y** texto (Regla 3
  §7).

- Una audacia por pantalla: la sonda. Lo demás —espaciados, bordes, estados—
  en voz baja y con los tokens de siempre.

### 7.2 Rutas, cabecera y filtros

| Ruta               | Qué es                                             |
| ------------------ | -------------------------------------------------- |
| `/believers`       | El listado. Es la pantalla principal de la sección |
| `/believers/:id`   | La ficha con su bitácora (D12)                     |
| `/believers/gifts` | El catálogo de dones (`believers.manage`)          |

Cabecera, en dos líneas:

1. Título «Creyentes», la frase de estado y, a la derecha, **«Añadir hermano»**.
2. La barra de filtros: buscador, pastillas de **estado con su cuenta**, sede,
   don, y la pastilla **«Piden atención (6)»** en tono `warning`.

Todo el filtro vive en la URL con `useTableQuery`, que ya existe: una búsqueda
concreta se comparte por enlace y el botón de atrás hace lo que se espera. La
**forma de verlo** no va en la URL sino en `navis.believersView`, como la
densidad del calendario: es una preferencia de quien mira, no del enlace que
manda.

### 7.3 La sonda

El elemento firma, y el que hay que hacer bien.

```
Juan Carlos Ruiz      ▬▬▬▬▬▬▬────────   hace 7 d
María Fernández       ▬▬▬▬▬▬▬▬▬▬▬▬▬▬  ⚠ hace 34 d
Andrés Molina         ──────────────    sin notas
```

- **Pista** de 3 px de alto, `bg-muted`, esquinas redondeadas. 72 px de ancho
  en la tabla; a lo ancho de la tarjeta en las fichas y en la ficha completa.
- **Relleno** proporcional a `transcurridos / margen`, tope al 100 % (no se
  sale de la pista):
  - hasta 0,7 → `bg-primary`
  - de 0,7 a 1 → `bg-warning`
  - por encima de 1 → `bg-destructive`
- **Etiqueta** a la derecha, `tabular-nums`: «hace 7 d». Desbordada, el texto
  pasa a `text-destructive` y se le antepone el icono `TriangleAlert`: **el
  color no informa solo**.
- **Sin margen** (`alertAfterDays = null`): no se pinta pista. Solo «hace 7 d»
  en `muted`. El aviso apagado se nota por ausencia, no por un gris más.
- **Sin ninguna nota**: pista vacía y el texto «sin notas» en `warning`. Es la
  llamada más fuerte de la pantalla y por eso no se disfraza de cero.
- **Accesibilidad**: la pista va `aria-hidden`; lo que lee un lector de
  pantalla es el texto, ampliado con `sr-only`: «Última nota hace 34 días;
  avisa a los 20».

**La animación de alerta.** Quien ha agotado su margen respira: la parte
desbordada de la pista pasa de `opacity: .55` a `1` y vuelta, 2,4 s,
`ease-in-out`, en bucle. Solo `opacity`, que el navegador resuelve en el
compositor, y **apagada por `prefers-reduced-motion`** desde `global.css`, como
todo lo demás (Regla 9 §5). El retardo se escalona por posición de la fila
(`animation-delay: calc(var(--fila) * 120ms)`) porque veinte cosas latiendo al
unísono se leen como un fallo de la pantalla y no como un aviso. Y la fila
lleva además un filete de 2 px en `bg-destructive` a la izquierda, que es lo
que se ve cuando la animación está apagada.

### 7.4 Las dos formas de verlo

Conmutador **Tabla / Fichas**, y solo aparece de `md` para arriba: por debajo
siempre fichas, porque una tabla de seis columnas en un teléfono se lee
desplazándose a lo ancho, que no es leerla (Regla 5 §2).

**Tabla** (`DataTable`, que ya existe y ya hace tabla arriba y lista de fichas
abajo):

| Columna   | De `md` | De `lg` | Notas                                      |
| --------- | :-----: | :-----: | ------------------------------------------ |
| Nombre    |    ✓    |    ✓    | Enlace a la ficha                          |
| Sede      |    ✓    |    ✓    | Punto del color de la sede + nombre        |
| Estado    |    ✓    |    ✓    | Pastilla                                   |
| Dones     |         |    ✓    | Hasta tres etiquetas y «+2»                |
| **Sonda** |    ✓    |    ✓    | Ordenable: es la columna que más se ordena |
| Acciones  |    ✓    |    ✓    | Menú, como en usuarios                     |

**Fichas**: `grid gap-4 sm:grid-cols-2 xl:grid-cols-3`. Cada tarjeta lleva el
nombre, la pastilla de estado, la sede, el teléfono como enlace `tel:`, los
dones como etiquetas de su color y **la sonda al pie, a todo lo ancho** — que
es donde mejor se lee, porque ahí sí hay sitio para la frase entera.

Las dos vistas comparten `Pagination` y las mismas acciones
(`believer-actions`), igual que la tabla de usuarios comparte `user-actions`
entre fila y ficha.

**Selección en lote, y solo para la sede.** Cada fila lleva su casilla y la
cabecera marca la página entera; al haber selección aparece una barra con el
desplegable de sedes y «Poner sede». Existe por un caso concreto: quien se da de
alta desde el selector de predicadores del calendario nace **sin sede** —allí no
se pregunta—, y ponérsela a treinta hermanos abriendo treinta fichas es la clase
de fricción que acaba en «ya lo haré». Es la **única** acción en lote a
propósito: borrar a veinte personas de un clic no es una comodidad, es un
accidente esperando.

### 7.5 La ficha — `/believers/:id`

Dos columnas de `lg` para arriba; una sola por debajo.

**Izquierda, pegajosa — quién es:**

- El nombre a 24 px, `tracking-[-0.02em]`.
- Pastilla de estado, sede con su punto, teléfono como enlace `tel:`.
- Los **dones** como etiquetas de su color, y un «+» para añadir.
- **La sonda a lo ancho**, con la frase completa: «Última nota el 14 de julio ·
  hace 21 días · avisa a los 20». Debajo, un enlace pequeño «Cambiar el aviso».
- Acciones: **«Añadir nota»** como acción principal (`size="lg"`, 48 px: es lo
  que más se pulsa y se pulsa de pie), «Editar» en secundario y el resto en
  menú.

**Derecha — la bitácora:**

- **Un buscador** y el conmutador de las cuatro vistas (D17). La búsqueda va al
  servidor, no al array ya cargado (D19).
- Pastillas de tipo con su cuenta: «Todo (37) · Seguimiento (21) · Testimonio
  (6) · Sueño (4) · Visión (2) · Experiencia (3) · Don (1)».
- **Vista «bitácora»**: las notas agrupadas **por mes**, con el mes en
  versalitas pequeñas y pegajoso al desplazar. Cada nota:

  ```
  ┃ ◆ TESTIMONIO · 14 jul
  ┃   Contó que llevaba dos años sin hablar con su hermano y…
  ┃   │ La indicación dada: que le llame esta semana
  ┃   🔔 Recordatorio el 12 ago, 19:00 · Preguntarle       Dar por hecho
  ┃   ▶ ──────── 1:24  Grabado aquí
  ┃   Cristian · hace 3 semanas
  ```

  Filete vertical de 2 px del color del tipo, el tipo en versalitas a 11 px con
  `tracking` abierto, la fecha al lado, **lo que contó** en `text-sm
leading-relaxed` y **la indicación** sangrada debajo, en `muted`, para que se
  distingan de un vistazo (D15). Después el recordatorio, si lo hay, y los
  audios con el reproductor del navegador. El pie, en `muted` y a 11 px.

- **Vista «lista»**: una línea por nota —cuándo, de qué va, lo que contó, la
  indicación—, truncadas. Es la de escanear un año, no la de leer.
- **Vista «fichas»**: cada nota en su tarjeta, en rejilla. Para leer varias en
  paralelo y para el teléfono.
- **Vista «calendario»**: el año en cuadraditos, uno por día, del color del
  tipo, con navegación de año y leyenda. Es la única que enseña **los huecos**.

- Al final, **«Ver más»** (D11). Se cargan de 20 en 20 con `useInfiniteQuery`.
- **Vacía**: «Todavía no hay nada escrito de {{name}}. La primera nota es la
  que hace que esto sirva.» y el botón de añadir. Una pantalla vacía invita a
  hacer algo (Regla 9 §6).

Los iconos de tipo, todos de lucide y ninguno que se lea como una cruz de lejos
(Regla 7 §6): seguimiento `MessageCircle`, testimonio `Quote`, sueño `Moon`,
visión `Eye`, experiencia `Flame`, don `Sprout` — un don que aparece es
crecimiento, no un paquete con lazo.

### 7.6 Alta, edición y la nota

Todo en `Dialog`, que ya existe.

**Alta / edición del hermano**: nombre, apellidos, teléfono, sede, estado,
dones (etiquetas que se encienden, con «crear uno nuevo» ahí mismo si se tiene
`believers.manage`) y el aviso: un interruptor «Avisar si pasan…» y un campo de
días que se propone con 30. Apagarlo es poner `null` (D3).

**Añadir nota**: el tipo primero, como seis pastillas con su icono —es lo que
decide el resto del formulario—; la fecha, con hoy puesto; **lo que me contó**,
que se lleva el foco al abrir porque es a lo que se viene; y **la indicación
dada**, opcional, porque a veces solo se escucha (D15). Si el tipo es
**«don»**, aparece el selector de don, obligatorio, con la nota «Se añadirá a
su ficha» (D8).

Debajo, dos cosas que no siempre hacen falta y por eso están plegadas:

- **El recordatorio** (D16): un interruptor que, al encenderse, abre día y hora
  —propuestos a una semana vista, a las 19:00— y de qué acordarse. En la
  bitácora aparece como una línea con su campana, y se da por hecho de un clic.
- **Los audios** (D18): «Grabar un audio», que usa el micrófono del navegador y
  enseña el cronómetro mientras graba, y «Adjuntar un audio» para uno ya hecho.
  Se quedan en memoria y **suben al guardar**, porque necesitan una nota a la
  que colgarse; mientras tanto la interfaz lo dice. Sin permiso de micrófono o
  sin `MediaRecorder`, se dice y queda el adjuntar, que siempre funciona.

Al guardar, `toast` con el mismo verbo que el botón: «Nota guardada», «{{name}}
en la lista», «Don añadido» (Regla 9 §6).

### 7.7 Los tres anchos

- **375 px**: fichas en una columna, filtros en un `Drawer` con el botón
  «Filtros (2)» que dice cuántos hay puestos. La sonda, a lo ancho. La acción
  principal, al alcance del pulgar.
- **768 px**: tabla sin la columna de dones, dos columnas en fichas, filtros en
  línea.
- **1280 px**: todo a la vista, y la ficha en sus dos columnas.

Comprobado además con el texto en alemán, que es el que rompe las pastillas
(Reglas 2 §9 y 5 §6), y sin scroll horizontal en ninguno de los tres.

### 7.8 Animación

Poca y con motivo (Regla 9 §5); solo `opacity` y `transform`.

- **Entrada del listado**: escalonada por fila, 40 ms entre una y otra, con el
  fundido corto que ya usa `PageTransition`. Se para a las doce primeras: más
  allá, la cascada solo hace esperar.
- **La sonda se llena** de 0 a su valor al entrar, 420 ms, `transform: scaleX`
  con origen a la izquierda. Solo en la primera pintura, no al refrescar: una
  tabla que se vuelve a llenar en cada `refetch` marea.
- **El latido del desbordado** (§7.3).
- **Al guardar una nota, la sonda se vacía** con la misma transición mientras
  la nota entra en la bitácora con un fundido. Es la confirmación de que se ha
  guardado y, de paso, es la tesis de la pantalla en un gesto: escribir de
  alguien es volver a tener margen con esa persona.
- Cambiar de vista (tabla ↔ fichas) es un fundido de 150 ms, sin
  desplazamiento: no se está yendo a otro sitio.

### 7.9 La app nativa queda fuera de esta versión

Igual que en la RFC 0002 §8.7. La pestaña «Creyentes» de móvil se queda con su
pantalla puente. Lo que se comparte cuando entre —el tipo, el esquema, los
hooks y las claves de traducción— ya se escribe compartido en esta entrega; el
JSX se escribirá dos veces, que es lo correcto (Regla 1 §2).

## Textos

Tres secciones nuevas o ampliadas en `packages/i18n/src/locales/`, en los seis
idiomas y en el mismo orden de claves en los seis (Regla 2 §5):

| Sección              | Qué lleva                                                                     |
| -------------------- | ----------------------------------------------------------------------------- |
| `believers.*`        | La pantalla: título, frase de cabecera, columnas, filtros, formulario, vacíos |
| `believers.status.*` | Los cuatro estados                                                            |
| `believers.alert.*`  | La sonda: «hace {{days}} d», «sin notas», «avisa a los {{days}}»…             |
| `notes.*`            | Los seis tipos, el formulario, la bitácora, los meses, «Ver más»              |
| `gifts.*`            | El catálogo: título, «De serie», «Añadir don», los errores                    |

Lo que **no** se traduce: el nombre de cada don (D6), que es dato de la
iglesia, igual que el nombre de una sede.

Las fechas salen de `Intl` con el idioma activo. Los «hace N días» también:
`Intl.RelativeTimeFormat`, no una cadena montada a mano.

## Migraciones

Tres, y las tres se prueban **en los dos motores** (Regla 4 §2).

1. **`AddBelieverStatus`** — añade `status` (por defecto `activo`),
   `search_name`, `alert_after_days` (por defecto 30) y `last_note_at`;
   rellena `status` desde `is_active` (`true → activo`, `false → inactivo`) y
   `search_name` desde el nombre; y **retira `is_active`**.
2. **`CreateGifts`** — `gifts` y `believer_gifts`, y siembra los siete de serie
   para cada iglesia que ya exista (D5).
3. **`CreateBelieverNotes`** — `believer_notes` con sus dos índices.
4. **`ReshapeBelieverNotes`** — parte el cuerpo en `told` y `advice`, retira
   `title` y `body` —el título viejo encabeza el texto, no se tira—, añade las
   tres columnas del recordatorio y crea `note_audios` (D15, D16, D18).

Y hay que tocar el mismo cambio en el resto del código que lee `is_active`:
`believers.service`, `preachers.service`, la semilla y los DTO. Se busca antes
de empezar, no después (Regla 8).

## Fases

Cada fase se termina entera —API, web, los seis idiomas y sus pruebas— antes de
empezar la siguiente. Una fase a medias en seis idiomas es lo mismo que una
fase sin hacer.

### Fase 1 — El modelo y la API

Migraciones, entidades, esquemas de `shared`, servicios y controladores de
creyentes, notas y dones. `daysWithoutNote` y `needsAttention` en `shared` con
sus tests. El listado paginado con todos sus filtros, y el resumen. El cambio
de `is_active` a `status` propagado al calendario. Tests unitarios de servicio
y e2e de la API en SQLite **y** en Postgres.

### Fase 2 — El listado en web

`/believers` con las dos vistas, los filtros en la URL, la paginación, las
pastillas con sus cuentas y **la sonda**. Hooks nuevos en
`packages/api-client`, claves en `queryKeys.believers`. Textos en los seis
idiomas.

### Fase 3 — La ficha y la bitácora

`/believers/:id`, el panel de identidad, el historial agrupado por mes con su
filtro de tipos y «Ver más», y el diálogo de nota con el caso de «don» (D8).

### Fase 4 — Escribir

Alta, edición, borrado con confirmación, el catálogo de dones en
`/believers/gifts`, los `toast` y los estados de error de cada formulario.

### Fase 5 — Rematar

Las animaciones de §7.8, los tres anchos, los dos temas, el alemán, e2e de
Playwright en los dos perfiles, y actualizar `docs/ESTADO.md` y `CLAUDE.md` con
lo que haya mordido.

## Pruebas

| Qué                                                            | Dónde                         |
| -------------------------------------------------------------- | ----------------------------- |
| `daysWithoutNote` y `needsAttention`, con los límites          | `packages/shared`             |
| `lastNoteAt` al crear, al mover la fecha y al borrar           | `believer-notes.service.test` |
| Una nota de tipo `don` añade el don y no lo duplica            | `believer-notes.service.test` |
| Borrar esa nota **no** le quita el don                         | `believer-notes.service.test` |
| «jesus» encuentra «Jesús» en los dos motores (D14)             | e2e de la API                 |
| Un don de serie no se puede borrar; uno propio sí              | `gifts.service.test`          |
| El orden `lastNote` pone primero a quien no tiene ninguna      | e2e de la API                 |
| Un creyente de otra iglesia da 404                             | e2e de la API                 |
| La lista pagina con 5.000 creyentes sin degradarse             | e2e de la API                 |
| La sonda se pinta en sus cuatro estados                        | `sonda.test.tsx`              |
| La fila desbordada lleva icono y texto, no solo color          | `sonda.test.tsx`              |
| Filtrar por «piden atención» y volver atrás conserva el filtro | Playwright                    |
| La ficha carga más notas al pulsar «Ver más»                   | Playwright                    |
| El recordatorio guarda día **y hora**, y se da por hecho       | `believer-notes.service.test` |
| Quitar el recordatorio lo deja sin marca de atendido           | `believer-notes.service.test` |
| La búsqueda de la bitácora encuentra en la indicación          | e2e de la API                 |
| Un audio sube, se descarga y cuelga de su nota                 | e2e de la API                 |
| Un fichero que no es audio no se guarda                        | e2e de la API                 |
| La bitácora se busca en el servidor, no en lo ya traído        | Playwright                    |
| Las cuatro vistas existen y la elegida se recuerda             | Playwright                    |

## Riesgos y trampas

- **Quitar `is_active` toca el calendario.** Es una columna que ya lee
  `preachers.service` y la semilla. Se busca con el grafo antes de tocar nada
  (Regla 8) y se corren los e2e del calendario después.
- **Quitar una columna en SQLite recrea la tabla.** TypeORM lo hace solo, pero
  se lleva por delante índices y valores por defecto si la migración no los
  vuelve a poner. Se comprueba con `DB_DRIVER=sqlite` **y** con `postgres`.
- **`last_note_at` es un dato derivado y por tanto se puede desincronizar.** Se
  escribe en un solo sitio y nunca desde otro servicio (D4). Si algún día hay
  importaciones masivas, harán falta un recálculo y su comando.
- **`NULLS FIRST` no existe en SQLite.** El orden por `lastNote` se escribe con
  cuidado y se prueba en los dos motores.
- **`IN ('')` contra una columna `uuid` revienta en Postgres** (CLAUDE.md): los
  filtros por sede y por don filtran los identificadores vacíos **antes** de la
  consulta.
- **Veinte filas latiendo a la vez es ruido, no aviso.** Retardo escalonado y
  `prefers-reduced-motion` (§7.3). Si al usarlo sigue siendo demasiado, la
  animación se queda solo en la ficha.
- **La bitácora con 10.000 notas y `OFFSET`.** Con el índice
  `(believer_id, occurred_at DESC)` aguanta de sobra el caso real. Si algún día
  no, se pasa a paginación por clave (`occurred_at, id`), que no cambia la
  interfaz.
- **El margen de aviso invita a jugar con él.** Bajarlo a 3 días para todo el
  mundo convierte la pantalla en un semáforo en rojo permanente y deja de
  informar. La copia del campo lo dice: «Cada cuánto quieres que te avise si no
  has escrito nada».

- **Los audios no están en la base de datos** (D18), así que **no entran en un
  volcado de Postgres**. La carpeta de `UPLOADS_PATH` —un volumen de Docker en
  el servidor— tiene que entrar aparte en las copias de seguridad. Es el precio
  de no engordar cada volcado con megas de voz, y está escrito aquí para que no
  se descubra el día que haga falta restaurar.
- **`MediaRecorder` solo funciona en contexto seguro.** En desarrollo va por
  `localhost` y en producción por HTTPS; en una IP de red local, no. Por eso
  adjuntar un fichero nunca se quita: es el camino que siempre funciona.
- **El nombre de un fichero subido no se usa jamás para escribir en disco.** La
  clave la genera el servidor y `AudioStorage` comprueba además que la ruta
  resuelta cae dentro de la carpeta. Un nombre venido de fuera es la puerta
  clásica al `../../etc/passwd`.

## Alternativas descartadas

- **Cuatro tarjetas de indicadores en la cabecera.** Es la salida por defecto
  (Regla 9 §2) y además separa el número del filtro. Las cuentas viven en las
  pastillas, que sí se pulsan.
- **Avatares con iniciales de colores.** Decoración que compite con los dos
  colores que sí significan algo aquí: el del don y el de la sonda.
- **Scroll infinito en el listado.** Rompe el botón de atrás, esconde el total
  y no se puede compartir por enlace (D11).
- **Panel lateral para la ficha.** Bien para un día del calendario; corto para
  una bitácora (D12).
- **Dones como texto libre.** «Sanidad» y «sanidad» acabarían siendo dos dones
  y el filtro dejaría de servir. Catálogo, como las labores.
- **`is_active` **y** `status` a la vez.** Dos fuentes de verdad (D2).
- **Un módulo de permisos `notes.*`.** Otra fila en la pantalla de roles para
  una distinción que hoy no pide nadie (D13).
- **Notas en Markdown.** Complica el editor justo donde más se escribe.
- **Un título en cada nota.** Lo que encabeza una nota es su tipo y su fecha;
  pedir además un titular era pedir trabajo que nadie iba a hacer (D15).
- **Una tabla de recordatorios aparte.** Un recordatorio siempre es _de_ algo
  que se habló: sin su nota no significa nada (D16).
- **Los audios dentro de la base de datos.** Simplificaría las copias, pero
  engorda cada volcado con megas que no se consultan nunca (D18).
- **`pg_trgm` y `unaccent` para la búsqueda.** Mejor en Postgres, inexistente
  en SQLite, y obliga a mantener dos búsquedas distintas. Una columna
  normalizada vale lo mismo en los dos (D14).
- **Un trabajo programado que mande el aviso por correo.** El aviso es una
  señal en pantalla; notificar es la RFC 0006.

## Criterios de aceptación

- [ ] El listado pagina en el servidor y se ve como tabla y como fichas, con la
      forma elegida recordada entre visitas.
- [ ] Buscar «jesus» encuentra «Jesús», en Postgres y en SQLite.
- [ ] Los filtros y la página van en la URL: se comparten por enlace y el botón
      de atrás funciona.
- [ ] Las pastillas enseñan su cuenta y filtran al pulsarlas.
- [ ] La sonda se pinta bien en sus cuatro casos: dentro de margen, cerca,
      desbordada y sin notas; y sin pista cuando el aviso está apagado.
- [ ] Quien ha agotado su margen se distingue **sin depender del color**:
      icono, texto y filete.
- [ ] Con `prefers-reduced-motion` no se mueve nada.
- [ ] Un hermano se crea, se edita, cambia de estado y se borra, con
      confirmación y con `toast`.
- [ ] Una nota se añade con su tipo, su fecha, lo que contó y la indicación;
      aparece en la bitácora y **la sonda se vacía** en el momento.
- [ ] Un recordatorio guarda día y hora, se ve en la bitácora y se da por hecho.
- [ ] Un audio se graba o se adjunta, sube al guardar y se escucha desde la
      nota; uno que no sea audio se rechaza.
- [ ] La bitácora se ve de cuatro formas y la elegida se recuerda.
- [ ] Buscar en la bitácora encuentra también en la indicación dada, y busca en
      todo el historial y no solo en lo ya cargado.
- [ ] Se puede poner la misma sede a varias personas de una vez.
- [ ] Una nota de tipo «don» añade el don a la ficha; borrarla no se lo quita.
- [ ] Un don de serie no se puede borrar; uno añadido por la iglesia, sí.
- [ ] La bitácora carga de 20 en 20 con «Ver más» y aguanta 10.000 notas.
- [ ] El listado pagina bien con 5.000 creyentes.
- [ ] Todos los textos están en los seis idiomas y se ven bien en claro y en
      oscuro, a 375, 768 y 1280 px, con el alemán puesto.
- [ ] `pnpm check` y `pnpm test:e2e` pasan; los e2e de la API, en los dos
      motores.
