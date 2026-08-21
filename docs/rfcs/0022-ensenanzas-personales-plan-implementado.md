# Enseñanzas personales

> **Estado**: Implementado · **Fecha**: 2026-08-20 · **Slug**: `ensenanzas-personales`

- **Tipo**: sección nueva, self-contained. No reabre ningún RFC existente, pero
  reutiliza tres patrones ya resueltos: el modelo «personal, sin `church_id`»
  de la [RFC 0004](./0004-profecias-personales-implementado.md) (profecías), la
  columna JSON en `text` de la [RFC 0021](./0021-tablas-personalizadas.md)
  (tablas personalizadas, D13), y el exportar-y-compartir de una sola entrada
  (Markdown + imagen) de la
  [RFC 0017](./0017-notas-de-iglesia-implementado.md) (el cuaderno, D12/D13).
- **Apps afectadas**: **api y web** (escritorio hereda la web). **Móvil queda
  fuera de esta entrega**, con pantalla puente — es la misma decisión que
  tomaron las RFC 0004 §7.10 y 0017 §7.10, y por el mismo motivo: la forma se
  asienta primero en web antes de duplicar el JSX en React Native, y aquí hay
  además un problema propio (§2, «texto enriquecido cruzado»).
- **Depende de**: nada estructuralmente. Reutiliza infraestructura de
  RFC 0004 (patrón de repositorio con dueño), RFC 0009/0017 (exportar Markdown
  e imagen) y RFC 0021 (columna JSON dual-motor).

## 1. Objetivo y alcance

El pedido es una sección nueva, personal (no de la iglesia), para registrar lo
que alguien aprende de una corrección o una enseñanza recibida: un **título**
y unas **observaciones** en texto con formato — listas con viñetas, listas
numeradas, checklist y negrita/cursiva, no un párrafo plano.

Va en el grupo **General** de la barra lateral, no en el de la iglesia. Esa no
es una preferencia de layout: en `apps/web/src/lib/nav.ts` el grupo `general`
es exactamente lo que ya define la RFC 0004 D1 — lo que es de **la persona**,
no de la iglesia activa (ahí viven hoy el panel y las profecías, y también
sueños). El grupo `church` es lo que cambia al cambiar de iglesia. Pedir que
esto vaya en General es pedir, aunque no se haya dicho con esas palabras, el
mismo modelo de privacidad que las profecías: sin `church_id`, sin
`ActiveChurchGuard`, sin permisos de rol — la única barrera de acceso es ser
el dueño.

Esto además evita un choque de vocabulario: el cuaderno de la iglesia
(RFC 0017) ya tiene un tipo de entrada llamado **«Corrección»**
(`TriangleAlert`, «algo que se hizo mal y hubo que hablar»), pero es una
entrada **compartida con el equipo que pastorea esa iglesia**. Lo que se pide
aquí es lo contrario: personal, y no ligado a ninguna iglesia. Son dos cosas
distintas que además usan la misma palabra si no se elige un nombre distinto —
ver §8, «nombre de la sección».

**Entra:**

- Alta y edición de una **enseñanza**: **título** (obligatorio) y
  **observaciones** en texto enriquecido — párrafos, negrita, cursiva, lista
  con viñetas, lista numerada y checklist. Nada más: sin adjuntos, sin
  encabezados, sin tablas, sin enlaces (§4, el whitelist es la validación).
- Una **fecha de recepción** (`receivedAt`), como en profecías y en el
  cuaderno: no es lo mismo «cuándo pasó» que «cuándo se escribió»
  (`createdAt`), y todo lo demás del proyecto que registra un suceso personal
  ya distingue las dos.
- Un **listado** — tabla en escritorio, tarjetas en móvil (Regla 5) — con
  búsqueda por título/contenido y orden por fecha.
- Una **ficha** de lectura por entrada, con las acciones de compartir.
- Una **portada con tarjetas de estadísticas**, a pedido explícito
  (revisión posterior a la primera versión de este plan): total de
  enseñanzas, cuántas en el año, un gráfico de barras de los últimos doce
  meses (mismo patrón que `MonthlyChart` de profecías, RFC 0004 §6.2) y una
  cuenta propia de este módulo que ninguno de sus hermanos tiene — el
  **porcentaje de ítems de checklist marcados** sobre el total, sumado en
  todas las enseñanzas. No es relleno: es la única cifra que sale de verdad
  del contenido enriquecido y no solo de la fecha, y es coherente con «una
  enseñanza se convierte en algo hecho» (§3).
- **Exportar y compartir una enseñanza**: como **Markdown** (`.md`, con el
  formato ya traducido a sintaxis Markdown: `- `, `1. `, `- [ ] `/`- [x] `,
  `**negrita**`, `*cursiva*`) y como **imagen en alta resolución** (PNG a
  escala ×2, con el logo de Navis) — el mismo par de salidas y el mismo
  mecanismo que ya tiene una entrada del cuaderno (RFC 0017 D12/D13), pedido
  explícitamente para esta sección también.
- API, web y escritorio, con los textos en los seis idiomas.

**No entra, y por qué:**

- **Filtrar o cruzar las estadísticas por tipo o etiqueta.** No hay tipos en
  este módulo (§1: dos campos, título y observaciones) — la portada muestra
  las cuentas de todas las enseñanzas, sin segmentar.
- **La app móvil**, con pantalla puente. El texto enriquecido no tiene una
  solución compartida entre DOM y React Native (§2): llevarlo a móvil no es
  «escribir el JSX otra vez», es escoger o construir un editor nativo
  distinto, que es trabajo propio y no de esta entrega. Igual que en
  RFC 0004/0017, el tipo y el esquema de zod sí se comparten desde el primer
  commit — lo que queda pendiente es la pantalla.
- **Una portada con estadísticas** (al estilo de la de profecías o el
  cuaderno). El pedido es «crear y anotar», no un panel de métricas; si hace
  falta más adelante, es una entrega aparte que no toca el modelo de datos.
- **Enlazar una enseñanza con un creyente o con una entrada del cuaderno.**
  Mezclaría un modelo personal con uno de iglesia — la misma frontera que ya
  trazó la RFC 0004 §12 al negarse a compartir tabla con las notas de
  creyentes.
- **Colaboración en tiempo real o comentarios.** Es un cuaderno de una sola
  persona, como las profecías; no hay nadie más que vaya a editarlo.
- **Formato más allá del whitelist** (encabezados, imágenes, tablas, enlaces,
  color de texto, tachado). Cuanto más grande el conjunto de nodos permitido,
  más grande el validador del servidor y el conversor a Markdown — y nadie ha
  pedido más que «puntos, numerado, checks y énfasis». Se amplía el día que
  haga falta, no antes (Regla 1 §5).

## 2. Referencias

- **Editores de texto enriquecido en React, 2025-2026** (Tiptap, Lexical,
  Editor.js, Quill, Slate — comparativas de Velt, Liveblocks y PkgPulse): el
  consenso es Tiptap como opción por defecto para un editor de producto en
  React — envuelve ProseMirror con una API pensada para React, produce **JSON**
  de forma nativa (no HTML que luego haya que sanear) y trae de fábrica
  `BulletList`, `OrderedList` y, como extensión oficial,
  `TaskList`/`TaskItem` para checklist — exactamente el conjunto que se pide.
  Se toma Tiptap por eso: cubre el whitelist del §4 con extensiones oficiales,
  sin tener que ensamblar plugins de ProseMirror a mano.
- **Texto enriquecido cruzado entre React y React Native** (hilo de Hacker
  News sobre editores multiplataforma; `react-native-enriched`; `BlockNote`):
  la conclusión, repetida en varias fuentes independientes, es que **no hay
  una solución compartida madura** entre DOM y React Native — BlockNote es «de
  navegador» explícitamente, y los editores nativos de verdad
  (`react-native-enriched`) son un motor aparte, sin ProseMirror ni Tiptap
  detrás. Confirma la decisión de §1: móvil se queda con pantalla puente, no
  por pereza sino porque no hay atajo razonable hoy.
- **RFC 0021 D13** (`custom_table_rows.data`): «`text` con `JSON.stringify`,
  igual en los dos motores, y no el `jsonb` nativo de TypeORM, que se comporta
  distinto en Postgres y en SQLite». Se reutiliza tal cual para
  `teachings.body_json` — es el mismo problema (guardar un árbol JSON en las
  dos bases de datos que soporta el proyecto) con la misma solución ya
  probada.
- **Almacenar texto enriquecido: JSON frente a HTML/Markdown** (comparativas
  de formatos, recomendaciones de saneado): guardar HTML obliga a sanear con
  una lista blanca de etiquetas en cada lectura; guardar Markdown pierde
  estructura fina (un `taskList` no es Markdown estándar sin una convención
  aparte). Guardar el **JSON del propio editor**, validado con un esquema de
  zod que sea la misma lista blanca de tipos de nodo que acepta el editor,
  evita las dos cosas: nunca se renderiza HTML ajeno
  (`dangerouslySetInnerHTML` no aparece en ningún punto de esta RFC) y la
  estructura no se degrada. Markdown se **genera** al exportar, no se guarda
  como fuente — ver D-export.
- **RFC 0004 D1/D2, `prophecies.repository.ts`**: el patrón «un repositorio
  que exige `ownerId` en todos sus métodos, sin permisos de rol, con 404 y no
  403» ya está escrito y probado. Se copia entero para `teachings.repository.ts`.

## 3. Dirección de diseño

Nada de un formulario centrado y solo sobre fondo vacío (Regla 9 §2): la
ficha de una enseñanza se compone como una **página de cuaderno**, con el
título como cabecera y las observaciones ocupando el ancho de lectura
(`max-w-prose`), en la misma familia visual que ya usa `EntryAnnotation` del
cuaderno — no se inventa una composición nueva para una pantalla hermana.

**El elemento firma**: marcar un ítem de checklist no pinta un icono de
`check` genérico de librería. Al marcarlo, un trazo fino se dibuja de
izquierda a derecha sobre el texto —`transform: scaleX(0)` a `scaleX(1)`,
nunca `width` (Regla 9 §5, mismo mecanismo que la sonda de creyentes en
CLAUDE.md)— como quien tacha algo aprendido en un cuaderno de verdad. Es una
sola animación, con motivo, y respeta `prefers-reduced-motion` (se aplica sin
transición cuando está activo).

El resto —negrita, cursiva, listas— usa exactamente la tipografía y los
tokens que ya tiene el resto de la aplicación: sin una paleta de colores
propia para el editor, sin sombras nuevas. La barra de formato del editor va
en `bg-popover`/`border`, como cualquier otro control flotante de Navis
(`MessageMenu`, `ReactionPicker`).

**La organización se aparta a propósito del molde profecías/cuaderno**, que
es portada → listado → ficha, las tres con la misma composición de tarjeta
blanca sobre fondo neutro. Aquí:

- La **portada** no es una fila de tarjetas iguales: una tarjeta de
  estadística grande (el porcentaje de checklist, el único número propio de
  este módulo) lleva `bg-brand` con texto en su `-foreground`, como
  superficie de marca (Regla 3 §6) — el resto de tarjetas (total, del año, el
  gráfico mensual) usan `bg-card` pero con un borde de acento
  (`border-accent`/`bg-accent/10`) en vez del borde neutro por defecto, para
  que la pantalla no se lea en blanco y gris como el resto de portadas del
  grupo General. Es la misma paleta de siempre —nada de hexadecimales
  nuevos—, usada con más peso de lo habitual en esta pantalla concreta.
- El **listado** entra con una animación escalonada por fila
  (`animation-delay` creciente, Regla 9 §5) en vez del fundido plano que
  usan las demás tablas, y las tarjetas de móvil llevan el filete de color
  de `border-l-2` que ya usa `EntryAnnotation`, pero coloreado por si la
  enseñanza tiene algún ítem de checklist sin marcar (`border-l-warning`) o
  todos marcados (`border-l-success`) — otra pista visual que no repite lo
  que ya hacen profecías o el cuaderno.
- La **ficha** no es la tarjeta única y centrada de `EntryAnnotation`: el
  título va en una cabecera con `bg-accent/10` a todo el ancho (una franja de
  color suave, no una tarjeta blanca more), y las observaciones debajo, en
  `max-w-prose`, para que la lectura no parezca una copia de la pantalla del
  cuaderno con otro nombre.

Todo lo anterior sigue siendo tokens semánticos y sigue cumpliendo contraste
en los dos temas (Regla 3): «menos blanco» se resuelve con más superficie de
`accent`/`brand` a propósito, nunca con un color fijo.

## 4. Arquitectura

### 4.1 Modelo de datos

```
Teaching (tabla `teachings`)
├── id: uuid
├── owner_id: text        — el dueño; única barrera de acceso (RFC 0004 D1)
├── title: text
├── body_json: text        — documento del editor, JSON.stringify (RFC 0021 D13)
├── search_text: text       — title + texto plano de body_json, sin acentos, minúsculas
├── received_at: date       — cuándo se recibió, no cuándo se escribió
├── created_at / updated_at / deleted_at   — BaseEntity
```

Índices, calcados de `prophecies`: `IDX_teachings_owner_received` sobre
`(owner_id, received_at)` para el listado, `IDX_teachings_owner_search` sobre
`(owner_id, search_text)` para la búsqueda.

`TeachingsRepository` es el único punto que toca la tabla, con `scoped(ownerId)`
y `require(ownerId, id)` (404, no 403) copiados de `PropheciesRepository`.

### 4.2 El documento (whitelist)

El editor solo produce — y el servidor solo acepta — este árbol, en
`packages/shared/src/schemas/teachings.ts`:

```typescript
const markSchema = z.object({ type: z.enum(['bold', 'italic']) });

const textNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(markSchema).optional(),
});

// paragraph, listItem y taskItem son mutuamente recursivos con las listas,
// de ahí z.lazy(): TypeScript no puede inferir un tipo que se usa a sí mismo.
const paragraphSchema = z.object({
  type: z.literal('paragraph'),
  content: z.array(textNodeSchema).optional(),
});

const listItemSchema: z.ZodType<TeachingListItem> = z.lazy(() =>
  z.object({ type: z.literal('listItem'), content: z.array(paragraphSchema) }),
);

const taskItemSchema: z.ZodType<TeachingTaskItem> = z.lazy(() =>
  z.object({
    type: z.literal('taskItem'),
    attrs: z.object({ checked: z.boolean() }),
    content: z.array(paragraphSchema),
  }),
);

const bulletListSchema = z.object({
  type: z.literal('bulletList'),
  content: z.array(listItemSchema),
});
const orderedListSchema = z.object({
  type: z.literal('orderedList'),
  content: z.array(listItemSchema),
});
const taskListSchema = z.object({
  type: z.literal('taskList'),
  content: z.array(taskItemSchema),
});

const blockSchema = z.discriminatedUnion('type', [
  paragraphSchema,
  bulletListSchema,
  orderedListSchema,
  taskListSchema,
]);

export const teachingBodySchema = z.object({
  type: z.literal('doc'),
  content: z.array(blockSchema),
});

export type TeachingBody = z.infer<typeof teachingBodySchema>;
```

(`TeachingListItem`/`TeachingTaskItem` son los tipos que resuelven la
recursión — se escriben a mano, sin `any`, como pide la Regla 10 §1 para
«algo genérico de verdad».)

El body que llega en el DTO de creación/edición se valida contra
`teachingBodySchema` **antes** de `JSON.stringify` — cualquier tipo de nodo
fuera de esta lista, o cualquier HTML colado como texto, se rechaza con 400.
Nunca hay un `JSON.parse` sin pasar por este esquema al leer (Regla 10 §2).

### 4.3 El editor (solo web)

Tiptap, con `StarterKit` recortado a `paragraph`/`bold`/`italic`/`bulletList`/
`orderedList`/`listItem` (se desactivan encabezados, código, cita, regla
horizontal — no están en el whitelist) más `@tiptap/extension-task-list` y
`@tiptap/extension-task-item`.

Vive detrás de una sola puerta, como recharts (CLAUDE.md): se importa
únicamente en `apps/web/src/components/teachings/editor/`, y la pantalla lo
carga con `React.lazy` — Tiptap más las dos extensiones de checklist no
tienen que entrar en el bundle inicial de una aplicación cuya portada es el
panel.

### 4.4 API

Sin `ActiveChurchGuard` y sin `@RequirePermissions` (RFC 0004 D1/D2): el
`ownerId` sale de la sesión, nunca del cuerpo ni de la URL.

| Método | Ruta               | Rol mínimo     | Descripción                                                   |
| ------ | ------------------ | -------------- | ------------------------------------------------------------- |
| GET    | `/teachings/stats` | dueño (sesión) | Las cuentas de la portada (antes de `:id`, como en profecías) |
| GET    | `/teachings`       | dueño (sesión) | Listado paginado y con búsqueda                               |
| POST   | `/teachings`       | dueño (sesión) | Crear                                                         |
| GET    | `/teachings/:id`   | dueño (sesión) | Ficha                                                         |
| PATCH  | `/teachings/:id`   | dueño (sesión) | Editar                                                        |
| DELETE | `/teachings/:id`   | dueño (sesión) | Borrado lógico                                                |

**`/teachings/stats`**, calcado de `prophecy-stats.ts` (§2): una sola
consulta de las filas del dueño, resuelto en memoria (colección personal, no
de iglesia). Devuelve `{ total, thisYear, monthly: TeachingMonth[12],
checklistRate: number | null }`. `monthly` son los últimos doce meses **con
los vacíos incluidos y a cero**, igual que `monthlyGrid` de profecías —
misma razón: un hueco sin mes intermedio falsea la forma del gráfico.
`checklistRate` se calcula recorriendo `body_json` de cada fila y contando
`taskItem.attrs.checked` sobre el total de `taskItem`; `null` cuando no hay
ningún `taskItem` en ninguna enseñanza (cero por ciento y «no hay checklist
todavía» son cosas distintas, mismo criterio que `fulfillmentRate` de
profecías).

No hay endpoint de exportación en el servidor: Markdown e imagen se generan
**en el navegador**, a partir de la ficha ya cargada — el mismo diseño que
`useEntryMarkdownDownload`/`useEntryImageExport` del cuaderno (§4.5).

### 4.5 Exportar y compartir

- **Markdown**: `apps/web/src/lib/teachings/body-to-markdown.ts`, un
  recorrido del árbol de §4.2 (el mismo whitelist, así que la función no
  necesita más casos que los que ya valida el servidor) que emite `- `,
  `1. `, `- [ ] `/`- [x] ` y `**`/`*`. Un fichero corto y con nombre propio
  (Regla 6), en la línea de `lib/export/journal-markdown.ts`. Se descarga con
  `downloadFile`, ya existente en `lib/share/files.ts`.
- **Imagen**: una tarjeta `TeachingCard` (título, fecha, el cuerpo ya
  renderizado por una instancia de Tiptap en modo lectura, el logo de Navis)
  se rasteriza con `nodeToPng(el, 2)` — «×2» es la «excelente calidad»
  pedida, el mismo factor que ya usa `useEntryImageExport`. Un hook
  `useTeachingImageExport`, calcado de ese mismo fichero: comparte por la
  hoja del sistema si existe (`canShareFiles`/`shareFile`) o descarga.
- El `body_json` en la base de datos sigue siendo la **única fuente de
  verdad** — Markdown y PNG son proyecciones que se calculan al pulsar
  exportar, nunca se guardan. Es la misma razón por la que `fulfilledAt` de
  profecías es una columna y no dos (RFC 0004 D3/D4): no se abren dos sitios
  que puedan desincronizarse.

## 5. Pasos ordenados

1. **Esquema compartido** (`packages/shared/src/schemas/teachings.ts`): el
   whitelist de §4.2, `createTeachingSchema`/`updateTeachingSchema` con
   `title` (1-200) y `receivedAt`. Es la base de todo lo demás — API y editor
   se escriben contra este tipo.
2. **Entidad, migración y repositorio en la API**: `Teaching`,
   `TeachingsRepository`, migración `CreateTeachings` (en los dos motores).
   Sin tocar `role-permissions.ts`: no hay permisos que dar.
3. **Servicio, estadísticas y controlador**: CRUD + búsqueda, calcado de
   `prophecies.service.ts`/`prophecies.controller.ts` sin las partes que no
   aplican (cumplimientos); `teaching-stats.ts` calcado de
   `prophecy-stats.ts` (§4.4).
4. **`nav.ts`, icono y traducciones base**: entrada `teachings` en el grupo
   `general` (icono `GraduationCap`, libre hoy en `nav.ts`), claves
   `nav.teachings` y `teachings.*` en los seis idiomas (§7).
5. **El editor** (`components/teachings/editor/`), aislado y con su propio
   test de «solo produce nodos del whitelist» antes de conectarlo a nada.
6. **Listado y ficha en web**: `/teachings` (tabla/tarjetas, Regla 5),
   `TeachingFormDialog` para crear/editar, `/teachings/:id` para leer, con la
   composición propia de §3 (nada de copiar la de profecías/cuaderno).
7. **La portada** (`/teachings` raíz, si se separa de §6, o su cabecera si no
   — a decidir en el momento con el mismo criterio que profecías D9): las
   tarjetas de estadística y `MonthlyChart`-equivalente para este módulo,
   cargado con `React.lazy` (§4.3, mismo patrón que `components/charts/lazy.tsx`).
8. **Exportar**: `body-to-markdown.ts`, `TeachingCard`,
   `useTeachingImageExport` (§4.5).
9. **Pantalla puente en móvil**: `apps/mobile/app/teachings.tsx`, entrada en
   `(tabs)/more.tsx`, `'nav.teachings'` añadido al `NavKey` de
   `placeholder-screen.tsx`.

## 6. Interfaz

- **Web**: `/teachings` (listado, con `DataTable` — fila con título,
  fecha, primeras palabras en texto plano de `body_json` **solo como
  vista previa**: igual que la ficha del cuaderno, editar vuelve a pedir la
  entrada entera por identificador y no reutiliza el extracto truncado,
  CLAUDE.md) y `/teachings/:id` (ficha de lectura, con las acciones de
  exportar). Crear y editar son un diálogo (`TeachingFormDialog`), no una
  ruta aparte — como el resto de formularios cortos del proyecto.
- **Móvil**: `apps/mobile/app/teachings.tsx` con `PlaceholderScreen`,
  colgado de `(tabs)/more.tsx` junto a profecías, sueños y comunicaciones
  (Regla 5 §2).
- Los tres anchos (Regla 5 §7) y los dos temas (Regla 3) se comprueban en la
  ficha con una enseñanza que tenga las cuatro cosas a la vez: un párrafo
  largo, una lista numerada, una checklist con algún ítem marcado y una
  palabra en alemán larga en el título.

## 7. Consideraciones

- **Privacidad**: mismas garantías que profecías (RFC 0004 D1) — sin
  `church_id`, invisible para cualquiera que no sea el dueño, ni siquiera un
  pastor de la iglesia activa. El aviso de la RFC 0004 sobre que un
  administrador de la base de datos puede leer la fila sigue aplicando
  igual aquí.
- **Offline**: como el resto de la PWA, sin soporte de escritura sin
  conexión en esta entrega; el service worker no necesita tocarse (no hay
  ninguna ruta `/teachings` que deba esquivar el `navigateFallback`, a
  diferencia de `/l/:token`).
- **IA**: no se usa el módulo `ai` en esta entrega.

### Textos nuevos

Sección nueva en `packages/i18n/src/locales/`, seis idiomas, mismo orden de
claves en los seis (Regla 2 §5):

| Clave                          | es (referencia)                          |
| ------------------------------ | ---------------------------------------- |
| `nav.teachings`                | Enseñanzas                               |
| `teachings.title`              | Enseñanzas                               |
| `teachings.titleField`         | Título                                   |
| `teachings.titlePlaceholder`   | Qué aprendiste                           |
| `teachings.notesField`         | Observaciones                            |
| `teachings.notesPlaceholder`   | Anota lo que quieras recordar            |
| `teachings.receivedAtField`    | Fecha                                    |
| `teachings.new`                | Nueva enseñanza                          |
| `teachings.searchPlaceholder`  | Buscar en tus enseñanzas                 |
| `teachings.empty`              | Todavía no has anotado ninguna enseñanza |
| `teachings.editor.bold`        | Negrita                                  |
| `teachings.editor.italic`      | Cursiva                                  |
| `teachings.editor.bulletList`  | Lista con viñetas                        |
| `teachings.editor.orderedList` | Lista numerada                           |
| `teachings.editor.taskList`    | Checklist                                |
| `teachings.export.markdown`    | Descargar como Markdown                  |
| `teachings.export.image`       | Compartir como imagen                    |
| `teachings.delete.confirm`     | ¿Borrar esta enseñanza?                  |

`common.save`, `common.cancel`, `common.delete`, `common.loading` y
`errors.generic` ya existen y se reutilizan sin duplicarlos.

## 8. Alternativas descartadas

- **Llamarla «Correcciones».** Es la primera palabra que se propuso, pero
  choca con el tipo «Corrección» que ya existe en el cuaderno de la iglesia
  (RFC 0017 D2) y que significa otra cosa (compartido, no personal). Se
  descarta también «Feedback» — no está en español y el proyecto no mezcla
  idiomas en la interfaz salvo el nombre de la aplicación. **Enseñanzas**
  queda porque cubre tanto una corrección como una lección aprendida sin
  reutilizar una palabra ya ocupada.
- **Ampliar el tipo «Corrección» del cuaderno en vez de crear una sección.**
  Se descarta porque el pedido — «va en General» — es explícitamente sobre el
  modelo de **privacidad**: el cuaderno es de la iglesia, esto es de la
  persona. Forzarlo dentro del cuaderno significaría o bien exponerlo al
  equipo (lo contrario de lo pedido) o bien meter una excepción de
  visibilidad dentro de un módulo que hoy no tiene ninguna (RFC 0017 D1) —
  más complejidad que crear una tabla nueva.
- **Guardar el cuerpo como Markdown en vez de JSON.** El editor tendría que
  serializar a Markdown en cada pulsación y volver a parsearlo al abrir, y un
  `taskList` con estado `checked` no tiene una representación Markdown
  estándar sin inventar una convención propia. El JSON del propio árbol,
  validado con el whitelist de §4.2, es la fuente de verdad; Markdown es una
  exportación, no un formato de guardado (§4.5, §2).
- **`jsonb` nativo de Postgres para `body_json`.** Descartado por la misma
  razón que ya dejó escrita la RFC 0021 D13: se comporta distinto en
  Postgres y en SQLite, y este proyecto corre migraciones en los dos
  motores. `text` con `JSON.stringify` es idéntico en ambos.
- **BlockNote o un editor "todo en uno".** Trae su propia interfaz de bloques
  ya diseñada (arrastrar, insertar imagen, tablas…), la mayoría fuera del
  whitelist de esta entrega y con su propio aspecto que costaría más
  desactivar y re-vestir con los tokens de Navis que construir la barra de
  formato mínima sobre Tiptap (Regla 9 §2: nada de plantilla ajena pegada tal
  cual).
- **Portar el editor a móvil con un WebView.** Es una salida real (algunos
  proyectos lo hacen), pero tiene penalización de rendimiento y de UX
  documentada en la propia comunidad de React Native, y el pedido no incluía
  móvil. Queda anotado para cuando la app móvil se ponga a la par de web,
  como el resto de secciones «solo web» del proyecto.

## 9. Plan de pruebas

- **Esquema compartido**: acepta el árbol del whitelist; rechaza un tipo de
  nodo fuera de la lista y un `taskItem` sin `attrs.checked`.
- **API**: e2e calcado del de profecías — crear, listar, editar, borrar, y
  que pedir el identificador de la enseñanza de otro usuario devuelva 404. En
  los dos motores (Regla 4 §6, Postgres y SQLite).
- **Editor**: un test de comportamiento (no de estilos, Regla 4 §4) que
  compruebe que aplicar «lista con viñetas» y luego «checklist» sobre el
  mismo párrafo produce un documento válido contra el esquema — no que se
  vea de una forma concreta.
- **`body-to-markdown.ts`**: un documento con las cuatro construcciones a la
  vez produce el Markdown esperado, checklist incluida (`- [x]`/`- [ ]`).
- **Web**: la fila del listado, el diálogo de crear/editar, y que el enlace
  de la ficha exporta un `.md` descargable y un PNG (`canShareFiles`/
  `downloadFile` mockeados, como ya hace el test del cuaderno).
- `pnpm check`, y `pnpm test:e2e` por tocar api y web (Regla 4 §2).

## Criterios de aceptación

- [ ] `Enseñanzas` aparece en el grupo **General** de la barra lateral, en
      los seis idiomas.
- [ ] Se puede crear una enseñanza con título y observaciones en negrita,
      cursiva, lista con viñetas, lista numerada y checklist.
- [ ] Una enseñanza de un usuario no es visible ni editable por otro
      (404, no 403).
- [ ] El listado busca por título y por el texto de las observaciones.
- [ ] La ficha exporta la enseñanza como `.md` con el formato traducido a
      Markdown, y como imagen PNG en alta resolución con el logo de Navis.
- [ ] `pnpm check` y `pnpm test:e2e` pasan en verde.
- [ ] La app móvil muestra la pantalla puente con el enlace a este RFC, sin
      romper la navegación de `(tabs)/more.tsx`.
- [ ] Los dos temas y los tres anchos se ven correctos con contenido real
      (párrafo largo + lista numerada + checklist con ítems marcados).
