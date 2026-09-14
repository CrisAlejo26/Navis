# Plan: Creyentes en móvil

Adaptación de la sección Creyentes (RFC 0003, implementada en API y web) a
`apps/mobile`. La mecánica ya existe y se comparte: tipos de `@navis/shared`,
hooks de `@navis/api-client` (`useBelievers`, `useBelieversSummary`,
`useBeliever`, `useBelieverNotes` con `useInfiniteQuery`, `useBelieverNoteMutations`,
`useGiftHooks`, `useMinistryHooks`, `useBelieverTagHooks`, mutaciones y subida de
foto/audio) y claves `believers.*`, `notes.*`, `gifts.*` ya traducidas a los seis
idiomas. Aquí solo se escribe JSX nativo, que es lo que toca escribir dos veces
(RFC 0003 §7.9, Regla 1 §2).

## 1. Objetivo y alcance

La pestaña «Creyentes» deja de ser pantalla puente y responde, en el teléfono,
la pregunta de la RFC: **«¿con quién no he hablado?»**.

**Entra:**

- El listado con búsqueda, filtros (estado con cuenta, sede, don, «piden
  atención»), paginación en el servidor y la sonda en cada tarjeta.
- La ficha: identidad, sonda a lo ancho, dones, ministerios, etiquetas y la
  bitácora con búsqueda, filtro por tipo, «Ver más» y las vistas bitácora,
  lista y calendario.
- Alta y edición del hermano, con foto (cámara o galería) y el aviso por días.
- Añadir nota: seis tipos, fecha, lo que contó, la indicación, recordatorio y
  **grabación de audio con el micrófono del teléfono** (`expo-av`), que es donde
  el móvil gana a la web.
- Selección en lote para «Poner sede», por pulsación larga.
- El catálogo de dones, como pantalla aparte.
- Exportación (xlsx/pdf) vía `useBelieversExport`, con `expo-sharing`.

**No entra:** notificaciones push del recordatorio (RFC 0006), notas privadas
(D10), donativos. La vista «fichas» de la web no se replica: en móvil la
bitácora ya son tarjetas y dos vistas de tarjetas sería redundante.

## 2. Referencias (Refero)

| Referencia                                                                        | Qué se toma                                                                                                     | Qué se evita                                                                |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Monday.com** — gestión de usuarios (búsqueda + tres filtros + filas con avatar) | El orden vertical: buscador arriba, filtros como una fila horizontal con desplazamiento, lista debajo           | Sus desplegables enormes: aquí los filtros son pastillas `Chip`, a un toque |
| **X** — gestión de miembros (búsqueda + pestañas + lista)                         | El estado vacío de búsqueda sin resultados con acción de deshacer el filtro                                     | La densidad de su lista: cada creyente lleva sonda y necesita más aire      |
| **ABY Journal** — nota de voz sobre la entrada del diario                         | La grabación como lámina flotante con cronómetro, forma de onda y transcripción; se guarda sin salir de la nota | Su estética de app de salud: aquí mandan los tokens de Navis                |
| **Kin** — diario con botones de texto/voz al pie                                  | La barra de acciones de la bitácora siempre al alcance del pulgar                                               | —                                                                           |
| **On** — edición de perfil con avatar y action sheet de foto                      | El flujo de foto: pulsar el avatar → «Hacer foto / Elegir de la galería / Quitar»                               | —                                                                           |
| **Family** — confirmación de borrado sobre fondo difuminado                       | El diálogo de confirmación antes de borrar hermano o nota                                                       | —                                                                           |

Patrón común: **lista escaneable con identidad visual (avatar) + filtro a un
toque + acción principal anclada abajo**. La sonda de Navis es el elemento que
ninguna de las dos tiene, y es el que manda en la jerarquía de la tarjeta.

## 3. Dirección de diseño

Sin colores nuevos: tokens de `packages/theme` vía `themeColorsHex`. La sonda
conserva su semántica exacta (§7.3 del RFC): relleno `primary` → `warning` →
`destructive`, etiqueta `tabular-nums`, «sin notas» en `warning`, pista
`accessible={false}` con el texto ampliando lo que lee el lector. Objetivos
táctiles de 44 px; la acción principal («Añadir hermano» / «Añadir nota») como
botón de 48 px anclado al pie o en cabecera, nunca escondido en un menú.

## 4. Arquitectura

```
app/(tabs)/believers.tsx            listado (sustituye al puente)
app/believers/[id].tsx              ficha + bitácora (ruta de Stack)
app/believers/gifts.tsx             catálogo de dones
src/components/believers/
  believer-list-card.tsx            tarjeta del listado: avatar, estado, sede, sonda
  believers-filters.tsx             buscador + fila de Chips + filter-sheet
  sonda.tsx                         pista animada (compartida por listado y ficha)
  believer-form-sheet.tsx           alta/edición en bottom-sheet
  note-form-sheet.tsx               añadir/editar nota, con grabación
  audio-recorder.tsx                expo-av: cronómetro, forma de onda, subir al guardar
  note-row.tsx / note-month-group   bitácora agrupada por mes
  notes-calendar.tsx                el año en cuadraditos (calendar-grid ya existe)
  believer-journey.tsx              hitos del recorrido
  bulk-bar.tsx                      «Poner sede» con selección activa
```

Estado de filtros en los parámetros de la ruta (`useLocalSearchParams`), espejo
de la URL de la web; la vista (bitácora/lista/calendario) en preferencia local,
como `navis.believersView` en web.

## 5. Pasos ordenados

1. **Sonda** (`sonda.tsx`): `scaleX` al entrar (420 ms), latido del desbordado
   con `withRepeat` y `useReducedMotion`, escalonado por fila. Es el componente
   firma; todo lo demás cuelga de él.
2. **Listado**: `FlashList`/`FlatList` de tarjetas, `useBelievers` paginado con
   `onEndReached`, esqueletos de carga, vacío con acción, error con reintento.
3. **Filtros**: buscador con retardo, chips de estado con cuenta
   (`useBelieversSummary`), sede y don en `filter-sheet`, chip «Piden atención»
   en tono `warning`.
4. **Ficha**: identidad, sonda a lo ancho con la frase completa, dones,
   ministerios y etiquetas; acciones («Añadir nota» principal, «Editar», menú).
5. **Bitácora**: agrupada por mes con cabeceras pegajosas, `useInfiniteQuery`,
   vistas bitácora/lista/calendario con `segmented-control`, buscador al
   servidor, recordatorios con «Dar por hecho», reproductor de audios.
6. **Formularios**: hermano (con foto vía `expo-image-picker` y action sheet) y
   nota (tipo primero, recordatorio plegado, grabación de audio).
7. **Lote y catálogo**: selección por pulsación larga, `bulk-bar`, dones.
8. **Exportación**: menú → `useBelieversExport` → `expo-sharing`.
9. **i18n**: revisar claves que faltan solo para móvil (p. ej. «Hacer foto»,
   «Elegir de la galería») y completar los seis locales.

## 6. Animaciones e interacciones

- Entrada del listado escalonada (40 ms por fila, para a las doce), como la web.
- La sonda se llena solo en la primera pintura; al guardar una nota **se vacía**
  con la misma transición mientras la nota entra con fundido: escribir es
  recuperar margen.
- Latido del desbordado: `opacity` 0,55↔1 en bucle, 2,4 s, escalonado,
  apagado con `useReducedMotion`; filete `destructive` a la izquierda como
  respaldo estático.
- Los formularios suben como `bottom-sheet` con spring (patrón `more-menu`);
  láminas y fundidos se desactivan con movimiento reducido.

## 7. i18n

Las secciones `believers.*`, `notes.*`, `gifts.*` ya existen en los seis
idiomas por la web. Claves nuevas previstas, pocas y de móvil: acción de foto
(cámara/galería/quitar), permiso de micrófono denegado, «Grabando…», selección
en lote. `es.ts` fija el tipo; los seis en el mismo orden (Regla 2).

## 8. Plan de pruebas

- **Unitarias (Jest, móvil)**: sonda (proporciones, colores, texto de
  accesibilidad, reduced motion), filtros (mapeo de consulta), nota (tipo «don»
  exige don), bitácora (agrupación por mes). Los de `expo-av` e
  `image-picker` con el módulo mockeado: se comprueba el contrato, no el
  hardware.
- **Comando**: `pnpm check` y, al cerrar, `pnpm --filter @navis/mobile exec
expo-doctor`.
- **A mano, en los dos temas y dos idiomas** (es + de, que es el que rompe
  pastillas): listado, ficha, grabación de audio con permiso concedido y
  denegado, y el flujo de foto completo.
