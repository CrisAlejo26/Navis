# Plan — `DataTable` reutilizable de Navis (TanStack Table + TanStack Query)

- **Estado**: Propuesto (2026-09-25)
- **Autor**: Cristian Alejandro Arroyave (con Claude)
- **Origen**: el usuario pide una sola tabla, reutilizable en todas las pantallas,
  con paginación, tamaño de página, buscador, filtros (simples y avanzados),
  ocultar columnas y preferencias guardadas en `localStorage`. Referencia: la
  tabla de Kairo (`D:\Cloud wifi\kairo\src\components\data-table`), «pero mucho
  más completa».
- **Alcance**: web (y escritorio, que la hereda). Móvil nativo queda fuera: son
  fichas de React Native (Regla 1 §2.3); solo se comparte el contrato.
- **Depende de**: [plan de filtros de tablas](../implementados/filtros-tablas-plan.md)
  (los controles por tipo y los chips ya existen para tablas personalizadas) y
  RFC 0009 (exportar lo que se ve).

---

## Progreso

| Fase                           | Estado                                                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Contrato y dependencia      | Hecha: `table-state*.ts` en `shared`, TanStack Table 9.2.4, tamaño por defecto 10                                                                                                |
| 2. Estado                      | Hecha: URL + preferencias por usuario; el orden y los filtros de la última vez también se guardan                                                                                |
| 3. Núcleo visual               | Hecha y vista en el navegador con Roles: estilo Kairo, claro/oscuro, teléfono, alemán                                                                                            |
| 4. Filtros                     | Hecha: botón rápido, «Filtros avanzados» (panel/cajón), chips, descripciones. **Falta** el icono de filtro dentro de cada cabecera (los avanzados ya cubren todas)               |
| 5. Columnas y vistas           | Hecha: ocultar, reordenar, restablecer, densidad y vistas guardadas con nombre. **Falta** fijar la primera columna                                                               |
| 6. Selección, exportar, pulido | Hecha: casillas, barra de acciones masivas **extensible** (`defineBulkAction`), exportar a Excel/PDF/imagen/Markdown/CSV con lo que se ve. Guía: `referencias/tabla-de-datos.md` |
| 7. Migración · 8. Retirada     | Migrada **Roles** (modo cliente). Pendientes: usuarios, sueños, profecías, enseñanzas, cuaderno, creyentes (reglas del §12), tablas personalizadas                               |

## 1. El problema de hoy

Navis tiene **ocho** sitios que pintan una tabla y **ninguno comparte el motor**:

| Sitio                                          | Cómo lo hace hoy                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ui/data-table.tsx`                            | Solo el **envoltorio visual** (tarjeta, esqueleto, vacío, fichas en móvil). Sin estado |
| creyentes, sueños, profecías, cuaderno, ens.   | Cada `use-*-screen.ts` + `filters.ts` monta su búsqueda, filtros, orden y página       |
| `users-panel`, `roles-panel`                   | `useTableQuery` + cabeceras a mano                                                     |
| `tables/rows-grid.tsx` (tablas personalizadas) | Sus propios filtros en `useState`, popover por cabecera y chips                        |

Consecuencias: cada pantalla nueva reescribe 150–300 líneas de estado; los
filtros se comportan distinto en cada una; **nada recuerda las columnas ni el
tamaño de página** del usuario; y no hay ocultar/reordenar columnas salvo en
las tablas personalizadas.

## 2. Qué hace Kairo y qué le falta

Kairo usa `@tanstack/react-table` v9 con un set de _features_ único
(`table-features.ts`), Zustand + `persist` **por `tableId`**
(`kairo.table.<id>`), filtros rápidos por columna (faceted, con conteo),
filtros de rango en un panel «avanzados», visibilidad de columnas,
paginación 10/25/50/100 y un skeleton que **mide la forma real** de la tabla.

Lo que **no** tiene y aquí sí queremos:

| Falta en Kairo                                                    | Por qué importa                                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Modo servidor**: todo se filtra/ordena/pagina en cliente        | Los datos de Navis vienen paginados de la API; en cliente solo vale para listas cortas |
| Filtros y búsqueda **no se persisten ni van a la URL**            | Recargar o compartir el enlace pierde el trabajo                                       |
| Filtros solo `arrHas`, rango de fecha/número y texto global       | Faltan operadores (empieza por, vacío/no vacío, distinto de, presets de fecha)         |
| Sin chips de filtros activos                                      | «Una tabla filtrada que parece igual que sin filtrar» es el error clásico              |
| Orden de **una sola** columna, dos estados, sin selector en móvil | Se pide orden múltiple, tercer estado «sin orden» y orden por idioma                   |
| Sin **reordenar** columnas, fijar la primera, densidad            | Lo pide el usuario y lo ofrecen Airtable, Notion y Linear                              |
| Sin selección de filas ni barra de acciones en bloque             | Creyentes ya la necesita                                                               |
| Sin **vistas guardadas** locales (filtros + columnas + orden)     | Es el salto de «tabla» a «herramienta de trabajo»                                      |
| Sin botón «restablecer», ni aviso de columnas ocultas             | El usuario olvida que ocultó algo y cree que faltan datos                              |

## 3. Cómo lo hace la industria (investigación)

Resumen de las fuentes citadas al final, más el análisis previo de
[filtros-tablas-plan §2](../implementados/filtros-tablas-plan.md) (Airtable, Notion, Linear):

1. **Paginación numerada, no scroll infinito.** Con datos que se comparan y se
   vuelven a buscar, el infinito «relocaliza» filas y da falsa sensación de
   haber visto todo. Tamaños típicos **10–25**, con selector (10/25/50/100) y
   el texto «Mostrando 21–30 de 132». Con miles de filas: cursor o virtualización
   —no es nuestro caso—.
2. **Filtros cerca de lo que filtran** (icono en la cabecera) **y un botón
   «Filtro (n)»** para añadir. Los filtros activos **siempre visibles** como
   chips removibles, con «Quitar todo». Lógica AND implícita; AND/OR anidado
   (Notion «advanced filter») es un extra caro que casi nadie usa a diario.
3. **Operadores según el tipo de dato**: texto (contiene, es, empieza por,
   vacío), número (=, <, >, entre), fecha (entre + presets: hoy, últimos 7 días,
   este mes), selección (es uno de / no es), booleano.
4. **Columnas**: mostrar/ocultar, reordenar con arrastre, fijar la primera,
   cabecera pegajosa, densidad. Se guardan **por tabla**.
5. **Vistas**: la combinación filtros+orden+columnas tiene nombre y se
   recupera con un clic (Airtable, Linear, Notion).
6. **Estado en la URL** para lo que se comparte (página, búsqueda, orden,
   filtros) y en `localStorage` para lo que es **preferencia personal**
   (columnas, tamaño de página, densidad).
7. **TanStack Table en modo servidor** (`manualPagination`, `manualSorting`,
   `manualFiltering` + `rowCount`): la tabla no filtra, solo **refleja** un
   estado que la API resuelve. Reglas de oro de su documentación: resetear la
   página al cambiar filtros/orden/tamaño, conservar los resultados anteriores
   mientras carga la nueva página y descartar respuestas viejas.
8. **v9**: el estado que se quiere poseer (visibilidad de columnas, para
   persistirla) se pasa como _atom_ externo o como `state` + `onXChange`,
   igual que hace Kairo.

## 4. Decisiones

- **D1 — TanStack Table v9 (headless) + TanStack Query.** Es lo que pide el
  usuario y lo que ya usa Kairo. Se añade `@tanstack/react-table` al catálogo de
  pnpm (Kairo usa `^9.2.4`; **verificar que sea estable antes de fijar**, y si
  no, v8 con la misma arquitectura).
- **D2 — Dos modos, un solo componente.** `mode="server"` (por defecto: la API
  pagina, filtra y ordena) y `mode="client"` (lista corta ya cargada: usa los
  _row models_ de TanStack). El resto de la API del componente es idéntica.
- **D3 — Tres capas de estado, con dueño claro.**

    | Qué                                                                                | Dónde                                     | Por qué                                                 |
    | ---------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
    | página, búsqueda, orden, filtros                                                   | **URL** (`useSearchParams`)               | Se comparte y el «atrás» funciona                       |
    | columnas visibles y su orden, ancho, tamaño de página, densidad, orden por defecto | **`localStorage`** por `tableId`          | Es preferencia personal, no del enlace                  |
    | vistas guardadas (filtros + orden + columnas)                                      | **`localStorage`** por `userId`+`tableId` | Combinaciones con nombre; **solo locales**, sin backend |

    Prioridad al montar: **URL > preferencias guardadas > valores por defecto.**
    Las tablas personalizadas (RFC 0021) **conservan sus vistas de servidor**;
    esto no las sustituye.

- **D4 — Contrato de filtros único, en `packages/shared`.** Un esquema zod
  `tableQuery` (`page`, `limit`, `search`, `sort`, `order`, `filters[]`) con
  `filters = { columnId, operator, value }` y una **tabla de operadores por
  tipo**. Extiende el `paginationQuerySchema` de `schemas/common.ts` y
  generaliza `RowFilter` de tablas personalizadas (que pasa a ser un caso).
  Lo que viaja por la URL se valida al leer; un filtro inválido se descarta,
  no rompe (mismo criterio que `filters-url.ts`).
- **D5 — La API filtra con lista blanca, nunca con SQL libre.** Un helper en
  `apps/api/src/common` (`applyTableQuery`) recibe **por módulo** qué columnas
  se pueden filtrar/ordenar y con qué operadores, y traduce a TypeORM. Absorbe
  las trampas de los dos motores ya documentadas en `CLAUDE.md`: `LIKE` vs
  `ILIKE`, `IN ('')` contra `uuid`, fechas (`iso-day.ts`, `date-sql.ts`), orden
  estable con un segundo criterio (`id`) y `take/skip` con relaciones.
- **D6 — Columnas declarativas, una vez.** Cada pantalla escribe su
  `ColumnDef[]` con `meta`: `label` (ya traducida), `type` (`text | number |
date | select | boolean`), `filterable`, `sortable`, `hideable`, `options`,
  `defaultVisible`, `mobile` (rol en la ficha). De ese `meta` **salen solos**
  el control de filtro, los operadores, la cabecera, el menú de columnas y el
  orden por defecto. Es el patrón «contrato único» de la Regla 1 §3.
- **D7 — Filtros: cabecera + menú aditivo + chips (ya diseñado).** Se reutiliza
  lo que se hizo para tablas personalizadas (`components/tables/filters/`,
  `filter-menu`, `active-filters-row`, `column-filter-popover`) y se **mueve** a
  `components/data-table/`: dos usos → se extrae (Regla 1 §5), y las tablas
  personalizadas pasan a consumirlo. **Filtros avanzados = panel con todos los
  filtros a la vez + presets de fecha + rango**, no lógica OR anidada. AND/OR
  entra solo si alguien lo pide (fuera de alcance, ver §9).
- **D7b — Ordenamiento (de primera clase, no un extra).**
    - **Ciclo de tres estados** al pulsar la cabecera: ascendente → descendente →
      sin orden (vuelve al orden por defecto de la tabla). Hoy `toggleSort` solo
      alterna dos.
    - **Orden múltiple** con `Shift`+clic (y una opción «Ordenar por…» en el menú
      de la columna para táctil y teclado): el número de prioridad se ve en la
      cabecera (↑1, ↓2). Límite razonable: 3 criterios.
    - **Contrato**: `sort` pasa de un campo a una lista `sort=[{ columnId, dir }]`
      en `tableQuery` (D4), con **compatibilidad** con el `sort`/`order` actuales
      de la URL para que los enlaces viejos sigan valiendo.
    - **Servidor**: solo se ordena por columnas de la **lista blanca** del módulo
      (D5), siempre con `id` como último criterio para que la paginación sea
      estable, y con `NULLS LAST` resuelto en `database/date-sql.ts` (SQLite no lo
      tiene). Textos con orden **según el idioma** (`Intl.Collator`/`COLLATE` en
      cliente; en Postgres `ILIKE`-consistente, documentando la diferencia con
      SQLite). Fechas y números por su valor, no como texto.
    - **Cliente**: `sortFn` por tipo de columna (`alphanumeric` con collator,
      `datetime`, `number`, `boolean`) y `sortFn` propio por columna cuando haga
      falta (la sonda de creyentes ordena por «tiempo sin nota»).
    - **Persistencia**: el orden activo va a la **URL** (compartible); el **orden
      por defecto que el usuario prefiere** se guarda en `localStorage` (D3) y
      entra en las vistas guardadas (D11). Cambiar el orden **resetea la página**.
    - **Móvil**: sin cabeceras no hay dónde pulsar, así que las fichas llevan un
      selector «Ordenar por» + dirección en la barra (patrón ya usado en la
      toolbar de tablas personalizadas).
    - **Accesibilidad**: `aria-sort` en la cabecera, botón con etiqueta
      «Ordenar por {columna}, actualmente ascendente», y `aria-live` que anuncia
      el cambio. La línea de estado (D15) muestra «orden: Nombre ↑» y se puede
      quitar desde ahí.
    - Columna `sortable: false` (acciones, dones…) no pinta el control.
- **D8 — Buscador con _debounce_ (300 ms)**, al servidor en modo servidor y a
  `globalFilter` en modo cliente. Resetea la página. `Esc` lo limpia.
- **D9 — Paginación**: tamaños `PAGE_SIZES` de `shared` (5–100), selector,
  «Mostrando X–Y de Z», primera/anterior/siguiente/última (las extremas solo
  ≥ `sm`), y salto a página válida si la actual deja de existir. **Conservar
  los datos previos** mientras carga (`placeholderData: keepPreviousData`) y
  **precargar la siguiente página**. El tamaño elegido se guarda (D3).
- **D10 — Columnas**: menú «Columnas» con casillas + **arrastre para reordenar**
  (reutiliza `sortable-columns.tsx`), «Restablecer», y un **aviso en la barra**
  «2 columnas ocultas» para que nadie crea que faltan datos. Opcional en fases
  posteriores: fijar la primera columna, ancho redimensionable, densidad.
- **D11 — Vistas guardadas locales**: «Guardar vista» (nombre) guarda filtros +
  orden + columnas; selector de vistas junto al buscador; «Vista sin guardar»
  se indica. Persisten por `tableId`. No se suben al servidor.
- **D12 — Selección y acciones en bloque** opcionales (`selectable`): casilla
  por fila y por página, barra con «N seleccionadas» y acciones que aporta la
  pantalla. Exportar respeta **lo que se ve** (RFC 0009): filtros, orden y
  columnas visibles.
- **D13 — Estados completos**: carga (esqueleto que **mide** la tabla real,
  como Kairo), vacío de verdad, «sin resultados» con «Quitar filtros», error
  con «Reintentar», y refresco en segundo plano sin parpadeo.
- **D14 — Responsive**: de `md` para arriba, tabla con cabecera pegajosa y
  scroll **dentro** del contenedor; por debajo, lista de fichas
  (`renderCard` o ficha genérica a partir del `meta`). En móvil, filtros en
  `Drawer` con «Filtros (n)» (patrón de `believers-toolbar`); el popover por
  cabecera es solo de escritorio (Regla 5).
- **D15 — Carácter propio (Regla 9)**: nada de plantilla de admin. La firma de
  la tabla es **la línea de estado de bitácora** bajo la barra: «21–30 de 132 ·
  2 filtros · 1 columna oculta · vista: Pendientes», con cada fragmento
  clicable para deshacerlo. El resto, sobrio y con tokens.
- **D16 — Accesibilidad**: `<caption>` oculto, `aria-sort`, `scope="col"`,
  foco visible, teclado completo en menús, `aria-live="polite"` para «N
  resultados», objetivos ≥ 44 px táctiles, `prefers-reduced-motion`.

## 5. API del componente (borrador)

```tsx
<DataTable
  tableId="believers"                 // estable: clave de persistencia
  columns={columns}                   // ColumnDef con meta (D6)
  query={query}                       // resultado de useTableData (TanStack Query)
  selectable                          // opcional
  renderCard={(row) => <BelieverCard … />}
  emptyState={{ icon: UserSearch, title: t('believers.empty') }}
  toolbarExtra={<ExportButton … />}   // acciones propias de la pantalla
/>
```

```ts
// La pantalla solo describe DE DÓNDE vienen los datos:
const state = useDataTableState({ tableId: 'believers', columns }); // URL + preferencias
const query = useDataTableQuery(state, (params) => api.believers.list(params)); // TanStack Query
```

`useDataTableState` (URL + `localStorage` + validación) y `useDataTableQuery`
(clave de caché con el estado, `keepPreviousData`, precarga) son **hooks
separados** de la vista (Regla 6). En modo cliente, `data` va directo.

## 6. Estructura de ficheros (todos ≤ ~100 líneas, Regla 6)

```
packages/shared/src/schemas/table-query.ts      contrato: tableQuery, operadores por tipo
packages/api-client/src/table-params.ts         serializar tableQuery → query string

apps/api/src/common/table-query/
  apply-table-query.ts                          lista blanca → TypeORM (los dos motores)
  table-query.dto.ts                            DTO validado

apps/web/src/lib/data-table/
  table-features.ts                             features de TanStack (uno solo, como Kairo)
  column-meta.ts                                tipos de meta y de columna
  use-data-table-state.ts                       URL + preferencias
  use-data-table-query.ts                       TanStack Query (keepPrevious, prefetch)
  table-preferences-store.ts                    Zustand persist por tableId (versionado, zod)
  table-views-store.ts                          vistas guardadas por tableId
  storage-keys.ts                               `navis.table.<id>.prefs|views` (constante)

apps/web/src/components/data-table/
  data-table.tsx                                composición
  toolbar.tsx · search.tsx · filter-menu.tsx · filter-chips.tsx
  column-filter-popover.tsx · filters/ (text, number, date, select, boolean)
  column-header.tsx · column-menu.tsx · views-menu.tsx
  status-line.tsx · pagination.tsx · selection-bar.tsx
  table-view.tsx · cards-view.tsx · skeleton.tsx
```

`components/ui/data-table.tsx` actual (envoltorio visual) **se absorbe** en el
nuevo; no se dejan dos `DataTable`. Nombres de tabla estables: `believers`,
`dreams`, `prophecies`, `journal`, `teachings`, `users`, `roles`, `custom-<id>`.

## 7. Persistencia en `localStorage`

- Clave `navis.table.<userId>.<tableId>.prefs` (constante en `storage-keys.ts`; la Regla
  1 prohíbe literales sueltos) con `{ v: 1, columnVisibility, columnOrder,
columnSizing, pageSize, density, sorting }`.
- **Se valida con zod al leer** (Regla 10): JSON corrupto, versión vieja o
  `localStorage` bloqueado → valores por defecto, sin romper (`try/catch`).
- **Se reconcilia con las columnas actuales**: se descartan ids que ya no
  existen y las columnas nuevas entran visibles al final. Sin esto, añadir una
  columna en una release deja a los usuarios sin verla.
- **No se persisten** página ni búsqueda (van a la URL) ni la selección.
- Escritura con _debounce_ corto; evento `storage` para sincronizar pestañas.
- **La clave lleva el `userId`** (decisión §10.3): en un equipo compartido, las
  columnas de una persona no son las de otra.

## 8. Fases

Cada fase termina con `pnpm check` verde y se mira en pantalla (Reglas 4 y 11).

1. **Contrato y API.** `table-query.ts` en `shared` (+ tests de operadores y de
   validación); `applyTableQuery` (+ tests en **SQLite y Postgres**); añadir
   `@tanstack/react-table` al catálogo.
2. **Estado.** `use-data-table-state`, store de preferencias, reconciliación y
   `storage-keys`; `use-data-table-query`. Tests: URL > preferencias >
   defecto, JSON corrupto, columna eliminada, reseteo de página.
3. **Núcleo visual.** Tabla + fichas, cabecera ordenable (ciclo de tres
   estados, orden múltiple con `Shift`, selector de orden en móvil, D7b),
   paginación, buscador,
   esqueleto/vacío/error, línea de estado. i18n `dataTable.*` en los **seis
   idiomas**.
   3b. **Subir el tamaño por defecto a 10** (`DEFAULT_PAGE_SIZE`) y ajustar los
   tests que asumen 5, antes de migrar ninguna pantalla.
4. **Filtros.** Menú aditivo, popover por cabecera, chips, «avanzados»
   (presets de fecha, rangos). Se mueven los controles desde
   `components/tables/filters/`.
5. **Columnas y vistas.** Menú de columnas con arrastre y «Restablecer», aviso
   de ocultas, vistas guardadas, densidad, primera columna fija.
6. **Selección, exportar y pulido.** Selección + barra, exportar lo visible,
   animaciones (solo `opacity`/`transform`), accesibilidad y teclado.
7. **Migración de todas las pantallas**, de menos a más riesgo: `roles` y
   `users` → `dreams`/`prophecies`/`teachings`/`journal` → `believers` (la más
   delicada, con las reglas del §12) → `rows-grid` (tablas personalizadas). **Una pantalla por commit**, con su e2e
   antes y después para probar que no cambia el comportamiento.
8. **Retirada**: borrar `use-table-query.ts`, los `filters.ts` por pantalla y el
   `ui/data-table.tsx` antiguo cuando nadie los importe (`trace_path`).

## 9. Fuera de alcance (por ahora)

- Grupos de filtros **AND/OR anidados**.
- Virtualización, scroll infinito, paginación por cursor (la escala no lo pide).
- Edición de celdas en línea, agrupación y filas expandibles.
- Vistas guardadas **en servidor** y compartidas con la iglesia (decisión §10.4).
- Tabla nativa de `apps/mobile`.

## 10. Decisiones tomadas (2026-09-25)

1. **Tamaño por defecto: 10, para todo.** `DEFAULT_PAGE_SIZE` de
   `packages/shared/src/constants.ts` pasa de 5 a 10, y con él las pantallas que
   lo leen: los `*-page.service.ts` de sueños, profecías, cuaderno y
   enseñanzas, los DTO de tareas/hábitos/preparadores, `dashboard.service.ts`,
   `use-table-query.ts` y `rows-grid`. Hay que revisar los tests que asumen 5
   (p. ej. `access.e2e-spec.ts`). `PAGE_SIZES` se queda en 5–100 (el 5 sigue
   siendo elegible).
2. **Modo cliente: sí, desde el principio.** Es barato (TanStack ya trae los
   _row models_) y garantiza que el componente sirva para **cualquier**
   tabla, venga paginada de la API o sea una lista corta ya cargada (roles,
   catálogos). Misma API de componente en los dos modos (D2).
3. **La clave de `localStorage` lleva el `userId`**:
   `navis.table.<userId>.<tableId>.prefs`. Sin sesión (modo local) se usa un
   `userId` fijo `local`. Al cerrar sesión no se borra, para que vuelva igual al
   entrar; la iglesia activa **no** entra en la clave (las columnas son de la
   persona, no de la iglesia).
4. **Vistas guardadas solo locales**, sin subir nada al servidor: se aplican,
   funcionan y persisten en el navegador de esa persona. Nada de endpoints ni
   migraciones para esto.
5. **Se migran todas las tablas**, incluida `rows-grid` (tablas personalizadas):
   sus vistas de servidor (RFC 0021) siguen existiendo como **fuente de
   filtros/orden iniciales**, pero el motor de tabla es el común.
6. **Creyentes: no se pierde ni un dato** (ver §12).

7. **Corrección de D4/D5 (2026-09-25).** Al empezar la fase 1 se vio que cada
   endpoint tiene sus propios filtros tipados (`state`, `emotion`, `from`…) y que
   el móvil los consume, así que **no hay un endpoint genérico `filters[]`**. El
   contrato común (`packages/shared/src/schemas/table-state*.ts`) es del
   **cliente**: filtros, orden y su codificación en la URL. Cada pantalla lo
   traduce con un **adaptador** a los parámetros que ya acepta su API, y la API
   solo se toca de forma **aditiva** al migrar esa pantalla (orden múltiple,
   operadores nuevos), sin romper al móvil. `applyTableQuery` deja de ser una
   pieza previa y pasa a ser un helper que se extrae cuando dos módulos lo
   necesiten (Regla 1 §5).

## 11. Verificación

```bash
rtk pnpm check
rtk pnpm db:up && rtk pnpm db:migrate && rtk pnpm test:e2e   # el helper de API, en los dos motores
```

Y a mano: los **dos temas**, 375 / 768 / 1280 px sin scroll horizontal, alemán
(el texto más largo) en la barra de filtros, recarga con filtros en la URL,
`localStorage` vacío/corrupto, teclado sin ratón, y `prefers-reduced-motion`.

## 12. Creyentes: paridad de información, sin perder nada

Es la pantalla que más le gusta a quien la usa, así que la migración **no
rediseña**: cambia el motor y conserva lo que se ve. Inventario de lo que hoy
muestra la fila (`believer-row.tsx`) y la ficha (`believer-card.tsx`), y que
**tiene que seguir mostrando**:

| Dato                                             | Tabla (`≥ md`)                                    | Ficha (`< md`)           |
| ------------------------------------------------ | ------------------------------------------------- | ------------------------ |
| Casilla de selección (`canManage`)               | columna al inicio + «seleccionar todo»            | casilla junto al nombre  |
| Fotografía                                       | columna **solo si alguien de la página la tiene** | junto al nombre, siempre |
| Nombre (enlace a la ficha) + puntos de listas    | sí                                                | sí                       |
| Teléfono                                         | bajo el nombre                                    | con icono, enlace `tel:` |
| Estado (`StatusBadge`)                           | columna ordenable                                 | arriba a la derecha      |
| Dones (`GiftTags`)                               | `lg` en adelante, máx. 3                          | siempre, máx. 4          |
| Labores (`MinistryTags`)                         | `xl` en adelante, máx. 2                          | siempre, máx. 3          |
| Etiqueta destacada                               | `md` en adelante                                  | siempre                  |
| Sonda / aviso (`Sonda`, ordenable «última nota») | columna, con latido escalonado                    | al pie, a todo lo ancho  |
| Fila/ficha resaltada si `needsAttention`         | filete + lavado rojo                              | idem                     |
| Acciones de la fila (`BelieverActions`)          | columna final                                     | al pie                   |
| Sede                                             | **no es columna** (a petición); sí filtro         | idem                     |

Reglas de la migración:

1. **Se reutilizan tal cual** `BelieverRow`, `BelieverCard`, `Sonda`, `GiftTags`,
   `MinistryTags`, `StatusBadge`, etc. La tabla común los recibe por
   `renderCell`/`renderCard` de la columna; no se reescriben ni se «genericizan».
2. **Las columnas responsivas se conservan** (`lg`/`xl`/`md`): `meta.showFrom`
   declara desde qué ancho se ve cada una, para que el menú «Columnas» no
   contradiga esa regla (una columna «visible» por preferencia pero sin ancho
   sigue oculta y se indica).
3. **La columna de fotografía condicional** y **`rowClassName` por
   `needsAttention`** son parte del contrato de la tabla común
   (`meta.visibleWhen(rows)` y `getRowClassName`), no un caso especial.
4. **Los filtros de hoy se mantienen todos** (`believers-filters.tsx`: estado,
   sede, dones, etiquetas, listas, resumen…) y **pasan a chips**; ninguno
   desaparece. El resumen numérico por estado (`summary`) se conserva.
5. **Las columnas ocultables** son solo las secundarias (dones, labores,
   etiqueta, teléfono). Nombre, estado, sonda y acciones **no se pueden ocultar**
   (`hideable: false`): sin ellas la pantalla pierde su razón de ser.
6. **Paridad probada antes de borrar nada**: un e2e (Chromium y Pixel 7) que
   crea creyentes con foto, dones, labores, etiqueta, teléfono, lista y sonda en
   aviso, y comprueba que **cada dato de la tabla anterior sigue visible** en
   los dos anchos. Se escribe **sobre la pantalla actual, antes de migrar**, y
   debe pasar igual después. Además, capturas antes/después en los dos temas y
   se **pide al usuario que las mire** antes de retirar el código viejo
   (Regla 11 §2).
7. **Vista de fichas** (`BelieversViewSwitch`), **exportar** y **acciones en
   lote** siguen igual.

## Fuentes

- [TanStack Table — Client-Side vs Server-Side](https://tanstack.com/table/latest/docs/guide/client-side-vs-server-side)
- [TanStack Table — Pagination (React)](https://tanstack.com/table/latest/docs/framework/react/guide/pagination)
- [TanStack Table — Column Filtering (React)](https://tanstack.com/table/latest/docs/framework/react/guide/column-filtering)
- [Pencil & Paper — Data table design patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)
- [Eleken — Table design UX guide](https://www.eleken.co/blog-posts/table-design-ux)
- [Setproduct — Data table UI design 2026](https://www.setproduct.com/blog/data-table-ui-design)
- [UX Patterns for Developers — Data table](https://uxpatterns.dev/patterns/data-display/table)
- Código de referencia: `D:\Cloud wifi\kairo\src\components\data-table\*` y
  `src\lib\data-table\table-preferences-store.ts`.
