# Plan — Rediseño de filtros y gestión de columnas en Tablas

- **Estado**: Implementado (2026-09-24, commit «rediseña los filtros de las tablas»)
- **Autor**: Cristian Alejandro Arroyave (con Claude)
- **Fecha**: 2026-09-24
- **Origen**: el usuario reporta que, al crear una tabla con muchas columnas,
  la barra de filtros (un control por columna, generada automáticamente según
  RFC 0021 D28) ocupa **más que la propia tabla**. La experiencia es pobre y
  hay que replantearla con los patrones que usa la industria.
- **Alcance**: solo **web** (móvil está fuera de alcance del RFC 0021; escritorio la hereda).
- **Depende de**: RFC 0021 ya implementado (tablas personalizadas).

---

## 1. Objetivo y alcance

**Problema.** La barra de filtros actual (`filters-bar.tsx`) pinta un control
completo por cada columna filtrable, siempre visibles, en una rejilla
`auto-fill minmax(13rem, 1fr)`. Con 10+ columnas, la zona de filtros desplaza
la tabla fuera de la primera pantalla: el usuario abre la ficha y lo primero
que ve son controles vacíos, no datos.

**Objetivo.** Que la tabla vuelva a ser lo primero. Los filtros pasan a un
modelo **aditivo y bajo demanda**, con los activos visibles y eliminables uno
a uno, siguiendo el patrón de la industria.

**Entra:**

- Rediseño completo de la experiencia de filtrado en la ficha de tabla
  (cuadrícula, tablero y calendario).
- Popover de filtros por cabecera de columna (patrón «header filter»).
- Barra de filtros activos (chips removibles) + «quitar todo».
- Vista guardada = filtros + orden + visibilidad de columnas persistidos.
- Ajustes de gestión de columnas que caen del mismo análisis.
- i18n en los seis idiomas, tests de componentes y e2e.

**No entra:**

- La app móvil (fuera de alcance del RFC 0021, igual que hoy).
- Grupos de filtros con lógica AND/OR anidada (estilo «advanced filters» de
  Notion). El modelo de datos actual es una lista plana de filtros; encajar
  grupos exigiría otro contrato. Si algún día hace falta, es extensión.
- Adjuntos, columnas calculadas, campos de relación (fuera de alcance del
  RFC 0021, siguen siéndolo).
- Virtualización o cursor de paginación: la escala no lo justifica (D17).

---

## 2. Hallazgos de la investigación

### 2.1 Cómo lo resuelve la industria

| Producto                     | Patrón de filtros                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Airtable**                 | Botón «Filter» que abre un panel/lista de condiciones **añadibles una a una**; los activos se listan en el panel, no ocupan la pantalla.         |
| **Notion**                   | Igual: menú «Filter» → se añade una propiedad → se queda en la lista del panel. «Advanced filter» para grupos AND/OR (nosotros no, ver alcance). |
| **Linear**                   | Barra con chips de filtros activos + menú «Filter» para añadir. Cada chip es editable al clic y removable con una X.                             |
| **MonoDesk**                 | (Refero) Dropdowns compactos en la toolbar + chips de filtros aplicados bajo la barra; tabla limpia.                                             |
| **Excel / Baserow / NocoDB** | Filtro por **cabecera de columna** (icono en cada th). Máximo contexto: el resultado cambia justo debajo del control.                            |

**Conclusiones transversales** (Pencil & Paper «Enterprise filtering»,
Smashing Magazine «Designing filters that work», Helios Design System):

1. **Ningún producto serio pinta todos los filtros siempre visibles.** Todos
   usan _progressive disclosure_: un gatillo («Filter» o icono por columna) y
   el control aparece al pedirlo.
2. **Los filtros activos deben ser visibles y removibles individualmente**
   (chips/lozenges con X), con un «clear all» accesible. Un filtro activo que
   no se ve es un bug de percepción: la lista parece «rota».
3. **El filtro por cabecera de columna** (patrón Excel/Notion) da el máximo
   contexto: el control nace donde está el dato que filtra.
4. **Indicar cuántos filtros hay activos** en el gatillo (badge numérico).
5. Los filtros son **aditivos** entre sí (AND implícito), lo que ya coincide
   con el modelo `RowFilter[]` de la API.
6. **Filtros en la URL** — el proyecto ya lo hace en creyentes (§7.2 de su
   RFC) y `useTableQuery` ya lo hace para page/search/sort; los filtros de
   tablas hoy viven en `useState` local de `RowsGrid`, lo que es una
   regresión respecto al patrón del proyecto.

### 2.2 Referencias visuales (Refero)

- **MonoDesk — Completed Tasks** (screen `6aad12ae`): toolbar compacta,
  dropdowns de filtro con badge, tabla protagonista. → Tomar: jerarquía
  (toolbar fina, tabla grande), dropdown de filtro con opciones y check.
- **Notion / Airtable** (docs de producto): el modelo aditivo de «añadir
  filtro» como lista en un panel. → Tomar: el menú «añadir filtro» lista las
  columnas disponibles, no repite controles muertos.
- **Linear**: chips activos editables. → Tomar: chip con «columna: valor» +
  X para quitar.

### 2.3 Diagnóstico del código actual

| Fichero                                             | Problema                                                                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/tables/filters-bar.tsx`                 | Pinta **todos** los controles de filtro de golpe, uno por columna filtrable, en rejilla de `13rem`. Es la causa directa del reporte.                                         |
| `components/tables/rows-grid.tsx`                   | `filters` en `useState` local; no va a la URL (regresión frente a `useTableQuery` ni siquiera se usa aquí).                                                                  |
| `components/tables/rows-grid-toolbar.tsx`           | El `<Select>` de orden mete todas las columnas × 2 direcciones en un desplegable — funciona pero es raro; con el popover por columna, el orden en la cabecera lo cubre.      |
| `components/tables/view-form.tsx`                   | Crea vista kanban/calendar pero **no permite guardar filtros ni orden al crearla**; `updateTableViewSchema` sí acepta `filters/sortBy/sortOrder` pero la UI nunca los manda. |
| `packages/shared/src/schemas/custom-table-views.ts` | `customTableViewSchema` ya tiene `filters`, `sortBy`, `sortOrder` — el modelo ya lo soporta; falta la UI.                                                                    |
| `components/tables/columns-dialog.tsx`              | Lista vertical con drag & drop; correcta pero sin contador de filas ni «tipo» visible a golpe de vista rápida. Menor.                                                        |

**Lo que ya existe y se reutiliza** (Regla 1):

- `RowFilter`, `rowFilterSchema`, `withFilter`, `filterFor`, `encodeFilters` (`lib/tables/filters.ts`).
- Los cinco controles por tipo en `components/tables/filters/` — se conservan
  tal cual; lo que cambia es **dónde y cuándo** se montan.
- `useTableQuery` (`lib/use-table-query.ts`) para URL-state.
- `menu-button.tsx`, `combobox-listbox.tsx`, `chip.tsx`, `clear-filters-button.tsx`.
- `customTableViewSchema` con `filters/sortBy/sortOrder` — persistencia lista en el contrato.

---

## 3. Dirección de diseño

Se mantiene la identidad del RFC 0021 (D31–D33): acento por tabla, rejilla que
se construye sola, `DataTable` responsive. Lo que cambia es la jerarquía
vertical de la ficha:

```
┌──────────────────────────────────────────────────────────────┐
│ Cabecera a sangre (acento)            [Exportar] [Columnas]… │
│ Pestañas de vista: Cuadrícula · Por estado · Calendario      │
│ ── toolbar (una sola fila, fina) ─────────────────────────── │
│ [🔍 Buscar…]  [⊕ Filtro (2)]  [↕ Ordenar: Recientes]  [+Fila]│
│ [chip: Estado = Nuevo ×] [chip: Fecha ≥ 1 sep ×]  Quitar todo│   ← solo si hay filtros
│ ── la tabla, protagonista ──────────────────────────────────  │
│ ┌───────────────┬───────────────┬──────────────┬──────────┐  │
│ │ Nombre ⇅      │ Estado ⇅      │ Fecha ⇅      │ ⋯        │  │
│ └───────────────┴───────────────┴──────────────┴──────────┘  │
```

Decisiones:

- **D1 — Filtro por cabecera de columna (patrón Excel/Notion).** Cada `th`
  activo lleva, al pasar el cursor, un icono de filtro; el clic abre un
  _popover_ con el control que ya existe para ese tipo
  (`ColumnFilterControl`). Al aplicar, nace un chip en la fila de filtros
  activos. Máximo contexto, cero ocupación permanente.
- **D2 — Menú «Filtro» aditivo en la toolbar.** Botón `Filtro (n)` que abre
  un panel (menú) con la lista de columnas filtrables: las **con filtro
  activo** arriba (con su control inline para editar), el resto como lista
  para añadir. Es el modelo Notion/Airtable. El icono de la columna indica el
  tipo.
- **D3 — Fila de filtros activos (chips).** Un chip por filtro:
  `«Etiqueta» operador valor ×`. Clic en el chip = reabrir su control (editar
  sin buscarlo); la X lo quita. `Quitar todo` reutiliza
  `ClearFiltersButton`. La fila desaparece cuando no hay filtros: la tabla
  queda sola.
- **D4 — Los filtros activos van a la URL.** Se integra con `useTableQuery`
  (o un hook hermano) para serializar `filters` como parámetro, igual que
  creyentes. Compartir una vista filtrada = copiar el enlace. La vista
  guardada (D5) es el caso de «esta combinación tiene nombre».
- **D5 — La vista guardada sí guarda filtros, orden y columnas visibles.** La
  ficha de vista gana un botón «Guardar como vista» (o «Actualizar vista» si
  es una guardada): manda `filters`, `sortBy`, `sortOrder` al `PATCH` que el
  contrato ya acepta. Además, `view-form.tsx` gana la sección de filtros
  inicial opcionales al crear. Al abrir una vista guardada, se hidratan sus
  filtros en la URL y los chips los muestran.
- **D6 — El orden se queda donde está** (el `<Select>` de la toolbar con
  `sortNewest/sortOldest` + por columna), porque la cabecera ya es sortable
  con clic; no se duplica mecanismo. El icono del popover por columna puede
  ofrecer también «ordenar por aquí» como accesibilidad extra, pero no es
  obligación del plan.
- **D7 — La gestión de columnas gana contexto.** En `columns-dialog.tsx`, la
  fila muestra el **tipo** con su etiqueta traducida y el **número de
  opciones** si es selección; y en la tabla, cada cabecera con popover de
  filtro también puede llegar a ofrecer «ocultar columna» — pero eso se
  pospone: `isActive` es global a la tabla y tocarlo desde la vista podría
  confundir. No entra en este plan.
- **D8 — Responsive.** En móvil (`md:hidden`, fichas), la toolbar conserva
  buscar + filtrar (D2) + añadir; los chips de filtros activos son
  scrollables horizontales. El popover por columna es un patrón de escritorio
  (no hay hover en táctil): en móvil solo existe el menú «Filtro» (D2).
- **D9 — Animación.** Entrada/salida de chips con transición de
  escala/opacidad (CSS); popover con transición breve de opacidad y
  traslación 4px; la fila de chips colapsa/expand con `grid-template-rows`
  animado o `max-height` — CSS puro, sin librería (Regla 9 §5). Respeta
  `prefers-reduced-motion`.
- **D10 — Accesibilidad.** El popover por columna es un diálogo/menú con foco
  atrapado, cierra con `Escape` y clic fuera; el botón de filtro de cabecera
  es `<button>` con `aria-label="Filtrar por {columna}"`; los chips son
  botones con nombre accesible compuesto («Quitar filtro Estado igual a
  Nuevo»). Objetivos táctiles ≥ 44 px (Regla 5).

---

## 4. Arquitectura

### 4.1 Modelo de datos — sin migraciones

`custom_table_views` ya tiene `filters`, `sortBy`, `sortOrder`. Nada que
migrar. Lo único que cambia de contrato es la **serialización de filtros en
URL** (cliente) y el payload del `PATCH` de vista (ya existe).

### 4.2 Ficheros nuevos y modificados (web)

| Fichero                                                        | Qué hace                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/tables/filters-url.ts` _(nuevo)_                          | Serializa `RowFilter[]` ↔ URL (`?f=<base64/json>` o JSON en un parámetro `filters`, mismo formato que `encodeFilters`). Validación al leer con `rowFilterSchema` + validación contra columnas: filtro inválido se descarta, no rompe. |
| `components/tables/filter-menu.tsx` _(nuevo)_                  | El panel aditivo (D2): lista de columnas con filtro activo arriba (editable inline), resto lista para añadir. Reutiliza `ColumnFilterControl`.                                                                                        |
| `components/tables/column-filter-popover.tsx` _(nuevo)_        | El popover por cabecera (D1). Envuelve `ColumnFilterControl` en un menú posicionado bajo el `th`. Reutiliza el posicionamiento de `menu-button.tsx`.                                                                                  |
| `components/tables/active-filters-row.tsx` _(nuevo)_           | Los chips (D3). Chip + X + «Quitar todo».                                                                                                                                                                                             |
| `components/tables/filters-bar.tsx` _(modificado → eliminado)_ | Se sustituye por `active-filters-row.tsx` + `filter-menu.tsx`. Muere el componente, viven los controles por tipo.                                                                                                                     |
| `components/tables/rows-grid.tsx` _(modificado)_               | Estado de filtros desde URL (D4) vía `filters-url.ts`; compone `RowsGridToolbar` nueva con `FilterMenu` + `ActiveFiltersRow`; pasa filtros activos a las cabeceras.                                                                   |
| `components/tables/rows-grid-toolbar.tsx` _(modificado)_       | Nueva composición: buscar + botón Filtro (con badge) + ordenar + añadir fila; y debajo la fila de chips. Deja de montar `FiltersBar`.                                                                                                 |
| `components/ui/table.tsx` _(modificado)_                       | `TableHeader` gana slot `filter?: ReactNode` o children extra para el botón del popover (D1).                                                                                                                                         |
| `components/tables/kanban-board.tsx` _(modificado)_            | El tablero hereda filtros de la vista activa (ya lo hace con `view.filters` si existe; verificar y unificar con D4 cuando no hay vista).                                                                                              |
| `components/tables/table-calendar-view.tsx` _(modificado)_     | Igual que el tablero.                                                                                                                                                                                                                 |
| `components/tables/view-form.tsx` _(modificado)_               | Sección opcional «Filtros iniciales» (reutiliza `FilterMenu`) al crear; y botón de «Guardar cambios en la vista» en la ficha cuando hay vista activa con filtros/orden distintos (D5).                                                |
| `components/tables/columns-dialog.tsx` _(modificado)_          | `ColumnRow` muestra el tipo traducido y el nº de opciones (D7).                                                                                                                                                                       |
| `components/tables/column-row.tsx` _(modificado)_              | Idem.                                                                                                                                                                                                                                 |
| `packages/i18n/src/locales/*.ts` _(modificado)_                | Claves nuevas (§6).                                                                                                                                                                                                                   |
| `apps/web/e2e/…` _(modificado/nuevo)_                          | Escenarios (§7).                                                                                                                                                                                                                      |

### 4.3 API — sin cambios

`GET /tables/:id/rows` ya acepta `filters` (D30 del RFC 0021) y
`PATCH /tables/:id/views/:vid` ya acepta `filters/sortBy/sortOrder`. El plan
es **solo de cliente**.

---

## 5. Pasos ordenados

1. **`filters-url.ts`** + tests: serializar/deserializar/validar filtros URL.
2. **`TableHeader`** de `ui/table.tsx`: slot de filtro + estilos del botón
   (visible en hover/focus, persistente si la columna está filtrada).
3. **`ColumnFilterPopover`** + test de componente.
4. **`FilterMenu`** + test (añadir/quitar/editar filtro desde el panel).
5. **`ActiveFiltersRow`** + test (chips, X, quitar todo, editar al clic).
6. **`RowsGrid`**: integrar todo, quitar `FiltersBar`, filtros desde URL.
   Test: filtrar → chip aparece → quitar chip → vuelve todo.
7. **Kanban y calendario**: heredar los filtros de la vista (o de la URL si
   no hay vista guardada). Test de hidratación.
8. **Vista guardada**: hidratar filtros al abrir; guardar cambios (D5) con
   `PATCH`; «Filtros iniciales» en `ViewForm`. Test de e2e.
9. **Gestión de columnas** (D7): tipo visible y contador de opciones.
10. **Animaciones** (D9) y `prefers-reduced-motion`.
11. **i18n** en los seis idiomas.
12. **`pnpm check` + `pnpm test:e2e`**.

---

## 6. i18n — claves nuevas

Bajo `tables.filters.*` (es; las seis se completan al implementar):

| Clave                             | es                             |
| --------------------------------- | ------------------------------ |
| `tables.filters.add`              | Filtro                         |
| `tables.filters.addWithCount`     | Filtro ({{count}})             |
| `tables.filters.activeTitle`      | Filtros activos                |
| `tables.filters.addColumnHint`    | Elige una columna para filtrar |
| `tables.filters.editHint`         | Toca un filtro para ajustarlo  |
| `tables.filters.removeOne`        | Quitar filtro {{label}}        |
| `tables.filters.sortByThisColumn` | Ordenar por esta columna       |
| `tables.filters.saveAsView`       | Guardar como vista             |
| `tables.filters.updateView`       | Actualizar vista               |
| `tables.filters.viewSaved`        | Vista guardada                 |
| `tables.filters.viewUpdated`      | Vista actualizada              |
| `tables.filters.showFilters`      | Mostrar filtros                |
| `tables.filters.hideFilters`      | Ocultar filtros                |
| `tables.filters.menuButton`       | Filtrar por {{label}}          |
| `tables.filters.clearOne`         | Quitar                         |
| `tables.filters.typeToggle`       | Ordenar                        |

Reutilizar las existentes (`contains`, `between`, `today`, …).

---

## 7. Plan de pruebas

**Unidad / componentes** (vitest, `apps/web`):

- `filters-url.test.ts`: round-trip de filtros; filtro inválido (columna que
  no existe, operador que no toca) se descarta; URL sin `f` = sin filtros.
- `active-filters-row.test.tsx`: pinta un chip por filtro con su etiqueta de
  columna; quitar con la X llama `onChange` sin ese filtro; «Quitar todo»
  llama con `[]`; clic en chip abre edición.
- `filter-menu.test.tsx`: lista columnas con filtro activo primero; añadir
  filtro de una columna sin él; editar inline.
- `column-filter-popover.test.tsx`: abre/cierra, foco atrapado, Escape.

**e2e** (Playwright, añadir a los existentes de tablas):

- Crear tabla con 3 columnas de tipos distintos → añadir fila → filtrar por
  cabecera → la fila desaparece → chip visible → quitar chip → fila vuelve.
- Filtros en URL: recargar conserva el filtrado; copiar enlace en contexto
  nuevo lo reproduce.
- Guardar vista con filtros → cerrar y abrir → filtros activos.
- Sin filtros, la toolbar es una sola fila y la tabla llena el viewport.

**Verificación general** (obligatoria, Regla 4):

```bash
rtk pnpm check
rtk pnpm test:e2e
```

Y revisión manual en los dos temas, en móvil y escritorio, y en dos idiomas
como mínimo.

---

## 8. Riesgos y puntos de atención

- **Trampa conocida**: «En Playwright, un service worker activo se come los
  `page.route`» — los e2e nuevos que sirvan la API desde el navegador llevan
  `serviceWorkers: 'block'` (ya es el patrón del repo).
- **Posicionamiento del popover**: dentro de un contenedor con
  `overflow-x-auto` (la tabla desplazable), un popover absoluto puede
  recortarse. Opción segura: portal al `body` con coordenadas del botón, o
  anclar el popover al `th` con `position: fixed`. Se decide en
  implementación; el test cubre que el popover no se recorte.
- **`encodeFilters` hoy manda JSON crudo en el parámetro `filters`.** Para la
  URL visible se prefiere el mismo formato (legible en DevTools) — mantener
  compatibilidad con lo que ya viaja a la API, solo cambia el transporte.
- **Compatibilidad de vistas antiguas**: una vista guardada sin `filters`
  sigue funcionando igual (opcional en el esquema).
- **No romper el e2e existente de tablas**: los tests actuales que asumen la
  barra de filtros plana habrá que actualizarlos — es parte del paso 12.
- **Regla de ficheros cortos** (Regla 6): los componentes nuevos se quedan
  bajo ~100 líneas reutilizando los controles existentes.
