# Profecías en la app móvil — plan de implementación

- **Fecha**: 2026-09-22
- **Depende de**: RFC 0004 (profecías, implementado en api/web) y RFC 0024
  (login completo en móvil, Fase 1 implementada — base local + repositorios).
- **Sustituye**: `apps/mobile/app/prophecies.tsx`, hoy un `PlaceholderScreen`
  que enlaza a este documento en vez de a la RFC (se actualiza al empezar).

## 0. Enmienda a la RFC 0004 §7.10

La RFC 0004 (agosto 2026) decía: «la app móvil queda fuera... el tipo, el
esquema y los hooks ya se escriben compartidos en esta entrega». Eso asumía
que móvil hablaría con la API como web. Un mes después, la RFC 0024 cambió esa
premisa para **todo** el proyecto: móvil tiene su propia base SQLite
(`expo-sqlite`) y las pantallas consumen **repositorios locales**, no
`api-client` — es como ya están creyentes, notas y calendario. Este plan seguía
esa arquitectura, no la de la RFC 0004 §7.10: hay que escribir un esquema local, una
migración y un repositorio nuevos, no reutilizar hooks de `api-client`.

Lo que sí se reutiliza tal cual de `packages/shared`: `prophecyState`,
`waitingDays`, `isFulfilled`, `toSearchName`, los esquemas de validación y las
casi 100 claves de `prophecies.*` que ya existen en los seis idiomas.

## 1. Objetivo y alcance

Dar a profecías, en la app móvil, el mismo modelo de datos y los mismos
estados que ya tiene api/web (RFC 0004), con una interfaz pensada para
móvil desde cero — no un recorte de la web ni una pantalla de plantilla.

**Entra:**

- El esquema local (`prophecies` + `prophecy_fulfillments`), su migración y su
  repositorio, con paridad de campos comprobada contra las entidades de la API.
- Portada con las estadísticas y tarjetas-filtro.
- Listado con buscador, filtros de estado y ventana, y sus vistas.
- Ficha con el historial de cumplimientos y el interruptor «Ya se cumplió»
  (D6 de la RFC 0004).
- Los dos formularios (apuntar/editar profecía, anotar cumplimiento).
- Los seis idiomas, los dos temas, animación con motivo, tests.

**No entra, y por qué:**

- **Sueños** (RFC 0005) y **Enseñanzas** (RFC 0022). Son secciones hermanas,
  ya implementadas en api/web con el mismo patrón que profecías (sin
  `church_id`, propias del usuario). El mismo criterio que la RFC 0004 aplicó
  sobre sí misma —«la forma se asienta primero en una pantalla antes de
  repetirla»— aplica aquí: se hace un plan aparte para Sueños una vez este
  quede asentado y revisado en un dispositivo real, reutilizando lo que este
  plan deje resuelto (el patrón de repo local sin iglesia, el conmutador de
  vistas, el anillo de tasa).
- **Exportar** (D9 web, XLSX) y **compartir una profecía**: no están pedidos y
  la RFC 0004 los deja fuera también en web más allá del export ya construido.
- **Cifrado en reposo**: la RFC 0004 ya lo deja como pregunta abierta sin
  resolver; no se resuelve aquí tampoco.

## 2. Hallazgos de la investigación

### 2.1 La web, en marcha

Se levantó `pnpm dev` local y se recorrió `/prophecies`, `/prophecies/list`
(las cuatro vistas) y una ficha, con datos reales creados a mano —una
profecía en espera, una cumplida al crearse, y un cumplimiento parcial
anotado sobre la primera—. Confirma que la RFC 0004 está implementada tal
cual está escrita: la portada vacía dice exactamente «Todavía no has apuntado
ninguna profecía»; el interruptor «Ya se cumplió» despliega la fecha con hoy
puesto (D6); la ficha cambia de degradado de cabecera según el estado
(ámbar en espera, azul en camino); el conmutador de cuatro vistas
(Bitácora/Lectura/Recorrido/Fichas) funciona en la ficha, y la travesía
(D11.1) se ve en el listado como un trazado horizontal por fila con la marca
del cumplimiento parcial. Esto es lo que hay que igualar en función, no en
píxel: la interfaz de móvil es otra.

### 2.2 Dreamkeeper (`D:\Proyectos_personales\Dreamkeeper`)

Su tabla `prophecies` (`database/schema.ts`) es **más simple** que la de
Navis: `title`, `description`, `heard_date`, `status` ('pending'|'fulfilled',
solo dos estados guardados en columna), `fulfillment_date`,
`fulfillment_notes` (un solo campo de texto libre para todo lo cumplido).
Navis ya tiene un modelo **superior** al de Dreamkeeper: tres estados
derivados (D3) en vez de dos guardados, y una tabla de cumplimientos
parciales en vez de un campo de texto (D4, descartado expresamente en la RFC
0004 por las mismas razones que aquí se confirman al leer Dreamkeeper: no
deja contar, ordenar ni pintar una travesía). **Conclusión: «los mismos
campos que Dreamkeeper» ya está superado por lo que Navis tiene diseñado —
este plan no reduce el modelo de la RFC 0004 a los campos de Dreamkeeper; lo
lleva tal cual a móvil.**

Lo que sí vale la pena tomar de Dreamkeeper son sus **patrones de
interacción** para React Native, que Navis no tenía resueltos para este caso:

- **Metapíldoras de fecha/estado** (`add-prophecy-meta-row.tsx`): dos
  píldoras con icono, etiqueta y valor, una para la fecha y otra para el
  interruptor de cumplida, cada una abre su propio selector al tocarla. Más
  aprovechable en una pantalla de formulario en móvil que un interruptor
  suelto seguido de un `<input type="date">` como en web.
- **La sección de cumplimiento aparece con una animación de entrada/salida**
  al marcar y desmarcar el interruptor (`FadeInDown`/`FadeOut`,
  220/180&nbsp;ms) — el equivalente nativo exacto de lo que la RFC 0004 §7.8
  pide para el mismo gesto en web.
- **Tarjeta con listón de color lateral** (`prophecy-card.tsx`): 3&nbsp;px de
  ámbar o esmeralda según el estado, con `Pressable` + `withSpring` al tocar
  (`scale: 0.98`). Reutilizable tal cual con los tokens de Navis para las
  tarjetas de la vista «Fichas» del listado.

### 2.3 Refero — referencias concretas

| Referencia                                                                                                       | Qué se toma                                                                                                                                                  | Qué se evita                                                                    |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Rewind** (app UNHINGED, journal) — timeline vertical de mañana/tarde/noche unidas por un filete a la izquierda | La forma exacta de reinterpretar la travesía en vertical para móvil: entradas ancladas a una línea continua, cada una con su marca y su hora                 | Su agrupación por franja horaria — aquí se agrupa por año, como en web          |
| **ABY Journal** — tarjetas de racha y estadísticas en pastel, con calendario mensual y mood dots                 | La composición de la portada: una tarjeta grande arriba (aquí, el anillo de tasa) y tarjetas de apoyo alrededor                                              | Su paleta pastel decorativa — aquí, tokens de Navis y nada de relleno (Regla 9) |
| **one year** — vista de rejilla de puntos por día, un punto por entrada                                          | El espíritu de la vista «Año» (D11.4 de la RFC 0004): lo que importa es ver los huecos, no cada entrada                                                      | El widget de pantalla de inicio, fuera de alcance                               |
| **CocoonWeaver** — lista de notas agrupada por píldoras de fecha, con botón flotante de añadir                   | Las píldoras de fecha como cabecera de sección en el listado agrupado (alternativa más ligera que `SectionList` con texto plano, si el diseño final lo pide) | —                                                                               |
| **Planny** — bitácora oscura de tareas con marcas de tiempo y insignias de color                                 | El tono sobrio para la vista «Bitácora» de la ficha: lista vertical, sin tarjetas pesadas, una insignia de color por entrada                                 | Su modo oscuro fijo — aquí sigue el tema del sistema (Regla 3)                  |

## 3. Dirección de diseño

### 3.1 La travesía se reinterpreta, no se encoge

La propia RFC 0004 §7.9 ya lo autoriza: «si aun así no se lee, la vista de
serie en móvil pasa a ser "fichas", y la travesía queda de `md` para arriba».
Meter el trazado horizontal de la web en 375&nbsp;px sería forzar un
componente pensado para escritorio en una pantalla que no es la suya — y
caer directamente a una rejilla de fichas sin más sería la salida fácil que
Regla 9 pide evitar.

**Decisión — el elemento firma de móvil es «Recorrido»: una travesía
vertical**, con la forma de Rewind (§2.3): un filete continuo baja por el
centro de la pantalla, cada profecía es un tramo con su punto de inicio (la
fecha en que se recibió), sus marcas de cumplimiento parcial y su cierre — un
`◆` relleno si está cumplida, un trazo que se desvanece hacia abajo si sigue
esperando. Es la travesía de la RFC 0004, girada 90°: mismo dato (el tiempo
transcurrido), la orientación que sí funciona en una pantalla estrecha y
alta. Sustituye a «Fichas» como vista de serie por defecto del listado;
«Fichas» sigue existiendo como una de las vistas del conmutador, para quien
quiera escanear muchas a la vez.

### 3.2 Una audacia por pantalla (Regla 9 §4)

- **Portada**: el anillo de tasa de cumplimiento (`ProgressRing`, ya existe
  en `components/ui`) — se anima de 0 a su valor solo en el primer montaje.
- **Listado**: el Recorrido vertical de §3.1.
- **Ficha**: el hilo de cumplimientos de la vista «Bitácora», ya descrito en
  la RFC 0004 §7.6 («cada cumplimiento anclado a su fecha, con un filete que
  los enhebra») — se reutiliza el mismo lenguaje visual que el Recorrido del
  listado (misma primitiva, Regla 1).

Lo demás en voz baja: tarjetas y chips de los tokens de siempre, sin
degradados fuera de la tarjeta grande de la portada.

### 3.3 Iconos e identidad

Los mismos papeles que en web, traducidos a Ionicons (móvil usa Ionicons, no
lucide — CLAUDE.md). Comprobado contra el glyph map instalado
(`@expo/vector-icons`): Ionicons no tiene `anchor` ni `waves`, así que los dos
papeles que en web usan esos lucide se resuelven con un icono propio en vez
de forzar el que no existe:

| Papel     | Web (lucide) | Móvil (Ionicons)     | Por qué                                                                                                                                                                                |
| --------- | ------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sección   | `Sparkles`   | `sparkles-outline`   | Existe tal cual                                                                                                                                                                        |
| Cumplida  | `Anchor`     | `flag-outline`       | «Anchor» no existe en Ionicons; una bandera de llegada es la misma idea (se acabó el trayecto) sin reutilizar el barco del logo, que ya significa «Navis» en otro sitio de la interfaz |
| En camino | `Waves`      | `trail-sign-outline` | «Waves» no existe; una señal de sendero encaja mejor todavía con «en camino» que las olas — es un camino, no un mar                                                                    |
| Espera    | `Hourglass`  | `hourglass-outline`  | Existe tal cual                                                                                                                                                                        |

Ninguno se lee como cruz de lejos (Regla 7 §6): comprobado a simple vista
sobre los cuatro, quedan fijados así.

## 4. Arquitectura

### 4.1 Esquema local (`packages/shared/src/local-schema.ts`)

Dos tablas nuevas en `LOCAL_TABLES`, mirando `Prophecy` y
`ProphecyFulfillment` (`apps/api/src/prophecies/*.entity.ts`) columna por
columna. **Son las primeras tablas locales sin `church_id`** — igual que en
la API, y por el mismo motivo (D1): la fila la posee el usuario, no la
iglesia.

```ts
table('prophecies', 'Prophecy', [
  { name: 'owner_id', type: 'text' },
  { name: 'title', type: 'text' },
  { name: 'body', type: 'text' },
  { name: 'search_text', type: 'text' },
  { name: 'received_at', type: 'text' }, // date -> ISO AAAA-MM-DD
  { name: 'fulfilled_at', type: 'text', nullable: true },
  { name: 'last_fulfillment_at', type: 'text', nullable: true },
]),
table('prophecy_fulfillments', 'ProphecyFulfillment', [
  { name: 'prophecy_id', type: 'text' },
  { name: 'owner_id', type: 'text' }, // denormalizado, igual que en la API (D1)
  { name: 'text', type: 'text' },
  { name: 'occurred_at', type: 'text' },
]),
```

`LOCAL_INDEXES` añade el espejo de los índices de la API:
`IDX_prophecies_owner_received`, `IDX_prophecies_owner_fulfilled`,
`IDX_prophecies_owner_search`, `IDX_prophecy_fulfillments_prophecy`.

`owner_id` en local mode es siempre `session.userId` de `useLocalSession`
(`apps/mobile/src/stores/local-session.ts`) — no hace falta `churchId`, así
que, a diferencia de creyentes o notas, el repositorio de profecías **no
depende de tener una iglesia creada**. No cambia el flujo de alta actual
(sigue exigiendo crear iglesia antes de entrar a la app, RFC 0024), solo es
una nota para no añadir un filtro por iglesia que no toca (RFC 0004 D1, otra
vez, ahora en local).

### 4.2 Migración (`apps/mobile/src/data/db.ts`)

`SCHEMA_VERSION` pasa de 5 a 6. La migración 6 sigue el patrón ya usado en
las migraciones 2 y 4 (crear solo lo que falte, porque una base **nueva** ya
recibe las tablas por `ALL_LOCAL_TABLES` en la migración 1):

```ts
6: async (db) => {
  const existing = new Set(/* PRAGMA sqlite_master, como en la migración 4 */);
  for (const one of ALL_LOCAL_TABLES) {
    if (!['prophecies', 'prophecy_fulfillments'].includes(one.name)) continue;
    if (existing.has(one.name)) continue;
    await db.execAsync(createTableSql(one));
  }
  for (const one of LOCAL_INDEXES) {
    if (!['prophecies', 'prophecy_fulfillments'].includes(one.table)) continue;
    await db.execAsync(/* CREATE INDEX IF NOT EXISTS, como en la migración 4 */);
  }
},
```

`apps/api/src/database/local-schema.parity.test.ts` recoge las dos tablas
nuevas automáticamente en cuanto están en `LOCAL_TABLES` (es genérico sobre
la lista, no hay que tocarlo a mano salvo que el test lo pida al correr).

### 4.3 Repositorio (`apps/mobile/src/data/repos/`)

Dos ficheros, por la Regla 6 y porque son dos responsabilidades distintas
(la Regla 1 §2 ya separa así believers de notes):

- **`prophecies-repo.ts`** — CRUD de la profecía, listado y estadísticas.
- **`prophecy-fulfillments-repo.ts`** — CRUD de un cumplimiento, y quién
  mantiene `last_fulfillment_at` (ver abajo).

Lo que se reutiliza de `packages/shared` en vez de reescribirse:

| Necesito                                                  | Uso                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El estado derivado                                        | `prophecyState`, `isFulfilled` (`prophecy-state.ts`)                                                                                                                                                                                                                                                                                                                                                              |
| Los días de espera                                        | `waitingDays`                                                                                                                                                                                                                                                                                                                                                                                                     |
| Normalizar la búsqueda                                    | `toSearchName` — `search_text = toSearchName(`${title} ${body}`)`, igual que hace `toSearchText` en `prophecies.service.ts` de la API                                                                                                                                                                                                                                                                             |
| Validar título/cuerpo, D7 (cumplida no antes de recibida) | `createProphecySchema`, `createFulfillmentSchema`/`updateFulfillmentSchema` de `packages/shared/src/schemas/prophecies.ts` — encajan tal cual con el input local (mismos campos, y el `refine` de D7 ya viene incluido), así que el repositorio valida con ellos antes de escribir, igual que hacen los DTO de la API                                                                                             |
| La ventana de tiempo (`7d`/`30d`/`year`/`all`)            | `windowStart` sube de `apps/api/src/prophecies/prophecies-filter.ts` a `packages/shared` (usa `addDays`, ya compartido, y no depende de TypeORM): con API y móvil ya hay dos usos reales, así que se extrae ahora en vez de duplicarla (Regla 1 §5)                                                                                                                                                               |
| Traducir el estado a SQL                                  | `STATE_SQL` **no** sube a `shared`: en la API es una expresión de TypeORM (`prophecy.fulfilledAt IS NULL...`) y en móvil es SQL crudo en `snake_case` — no es la misma función con otro nombre, son dos traducciones distintas de la misma regla D3 a dos motores de consulta. Se repite como una constante `STATE_SQL` propia en `prophecies-repo.ts`, con el mismo comentario que en la API explicando la regla |

**`last_fulfillment_at` se escribe en un solo sitio** (RFC 0004 §5.1, el
mismo principio que ata `last_note_at` en creyentes): las funciones del
repositorio que crean, editan o borran un cumplimiento recalculan
`MAX(occurred_at)` de los cumplimientos vivos de esa profecía y lo escriben
ahí, dentro de la misma transacción SQLite. Ningún otro punto del código lo
toca.

Firmas, mismo espíritu que `believers-repo.ts`:

```ts
listProphecies(query: PropheciesQuery & { ownerId: string; limit: number; offset: number }): Promise<Paginated<ProphecyListItem>>
prophecyStats(ownerId: string, today: IsoDate): Promise<ProphecyStats>
findProphecy(ownerId: string, id: string): Promise<ProphecyDetail | null>
createProphecy(ownerId: string, input: WriteProphecyInput): Promise<string>
updateProphecy(ownerId: string, id: string, input: Partial<WriteProphecyInput>): Promise<void>
deleteProphecy(ownerId: string, id: string): Promise<void>

listFulfillments(ownerId: string, prophecyId: string): Promise<ProphecyFulfillment[]>
addFulfillment(ownerId: string, prophecyId: string, input: { text: string; occurredAt: string }): Promise<string>
updateFulfillment(ownerId: string, id: string, input: Partial<{ text: string; occurredAt: string }>): Promise<void>
deleteFulfillment(ownerId: string, id: string): Promise<void>
```

Los tipos (`PropheciesQuery`, `ProphecyListItem`, `ProphecyStats`,
`WriteProphecyInput`) son los mismos de `packages/shared`, no una copia local
— es lo que hace que el mismo `ProphecyCard` o el mismo cálculo de estado
sirvan aquí y en web sin traducir nada.

### 4.4 Hooks (`apps/mobile/src/hooks/use-prophecies.ts`)

TanStack Query envolviendo el repositorio, igual que `use-believers.ts`
(§2 de ese fichero: «la pantalla no sabe que los datos vienen de SQLite»):

```
queryKeys: ['prophecies', ownerId, 'list', query]
           ['prophecies', ownerId, 'stats']
           ['prophecies', ownerId, 'detail', id]
```

`useProphecies(query)` (infinita, 20 en 20, como creyentes), `useProphecyStats()`,
`useProphecy(id)`, `useCreateProphecy()`, `useUpdateProphecy()`,
`useDeleteProphecy()`, `useAddFulfillment()`, `useUpdateFulfillment()`,
`useDeleteFulfillment()`. Las mutaciones invalidan `['prophecies', ownerId]`
entero (lista, stats y detalle a la vez), igual que hace `refreshBelievers`.

### 4.5 Pantallas y componentes

```
apps/mobile/app/
├── prophecies.tsx              — portada (sustituye el PlaceholderScreen)
└── prophecies/
    ├── list.tsx                 — listado con buscador, filtros y vistas
    └── [id].tsx                 — ficha, con su conmutador de 4 vistas

apps/mobile/src/components/prophecies/
├── prophecy-hero.tsx            — cabecera de la portada («47 palabras · …»)
├── prophecy-stat-cards.tsx      — las seis tarjetas-filtro (D10), cada una navega a list con su filtro
├── prophecy-monthly-chart.tsx   — cumplimiento mes a mes, dos series (ver 4.6)
├── prophecy-filters.tsx         — buscador + chips de estado y ventana (reutiliza Chip, SearchField)
├── prophecy-view-switch.tsx     — envoltorio fino de SegmentedControl con las opciones de móvil
├── prophecy-journey.tsx         — el Recorrido vertical (§3.1), reutilizado en listado y ficha
├── prophecy-card.tsx            — tarjeta de la vista «Fichas» (listón de color, Dreamkeeper §2.2)
├── prophecy-year-view.tsx       — vista «Año», reutilizando el patrón de `notes-calendar-view.tsx`
├── prophecy-form-sheet.tsx      — apuntar/editar, con las metapíldoras de fecha (§2.2)
├── prophecy-fulfillment-sheet.tsx — anotar un cumplimiento
└── prophecy-fulfillment-toggle.tsx — el interruptor «Ya se cumplió» con su fecha (D6)
```

Reutilización directa de `components/ui` — nada de esto se reinventa (Regla 1):

| Necesito                           | Componente ya existente                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| El anillo de tasa                  | `ProgressRing` (API ya trae `progress: 0–1`, `tone`, `label`)                                                       |
| El gráfico de dos series           | `BarChart`/`LineChart` no soportan dos series hoy — ver 4.6                                                         |
| Conmutador de vistas               | `SegmentedControl`                                                                                                  |
| Chips de estado/ventana con cuenta | `Chip`, tal como los usa `KindChips` en `notes-bitacora.tsx`                                                        |
| Buscador                           | `SearchField`, con el mismo patrón de `useDebouncedValue` (evita la trampa de `expo-sqlite` concurrente, CLAUDE.md) |
| Hoja de formulario                 | `BottomSheet`                                                                                                       |
| Selector de fecha                  | `DatePicker`                                                                                                        |
| Vacíos                             | `EmptyState`                                                                                                        |
| Esqueletos de carga                | `Skeleton`                                                                                                          |
| Confirmación de borrado            | El mismo patrón de diálogo que ya usa creyentes/notas                                                               |

### 4.6 El gráfico mensual

Ninguna de las primitivas de `components/ui` (`BarChart`, `LineChart`) admite
hoy dos series (recibidas/cumplidas) — es un caso nuevo, no una carencia:
Regla 1 §5 dice que se generaliza a la tercera vez, y esta es la primera vez
que hace falta. Se construye un componente propio en
`components/prophecies/prophecy-monthly-chart.tsx` sobre
`react-native-gifted-charts` (ya es la librería de gráficos del proyecto,
CLAUDE.md) usando su soporte de barras agrupadas, con los mismos tokens de
`chartTheme` que ya usan `BarChart`/`LineChart`. Si en el futuro aparece un
segundo caso de dos series, ahí sí se sube a una primitiva genérica.

Los mismos matices de la RFC 0004 D14 aplican en local: `monthly` cubre los
últimos doce meses con los vacíos a cero, y `fulfillmentRate` es `null` con
cero profecías (no `0`) — se calcula igual en el repositorio.

### 4.7 Lo que la web tiene y aquí se simplifica o pospone a propósito

**Decidido:**

- **Portada y listado son dos pantallas** (como D9 web) y no una sola
  desplazable: es también el patrón de Dreamkeeper (dashboard separado de la
  lista con «ver todas»), confirmado por dos productos distintos.
- **Cuatro vistas del listado, pero la de serie es el Recorrido vertical**
  (§3.1) en vez de la travesía horizontal — es la propia RFC 0004 quien lo
  autoriza para pantallas estrechas.
- **«Tabla» se renombra a «Lista»**: `DataTable` no tiene equivalente en
  móvil — la propia Regla 5 §2 hace que una tabla se convierta en fichas por
  debajo de `md`, así que no hay nada que «ser tabla» en un teléfono. La
  cuarta vista es una lista plana y compacta, una fila por profecía
  (título, pastilla de estado, fecha, cumplimientos), con la copia
  `prophecies.views.list` («Lista») — la misma palabra que ya usa
  `notes.viewList` para el mismo tipo de vista en creyentes.
- **Sin exportar XLSX** en esta entrega: no está pedido para móvil y ninguna
  otra sección lo tiene todavía ahí (creyentes tampoco).
- **El filtro de fechas a medida (`from`/`to`) no lleva selector de rango
  propio**: se reutiliza `DateRangePicker`/`date-range-presets.tsx`, que ya
  existe para otra pantalla, en vez de construir uno nuevo.
- **La URL no lleva los filtros** (D12 web): en móvil no hay URL que
  compartir; el estado de filtros vive en el componente, como ya hace
  `NotesBitacora`. La vista elegida sigue recordándose entre sesiones
  (`navis.propheciesView` en AsyncStorage, mismo mecanismo que el tema).

## 5. Pasos ordenados

Cada paso deja la sección mejor de lo que estaba y es entregable por
separado (Regla 4: cada uno termina con `pnpm --filter @navis/mobile
typecheck && test`, y `pnpm check` al cerrar el plan entero).

1. **Esquema, migración y repositorio** — las dos tablas, la migración 6, el
   test de paridad al día, `prophecies-repo.ts` y
   `prophecy-fulfillments-repo.ts` con sus tests contra `test-support.js`
   (creación, listado con cada filtro, D7 rechazada, `last_fulfillment_at`
   recalculado al crear/editar/borrar un cumplimiento, D1 comprobado: un
   `ownerId` no ve las profecías de otro).
2. **Hooks** — `use-prophecies.ts` con las claves de 4.4.
3. **Portada** — hero, las seis tarjetas-filtro navegando a `list` con su
   filtro, el anillo de tasa, el gráfico mensual, estado vacío.
4. **Listado** — buscador, chips de estado/ventana, conmutador de vistas
   (Recorrido por defecto, Lista, Fichas, Año — ver 4.7), botón «Apuntar una
   palabra».
5. **Ficha** — las cuatro vistas (Bitácora/Lectura/Recorrido/Fichas), el
   interruptor «Ya se cumplió» (D6), «Anotar un cumplimiento», editar, borrar
   con confirmación.
6. **Formularios** — apuntar/editar con las metapíldoras (Dreamkeeper §2.2),
   textarea grande para el cuerpo, validación D7 con su mensaje.
7. **Rematar** — animaciones de §6, los seis idiomas revisados con el alemán
   en 375&nbsp;pt, los dos temas, `expo-doctor`, y actualizar el
   `PlaceholderScreen` de origen (queda borrado, la ruta pasa a la pantalla
   real).

## 6. Animaciones e interacciones

- **El Recorrido se dibuja al entrar**: cada tramo crece de arriba a abajo
  con `transform: scaleY()` desde el origen superior, escalonado por fila
  como ya hacen las cintas de la agenda del calendario — una sola vez por
  sesión, no cada vez que se vuelve de la ficha (la misma regla que ya está
  fijada para las tarjetas de creyentes).
- **La sección de cumplimiento del formulario** entra y sale con
  `FadeInDown`/`FadeOut` al activar/desactivar el interruptor «Ya se
  cumplió» — el patrón exacto de Dreamkeeper (§2.2), que es además lo que
  pide la RFC 0004 §7.8 para el mismo gesto en web.
- **El anillo de tasa** anima `stroke-dashoffset` de 0 a su valor en el
  primer montaje (ya es el comportamiento de `ProgressRing`; se confirma que
  no se repite en cada `refetch`).
- **Tarjetas con `Pressable` + `withSpring`** (`scale: 0.98` al tocar), como
  `prophecy-card.tsx` de Dreamkeeper, con `expo-haptics` ligero — mismo
  patrón que las tarjetas de creyentes.
- Todo se apaga con `useReducedMotion` (ya mockeado en `jest.setup.js`).

## 7. i18n

**Casi todo ya existe.** `prophecies.*` tiene ~95 líneas ya traducidas a los
seis idiomas en `packages/i18n/src/locales/*.ts` (portada, listado,
formularios, vacíos, estados) porque se escribieron con la RFC 0004 en web.
Revisado clave a clave contra `es.ts`, esto es lo que se reutiliza y lo único
que hace falta añadir:

- **`prophecies.detailViews.recorrido`** («Recorrido», ya existe para el
  conmutador de la ficha) es la copia del Recorrido vertical **también en el
  listado** — el mismo componente en las dos pantallas lleva el mismo nombre,
  así que **no** se usa `prophecies.views.travesia` («Travesía») para la vista
  de serie del listado móvil: sería un segundo nombre para la misma cosa.
- **`prophecies.lead`** (la frase de cabecera con los tres totales) se
  reutiliza tal cual en la portada; si el alemán no cupiera en una línea a
  375&nbsp;pt se resuelve dejándola partir en dos líneas, no acortando la
  copia con una clave aparte.
- **Clave nueva: `prophecies.loadMore`** («Ver más»), con la misma copia que
  ya usa `notes.loadMore` — el resto de `prophecies.*` no tiene paginación con
  «cargar más» porque la web pagina con números de página, y el listado móvil
  pagina por scroll como creyentes y notas.
- **Clave nueva: `prophecies.views.list`** («Lista»), la misma copia que
  `notes.viewList`, para la cuarta vista del listado móvil (§4.7 — sustituye
  a «Tabla», que no tiene sentido sin `DataTable`).

Con eso no falta ninguna clave más: el resto de la interfaz móvil (buscador,
chips de estado y ventana, formularios, vacíos, confirmaciones) usa
`prophecies.*` y `common.*` ya existentes sin cambios.

## 8. Plan de pruebas

| Qué                                                                              | Dónde                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------- |
| Listar, crear, editar, borrar una profecía en SQLite en memoria                  | `prophecies-repo.test.ts`                           |
| Cada filtro de estado (espera/camino/cumplida) se resuelve en SQL, no en memoria | `prophecies-repo.test.ts`                           |
| Cada ventana (7d/30d/año/todo) y `search` normalizado con acentos                | `prophecies-repo.test.ts`                           |
| D7: cumplida antes de recibida se rechaza                                        | `prophecies-repo.test.ts`                           |
| D1: un `ownerId` no ve ni puede tocar las profecías de otro                      | `prophecies-repo.test.ts`                           |
| `last_fulfillment_at` se recalcula al crear/editar/borrar un cumplimiento        | `prophecy-fulfillments-repo.test.ts`                |
| Marcar cumplida y desmarcarla no borra los cumplimientos (D6)                    | `prophecy-fulfillments-repo.test.ts`                |
| El test de paridad de esquema sigue en verde con las dos tablas nuevas           | `apps/api/src/database/local-schema.parity.test.ts` |
| El Recorrido distingue los tres estados sin depender solo del color              | `prophecy-journey.test.tsx`                         |
| El interruptor «Ya se cumplió» despliega/oculta la fecha y limpia al apagar      | `prophecy-fulfillment-toggle.test.tsx`              |
| Las tarjetas-filtro de la portada navegan a `list` con el filtro correcto        | `prophecy-stat-cards.test.tsx`                      |
| `render`/`fireEvent` asíncronos (Testing Library 14 + React 19)                  | todos los de componente                             |

Verificación manual, como pide la Regla 11: recorrido completo en el
simulador (crear, marcar cumplida, anotar un cumplimiento parcial, borrar),
en los dos temas, a 375&nbsp;pt con el alemán activo, y con
`prefers-reduced-motion`/reducción de movimiento del sistema activada.

## Riesgos y trampas

- **Es la primera tabla local sin `church_id`.** Si alguien copia el patrón
  de `believers-repo.ts` sin pensarlo, añadirá un filtro por iglesia que no
  existe aquí (D1, ahora también en local) o, peor, olvidará el filtro por
  `owner_id` — que es la **única** barrera de acceso que tiene este módulo
  (RFC 0004, «Riesgos y trampas»). El repositorio debe exigir `ownerId` como
  primer parámetro en cada método, igual que en la API.
- **`last_fulfillment_at` es derivado y se puede desincronizar** si algún
  método nuevo lo toca desde fuera de `prophecy-fulfillments-repo.ts` — la
  misma trampa que ya está escrita para `last_note_at` en CLAUDE.md.
- **Concurrencia de SQLite en Android**: cualquier consulta nueva pasa por la
  cola de `serialize()` en `db.ts`; un `Promise.all` de varias consultas de
  profecías se comería el mismo NullPointerException que ya mordió al
  buscador de creyentes si se llaman sin pasar por los hooks.
- **`react-native-gifted-charts` en Jest**: como ya está documentado en
  CLAUDE.md, sus animaciones con `setTimeout` revientan tras el teardown; el
  test de `prophecy-monthly-chart.tsx` mockea la librería y comprueba el
  contrato del envoltorio, no el render real.
- **El Recorrido vertical con años de rango** puede acumular muchas marcas en
  poco alto si hay muchos cumplimientos parciales seguidos — la RFC 0004
  §7.9 ya resolvió el caso equivalente en horizontal agrupando marcas
  cercanas; aquí se revisa al implementar con datos de prueba densos antes
  de darlo por bueno.
