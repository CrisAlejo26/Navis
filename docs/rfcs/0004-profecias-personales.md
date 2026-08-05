# RFC 0004: Profecías personales

- **Estado**: **Implementado** (API y web). Reescrito el 2026-08-05 sobre el
  borrador del 2026-08-03, que describía otra cosa. Queda pendiente la cobertura
  de Playwright: ver «Pruebas»
- **Fecha**: 2026-08-03 · reescrito e implementado el 2026-08-05
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). La app móvil queda fuera de esta versión — §7.9
- **Depende de**: nada. Y eso es la decisión central de este documento: es el
  primer módulo del proyecto que **no** cuelga de una iglesia (D1)

## Problema

Una palabra profética se recibe una vez y se comprueba durante años. Entre las
dos cosas hay un cuaderno que se pierde, una nota en el móvil que se borra al
cambiar de teléfono, y un recuerdo que se va deformando hasta que ya no se sabe
si aquello se dijo así.

Lo que se pierde no es el texto: es **la capacidad de mirar atrás y ver qué ha
pasado con lo que se recibió**. Cuántas siguen esperando. Cuántas se cumplieron
y cuándo. Cuáles se están cumpliendo a trozos, que es como se cumplen casi
todas y es justo lo que un estado de sí-o-no no sabe contar.

La pregunta que esta sección responde no es «¿qué me dijeron?». Es **«¿qué ha
pasado con lo que me dijeron?»**.

## Alcance

**Entra:**

- El registro de cada palabra: título, fecha en que se recibió, el texto entero
  y —si se cumplió— la fecha en que se cumplió.
- Los **cumplimientos parciales**: una profecía tiene partes, y cada parte se
  anota con su texto y su fecha, sin cerrar la profecía entera.
- La **portada** con las estadísticas: cuántas hay, cuántas esperan, cuántas se
  han cumplido, cuántas este año, la tasa de cumplimiento y el cumplimiento
  mes a mes.
- El **listado** con cuatro formas de verlo, búsqueda en el servidor, filtros
  por estado y por ventana de tiempo, y paginación en el servidor.
- La **ficha** de cada profecía con su historial de cumplimientos.
- API, web y escritorio, con los textos en los seis idiomas.

**No entra, y por qué:**

- **La app móvil.** Igual que en las RFC 0002 (§8.7) y 0003 (§7.9): la forma se
  asienta primero en web y la pestaña nativa entra después sin rehacer nada. El
  tipo, el esquema y los hooks ya se escriben compartidos en esta entrega; el
  JSX se escribirá dos veces, que es lo correcto (Regla 1 §2).
- **Adjuntos de audio o foto.** El borrador los proponía. La infraestructura ya
  existe —`AudioStorage` y `note_audios` de la RFC 0003 D18—, así que añadirlos
  después es barato y no condiciona nada de lo que se decide aquí. Nadie los ha
  pedido todavía.
- **Enlazar una profecía con un creyente.** El borrador lo dejaba abierto con
  un problema de consentimiento sin resolver. Con D1 el problema desaparece por
  construcción: aquí no hay datos de terceros porque no hay iglesia. Si algún
  día se quiere «¿qué se ha profetizado sobre esta persona?», es otra cosa y es
  otro documento — con su propia conversación sobre consentimiento.
- **Cifrado en reposo.** Ver «Preguntas abiertas». No se promete lo que no se
  va a implementar en esta entrega.
- **Búsqueda semántica con IA.** Es el mejor caso de uso del microservicio
  Python con embeddings locales, y sigue siéndolo. Pero primero hace falta que
  haya profecías que buscar.
- **Compartir una profecía con alguien.** Todo lo de este módulo es privado por
  construcción (D1). Un «compartir» abre el modelo entero y merece su propio
  documento.

## Vocabulario

El mismo en el código, en la interfaz y en las traducciones:

| Término                  | Qué es                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| **Profecía**             | Una palabra recibida, con su fecha y su texto                            |
| **Recibida**             | La fecha en que se recibió. Es la que ordena todo                        |
| **Cumplida**             | Tiene fecha de cumplimiento: se acabó de cumplir                         |
| **En camino**            | No está cumplida, pero ya tiene algún cumplimiento parcial anotado       |
| **En espera**            | Ni cumplida ni en camino: no ha pasado nada todavía                      |
| **Cumplimiento**         | Una parte que ya se cumplió, con su texto y su fecha                     |
| **Tasa de cumplimiento** | Cumplidas ÷ totales. Es un porcentaje, no un cumplimiento                |
| **La travesía**          | La vista que enseña cada profecía como un trayecto en el tiempo (§7.5)   |
| **La espera**            | Los días que lleva una profecía sin cumplirse. Es lo que mide la portada |

En inglés, dentro del código: `prophecy`, `receivedAt`, `fulfilledAt`,
`fulfillment`, `fulfillmentRate`, `state`, `waitingDays`.

Un aviso sobre dos palabras que se parecen: **«cumplimiento»** (contable: «tres
cumplimientos») es una parte anotada, y **«tasa de cumplimiento»** es el
porcentaje. En el código no se confunden nunca porque una es `fulfillments` y la
otra `fulfillmentRate`; en la copia, la tasa lleva siempre la palabra «tasa».

## Decisiones tomadas

- **D1 — Una profecía es de un usuario, no de una iglesia.** Es la decisión de
  la que cuelga todo lo demás y va **al revés que el resto del proyecto**. No
  hay `church_id`, no pasa por `ActiveChurchGuard`, no aparece en el selector de
  iglesia y no se ve afectada al cambiar de espacio de trabajo. Si mañana
  alguien entra en otra iglesia, o en ninguna, sus profecías siguen siendo las
  suyas y las mismas.

  El filtro por `owner_id` va **en el repositorio, no en el controlador**: un
  endpoint nuevo que se olvide del filtro no debe poder existir. En la práctica,
  un único `ProphecyRepository` con métodos que **exigen el `ownerId` como
  primer parámetro**, y ningún acceso a `Repository<Prophecy>` fuera de él.

- **D2 — Se retiran los permisos `prophecies.*` de los roles de iglesia.** Hoy
  existen `prophecies.view` y `prophecies.manage` en
  `packages/shared/src/permissions.ts`, la entrada de navegación los exige y
  `role-permissions.ts` se los da a algunos roles. Con D1 eso es un fallo de
  producto: alguien cuyo rol en su iglesia no incluya `prophecies.view` no
  podría ver **sus propias profecías privadas**, y un administrador podría
  creer que al concederlos está viendo las de otro. Se van los dos permisos, la
  entrada de navegación pierde su `permission` —basta con tener sesión— y una
  migración los quita de los roles que ya los tuvieran.

  No se sustituyen por otros. La autorización aquí es una sola regla y no es
  configurable: **eres el dueño o no lo eres**.

- **D3 — El estado se deriva; no hay columna `status`.** Se guarda
  `fulfilled_at` y se guardan los cumplimientos; el estado sale de los dos:

  ```
  cumplida    si fulfilled_at != null
  en camino   si fulfilled_at == null y tiene al menos un cumplimiento
  en espera   en cualquier otro caso
  ```

  Una columna de estado **además** de esos datos serían dos fuentes de verdad
  que se desincronizan a la primera —es la misma decisión que la D2 de la RFC
  0003 con `is_active` y `status`—. Marcar como cumplida es poner una fecha, y
  desmarcarla es quitarla; no hay un tercer sitio que actualizar. El estado se
  calcula en `shared` y se comparte:

  ```ts
  export function prophecyState(p: Prophecy): ProphecyState;
  export function waitingDays(p: Prophecy, today: Date): number;
  ```

- **D4 — Los cumplimientos parciales son una tabla hija, no un campo de
  texto.** Cada uno tiene su texto y su fecha propia, y hacen falta separados
  para tres cosas que un `fulfillmentNotes` de texto libre no puede dar: contar
  cuántas profecías van «en camino», ordenar por el último movimiento, y pintar
  las marcas de la travesía (§7.5). El borrador tenía un campo de texto; se
  retira.

- **D5 — Las fechas son `date`, no `timestamptz`.** Lo que se recibió el 14 de
  julio se recibió el 14 de julio en cualquier huso. Es la misma decisión de la
  RFC 0002 §5.5 y la 0003 D9, y arrastra la misma trampa ya conocida: una
  columna `date` leída en crudo desde Postgres vuelve como `Date` a medianoche
  local, así que se convierte con `apps/api/src/database/iso-day.ts` y en
  ningún otro sitio.

- **D6 — Marcar como cumplida abre la fecha ahí mismo, y se propone hoy.**
  Un interruptor «Ya se cumplió» que, al encenderse, despliega el campo de
  fecha con el día de hoy puesto. Apagarlo borra la fecha y devuelve la profecía
  a su estado anterior —«en camino» si tiene cumplimientos, «en espera» si no—,
  y los cumplimientos parciales **no se tocan**: que se cierre entera no borra
  lo que se fue cumpliendo por el camino, igual que borrar una nota de tipo
  «don» no le quita el don a nadie (RFC 0003 §6.3).

- **D7 — La fecha de cumplimiento no puede ser anterior a la de recepción**, y
  la de un cumplimiento parcial tampoco. Se valida en el DTO y en el esquema de
  `shared`, y el mensaje dice qué pasa: «No puede haberse cumplido antes de
  recibirse». Fechas en el futuro sí se aceptan: alguien puede estar anotando
  algo con la fecha del día que viene y no es asunto de la aplicación
  discutírselo.

- **D8 — recharts, y envuelto.** Se añade `recharts` a `apps/web`. Es una
  decisión tomada a sabiendas del riesgo: **los gráficos de recharts se
  reconocen a distancia**, y esta es la pantalla donde la Regla 9 se juega más.
  Se compensa con tres cosas, que no son opcionales:

  1. **Ninguna pantalla importa `recharts`.** Se importa solo dentro de
     `apps/web/src/components/prophecies/charts/`, que expone componentes
     propios (`<CumplimientoMensual>`, `<AnilloDeTasa>`, `<Sparkline>`). Es un
     solo sitio donde cambiarlo si algún día se cambia (Regla 1).
  2. **Nada de los valores por defecto**: sin `CartesianGrid`, sin `Legend`
     automática, sin tooltip de la librería —`content={<TooltipPropio />}`—,
     ejes sin línea, ticks a 11 px en `muted` y con `tabular-nums`.
  3. **Los colores salen de `themeColorsHex`** (Regla 3 §5): recharts no
     entiende `oklch`, así que ni una clase de Tailwind ni un hexadecimal a ojo.
     Y se vuelven a leer al cambiar de tema, o los gráficos se quedan con los
     colores del tema anterior.

  Además, **carga diferida**: `React.lazy` sobre el módulo de gráficos, para que
  los ~100 kB de recharts no entren en el bundle inicial de una aplicación en la
  que la mayoría de las pantallas no tienen ni un gráfico. Mientras carga, el
  esqueleto que ya existe.

- **D9 — La portada y el listado son dos rutas.** `/prophecies` es la portada
  con las estadísticas; `/prophecies/list` es el listado con sus cuatro vistas;
  `/prophecies/:id` es la ficha. Que la portada y el listado sean la misma ruta
  con una pestaña obligaría a cargar los dos juegos de datos siempre, y la
  gracia de la portada es justo que **se entra a ella y se sale hacia algún
  sitio**.

- **D10 — Cada tarjeta de la portada es un filtro, no un adorno.** La RFC 0003
  §7.1 descartó «cuatro tarjetas con un número grande» por genéricas, y tiene
  razón. Aquí hay tarjetas porque se han pedido, pero se ganan el sitio
  cumpliendo dos condiciones: **llevan a algún lado** —cada una abre el listado
  ya filtrado, con el filtro puesto en la URL— y **enseñan forma, no solo un
  número** (una sparkline, un anillo, una barra de reparto). Un número grande
  que no se puede pulsar y no dice cómo ha llegado ahí es mobiliario.

- **D11 — Cuatro formas de ver el listado**, y la elegida se recuerda en
  `navis.propheciesView`, como la del calendario y la de creyentes: es
  preferencia de quien mira, no del enlace que se comparte. Los filtros sí van
  en la URL (D12).

- **D12 — Filtros y página en la URL, con `useTableQuery`.** Ya existe y ya
  valida lo que llega de fuera. Se comparte por enlace y el botón de atrás hace
  lo que se espera.

- **D13 — La búsqueda se resuelve en el servidor.** El listado se pagina, así
  que buscar en el cliente solo encontraría lo ya traído — es la misma decisión
  que la D19 de la RFC 0003. Busca en el título, en el cuerpo y en el texto de
  los cumplimientos. Contra una columna normalizada `search_text` (minúsculas y
  sin acentos, calculada al guardar), por el mismo motivo que la D14 de la 0003:
  vale igual en Postgres y en SQLite, sin `unaccent` ni `pg_trgm`.

- **D14 — Las estadísticas van en un endpoint propio**, `/prophecies/stats`, y
  no se derivan en el cliente a partir del listado paginado: la página 1 no sabe
  nada de las otras 400. Una sola consulta con agregados.

- **D15 — El listado se reutiliza de creyentes, la portada no.** `DataTable`,
  `Pagination`, `SortableColumns`, `useTableQuery`, `Chip`, `Badge`, `Drawer` y
  `EmptyState` se usan tal cual: ya hacen tabla arriba y fichas abajo, ya tienen
  esqueleto, estado vacío y de error. Lo que **no** se copia es la sonda: mide
  otra cosa (el margen sin escribir de una persona) y aquí significaría algo
  distinto con la misma forma, que es peor que no tenerla.

- **D20 — La acción principal de la ficha cambia con el estado.** Se entra a la
  ficha a dos cosas: releer y **marcar que ya se cumplió**. Hacer lo segundo
  pasar por el formulario de edición —con su título, su fecha de recepción y sus
  doce filas de texto— era pedir cuatro pasos para uno. Mientras sigue abierta,
  el botón grande es «Ya se cumplió» y abre un diálogo de **un solo campo**; una
  vez cerrada, ese botón no tiene sentido y su sitio lo ocupa «Volver a
  abrirla», que es lo único que se puede querer hacer entonces.

- **D21 — La ficha se lee de cuatro formas, y ninguna es una variante de otra.**
  Bitácora responde «qué ha pasado, en orden»; Lectura, «déjame releerla
  entera»; Recorrido, «cuándo pasó cada cosa»; Fichas, «enséñamelo todo a la
  vez». Si dos se parecieran, sobraría una — el listado tiene sus cuatro por el
  mismo criterio (D11).

### Preguntas abiertas

- **¿Cifrado en reposo?** El borrador lo prometía. Hacerlo de verdad —cifrado
  por usuario, con la clave fuera de la base de datos— cambia el modelo de
  despliegue, rompe la búsqueda en el servidor (D13) y obliga a resolver qué
  pasa cuando alguien pierde la clave. No entra aquí. Lo que sí se hace es
  dejarlo escrito: **hoy un administrador de la base de datos puede leer estas
  filas**, y quien despliegue esto en un servidor compartido tiene que saberlo.
- **¿Archivar?** El borrador tenía un estado `archivada`. No se ha pedido y con
  D3 no cabe en el modelo derivado. Si hace falta, es una columna
  `archived_at`, no un quinto estado.
- **¿Recordatorios?** Las notas de creyentes los tienen (RFC 0003 D16). Aquí
  encajarían —«volver a mirar esto en un año»— pero nadie los ha pedido y traen
  su propia pantalla de vencidos.

## Modelo de datos

### 5.1 `prophecies`

```
Prophecy
├── id: uuid
├── owner_id → user(id)           — de quién es. NO hay church_id (D1)
├── title: text                   — obligatorio
├── body: text                    — la palabra, entera. Obligatorio
├── search_text: text             — título + cuerpo, en minúsculas y sin acentos (D13)
├── received_at: date             — cuándo se recibió                      (D5)
├── fulfilled_at: date | null     — cuándo se acabó de cumplir             (D3, D6)
├── last_fulfillment_at: date|null— derivado: el último cumplimiento parcial
├── ← ProphecyFulfillment[]
└── created_at / updated_at / deleted_at        (BaseEntity)

ProphecyFulfillment                — una parte que ya se cumplió           (D4)
├── id: uuid
├── prophecy_id → Prophecy(id)
├── owner_id → user(id)           — denormalizado, ver abajo
├── text: text                    — qué parte se cumplió. Obligatorio
├── occurred_at: date             — cuándo
└── created_at / updated_at / deleted_at

ÍNDICES  (owner_id, received_at DESC)        — el listado
         (owner_id, fulfilled_at)            — las cuentas y el filtro de estado
         (prophecy_id, occurred_at DESC)     — los cumplimientos de una ficha
```

`owner_id` está duplicado en `prophecy_fulfillments` a propósito, por el mismo
motivo que `church_id` en `believer_notes` (RFC 0003 §5.3): el repositorio
comprueba una columna en vez de unir con la tabla padre, y así **la regla de D1
se cumple también en la tabla hija sin depender de que alguien se acuerde de
hacer el `JOIN`**. El precio —mantenerlo al crear— se paga en un solo sitio.

`last_fulfillment_at` es derivado y por tanto se puede desincronizar; se aplica
la misma disciplina que a `last_note_at` (RFC 0003 D4): **se escribe en un solo
servicio**, al crear, al mover la fecha y al borrar un cumplimiento, y nunca
desde fuera. Existe para poder ordenar por «lo último que se movió» sin un
`MAX()` correlacionado en cada fila del listado.

No hay `enum` en la base de datos: en SQLite no existe y en Postgres cada valor
nuevo es una migración. Y aquí, además, **no haría falta ninguno** — el estado
se deriva (D3).

### 5.2 Lo que se comparte en `packages/shared`

```ts
// packages/shared/src/schemas/prophecies.ts
export const PROPHECY_STATES = ['espera', 'camino', 'cumplida'] as const;
export type ProphecyState = (typeof PROPHECY_STATES)[number];

/** Las ventanas de tiempo del filtro (D12). */
export const PROPHECY_WINDOWS = ['7d', '30d', 'year', 'all'] as const;
```

Y las dos funciones de D3, con sus tests: `prophecyState` y `waitingDays`. La
regla vive **una vez** y la usan el servidor —para las cuentas— y el cliente
—para pintar—, que es lo mismo que se hizo con `needsAttention`.

## API

Todo bajo sesión, y **nada bajo `ActiveChurchGuard`** (D1). El `ownerId` sale
de `@CurrentUser('id')`, nunca del cuerpo ni de la URL.

| Método | Ruta                                       | Descripción                           |
| ------ | ------------------------------------------ | ------------------------------------- |
| GET    | `/api/v1/prophecies`                       | Listado paginado, con filtros y orden |
| GET    | `/api/v1/prophecies/stats`                 | Las estadísticas de la portada        |
| POST   | `/api/v1/prophecies`                       | Crear                                 |
| GET    | `/api/v1/prophecies/:id`                   | La ficha, con sus cumplimientos       |
| PATCH  | `/api/v1/prophecies/:id`                   | Editar, incluido marcar cumplida      |
| DELETE | `/api/v1/prophecies/:id`                   | Borrado lógico                        |
| POST   | `/api/v1/prophecies/:id/fulfillments`      | Añadir un cumplimiento parcial        |
| PATCH  | `/api/v1/prophecies/:id/fulfillments/:fid` | Editar uno                            |
| DELETE | `/api/v1/prophecies/:id/fulfillments/:fid` | Borrarlo                              |

Los cumplimientos cuelgan de su profecía en la ruta y no de una raíz
`/fulfillments`, por lo mismo que las notas en la RFC 0003: el alcance se
comprueba una vez, al resolver la profecía, y no hay forma de tocar el
cumplimiento de otra persona.

**Una profecía que no es tuya da 404, no 403.** Un 403 confirmaría que existe.

### 6.1 `GET /prophecies` — la consulta

| Parámetro       | Valores                                             |
| --------------- | --------------------------------------------------- |
| `page`, `limit` | Los de siempre (`paginationQuerySchema`)            |
| `search`        | Contra `search_text`, sin acentos (D13)             |
| `state`         | Repetible: `?state=espera&state=camino`             |
| `window`        | `7d` · `30d` · `year` · `all` — sobre `received_at` |
| `from`, `to`    | Ventana a medida, si `window` no llega              |
| `sort`          | `received` · `fulfilled` · `title` · `lastMovement` |
| `order`         | `asc` · `desc`                                      |

El elemento del listado trae ya calculado lo que la fila necesita, para que la
interfaz no vuelva a pedir nada:

```ts
interface ProphecyListItem {
  id: string;
  title: string;
  excerpt: string; // las primeras ~160 letras del cuerpo, cortadas en palabra
  receivedAt: string; // AAAA-MM-DD
  fulfilledAt: string | null;
  lastFulfillmentAt: string | null;
  state: ProphecyState;
  waitingDays: number; // días entre recibida y cumplida (o hasta hoy)
  fulfillmentsCount: number;
}
```

`excerpt` se calcula en el servidor y no se manda el cuerpo entero: una página
de 20 profecías largas serían cientos de kilobytes para pintar tres líneas.

**El filtro por estado se traduce a SQL, no se filtra en memoria** (D3):
`espera` es `fulfilled_at IS NULL AND last_fulfillment_at IS NULL`, `camino` es
`fulfilled_at IS NULL AND last_fulfillment_at IS NOT NULL`, y `cumplida` es
`fulfilled_at IS NOT NULL`.

### 6.2 `GET /prophecies/stats`

```json
{
  "total": 47,
  "byState": { "espera": 22, "camino": 9, "cumplida": 16 },
  "fulfilledThisYear": 5,
  "receivedThisYear": 11,
  "fulfillmentRate": 0.34,
  "medianWaitingDays": 214,
  "monthly": [
    { "month": "2026-01", "received": 2, "fulfilled": 1 },
    { "month": "2026-02", "received": 0, "fulfilled": 2 }
  ],
  "longestWaiting": { "id": "…", "title": "…", "waitingDays": 1840 }
}
```

- `monthly` cubre **los últimos doce meses**, con los meses vacíos incluidos y
  a cero: un gráfico al que le faltan los meses sin datos miente sobre la forma.
- `fulfillmentRate` es `cumplidas / total`, y con `total = 0` es `null`, no `0`.
  Cero por ciento y «todavía no hay nada» son cosas distintas y se pintan
  distinto.
- `medianWaitingDays` es la mediana y no la media: una sola profecía de quince
  años desplaza la media y deja de describir el caso normal.
- `longestWaiting` es la que más lleva esperando, y es el dato con el que se
  entra al listado desde la portada.

### 6.3 Errores

| Situación                              | Código | Mensaje                                          |
| -------------------------------------- | ------ | ------------------------------------------------ |
| Profecía de otro usuario               | 404    | «Esa profecía no existe»                         |
| Cumplida antes de recibida (D7)        | 400    | «No puede haberse cumplido antes de recibirse»   |
| Cumplimiento parcial antes de recibida | 400    | «Eso es anterior a la fecha en que la recibiste» |
| Título o cuerpo vacíos                 | 400    | «La profecía necesita un título y un texto»      |
| Cumplimiento sin texto                 | 400    | «Escribe qué parte se ha cumplido»               |

## Interfaz

### 7.1 La dirección

Esta pantalla tiene dos maneras seguras de salir mal: el **panel de indicadores
genérico** —cuatro tarjetas, un donut y una línea— y el **místico de plantilla**
—morados, destellos, degradados de aurora—. Las dos serían de otro producto
(Regla 9), y la segunda además trata el contenido como decoración.

La dirección es la contraria y sale del propio material: una profecía es un
**rumbo puesto en la carta**. Se recibe en un punto, se navega, y algún día se
llega — o todavía no. Lo que esta sección tiene que dejar ver de un vistazo es
**el tiempo transcurrido**, que es la única magnitud que de verdad importa aquí.

- **Elemento firma: la travesía** (§7.5). Cada profecía es un trayecto
  horizontal en el tiempo: empieza el día que se recibió, lleva una marca por
  cada cumplimiento parcial y se cierra el día que se cumplió. Las que siguen
  en espera **no terminan**: se desvanecen hacia el borde derecho, que es hoy.
  Es un dato, no un adorno, y es lo que se recuerda de la pantalla.
- **Una audacia por pantalla.** La travesía en el listado; en la portada, el
  anillo de la tasa. Lo demás en voz baja: espaciados regulares, tipografía
  sobria, tokens de siempre.
- **Los degradados se ganan el sitio o no van.** Se permiten en las tarjetas de
  la portada, construidos **entre dos tokens** (`from-primary/12 to-brand/5`), y
  nunca como fondo de pantalla. Un degradado que no separa nada de nada es
  relleno (Regla 9 §2).
- **Nada de emoji, nada que se lea como una cruz de lejos** (Regla 7 §6). Los
  iconos, de lucide: `Sparkles` ya es el de la sección, `Anchor` para lo
  cumplido, `Waves` para lo que sigue en camino, `Hourglass` para la espera.
- **Tipografía con saltos de verdad**: el título de una profecía a 15 px en peso
  medio, el extracto a 13 px en `muted`, las fechas a 12 px con `tabular-nums`
  para que las columnas no bailen al paginar.
- **El estado nunca es solo un color**: pastilla con icono **y** texto
  (Regla 3 §7).

### 7.2 Rutas

| Ruta               | Qué es                                      |
| ------------------ | ------------------------------------------- |
| `/prophecies`      | La portada: estadísticas y tarjetas         |
| `/prophecies/list` | El listado, con sus cuatro vistas           |
| `/prophecies/:id`  | La ficha, con su historial de cumplimientos |

La entrada de navegación deja de exigir `prophecies.view` (D2) y se queda en el
bloque `general`, que es el que **no** depende de la iglesia activa — que es
exactamente lo que esta sección es.

### 7.3 La portada — `/prophecies`

Una frase de cabecera, no un titular vacío: **«47 palabras · 22 esperan · 16
cumplidas»**. Debajo, la rejilla: `grid gap-4 sm:grid-cols-2 xl:grid-cols-3`.

**Las tarjetas** (D10). Cada una lleva a `/prophecies/list` con su filtro ya
puesto en la URL, y cada una enseña forma además del número:

| Tarjeta                  | Qué enseña                                            | A dónde lleva                 |
| ------------------------ | ----------------------------------------------------- | ----------------------------- |
| **Todas**                | El total, y una barra de reparto de los tres estados  | `?state=` (sin filtro)        |
| **En espera**            | El número, y la que más lleva esperando, con sus días | `?state=espera`               |
| **En camino**            | El número, y cuántos cumplimientos parciales hay      | `?state=camino`               |
| **Cumplidas este año**   | El número, y una sparkline de los doce meses          | `?state=cumplida&window=year` |
| **Tasa de cumplimiento** | El anillo, con el porcentaje dentro                   | `?state=cumplida`             |
| **Espera típica**        | La mediana en días, en lenguaje natural               | `?sort=received&order=asc`    |

La **tarjeta grande** es la de la tasa, y ocupa dos columnas de `sm` para
arriba. Fondo con el degradado entre tokens, el anillo a la izquierda y a la
derecha el reparto en tres cifras. El anillo se dibuja con un `<circle>` y
`stroke-dasharray`, no con un donut de la librería: es una sola cifra y
merecía cincuenta líneas propias antes que un componente genérico.

**El gráfico**: cumplimiento mes a mes de los últimos doce, dos series
—recibidas y cumplidas— sobre el mismo eje. Es donde de verdad se ve el ritmo:
años en los que llegaron muchas y años en los que se cumplieron. Con
`recharts`, envuelto y desnudado según D8.

**Vacía**: si no hay ninguna profecía, la portada no enseña seis tarjetas a
cero. Enseña una sola cosa —«Todavía no has apuntado ninguna palabra. La
primera es la que hace que esto sirva.»— y el botón de añadir (Regla 9 §6).

### 7.4 El listado — `/prophecies/list`

**Cabecera**: la frase, y a la derecha **«Apuntar una palabra»** (`size="lg"`,
48 px: es la acción principal y se pulsa de pie — Regla 5 §4).

**La barra de filtros**, toda en la URL:

- Buscador (D13).
- Pastillas de **estado con su cuenta**: «En espera (22) · En camino (9) ·
  Cumplidas (16)».
- Pastillas de **ventana**: «7 días · 30 días · Este año · Todo». Se aplican
  sobre la fecha de recepción.
- El conmutador de las cuatro vistas, a la derecha.

A 375 px los filtros se van a un `Drawer` con el botón «Filtros (2)», que dice
cuántos hay puestos — igual que en creyentes (RFC 0003 §7.7).

### 7.5 Las cuatro vistas (D11)

1. **Travesía** — la de serie, y el elemento firma. Un eje de tiempo compartido
   arriba (años o meses según el rango) y una línea por profecía:

   ```
   2019          2021          2023          2025      hoy
     ├────●─────────●───────────────────────────▶  Sanidad de mi madre
     ├──────────────────────────────◆              La casa
     ├────●────────────────────────────────────▶  El ministerio de …
   ```

   El punto de salida es la fecha en que se recibió; los `●` son cumplimientos
   parciales; el `◆` cierra la que se cumplió; la flecha desvanecida al borde
   derecho es la que sigue esperando. Se ordena por fecha de recepción y se
   puede invertir. **Es la única vista que enseña la espera como longitud**, que
   es la tesis de la sección.

   Accesibilidad: el trazado va `aria-hidden` y cada fila lleva su texto real,
   ampliado con `sr-only`: «Recibida el 3 de marzo de 2019, dos cumplimientos
   parciales, todavía en espera; 2.617 días».

2. **Tabla** — `DataTable` tal cual (D15). Columnas: Título (enlace a la
   ficha) · Recibida · Estado · Cumplimientos · Espera · Acciones. Ordenable
   por las cuatro primeras con `SortableColumns`. De `md` para abajo, la propia
   `DataTable` ya cambia a lista de fichas.

3. **Fichas** — `grid gap-4 sm:grid-cols-2 xl:grid-cols-3`. Título, pastilla de
   estado, el extracto a tres líneas, las fechas al pie y el número de
   cumplimientos.

4. **Año** — los doce meses en cuadrícula, cada profecía como un punto en su
   mes: las recibidas en `primary`, las cumplidas en `success`. Igual que la
   vista de calendario de la bitácora (RFC 0003 D17), **es la que enseña lo que
   no hay**: los años en blanco.

La vista elegida se recuerda en `navis.propheciesView` (D11).

### 7.6 La ficha — `/prophecies/:id`

Dos columnas de `lg` para arriba; una sola por debajo.

**Izquierda, pegajosa:**

- El título a 24 px, `tracking-[-0.02em]`.
- La pastilla de estado con su icono.
- **La espera**, en una línea que dice lo que hay que saber: «Recibida el 3 de
  marzo de 2019 · 2.617 días esperando», o «Cumplida el 12 de mayo de 2024 ·
  esperó 1.896 días».
- **La acción principal cambia con el estado** (D20). Mientras sigue abierta es
  **«Ya se cumplió»**, que abre un diálogo de **un solo campo** —la fecha, con
  hoy puesto—; una vez cerrada, su sitio lo ocupa «Volver a abrirla». Debajo,
  «Anotar un cumplimiento», «Editar» y el borrado.

**Derecha, en cuatro vistas** (D21). El conmutador va arriba a la derecha, y la
elegida se recuerda en `navis.prophecyView`:

1. **Bitácora** — el texto entero y, debajo, los cumplimientos hacia atrás,
   unidos por un filete vertical que los enhebra: se leen como una secuencia
   porque lo son. Es la de serie.
2. **Lectura** — solo el texto, a 17 px y con más interlínea, sin la lista.
   Para releer la promesa entera sin nada alrededor.
3. **Recorrido** — el trayecto de **esta** profecía en el tiempo, con su eje de
   años y una marca por cumplimiento; debajo, cada uno anclado a su fecha.
   Reutiliza el mismo trazado que la travesía del listado, no otro (Regla 1).
4. **Fichas** — cada cumplimiento en su tarjeta, en rejilla. Para verlos todos
   a la vez cuando hay diez o quince.

El texto va con `max-w-prose`: es lo que se viene a releer y merece un ancho de
lectura cómodo (Regla 5 §3). Sin Markdown, por lo mismo que las notas.

- **Vacío**: «Todavía no has anotado nada de esta profecía. Cuando se cumpla una
  parte, aquí queda con su fecha.»

### 7.7 Los formularios

Todo en `Dialog`, que ya existe.

**Apuntar / editar una profecía:**

1. **Título** — se lleva el foco al abrir.
2. **Fecha en que se recibió** — con hoy puesto.
3. **El texto** — un `textarea` **grande de verdad**: 12 filas, que crece con lo
   que se escribe hasta el alto de la ventana, y con `max-w-prose`. Es el campo
   principal de esta pantalla y no puede ser una caja de tres líneas.
4. **«Ya se cumplió»** — el interruptor de D6. Encendido, despliega la fecha con
   hoy propuesto.

**Anotar un cumplimiento:** el texto —también amplio, 6 filas— y la fecha, con
hoy puesto. Dos campos, nada más.

Al guardar, `toast` con el mismo verbo que el botón: «Palabra apuntada»,
«Cumplimiento anotado», «Marcada como cumplida» (Regla 9 §6).

### 7.8 Animación

Poca y con motivo (Regla 9 §5); solo `opacity` y `transform`, y todo apagado
con `prefers-reduced-motion`.

- **La travesía se dibuja** al entrar: cada trayecto crece de izquierda a
  derecha con `transform: scaleX()` y origen a la izquierda, 480 ms,
  escalonado 40 ms por fila y **parando a las doce primeras** — más allá la
  cascada solo hace esperar. `scaleX`, no `width`: el compositor sabe resolver
  el primero y no el segundo (CLAUDE.md).
- **El anillo de la tasa se llena** de 0 a su valor, 600 ms, animando
  `stroke-dashoffset`. Solo en la primera pintura, no en cada `refetch`.
- **Al marcar una profecía como cumplida**, su trayecto **se cierra**: la flecha
  desvanecida se recoge y aparece el `◆` con un fundido corto. Es la
  confirmación de que se ha guardado y, de paso, la tesis de la pantalla en un
  gesto.
- **Los gráficos de recharts entran con su animación apagada** y se les pone la
  del proyecto —un fundido de 200 ms sobre el contenedor—: la animación por
  defecto de recharts es uno de los rasgos por los que se reconoce (D8).
- Cambiar de vista es un fundido de 150 ms, sin desplazamiento.

### 7.9 Los tres anchos

- **375 px**: una columna. La travesía sigue funcionando porque su eje es el
  tiempo y se comprime; los filtros, en `Drawer`. La acción principal, al
  alcance del pulgar.
- **768 px**: dos columnas en tarjetas y en fichas; tabla sin la columna de
  cumplimientos.
- **1280 px**: todo a la vista, y la ficha en sus dos columnas.

Comprobado con el texto en alemán, que es el que rompe las pastillas
(Reglas 2 §9 y 5 §6), y sin scroll horizontal en ninguno de los tres.

### 7.10 La app nativa queda fuera de esta versión

Igual que en las RFC 0002 §8.7 y 0003 §7.9. La pantalla puente se queda como
está. Lo que se comparte cuando entre —el tipo, el esquema, los hooks y las
claves de traducción— ya se escribe compartido en esta entrega.

## Textos

Una sección nueva en `packages/i18n/src/locales/`, en los seis idiomas y con el
mismo orden de claves en los seis (Regla 2 §5):

| Sección              | Qué lleva                                                     |
| -------------------- | ------------------------------------------------------------- |
| `prophecies.*`       | La pantalla: cabecera, columnas, filtros, formularios, vacíos |
| `prophecies.state.*` | Los tres estados                                              |
| `prophecies.stats.*` | Las tarjetas y las etiquetas de los gráficos                  |
| `prophecies.views.*` | Los nombres de las cuatro vistas                              |

`nav.prophecies` ya existe en los seis y no se toca.

Las fechas salen de `Intl` con el idioma activo, y los «hace N días» de
`Intl.RelativeTimeFormat`, no de una cadena montada a mano (Regla 2 §6). Ojo con
las cifras grandes: «2.617 días» se formatea con `Intl.NumberFormat`, que pone
el separador de miles de cada idioma.

## Migraciones

Dos, y las dos se prueban **en los dos motores** (Regla 4 §2).

1. **`CreateProphecies`** — `prophecies` y `prophecy_fulfillments` con sus tres
   índices. Sin `church_id` (D1).
2. **`DropChurchProphecyPermissions`** — quita `prophecies.view` y
   `prophecies.manage` de los roles que los tengan (D2). Tiene que valer **para
   una base de datos que ya existe y para una nueva**, que es la trampa que ya
   mordió con `CreateRoles` y `ROLES` (CLAUDE.md): la migración que siembra los
   roles importa la constante de `@navis/shared`, así que al quitar los permisos
   de ahí una base nueva ya nace sin ellos y esta migración no encuentra nada
   que borrar. Se escribe para que eso no sea un error, sino el caso normal.

Y hay que tocar, en el mismo cambio: `packages/shared/src/permissions.ts`,
`role-permissions.ts`, `apps/web/src/lib/nav.ts` y
`apps/web/src/lib/placeholders.ts`. Se busca con el grafo antes de empezar
(Regla 8), que es donde aparecerá algún sitio más.

## Fases

Cada fase se termina entera —API, web, los seis idiomas y sus pruebas— antes de
empezar la siguiente.

### Fase 1 — El modelo y la API

Migraciones, entidades, esquemas de `shared` con `prophecyState` y
`waitingDays` y sus tests, el repositorio con el `ownerId` obligatorio (D1),
servicio y controlador. El listado paginado con todos sus filtros y el endpoint
de estadísticas. La retirada de los permisos (D2), propagada. Tests unitarios de
servicio y e2e de la API en SQLite **y** en Postgres, incluido el caso de «la
profecía de otro da 404».

### Fase 2 — El listado en web

`/prophecies/list` con la tabla y las fichas, los filtros en la URL, la
paginación y las pastillas con sus cuentas. Hooks nuevos en
`packages/api-client`, claves en `queryKeys.prophecies`. Textos en los seis
idiomas.

### Fase 3 — Escribir

Los dos formularios, el interruptor de cumplida con su fecha (D6), los
cumplimientos parciales, el borrado con confirmación, los `toast` y los estados
de error.

### Fase 4 — La travesía y las otras dos vistas

El elemento firma, más la vista de fichas y la de año, y el conmutador con su
preferencia recordada.

### Fase 5 — La portada

recharts envuelto y desnudado (D8), las seis tarjetas navegables, el anillo de
la tasa y el gráfico mensual. Carga diferida del módulo de gráficos.

### Fase 6 — Rematar

Las animaciones de §7.8, los tres anchos, los dos temas, el alemán, e2e de
Playwright en los dos perfiles, y actualizar `docs/ESTADO.md` y `CLAUDE.md` con
lo que haya mordido.

## Pruebas

| Qué                                                                | Dónde                          |
| ------------------------------------------------------------------ | ------------------------------ |
| `prophecyState` en los tres casos, y `waitingDays` con sus límites | `packages/shared`              |
| `last_fulfillment_at` al crear, al mover la fecha y al borrar      | `prophecies.service.test`      |
| Marcar cumplida y desmarcarla no toca los cumplimientos (D6)       | `prophecies.service.test`      |
| Cumplida antes de recibida da 400 (D7)                             | `prophecies.service.test`      |
| **La profecía de otro usuario da 404, no 403**                     | e2e de la API                  |
| **Un admin no ve las profecías de otro** (D1)                      | e2e de la API                  |
| Un cumplimiento de otro usuario da 404                             | e2e de la API                  |
| El filtro por estado se resuelve en SQL en los dos motores         | e2e de la API                  |
| «vision» encuentra «visión» en los dos motores (D13)               | e2e de la API                  |
| `monthly` trae los doce meses, con los vacíos a cero               | `prophecy-stats.service.test`  |
| Con cero profecías, `fulfillmentRate` es `null` y no `0`           | `prophecy-stats.service.test`  |
| La mediana no se desplaza con un valor extremo                     | `prophecy-stats.service.test`  |
| El listado pagina bien con 5.000 profecías                         | e2e de la API                  |
| La travesía pinta los tres estados y las marcas parciales          | `travesia.test.tsx`            |
| Cada estado se distingue **sin depender del color**                | `travesia.test.tsx`            |
| Las tarjetas de la portada llevan al listado con su filtro         | `stat-grid.test.tsx`           |
| recharts no entra en el bundle inicial (D8)                        | `pnpm build` + tamaño de chunk |
| Filtrar y volver atrás conserva el filtro                          | Pendiente — ver abajo          |
| La vista elegida se recuerda entre visitas                         | Pendiente — ver abajo          |
| Con `prefers-reduced-motion` no se mueve nada                      | Pendiente — ver abajo          |

**Lo que todavía no cubre ningún test automático.** Las tres últimas filas
necesitan un navegador de verdad, y la suite de Playwright de esta sección no
está escrita. Mientras tanto se comprueban **a mano**, siguiendo el guion de
[`docs/pruebas/0004-profecias-en-navegador.md`](../pruebas/0004-profecias-en-navegador.md),
que las lleva paso a paso junto con los tres anchos, los dos temas y el alemán.
Escribir esos specs es el siguiente trabajo pendiente de esta RFC.

## Riesgos y trampas

- **D1 va contra la corriente de todo el proyecto.** Cualquiera que llegue
  después verá un módulo sin `church_id` y sin `ActiveChurchGuard` y pensará
  que falta. Va comentado en la entidad y en el repositorio, y anotado en
  `CLAUDE.md`: **es a propósito** (Regla 1 §7).
- **El filtro por `owner_id` es la única barrera que hay.** No hay permisos ni
  roles que lo respalden (D2). Por eso vive en el repositorio y por eso hay dos
  e2e dedicados a intentar saltárselo. Si algún día se añade un endpoint nuevo,
  el test que hay que copiar es ese.
- **recharts se reconoce a distancia.** Es el riesgo asumido de D8 y la razón de
  sus tres condiciones. Si al verlo montado sigue pareciendo el panel de
  cualquiera, la salida está preparada: como nadie importa `recharts` fuera de
  `components/prophecies/charts/`, cambiarlo por SVG propio es tocar esa carpeta
  y nada más.
- **recharts engorda el bundle.** ~100 kB que no puede pagar toda la aplicación
  por una pantalla. Carga diferida, y un test que lo comprueba.
- **Los colores de los gráficos se quedan viejos al cambiar de tema.** Los
  hexadecimales se leen en el render, no se capturan una vez en un módulo:
  `themeColorsHex` depende del tema activo (Regla 3 §5).
- **Una columna `date` desde Postgres vuelve como `Date` a medianoche local** y
  `toISOString()` devuelve el día anterior al este de Greenwich. Ya mordió con
  `MAX(occurred_at)` de las notas (CLAUDE.md). Se convierte con `iso-day.ts`.
- **Restar fechas no se escribe igual en los dos motores**: la espera en días
  sale de `database/date-sql.ts`, que ya lo absorbe.
- **`last_fulfillment_at` es derivado y se puede desincronizar.** Se escribe en
  un solo servicio (D4). Si algún día hay importaciones masivas, hará falta un
  recálculo.
- **Un `textarea` de doce filas dentro de un `Dialog` se sale en un teléfono.**
  El diálogo necesita `max-h-[90dvh]` con scroll interno y `min-w-0` en el
  contenedor: un hijo ancho dentro de un `flex-col` ensancha al padre
  (CLAUDE.md).
- **La travesía a 375 px con quince años de rango.** El eje se comprime hasta
  que las marcas se solapan. Por debajo de `sm` el eje pasa a años cerrados y
  las marcas parciales se agrupan; si aun así no se lee, la vista de serie en
  móvil pasa a ser «fichas» y la travesía queda de `md` para arriba.
- **Nada de esto se cifra** (Preguntas abiertas). Quien despliegue en un
  servidor compartido tiene que saber que un administrador de la base de datos
  puede leer estas filas. Escrito aquí para que no se descubra el día que
  importe.

## Alternativas descartadas

- **Una columna `status` guardada.** Dos fuentes de verdad con los datos que ya
  la determinan (D3). Es el mismo error que `is_active` **y** `status` en la
  RFC 0003.
- **`fulfillmentNotes` como campo de texto.** No deja contar, ni ordenar, ni
  pintar las marcas de la travesía (D4).
- **Colgar las profecías de la iglesia activa.** Es lo que hace todo lo demás
  del proyecto, y aquí sería un fallo: al cambiar de iglesia desaparecerían, y
  al salir de una se perderían.
- **Permisos `prophecies.*` en los roles.** Dejarían a alguien fuera de sus
  propias profecías privadas y sugerirían que un administrador puede ver las de
  otro (D2).
- **Reutilizar las notas de la RFC 0003 con un tipo nuevo.** Ahorraría una
  tabla, pero las notas pertenecen a un creyente de una iglesia y estas a un
  usuario, con reglas de visibilidad opuestas. Mezclarlas sería un fallo de
  privacidad esperando a ocurrir. (Del borrador; sigue siendo cierto.)
- **Cuatro tarjetas de indicadores sin más.** Se han pedido tarjetas y las hay,
  pero llevando a algún sitio y enseñando forma (D10). Un número grande que no
  se puede pulsar es mobiliario.
- **Degradado de aurora de fondo.** Decora para no dejar hueco y no dice nada
  (Regla 9 §2). Los degradados van en las tarjetas y entre dos tokens.
- **Scroll infinito en el listado.** Rompe el botón de atrás y esconde el total.
- **La sonda de creyentes, reutilizada aquí.** Misma forma para otra magnitud:
  peor que no tenerla (D15).
- **Markdown en el cuerpo.** Complica el editor justo donde más se escribe.

## Criterios de aceptación

- [ ] Un usuario no puede leer ni tocar una profecía de otro, **por mucho que
      sea administrador**, y el intento devuelve 404.
- [ ] Las profecías no cambian ni desaparecen al cambiar de iglesia activa, ni
      al no tener ninguna.
- [ ] Los permisos `prophecies.*` ya no existen, y la sección se ve con solo
      tener sesión.
- [ ] Una profecía se apunta con título, fecha y texto largo; se edita y se
      borra con confirmación y con `toast`.
- [ ] El interruptor «Ya se cumplió» abre la fecha ahí mismo con hoy puesto, y
      apagarlo devuelve la profecía a su estado anterior sin perder los
      cumplimientos.
- [ ] Una fecha de cumplimiento anterior a la de recepción se rechaza con un
      mensaje que dice qué pasa.
- [ ] Se anotan cumplimientos parciales con su texto y su fecha, y la profecía
      pasa a «en camino» sola.
- [ ] El listado se ve de **cuatro formas** y la elegida se recuerda entre
      visitas.
- [ ] Los filtros de estado y de ventana (7 días, 30 días, este año, todo) y la
      página van en la URL: se comparten por enlace y el botón de atrás
      funciona.
- [ ] La búsqueda encuentra en el título, en el cuerpo y en los cumplimientos, y
      busca en todo el historial y no solo en la página cargada.
- [ ] La portada enseña total, en espera, en camino, cumplidas este año, tasa de
      cumplimiento y espera típica; **y cada tarjeta abre el listado ya
      filtrado**.
- [ ] El gráfico mensual trae los doce meses, con los vacíos a cero.
- [ ] Con cero profecías, la portada no enseña seis ceros: enseña una invitación.
- [ ] La travesía distingue en espera, en camino y cumplida **sin depender del
      color**, y su contenido lo lee un lector de pantalla.
- [ ] Con `prefers-reduced-motion` no se mueve nada.
- [ ] recharts no entra en el bundle inicial de la aplicación.
- [ ] Todos los textos están en los seis idiomas y se ven bien en claro y en
      oscuro, a 375, 768 y 1280 px, con el alemán puesto.
- [ ] `pnpm check` y `pnpm test:e2e` pasan; los e2e de la API, en los dos
      motores.
