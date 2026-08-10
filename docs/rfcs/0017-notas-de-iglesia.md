# RFC 0017: El cuaderno de la iglesia

- **Estado**: Borrador
- **Autor**: propuesto a partir del encargo de Cristian, redactado por Claude
- **Fecha**: 2026-08-10
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). La app móvil queda fuera de esta versión — §7.10
- **Depende de**: [0008](./0008-iglesias-como-espacios-de-trabajo.md) (iglesias
  y permisos, para el alcance por `church_id`), y reutiliza infraestructura de
  la [0003](./0003-creyentes-y-notas.md) (audios), la
  [0004](./0004-profecias-personales.md) (recharts envuelto) y la
  [0009](./0009-exportar-listados.md) (ZIP sin librerías, la lámina
  rasterizada)

## Problema

El acompañamiento pastoral no vive solo en la ficha de cada persona. Hay algo
que se anota **de la iglesia como conjunto**: lo que se observa un domingo, un
testimonio que alguien cuenta en el pasillo, un sueño que se comparte antes de
orar, lo que salió bien en una actividad y lo que salió mal y hay que hablar,
una oración que se está sosteniendo, una decisión que se toma para el rumbo de
la congregación. Hoy eso no tiene sitio: se apunta en un cuaderno físico, en
las notas del teléfono, o no se apunta y se pierde.

No es la bitácora de un hermano (RFC 0003): esas notas son de una persona, y
esto es del **equipo que pastorea**, compartido entre quien tenga acceso a esa
iglesia. Y no es una profecía personal (RFC 0004): eso es privado de quien lo
recibe, y esto es exactamente lo contrario — pensado para que se lea entre
varios, se repase antes de una reunión de liderazgo y se lleve a la siguiente.

Cambiar de iglesia tiene que cambiar el cuaderno entero: las notas de una
congregación no aparecen en otra, igual que sus creyentes o su calendario.

## Alcance

**Entra:**

- El registro de cada entrada: **título**, **tipo** (siete, con icono y color
  propios), **fecha**, una **anotación** extensa y, si aplica, **lo
  aprendido**.
- Un **recordatorio** opcional, con mensaje corto, fecha y hora.
- **Audios**: grabados en la propia aplicación o adjuntados ya hechos.
- Una **portada** con estadísticas —por tipo, por mes— en gráficas de barras.
- Un **listado** con búsqueda en el servidor, filtros por tipo, por ventana de
  tiempo y por recordatorio pendiente, y tres formas de verlo.
- **Exportar a Markdown** — una entrada o varias a la vez.
- **Exportar y compartir como imagen**, con el logo de Navis.
- API, web y escritorio, con los textos en los seis idiomas.

**No entra, y por qué:**

- **La app móvil.** Misma disciplina que el resto del proyecto (RFC 0002 §8.7,
  0003 §7.9, 0004 §7.9, 0009): la forma se asienta primero en web. El tipo, el
  esquema y los hooks se escriben compartidos en esta entrega; el JSX se
  escribirá dos veces, que es lo correcto (Regla 1 §2). Grabar audio y
  rasterizar una imagen son además APIs del navegador (`MediaRecorder`,
  `<canvas>`) sin equivalente directo en React Native — llevarlo a móvil no es
  repetir el JSX, es otra implementación.
- **Enlazar una entrada con un creyente.** Sería mezclar dos modelos con reglas
  de visibilidad distintas — exactamente lo que la RFC 0004 §12 descartó al
  revés (reutilizar las notas de creyentes para profecías). Si algún día hace
  falta «¿qué se ha anotado sobre esta persona?», es otro documento.
- **Notificaciones del recordatorio.** Igual que en la RFC 0003 D16: el aviso
  es una señal **en pantalla**. Un correo o un push es la RFC 0006.
- **Exportar varias entradas como una sola imagen.** Una imagen es una postal
  de una entrada; un montaje de quince textos largos en una sola lámina no se
  lee. Con varias seleccionadas, la imagen se desactiva y solo queda Markdown
  — ver D13.
- **Cifrado en reposo.** No se promete lo que no se va a implementar en esta
  entrega, con la misma advertencia que ya deja escrita la RFC 0004: un
  administrador de la base de datos puede leer estas filas.

## Vocabulario

El mismo en el código, en la interfaz y en las traducciones. Con un cuidado:
**«notas»** ya es el nombre de la bitácora de un creyente (RFC 0003), así que
esta sección usa un vocabulario propio y no lo pisa.

| Término          | Qué es                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **El cuaderno**  | El nombre con el que la interfaz habla de esta sección              |
| **Entrada**      | Un registro del cuaderno: título, tipo, fecha, anotación            |
| **Tipo**         | Una de las siete categorías, cada una con su icono y su color       |
| **Anotación**    | El texto principal: lo que se observó, contó o decidió. Obligatorio |
| **Lo aprendido** | El segundo texto, opcional: la reflexión sobre lo anotado           |
| **Recordatorio** | Mensaje, fecha y hora para volver sobre una entrada                 |
| **El oleaje**    | La animación continua que identifica esta pantalla (§7.6)           |

En inglés, dentro del código: `journal`, `entry`, `kind`, `occurredAt`,
`annotation`, `learned`, `remindAt`. La sección de traducciones y el módulo de
permisos se llaman `journal.*` para no chocar con `notes.*`, que ya existe.

## Decisiones tomadas

- **D1 — Una entrada es de la iglesia activa, no de quien la escribe.** Al
  revés que las profecías (RFC 0004 D1) y a favor de la corriente del resto del
  proyecto: `church_id` y `ActiveChurchGuard`, como creyentes y calendario.
  Cambiar de iglesia cambia el cuaderno entero, y es justo lo que se ha pedido:
  «cada iglesia va a tener sus propias notas». Quien escribió una entrada queda
  guardado (`author_id`) para dar crédito, no para restringir quién la lee:
  quien tiene `journal.view` en esa iglesia ve todas las entradas, igual que
  con la bitácora de creyentes (RFC 0003 D10).

- **D2 — Siete tipos, con icono y **color** propios.** El encargo pedía cinco
  —observación, testimonio, sueño, bien hecho, cosas mal hechas— y dos más a
  elegir. Se añaden:

  | Tipo         | Icono           | Para qué                                               |
  | ------------ | --------------- | ------------------------------------------------------ |
  | Observación  | `Eye`           | Lo que se ve y conviene dejar escrito                  |
  | Testimonio   | `Quote`         | Lo que alguien cuenta                                  |
  | Sueño        | `Moon`          | Un sueño compartido con el equipo                      |
  | Bien hecho   | `Star`          | Un acierto que merece repetirse                        |
  | Corrección   | `TriangleAlert` | Algo que se hizo mal y hubo que hablar                 |
  | **Oración**  | `HandHeart`     | Lo que se sostiene en oración, respondida o no todavía |
  | **Decisión** | `Compass`       | Un rumbo que se toma para la congregación              |

  Las dos añadidas no son relleno: **oración** es tan pastoral como un
  testimonio y hoy no tiene dónde vivir, y **decisión** cierra el círculo de
  «bien hecho / mal hecho» con el paso que de verdad los conecta — qué se
  decidió hacer a partir de ahí. Y «decisión» conecta con el propio vocabulario
  náutico del proyecto: un rumbo es una decisión (RFC 0004 usa `Waves` y
  `Anchor`; aquí, la brújula).

  Es texto validado contra una constante de `shared`
  (`ENTRY_KINDS`), como los tipos de nota de creyentes (RFC 0003 D7): un tipo
  que dejara de proponerse no rompe lo ya escrito.

  **El color es dato, no decoración** (D14): cada tipo lleva un tono fijo de
  la paleta ampliada (`ACCENT_PALETTE`), elegido para separarse bien de los
  otros seis y sostenerse en claro y en oscuro. Se usa siempre igual: en el
  icono, en la pastilla, en el filete de la ficha y en la barra del gráfico
  «por tipo» — nunca un color que cambie de sitio a sitio.

- **D3 — La entrada lleva título, y no se trunca en el listado.** Al revés que
  la bitácora de un creyente (RFC 0003 D15, sin título porque el tipo y la
  fecha ya identifican la nota dentro de _su_ historial). Aquí no hay una
  persona que dé contexto: en una semana puede haber tres observaciones
  distintas, y sin nombre no se distinguen de un vistazo en el listado. Se ha
  pedido explícitamente y tiene sentido con la forma de esta pantalla.

- **D4 — El cuerpo son dos campos, como en la RFC 0003 D15.** **Anotación**
  (obligatoria) es lo que pasó; **lo aprendido** (opcional) es la reflexión.
  Separarlos deja releer solo una de las dos columnas, y no obliga a rellenar
  un campo cuando lo que hay que anotar es solo el hecho.

- **D5 — La fecha es `date`, no `timestamptz`.** Misma decisión que en toda la
  aplicación (RFC 0002 §5.5, RFC 0003 D9, RFC 0004 D5): lo que pasó el 14 de
  julio pasó el 14 de julio en cualquier huso, y se convierte con
  `iso-day.ts`/`formatDay`, nunca con `new Date(iso)`.

- **D6 — El recordatorio es el mismo patrón que la RFC 0003 D16.** Un
  interruptor que abre `remindAt` (con hora), `remindText` y `remindDoneAt`.
  Vive en la propia entrada, no en una tabla aparte, por el mismo motivo:
  siempre es _de_ algo que se anotó. Los recordatorios pendientes tienen su
  propia pastilla en el listado y su propia tarjeta en la portada — es la
  pregunta que un cuaderno de verdad tiene que responder: «¿qué me quedé por
  volver a mirar?».

- **D7 — Los audios son el gemelo exacto de `NoteAudio`/`AudioStorageService`**
  (RFC 0003 D18, «mapa de variantes» de la Regla 1 §3 aplicado a servicios, como
  ya hizo el `DocumentStorageService` de la RFC 0016). Ámbito de iglesia
  (`churchScope`), mismo tope (`MAX_AUDIO_BYTES`, 25 MB), grabado con
  `MediaRecorder` o adjuntado. El fichero vive en disco y **no entra en un
  volcado de Postgres** — el mismo aviso que ya deja escrito `CLAUDE.md`.

- **D8 — La búsqueda se resuelve en el servidor**, contra una columna
  `search_text` normalizada (título + anotación + lo aprendido, en minúsculas
  y sin acentos), calculada al guardar. Mismo motivo que la RFC 0003 D14 y la
  RFC 0004 D13: vale igual en Postgres y en SQLite, sin `unaccent` ni
  `pg_trgm`.

- **D9 — Filtros y página en la URL, con `useTableQuery`.** Tipo (repetible,
  con su cuenta en la pastilla), ventana de fecha (7 días, 30 días, este año,
  todo), y `pendingReminder` para «recordatorios sin atender». La forma de
  verlo (tabla, fichas o calendario) se recuerda en `navis.journalView`, que es
  preferencia de quien mira y no del enlace — mismo criterio que en creyentes y
  profecías.

- **D10 — Permiso propio `journal.*`, y no se cuelga de `believers.*`.** Una
  corrección o una decisión de liderazgo es información más sensible que la
  agenda de un creyente, y mezclarla con `believers.manage` daría acceso a
  quien no debería tenerlo por el simple hecho de gestionar personas. De
  serie, `journal.view` y `journal.manage` se dan a **pastor** y
  **predicador-apoyo** — los dos roles que ya llevan el día a día pastoral
  completo — y a nadie más. Es una semilla, no una ley: se afina por iglesia
  desde la administración de accesos (RFC 0008), igual que el resto.

- **D11 — Portada y listado son dos rutas**, como la RFC 0004 D9: `/journal`
  enseña las estadísticas y `/journal/list` el listado completo. Cada tarjeta
  de la portada abre el listado con su filtro ya puesto en la URL (mismo
  criterio que la RFC 0004 D10): un número que no lleva a ningún sitio es
  mobiliario (Regla 9 §2).

- **D12 — Exportar a Markdown: una entrada o varias, y se reutiliza el ZIP que
  ya existe.** No es la exportación tabular de la RFC 0009 —esto es el propio
  texto de la entrada, no una fila de una tabla—. Una sola entrada descarga un
  `.md` suelto, con una pequeña cabecera de metadatos y el texto entero debajo
  (§7.7). Varias entradas descargan un `.zip` con un `.md` por entrada,
  reutilizando `lib/export/zip.ts` **tal cual** (el mismo escritor «store» sin
  comprimir que ya usa el `.xlsx`, Regla 1 §5: no son dos cosas parecidas, es
  la misma). Se descartó concatenar todas en un solo fichero: quince entradas
  en un documento gigante es peor de manejar que quince ficheros sueltos que
  se pueden abrir uno a uno.

- **D13 — Exportar/compartir como imagen: nota a nota, con el logo de Navis.**
  Reutiliza el patrón de la lámina del calendario (RFC 0002 D13/D14, y
  `Poster` en concreto): un componente propio con estilos en línea, colores en
  hexadecimal y el logo incrustado como `data:`, rasterizado con
  `nodeToPng`/`nodeToJpeg` de `lib/share/rasterize.ts` y compartido con
  `lib/share/files.ts` — nada nuevo que escribir en esa capa, solo una
  composición nueva (`JournalEntryCard`, §7.7). Con varias entradas
  seleccionadas, el botón de imagen se desactiva (Alcance): no hay disposición
  razonable para un montaje de textos largos.

- **D14 — Elemento firma: el oleaje, y es distinto al resto del proyecto a
  propósito.** Todas las demás pantallas del proyecto animan **una vez**, al
  entrar o al cambiar un dato (la sonda que se llena, la travesía que se
  dibuja), y se paran ahí — es la disciplina de la Regla 9 §4. Aquí se ha
  pedido explícitamente lo contrario: una animación que **se repita**, y que
  sea reconociblemente de esta pantalla. La resolución no es aflojar la Regla
  9 en cinco sitios; es **concentrar la audacia en un elemento, y trabajarlo
  de verdad** (§7.6) en vez de repartirla en adornos sueltos por toda la
  pantalla — que es justo lo que la Regla 9 §4 pide y lo que evitaría que el
  cuaderno se leyera como una pantalla con animaciones puestas «porque sí».

- **D15 — El color, con intención en toda la pantalla.** Es la otra respuesta
  al «que sea colorida, no genérica»: el color de cada tipo (D2) no se queda
  en un icono — tiñe la pastilla, el filete de la tarjeta, la barra del
  gráfico y la ficha exportada. Con siete tipos y sus siete colores en la
  misma vista, el cuaderno se distingue de cualquier panel gris sin añadir ni
  un adorno que no signifique algo. Es la misma regla que ya aplica la RFC
  0005 §7.1.1 a las emociones de un sueño: «el color entra por el dato».

### Preguntas abiertas

- **¿Quién más debería tener `journal.view`?** Se ha empezado corto —solo
  pastor y predicador-apoyo (D10)— porque es más fácil ampliar un permiso que
  quitárselo a alguien que ya se acostumbró a tenerlo. Si recepción o biblias
  lo piden, es una fila en `role-permissions.ts`.
- **¿Un buscador que cruce el cuaderno con la bitácora de creyentes?** Alguien
  podría querer «todo lo que se ha anotado esta semana, de cualquier tipo». No
  se ha pedido y mezclar los dos modelos de búsqueda es su propio documento.

## Modelo de datos

### 5.1 `journal_entries`

```
JournalEntry
├── id: uuid
├── church_id → Church(id)          — D1
├── title: text                     — obligatorio (D3)
├── kind: text                      — uno de ENTRY_KINDS (D2)
├── occurred_at: date                — cuándo pasó (D5)
├── annotation: text                 — obligatoria (D4)
├── learned: text | null             — opcional (D4)
├── search_text: text                — normalizado (D8)
├── remind_at: timestamptz | null    — con hora (D6)
├── remind_text: text | null
├── remind_done_at: timestamptz | null
├── author_id → user(id) | null
├── ← JournalEntryAudio[]
└── created_at / updated_at / deleted_at   (BaseEntity)

JournalEntryAudio                    — gemelo de NoteAudio (D7)
├── id, church_id, entry_id
├── storage_key: text                — lo pone el servidor
├── mime_type: text
├── size_bytes: int                  — tope MAX_AUDIO_BYTES
├── duration_seconds: int | null
└── recorded: boolean

ÍNDICES  (church_id, occurred_at DESC)   — el listado
         (church_id, kind)               — las pastillas con su cuenta
         (church_id, remind_at)          — recordatorios pendientes
```

Sin `enum` de base de datos, por el mismo motivo que en toda la aplicación: en
SQLite no existe y en Postgres cada valor nuevo es una migración. La lista de
tipos vive en `shared`.

### 5.2 `packages/shared`

```ts
// packages/shared/src/schemas/journal.ts
export const ENTRY_KINDS = [
  'observacion',
  'testimonio',
  'sueno',
  'bienHecho',
  'correccion',
  'oracion',
  'decision',
] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];
export const DEFAULT_ENTRY_KIND: EntryKind = 'observacion';
export function isEntryKind(value: string): value is EntryKind;

export const entryKindSchema = z.enum(ENTRY_KINDS);

export const journalEntrySchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  title: z.string(),
  kind: entryKindSchema,
  occurredAt: isoDateSchema,
  annotation: z.string(),
  learned: z.string().nullable(),
  remindAt: z.string().nullable(),
  remindText: z.string().nullable(),
  remindDoneAt: z.string().nullable(),
  audios: z.array(journalEntryAudioSchema),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  createdAt: z.string(),
});

/** `giftId` no existe aquí: es el único punto donde este esquema se aparta
    del de creyentes, porque no hay nada equivalente que enlazar (D2). */
export const createEntrySchema = z
  .object({
    title: z.string().trim().min(1, 'Ponle un título a la entrada').max(200),
    kind: entryKindSchema,
    occurredAt: isoDateSchema,
    annotation: z.string().trim().min(1, 'Escribe la anotación').max(8000),
    learned: z.string().trim().max(8000).optional(),
    remindAt: reminderAtSchema.optional(),
    remindText: z.string().trim().max(500).optional(),
  })
  .refine((entry) => !entry.remindText || Boolean(entry.remindAt), {
    message: 'El recordatorio necesita día y hora',
    path: ['remindAt'],
  });
```

`reminderAtSchema` se reutiliza tal cual de `schemas/believer-notes.ts` (Regla
1 §5: es exactamente la misma validación) y se sube a `schemas/common.ts`,
donde ya la puede importar cualquiera de los dos.

El color de cada tipo (D2, D15) no vive en `shared`: es una decisión de
presentación, y se declara junto al resto de mapas de variantes de la web
(`apps/web/src/lib/journal/entry-kind.ts`), igual que los iconos de tipo de la
bitácora de creyentes.

## API

Todo bajo `ActiveChurchGuard` (D1).

| Método | Ruta                              | Permiso          | Descripción                              |
| ------ | --------------------------------- | ---------------- | ---------------------------------------- |
| GET    | `/api/v1/journal`                 | `journal.view`   | Listado paginado, con filtros y búsqueda |
| GET    | `/api/v1/journal/stats`           | `journal.view`   | Las estadísticas de la portada           |
| GET    | `/api/v1/journal/export`          | `journal.view`   | Filas completas, para Markdown (D12)     |
| POST   | `/api/v1/journal`                 | `journal.manage` | Crear                                    |
| GET    | `/api/v1/journal/:id`             | `journal.view`   | La ficha, con sus audios                 |
| PATCH  | `/api/v1/journal/:id`             | `journal.manage` | Editar, incluido el recordatorio         |
| DELETE | `/api/v1/journal/:id`             | `journal.manage` | Borrado lógico                           |
| POST   | `/api/v1/journal/:id/audios`      | `journal.manage` | Sube un audio grabado o adjuntado        |
| GET    | `/api/v1/journal/audios/:id`      | `journal.view`   | Lo descarga, si es de esta iglesia       |
| DELETE | `/api/v1/journal/:id/audios/:aid` | `journal.manage` | Lo quita y borra su fichero del disco    |

**La descarga va bajo `/journal/audios/:id` y no bajo `/audios/:id`.** La raíz
`/audios/:id` ya está tomada por `NoteAudiosController` (RFC 0003), que no
sabe nada de este módulo. Reutilizar la misma ruta sin querer sería servir un
audio de creyentes con el guard equivocado o, peor, que el segundo controlador
nunca se registre. Se prefija a propósito — es la trampa que hay que anotar en
`CLAUDE.md` en cuanto se implemente, para que no vuelva a pasar con el
siguiente módulo que necesite audios.

### 6.1 `GET /journal` — la consulta

| Parámetro         | Valores                                                |
| ----------------- | ------------------------------------------------------ |
| `page`, `limit`   | Los de siempre (`paginationQuerySchema`)               |
| `search`          | Contra `search_text` (D8)                              |
| `kind`            | Repetible: `?kind=testimonio&kind=oracion`             |
| `window`          | `7d` · `30d` · `year` · `all`, sobre `occurred_at`     |
| `from`, `to`      | Ventana a medida, si `window` no llega                 |
| `pendingReminder` | `true` deja solo entradas con recordatorio sin atender |
| `sort`            | `date` · `title` · `kind`                              |
| `order`           | `asc` · `desc`                                         |

Elemento del listado, con lo que la fila necesita ya resuelto:

```ts
interface JournalEntryListItem {
  id: string;
  title: string;
  kind: EntryKind;
  occurredAt: string; // AAAA-MM-DD
  excerpt: string; // primeras ~160 letras de la anotación, cortadas en palabra
  hasLearned: boolean;
  hasAudio: boolean;
  remindAt: string | null;
  remindDoneAt: string | null;
  authorName: string | null;
}
```

### 6.2 `GET /journal/stats`

```json
{
  "total": 63,
  "byKind": {
    "observacion": 14,
    "testimonio": 11,
    "sueno": 6,
    "bienHecho": 9,
    "correccion": 4,
    "oracion": 15,
    "decision": 4
  },
  "pendingReminders": 3,
  "thisMonth": 7,
  "monthly": [
    { "month": "2026-01", "total": 4 },
    { "month": "2026-02", "total": 6 }
  ]
}
```

`monthly` trae los últimos doce meses con los vacíos a cero, por el mismo
motivo que la RFC 0004 D-monthly: un gráfico al que le faltan meses miente
sobre la forma.

### 6.3 Errores

| Situación                   | Código | Mensaje                               |
| --------------------------- | ------ | ------------------------------------- |
| Recordatorio sin día y hora | 400    | «El recordatorio necesita día y hora» |
| Título vacío                | 400    | «Ponle un título a la entrada»        |
| Anotación vacía             | 400    | «Escribe la anotación»                |
| Adjunto que no es un audio  | 400    | «Ese fichero no es un audio»          |
| Audio de más de 25 MB       | 400    | «El audio es demasiado largo»         |
| Entrada de otra iglesia     | 404    | «Esa entrada no está en esta iglesia» |

## Interfaz

### 7.1 La dirección

Esta pantalla se pierde en dos direcciones muy transitadas: el **panel de
notas cualquiera** —tarjetas grises, un «+» arriba a la derecha, iconos
apagados— y, en el otro extremo, el **cuaderno decorado de más** —washi tape,
libretas de cuero, textura de papel—. Ninguna de las dos es Navis (Regla 9).

Lo que sí es de este producto: un cuaderno de a bordo tiene entradas de
naturaleza distinta —una observación no es una decisión— y **el color ya las
distingue antes de leer una palabra** (D15). Y un cuaderno de verdad no está
quieto: **el oleaje** (D14, §7.6) es lo que hace que esta pantalla se sienta
viva y no un archivador.

- **Elemento firma: el oleaje.** Una cinta fina, animada de forma continua,
  bajo la cabecera de la portada y del listado — la única animación en bucle
  de todo el proyecto, y trabajada con ese cuidado (§7.6).
- **Segunda capa, funcional: el recordatorio vencido respira**, con la misma
  técnica que ya valida la sonda de creyentes (RFC 0003 §7.3) — opacidad entre
  0,55 y 1 en bucle, nunca tamaño ni posición.
- **El color entra por el tipo, en toda la pantalla** (D15): icono, pastilla,
  filete de tarjeta, barra del gráfico. Con las siete a la vista, la portada
  no necesita ningún degradado de relleno para no verse vacía.
- **Tipografía con saltos de verdad**: el título de una entrada a 15 px en
  peso medio, la anotación a 13 px en el extracto y a 17 px con más interlínea
  en la ficha (`max-w-prose`), las fechas a 12 px con `tabular-nums`.
- **El estado nunca es solo un color**: la pastilla de tipo lleva icono y
  texto; el recordatorio vencido, además del respirar, lleva el icono `Bell`
  en `text-warning` y su texto (Regla 3 §7).

### 7.2 Rutas

| Ruta            | Qué es                              |
| --------------- | ----------------------------------- |
| `/journal`      | La portada: estadísticas y tarjetas |
| `/journal/list` | El listado, con sus tres vistas     |
| `/journal/:id`  | La ficha, con audios y exportación  |

La entrada de navegación exige `journal.view` (D10) y va en el bloque
`church` (RFC 0008), como creyentes y calendario: depende de la iglesia
activa. Icono `NotebookPen` — ni cruz ni nada que se le parezca (Regla 7 §6).

### 7.3 La portada — `/journal`

Cabecera en frase: **«63 entradas · 15 de oración · 3 recordatorios
pendientes»**. Debajo, el oleaje (§7.6).

La rejilla, `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`. Cada tarjeta lleva a
`/journal/list` con su filtro puesto (D11) y enseña algo más que un número:

| Tarjeta                                             | Qué enseña                                                   | A dónde lleva                |
| --------------------------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| **Todas**                                           | El total, y las siete barras de reparto por tipo, coloreadas | `/journal/list` (sin filtro) |
| **Recordatorios pendientes**                        | El número, en `warning`, con el que respira                  | `?pendingReminder=true`      |
| **Este mes**                                        | El número, y una sparkline de los doce meses                 | `?window=year`               |
| **Por tipo** (siete mini-tarjetas, `sm:col-span-2`) | Icono, color y cuenta de cada uno                            | `?kind=<tipo>`               |

El **gráfico mensual**, con `recharts` envuelto exactamente como la RFC 0004
D8: sin `CartesianGrid`, tooltip propio, ejes sin línea, colores de
`themeColorsHex`. Vive en `components/charts/`, que ya comparten profecías y
sueños, y ahora también el cuaderno (Regla 1 §5) — nada nuevo que envolver, un
consumidor más de `useChartTheme`.

**Vacía**: «Todavía no hay nada anotado. La primera entrada es la que hace que
esto sirva.» y el botón de añadir (Regla 9 §6).

### 7.4 El listado — `/journal/list`

Cabecera con **«Añadir entrada»** (`size="lg"`, 48 px — Regla 5 §4).

Barra de filtros, toda en la URL:

- Buscador (D8).
- Siete pastillas de tipo, **cada una en su color** y con su cuenta:
  «Observación (14) · Testimonio (11) · Sueño (6) · Bien hecho (9) ·
  Corrección (4) · Oración (15) · Decisión (4)».
- Pastillas de ventana: 7 días · 30 días · Este año · Todo.
- Pastilla **«Recordatorios pendientes (3)»**, en `warning`.
- El conmutador de las tres vistas.

A 375 px, filtros en `Drawer` con «Filtros (2)», igual que en creyentes y
profecías.

**Selección y exportación en lote (D12).** Cada fila lleva su casilla; con
selección puesta aparece una barra con **«Exportar N»**, que es la única
acción en lote — nunca un borrado masivo, con el mismo criterio de la RFC
0003 §7.4: una comodidad no puede ser también un accidente de un clic.

### 7.5 Las tres vistas

1. **Fichas** — la de serie, y donde más se nota el color (D15).
   `grid gap-4 sm:grid-cols-2 xl:grid-cols-3`. Cada tarjeta lleva un filete
   izquierdo de 3 px en el color del tipo, el icono y la pastilla arriba, el
   título, el extracto a tres líneas, la fecha, y abajo dos indicadores
   discretos si aplican: `Bell` si hay recordatorio (respirando si está
   vencido) y `AudioLines` si hay audio.

2. **Tabla** — `DataTable` tal cual. Columnas: Título (enlace a la ficha) ·
   Tipo (pastilla) · Fecha · Recordatorio · Autor · Acciones. De `md` para
   abajo, la propia `DataTable` cambia a fichas.

3. **Calendario** — el año en cuadraditos, uno por día, del color del tipo de
   la entrada de ese día (dos tipos el mismo día: dos triángulos, como ya
   resuelve la vista de creyentes). Es la que enseña los **huecos**: las
   semanas en las que no se anotó nada, que es justo lo que un cuaderno
   descuidado no puede contar por sí solo.

La vista elegida se recuerda en `navis.journalView` (D9).

### 7.6 El oleaje

El elemento firma (D14), y el único bucle real de todo el proyecto.

```
┌──────────────────────────────────────────────────────────────┐
│  63 entradas · 15 de oración · 3 recordatorios pendientes      │
│  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿  │  ← 32 px de alto
└──────────────────────────────────────────────────────────────┘
```

Una cinta de 32 px bajo la cabecera de la portada y del listado: dos trazados
`<path>` de una onda suave, superpuestos con opacidad distinta
(`stroke-primary/35` y `stroke-primary/15`), **duplicados en el mismo `<svg>`**
para que el bucle no dé un salto — el segundo empieza donde el primero
termina. Se anima con `transform: translateX(-50%)` sobre el grupo entero, 18
s, `linear`, infinito: es lo único de la pantalla que no se detiene nunca, y
por eso lleva solo dos trazos finos y ningún color más — con más encima
dejaría de leerse como un horizonte y pasaría a ser ruido.

Solo `transform`, que el compositor resuelve sin recalcular _layout_ (Regla 9
§5), y **apagado con `prefers-reduced-motion`**: sin él, la cinta se queda fija
en un fotograma, no desaparece — sigue leyéndose como una línea de horizonte,
solo que quieta.

El respirar del recordatorio vencido reutiliza tal cual la animación de la
sonda (RFC 0003 §7.3): `opacity` entre 0,55 y 1, 2,4 s, `ease-in-out`, en
bucle, con el mismo `animation-delay` escalonado por fila para que varias
alertas a la vez no lean como un fallo (Regla 9 §4 aplicada dos veces con el
mismo criterio: una audacia nueva, y una reutilizada donde ya existía).

### 7.7 La ficha — `/journal/:id`

Dos columnas de `lg` para arriba; una sola por debajo.

**Izquierda, pegajosa:**

- Filete superior de 4 px en el color del tipo.
- El título a 24 px, `tracking-[-0.02em]`, con la pastilla de tipo debajo.
- Fecha, autor, y si hay recordatorio: la tarjeta con su mensaje, fecha y hora,
  y el botón «Dar por atendido».
- Acciones: **«Editar»** como principal, y en menú: **«Exportar»** (dos
  entradas: Markdown e Imagen — D12/D13) y **«Eliminar»**.

**Derecha:**

- **Anotación**, a 17 px con más interlínea, `max-w-prose` (Regla 5 §3).
- **Lo aprendido**, si lo hay, en su propio bloque con un filete vertical fino
  que lo distingue de la anotación — mismo criterio visual que «lo que contó»
  y «la indicación» en la bitácora de creyentes (RFC 0003 §7.5).
- **Audios**: uno por fila, con el reproductor del navegador y la duración.
- **Vacío de audios**: no se enseña nada — un cuaderno sin audios en una
  entrada no es un vacío que haya que anunciar.

### 7.8 El formulario

`Dialog`, como el resto de la aplicación.

1. **Título** — se lleva el foco al abrir.
2. **Tipo** — siete pastillas con su icono y su color, en una fila que envuelve
   en dos si hace falta (Regla 5 §6, el alemán las estira). Es la primera
   decisión visual del formulario, a propósito: define de qué color va a salir
   la entrada.
3. **Fecha** — con hoy puesto.
4. **Anotación** — `textarea` de 10 filas que crece con el contenido,
   `max-w-prose`.
5. **Lo aprendido** — plegado tras un enlace «Añadir lo aprendido», 6 filas.
6. **Recordatorio** — interruptor que despliega día, hora (propuestos a una
   semana vista, 19:00) y el mensaje corto.
7. **Audios** — «Grabar un audio» (con cronómetro mientras graba) y «Adjuntar
   un audio». Se quedan en memoria y suben al guardar, como en la bitácora de
   creyentes (RFC 0003 §7.6): necesitan una entrada a la que colgarse.

Al guardar, `toast` con el verbo del botón: «Entrada guardada», «Recordatorio
puesto», «Audio subido» (Regla 9 §6).

### 7.9 Exportar

Un menú de dos entradas —Markdown e Imagen— en la ficha, y **«Exportar N»** en
la barra de selección del listado (solo Markdown ahí: D13).

**Markdown (D12).** Una entrada:

```markdown
---
titulo: Visita a la familia Gómez
tipo: Testimonio
fecha: 2026-07-14
recordatorio: 2026-08-12 19:00 — Preguntar cómo sigue
---

# Visita a la familia Gómez

## Anotación

Contó que llevaba dos años sin hablar con su hermano y que esta semana...

## Lo aprendido

Que a veces la reconciliación empieza por una llamada, no por una visita.
```

La cabecera se traduce a la vez que el contenido: quien exporta en alemán
recibe `titel`, `art`, `datum`. Con varias seleccionadas, se descarga
`navis-cuaderno-2026-08-10.zip` con un `.md` por entrada (el nombre de cada
fichero sale de `slugify(title)`, ya existente en `lib/share/files.ts`).

**Imagen (D13).** `JournalEntryCard`, hermana de `Poster` (RFC 0002): banda
azul de marca `#2140cf` con el logo de Navis y el nombre de la iglesia, debajo
el título con la pastilla del tipo en su color, la fecha, la anotación
—recortada a un párrafo cómodo, con «— sigue en Navis» si se corta— y el
recordatorio si está pendiente. Rasterizada con `nodeToPng` (`lib/share/
rasterize.ts`, sin cambios) y compartida con `canShareFiles`/`shareFile` o
descargada.

### 7.10 Los tres anchos

- **375 px**: fichas en una columna, filtros en `Drawer`, el oleaje se sigue
  viendo — es una cinta, no una tabla, y no necesita ancho. Acción principal
  al alcance del pulgar.
- **768 px**: dos columnas en fichas y en la rejilla de la portada, tabla sin
  la columna de autor.
- **1280 px**: todo a la vista, ficha en dos columnas, cuatro columnas en la
  portada.

Comprobado con el alemán activo — «Recordatorios pendientes» es de las cadenas
que más se estiran — y sin scroll horizontal en ninguno (Reglas 2 §9 y 5 §7).

### 7.11 La app nativa queda fuera de esta versión

Igual que el resto de secciones grandes del proyecto (§Alcance). Lo que se
comparte cuando entre — tipo, esquema, hooks, claves de traducción — ya se
escribe compartido en esta entrega.

## Textos

Sección nueva `journal.*` en los seis idiomas, en el mismo orden de claves
(Regla 2 §5). Se reutilizan `export.*` (RFC 0009) para las acciones de
descargar/compartir/copiar genéricas.

| Sección            | Qué lleva                                                             |
| ------------------ | --------------------------------------------------------------------- |
| `journal.*`        | Pantalla: cabecera, columnas, filtros, formulario, vacíos, `toast`    |
| `journal.kind.*`   | Los siete tipos                                                       |
| `journal.stats.*`  | Las tarjetas y las etiquetas del gráfico                              |
| `journal.views.*`  | Los nombres de las tres vistas                                        |
| `journal.export.*` | Cabecera del Markdown (`titel`, `art`, `datum`…) y «Compartir imagen» |

`nav.journal` es una clave nueva («Notas», que es como se ha pedido llamarla
en la interfaz aunque el código y las traducciones vivan bajo `journal.*` para
no chocar con `notes.*`, ya usado por la bitácora de creyentes).

Las fechas salen de `Intl` con el idioma activo; los «hace N días», de
`Intl.RelativeTimeFormat`.

## Migraciones

Dos, y las dos se prueban **en los dos motores** (Regla 4 §2).

1. **`CreateJournalEntries`** — `journal_entries` y `journal_entry_audios` con
   sus tres índices.
2. **`SeedJournalPermissions`** — añade `journal.view` y `journal.manage` a
   `permissions.ts` y los concede a `pastor` y `predicador-apoyo` en los roles
   que ya existan. Igual que `SeedMinistryRoles` (`CLAUDE.md`), tiene que valer
   para una base de datos que ya existe **y** para una nueva: la constante de
   `ROLE_PERMISSIONS` ya sembrará estos dos permisos en una iglesia nueva, así
   que esta migración no encuentra nada que hacer ahí, y eso es lo correcto.

Y hay que tocar, en el mismo cambio: `packages/shared/src/permissions.ts`,
`role-permissions.ts`, `apps/web/src/lib/nav.ts` y las entidades de
`data-source.ts` (Regla: listadas a mano, sin globs).

## Fases

Cada fase se termina entera —API, web, los seis idiomas y sus pruebas— antes
de empezar la siguiente.

### Fase 1 — El modelo y la API

Migraciones, entidades, esquemas de `shared`, permisos, servicio y
controlador. Listado paginado con todos sus filtros, estadísticas, y el
endpoint de exportación (filas completas). Tests unitarios de servicio y e2e
de la API en SQLite **y** Postgres.

### Fase 2 — El listado en web

`/journal/list` con las tres vistas, filtros en la URL, paginación, pastillas
con su color y su cuenta. Hooks en `packages/api-client`, claves en
`queryKeys.journal`. Textos en los seis idiomas.

### Fase 3 — Escribir

El formulario completo (título, tipo, fechas, los dos textos, recordatorio,
audios grabados o adjuntados), la ficha, borrar con confirmación, `toast`.

### Fase 4 — La portada y el oleaje

`recharts` envuelto (reutilizando `components/charts/`), las tarjetas
navegables, y **el oleaje** (§7.6) trabajado hasta que se sienta bien en los
dos temas y con `prefers-reduced-motion`.

### Fase 5 — Exportar

Markdown (una entrada y en lote, con el ZIP reutilizado) e imagen
(`JournalEntryCard`, compartir y descargar).

### Fase 6 — Rematar

Los tres anchos, los dos temas, el alemán, e2e de Playwright, y actualizar
`docs/ESTADO.md` y `CLAUDE.md` con lo que haya mordido (el prefijo de
`/journal/audios/:id`, seguro que sí).

## Pruebas

| Qué                                                                           | Dónde                        |
| ----------------------------------------------------------------------------- | ---------------------------- |
| `search_text` encuentra sin acentos, en los dos motores                       | e2e de la API                |
| Un recordatorio sin fecha ni hora se rechaza                                  | `journal.service.test`       |
| Dar por atendido un recordatorio no borra la entrada                          | `journal.service.test`       |
| `monthly` trae los doce meses, con los vacíos a cero                          | `journal-stats.service.test` |
| Una entrada de otra iglesia da 404                                            | e2e de la API                |
| Un audio sube, se descarga desde `/journal/audios/:id` y cuelga de su entrada | e2e de la API                |
| Un fichero que no es audio no se guarda                                       | e2e de la API                |
| El filtro `pendingReminder` se resuelve en SQL, en los dos motores            | e2e de la API                |
| Exportar una entrada da un `.md` con la cabecera y el cuerpo completos        | `export-markdown.test.ts`    |
| Exportar varias da un `.zip` con un `.md` por entrada                         | `export-markdown.test.ts`    |
| El listado pagina bien con 2.000 entradas                                     | e2e de la API                |
| Las tres vistas existen y la elegida se recuerda                              | Playwright                   |
| El oleaje no se mueve con `prefers-reduced-motion`                            | Playwright                   |
| El respirar del recordatorio vencido lleva icono y texto, no solo color       | `journal-card.test.tsx`      |
| Quien no tiene `journal.view` no ve la sección en la navegación               | Playwright                   |

## Riesgos y trampas

- **`/audios/:id` ya está tomada.** Es la trampa central de este documento
  (§6, `/journal/audios/:id`): dos controladores reclamando la misma ruta raíz
  es el tipo de fallo que no siempre avisa en desarrollo y sí en producción.
- **`search_text`, `remind_at` y `occurred_at` se recalculan al editar.** Igual
  que `last_note_at` en la RFC 0003 D4: se escriben en un solo servicio y
  nunca desde otro sitio.
- **Una columna `date` desde Postgres vuelve como `Date` a medianoche local.**
  Ya mordió con las notas de creyentes (`CLAUDE.md`); se convierte con
  `iso-day.ts`/`formatDay` y en ningún otro sitio.
- **`recharts` se reconoce a distancia** (RFC 0004 D8). Va desnudo, con carga
  diferida, y solo se importa dentro de `components/charts/`.
- **El oleaje es la única animación en bucle del proyecto**, y es fácil que se
  le añadan más «ya que estamos». No: es una audacia, y sigue siéndolo solo
  mientras sea la única (Regla 9 §4, D14).
- **`IN ('')` contra `uuid` revienta en Postgres.** El filtro por `ids` de la
  exportación en lote limpia los identificadores vacíos antes de la consulta,
  como ya hace la RFC 0009 §6.1.
- **Los audios no están en la base de datos.** La carpeta de `UPLOADS_PATH`
  entra aparte en las copias de seguridad — el mismo aviso que ya deja escrito
  `CLAUDE.md` para las notas de creyentes.

## Alternativas descartadas

- **Colgar las entradas del usuario, como las profecías.** Es lo contrario de
  lo que se ha pedido: «cada iglesia va a tener sus propias notas» (D1).
- **Reutilizar la tabla `believer_notes` con `believer_id` nulo.** Ahorraría
  una migración, pero mezclaría dos modelos con reglas de visibilidad
  distintas y un `NULL` que significaría «no es de nadie» — la clase de
  columna que la Regla 10 pide evitar por lo que puede llegar a significar.
- **Sin título, como la bitácora de creyentes.** Ahí el tipo y la fecha ya
  identifican la nota dentro de _su_ historial; aquí no hay una persona que dé
  contexto (D3).
- **Animar cada icono de tipo con su propio bucle.** Siete animaciones a la vez
  es ruido, no siete audacias (Regla 9 §4). Se concentra en un elemento (D14).
- **Exportar varias entradas como una sola imagen.** No hay disposición
  razonable para varios textos largos en una lámina (D13).
- **Concatenar la exportación en lote en un solo `.md`.** Peor de manejar que
  un `.zip` con un fichero por entrada, y el escritor de ZIP ya existía (D12).
- **Un permiso `journal.*` heredado de `believers.*`.** Daría acceso a
  información más sensible a quien solo debería gestionar personas (D10).

## Criterios de aceptación

- [ ] Cambiar de iglesia activa cambia el cuaderno entero: las entradas de una
      congregación no aparecen en otra.
- [ ] Una entrada se crea con título, tipo, fecha y anotación; lo aprendido, el
      recordatorio y los audios son opcionales.
- [ ] Los siete tipos se ven cada uno con su icono y su color, de forma
      consistente en la pastilla, la tarjeta, el gráfico y la exportación.
- [ ] Un recordatorio guarda día y hora, se ve en la ficha y en el listado, y
      se puede dar por atendido.
- [ ] Un audio se graba o se adjunta, sube al guardar, se escucha desde la
      ficha, y se descarga desde `/journal/audios/:id`.
- [ ] La búsqueda encuentra sin acentos, en Postgres y en SQLite.
- [ ] Los filtros, la página y la vista elegida se comportan como en creyentes
      y profecías: filtros y página en la URL, vista en preferencia local.
- [ ] La portada enseña el total, el reparto por tipo y el gráfico mensual con
      los doce meses, y cada tarjeta lleva al listado ya filtrado.
- [ ] Una entrada se exporta a Markdown con su cabecera y su cuerpo íntegro;
      varias, a un `.zip` con un fichero por entrada.
- [ ] Una entrada se exporta o comparte como imagen, con el logo de Navis y el
      color de su tipo.
- [ ] El oleaje se anima en bucle sin saltos, y se congela con
      `prefers-reduced-motion` sin desaparecer.
- [ ] El recordatorio vencido se distingue sin depender solo del color.
- [ ] Quien no tiene `journal.view` no ve la sección, ni en la navegación ni
      por URL directa.
- [ ] Todos los textos están en los seis idiomas y se ven bien en claro y en
      oscuro, a 375, 768 y 1280 px, con el alemán puesto.
- [ ] `pnpm check` y `pnpm test:e2e` pasan; los e2e de la API, en los dos
      motores.
