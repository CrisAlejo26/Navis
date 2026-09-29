# Enseñanzas en la app móvil — plan de implementación

- **Estado**: Implementado (falta el repaso visual en dispositivo)
- **Fecha**: 2026-09-29
- **Depende de**: RFC 0022 (enseñanzas, implementado en api/web), RFC 0024 (base
  local del móvil) y `docs/planes/implementados/suenos-movil-plan.md`, cuyo patrón
  de capas se sigue.
- **Sustituye**: `apps/mobile/app/teachings.tsx`, hoy un `PlaceholderScreen`.

## 0. Enmienda a la RFC 0022 («Móvil queda fuera»)

La RFC dejó el móvil fuera porque «no hay editor de texto enriquecido
compartido entre DOM y React Native». Sigue siendo cierto: **Tiptap no corre en
React Native** y `react-native-enriched` obliga a un _development build_ con
módulos nativos (la app se puede abrir hoy en Expo Go). Lo que se hace aquí es
lo que la RFC apuntó como camino: **un editor propio en React Native puro**,
sobre el mismo _whitelist_ de nodos (`teachingBodySchema`), sin dependencias
nuevas. Y, como en profecías y sueños, la pantalla consume **repositorios
locales** (RFC 0024), no los hooks de `packages/api-client`.

## 1. Objetivo y alcance

Los mismos datos y las mismas opciones que la web, en una interfaz pensada para
el móvil.

**Base de datos idéntica** (comprobado por `local-schema.parity.test.ts` contra la
entidad de TypeORM):

| Tabla local | Entidad API | Columnas                                                                                                    |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `teachings` | `Teaching`  | base + `owner_id`, `title`, `body_json`, `search_text`, `received_at` (sin `church_id`, RFC 0022 / 0004 D1) |

Índices espejo: `IDX_teachings_owner_received` y `IDX_teachings_owner_search`.
`body_json` es `text` con `JSON.stringify` y se valida con `teachingBodySchema`
al leer, como en la API.

**Entra** (todo lo de la web salvo lo de §5):

- Portada con las mismas cuentas: total, este año, % de checklist marcada
  (`null` si no hay ninguna) y gráfica de los últimos doce meses.
- Listado con buscador y orden (fecha / título), paginado, con filete de color
  por checklist (ámbar = queda algo, verde = todo marcado).
- Ficha de lectura con el cuerpo formateado y **checklist que se marca desde la
  propia ficha** (con el trazo que tacha, firma de la sección).
- Alta y edición: título, fecha y cuerpo con negrita, cursiva, lista con viñetas,
  lista numerada y checklist.
- Borrado (lógico, `deleted_at`) y compartir como Markdown (hoja del sistema).
- Textos en los seis idiomas: casi todo `teachings.*` ya existe; se añaden las
  claves que solo tienen sentido en móvil.

## 2. Referencias (Refero)

| Referencia                                   | Se toma                                                                                                     | Se evita                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Linear** (editar texto, 78698e9a…)         | Barra de formato **pegada al teclado**, iconos sueltos B / I con estado activo (fondo tenue), sin etiquetas | La fila de chips de metadatos bajo el texto               |
| **Raycast** (editar nota, e06ae2a3…)         | Las tres listas (viñetas, numerada, tareas) juntas en la misma barra; el bloque cambia de tipo con un toque | El popover flotante: en un teléfono pequeño tapa el texto |
| **Miro** (checklist editable, b16463cd…)     | Título grande sin caja, casillas a la izquierda alineadas con el texto, `Done` para cerrar el teclado       | Undo/redo en cabecera (fuera de alcance)                  |
| **Notion** (página con checklist, 60a05b21…) | Lectura limpia: el checklist se marca sin entrar en modo edición                                            | Barra inferior de cuatro iconos (Navis ya tiene la suya)  |
| **Superlist / Days** (tareas con progreso)   | El progreso de la lista como dato de la fila (barra fina o `2/5`), no como decoración                       | Tarjetas de colores saturados por categoría               |

## 3. Dirección de diseño (Regla 9)

No se copia la portada de profecías/sueños (escena azul con paralaje). La
identidad de la sección, igual que en web:

- **Portada**: cabecera en franja `bg-accent/10` a todo el ancho; una tarjeta
  grande en **`bg-brand`** con el % de checklist (la cifra propia del módulo) y
  un anillo (`ProgressRing`) — más dos tarjetas `accent` (todas / este año) y la
  gráfica mensual con `BarChart` de `components/ui`.
- **Listado**: tarjeta con **filete lateral** de `warning`/`success`, extracto y
  progreso `2/5`; gesto de deslizar = editar.
- **Ficha**: franja `accent/10` con el título (nada de tarjeta blanca
  centrada), cuerpo a ancho de lectura.
- **Firma (una)**: el **trazo que tacha** una tarea al marcarla — `scaleX` de 0
  a 1 (Reanimated, solo `transform`), respetando `useReducedMotion`.
- Tokens semánticos y `themeColorsHex` para todo lo nativo (Regla 3); objetivos
  táctiles ≥ 44 pt; alemán a 375 pt sin desbordes.

## 4. Arquitectura

### 4.1 Compartido (`packages/shared`) — lo que ya usan o van a usar dos apps

- `teaching-stats.ts` (nuevo): `summarizeTeachings` y `monthlyGrid` suben desde
  `apps/api/src/teachings/teaching-stats.ts` **con su test** (dos usos reales,
  Regla 1 §5; mismo movimiento que `summarizeDreams`). La API lo importa de
  `@navis/shared`. El nombre no choca con `summarize`/`summarizeDreams`.
- `teaching-body.ts` (nuevo): `parseTeachingBody(json)` y
  `toTeachingSearchText(title, body)` (hoy en el mapper y el servicio de la API).
- `teaching-markdown.ts` (nuevo): `toTeachingMarkdown` sube desde
  `apps/web/src/lib/teachings/body-to-markdown.ts` con su test (incluye los dos
  bugs de regresión: espacio dentro de la negrita y línea en blanco entre
  bloques). La web lo importa de `@navis/shared`.
- `local-schema.ts`: tabla `teachings` y sus dos índices.

### 4.2 Migración local (`db.ts`)

`SCHEMA_VERSION` 8 → 9. Crea `teachings` y sus índices solo si faltan
(`IF NOT EXISTS`); en una base nueva la migración 1 ya la crea. Idempotente,
como la 8. No hay siembra.

### 4.3 Repositorios y hooks

- `data/repos/teachings-sql.ts` — fila, orden, filtros y `toListItem`.
- `data/repos/teachings-repo.ts` — `listTeachings`, `teachingsStats`,
  `findTeaching`, `createTeaching`, `updateTeaching`, `deleteTeaching`. Todo
  método exige `ownerId` (única barrera de acceso). Valida con
  `createTeachingSchema`/`updateTeachingSchema`; `search_text` con
  `toTeachingSearchText`; nunca `JSON.parse` sin `teachingBodySchema`.
- `hooks/use-teachings.ts` — TanStack Query, todo colgado de
  `['teachings', ownerId]`.

### 4.4 El editor (solo móvil, sin dependencias)

Modelo de bloques plano, con lógica pura y probada aparte de la vista:

- `lib/teachings/editor-model.ts` — `EditorBlock { id, kind: 'paragraph' |
'bullet' | 'ordered' | 'task'; checked; runs }` y las conversiones
  `bodyToBlocks` / `blocksToBody` (bloques contiguos del mismo tipo forman una
  sola lista; el resultado siempre pasa `teachingBodySchema`).
- `lib/teachings/runs.ts` — tramos de texto con marcas: `applyTextChange`
  (reconcilia lo tecleado por prefijo/sufijo común), `toggleMark(range)`,
  `marksAt`, normalización que une tramos vecinos iguales.
- `components/teachings/editor/` — `teaching-editor` (lista de bloques + foco),
  `editor-block-row` (marcador + `TextInput` con el texto como hijos `<Text>`
  estilados), `editor-toolbar` (B, I, viñetas, numerada, checklist; pegada al
  teclado con `lib/ui/keyboard.ts`).
- Teclas: Enter crea bloque del mismo tipo (en uno vacío lo convierte en
  párrafo); Retroceso al inicio fusiona con el anterior o baja a párrafo.

### 4.5 Pantallas

```
apps/mobile/app/teachings.tsx           portada
apps/mobile/app/teachings/list.tsx      listado
apps/mobile/app/teachings/[id].tsx      ficha
apps/mobile/app/teachings/edit.tsx      alta y edición (?id=…): pantalla, no hoja
apps/mobile/src/components/teachings/   stat-cards, monthly-chart, card, body-view,
                                        checklist-item (tacha), detail-header, editor/
```

El formulario es una **pantalla** y no un `BottomSheet`: un editor con teclado y
barra de formato necesita todo el alto, y las hojas ya arrastran su propia
gestión del teclado (CLAUDE.md). Cada fichero apunta a ≤ 100 líneas (Regla 6).

## 5. Lo que se simplifica o pospone (a propósito)

- **Sin exportar como imagen** (postal): necesita captura de vista
  (`react-native-view-shot`) y no está pedido para móvil; sí Markdown, por la
  hoja de compartir del sistema (`Share`).
- **Sin deshacer/rehacer** en el editor.
- **Sin encabezados, enlaces ni más marcas**: el _whitelist_ es cerrado.
- **Pegar texto con saltos de línea** lo divide en párrafos; el formato del
  portapapeles se descarta.
- La gráfica mensual reutiliza `BarChart` (una serie), sin gráfico nuevo.

## 6. Pasos ordenados

1. **Compartido** (stats, body, markdown) con sus tests; la API y la web pasan a
   importarlo. `pnpm --filter @navis/shared build`.
2. **Esquema local + migración 9 + repositorio + hooks**, con tests: cada caso
   del repo, `ownerId` ajeno no ve nada, borrado lógico, búsqueda sin acentos,
   `checklistRate` `null`, migración idempotente.
3. **Lógica del editor** (`runs`, `editor-model`) con tests, antes de dibujar nada.
4. **Editor** (bloques, barra, teclas).
5. **Pantalla de alta/edición.**
6. **Ficha** con lectura, checklist viva y tacha; compartir Markdown.
7. **Listado** y **portada**.
8. **i18n** (seis idiomas) y enlaces desde «Más».
9. **Rematar**: `pnpm check`, `pnpm test:e2e` (la API y la web han cambiado de
   fichero), `expo-doctor`, dos temas, alemán a 375 pt; este plan pasa a
   `implementados/` y la RFC 0022 recoge la enmienda.

## 7. Plan de pruebas

- `pnpm --filter @navis/shared build && pnpm --filter @navis/i18n build` antes de
  fiarse del móvil (resuelve por `dist`).
- Jest (móvil): repo (con better-sqlite3 como los demás), editor puro, y
  componentes por comportamiento (marcar una tarea, cambiar de tipo de bloque).
- `local-schema.parity.test.ts` (API): mismas columnas que la entidad.
- `pnpm check`, `pnpm test:e2e`, `expo-doctor`.
- **Sin verificar aquí**: el repaso en dispositivo/emulador (caret al editar con
  marcas, teclado en Android e iOS). Se pedirá al usuario que lo mire.

## 8. Riesgos y trampas

- **El caret del `TextInput` con hijos estilados** puede saltar si se re-renderiza
  el texto en mitad de la escritura: por eso el texto solo se reconcilia desde
  `onChangeText` y no se fija `value`. Es el punto a mirar primero en dispositivo.
- **Mock de Reanimated** de `jest.setup.js`: cada animación nueva puede pedir un
  método más; se amplía el mock.
- **Fechas** `AAAA-MM-DD`: `formatDay`, nunca `formatDate`.
- **Barril de `packages/shared`** reexporta en plano: nombres únicos
  (`summarizeTeachings`, `toTeachingMarkdown`).
- Migraciones probadas solo en SQLite (better-sqlite3 en Jest).
