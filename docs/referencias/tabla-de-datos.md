# La tabla de datos (`DataTable`)

Guía de uso de la tabla reutilizable de la web. El plan y las decisiones están en
[`planes/pendientes/tabla-reutilizable-plan.md`](../planes/pendientes/tabla-reutilizable-plan.md);
aquí, cómo se usa y cómo se amplía.

## Montar una tabla

```tsx
const columns = useMemo<DataTableColumn<Rol>[]>(() => [/* ver abajo */], [t]);
const state = useDataTableState('roles', columns, DEFAULT_SORTS);

<DataTable
    columns={columns}
    state={state}
    source={{ kind: 'client', items, isLoading, isError, onRetry }} // o serverSource(query)
    getKey={(rol) => rol.id}
    emptyIcon={SearchX}
    emptyTitle={t('roles.noRoles')}
/>;
```

- `tableId` (`'roles'`) es **estable**: da nombre a las preferencias guardadas.
- `columns` va en un `useMemo`: de ellas cuelga la reconciliación de preferencias.
- **Modo cliente** (`kind: 'client'`): llega la lista entera y la tabla busca, filtra, ordena y pagina.
- **Modo servidor** (`serverSource(useDataTableQuery(...))`): la API hace todo y la tabla refleja la
  página. El estado (`state.request`) se traduce a los parámetros de cada endpoint con un adaptador
  propio de la pantalla.

## Una columna

```ts
{
    id: 'level',
    kind: 'number',                 // text | number | date | select | boolean
    label: t('roles.columnLevel'),
    cell: (rol) => rol.level,       // lo que se pinta
    value: (rol) => rol.level,      // el valor en bruto: orden, búsqueda, filtros y Excel en modo cliente
    filterable: true,               // entra en «Filtros avanzados»
    facet: true, options: [...],    // (solo select) además tiene su botón propio en la barra
    description: t('...'),          // qué hace el filtro: sale en el tooltip y en su panel
    hideable: false, sortable: false, showFrom: 'lg', align: 'right', exportable: false,
}
```

## Lo que la tabla trae sin pedirlo

Buscar, ordenar (clic, y Mayús+clic para varios criterios), filtros rápidos y avanzados con chips,
paginación, columnas (mostrar, ocultar, reordenar), densidad, **vistas guardadas** y fichas por debajo
de `md`. Todo lo personal se guarda en `localStorage` por usuario y tabla
(`navis.table.<usuario>.<tabla>.prefs`); lo que se comparte va en la URL (página, búsqueda, orden y
filtros). Prioridad: URL, luego lo guardado, luego lo de fábrica.

## Acciones masivas: cómo añadir una **sin tocar la tabla**

Una acción es un objeto. La tabla pinta las casillas y la barra, pide confirmación si la acción la
declara, la bloquea mientras corre, avisa si falla y vacía la selección cuando sale bien.

```ts
const archivar = defineBulkAction<Nota>({
    id: 'archive',
    label: t('notes.archive'),            // en un teléfono queda solo el icono; esto es su nombre accesible
    description: t('notes.archiveHelp'),  // tooltip
    icon: Archive,
    tone: 'warning',                      // primary | destructive | warning | success
    confirm: (notas) => ({                // opcional; puede ser un objeto fijo
        title: t('notes.archiveTitle', { count: notas.length }),
        description: t('notes.archiveBody'),
        confirmLabel: t('notes.archive'),
        destructive: false,
    }),
    blockedReason: (notas) => notas.some(estaArchivada) ? t('notes.alreadyArchived') : undefined,
    run: async (notas) => { for (const nota of notas) await archivarNota(nota.id); },
});

<DataTable ... bulkActions={[archivar]} rowLabel={(n) => t('notes.select', { name: n.title })} />
```

- Con alguna acción en `bulkActions`, **las casillas aparecen solas**. `selectable` las fuerza sin acciones.
- `isSelectable={(fila) => ...}` deshabilita la casilla de las filas que no admiten acciones.
- `run` recibe las filas marcadas **con el dato entero**, aunque estén en otra página.
- Si `run` lanza, la selección se conserva. `keepSelection: true` la conserva también al acabar bien
  (lo usa «Exportar selección»).
- La selección se vacía sola al cambiar filtros o búsqueda: no se actúa sobre filas que ya no se ven.
- Ejemplo real: `components/access/use-role-bulk-actions.ts`.

## Exportar

`exportConfig={{ label: t('roles.exportLabel') }}` añade el botón «Exportar» y, con casillas,
«Exportar selección». Abre el diálogo común de exportación (Excel, PDF, imagen, Markdown y CSV;
RFC 0009). Se exportan **las columnas que se ven, en su orden**, con la búsqueda, los filtros y el orden
puestos, y la segunda línea del fichero lo dice.

- Cada valor sale según el tipo de la columna: números como números, días como fechas de Excel,
  booleanos como sí/no y selecciones con su etiqueta. `options[].accent` la pinta como etiqueta de
  color; `exportCell` sustituye la celda entera si el valor en bruto no basta.
- En modo servidor la tabla solo tiene una página: `exportConfig.fetchAll` trae **todas** las filas que
  cumplen los filtros (con tope). Sin él se exporta la página y se avisa.
- El Excel lleva banda de título, línea de filtros, cabecera con el azul de marca, filas alternas,
  filtro automático, primera fila inmovilizada, anchos ajustados y una hoja de resumen. Está probado
  abriéndolo con una librería independiente (openpyxl).

## Dónde está cada cosa

| Qué                                            | Dónde                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Contrato de filtros, orden y URL               | `packages/shared/src/schemas/table-state*.ts`                       |
| Estado, preferencias, selección, exportación   | `apps/web/src/lib/data-table/`                                      |
| Componentes (tabla, barra, filtros, columnas…) | `apps/web/src/components/data-table/`                               |
| Tooltip, colores de acción, iconos de fila     | `components/ui/tooltip.tsx`, `icon-action.tsx`, `lib/icon-tones.ts` |
