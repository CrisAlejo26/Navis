# Calendario de programaciones en la app móvil — plan de implementación

Amplía [RFC 0002](./rfcs/0002-calendario-de-programaciones-implementado.md)
(§8.7 lo dejó fuera de la app nativa «hasta que exista su propio documento»:
este es ese documento) y [RFC 0011](./rfcs/0011-festivos-en-el-calendario-implementado.md).

- **Estado**: **Implementado** (pasos 1 a 9; la captura del PNG va por
  `toDataURL` de react-native-svg con `expo-sharing`; el texto es el
  respaldo). Ver «Pasos» y el historial en `docs/ESTADO.md`.
- **Fecha**: 2026-09-20
- **Apps afectadas**: **mobile** (y `packages/shared`: esquema local). La API
  no se toca: ya está implementada y probada. Web no cambia.
- **Depende de**: 0002 (modelo, API y decisiones), 0011 (festivos), 0024
  (la base SQLite local del teléfono, con su esquema espejo y paridad).

---

## 1. Objetivo y alcance

Llevar al móvil **toda** la funcionalidad del calendario que ya existe en web,
en modo local (SQLite del teléfono, RFC 0024 Fase 1 — el modo actual):

- El **mes** como vista principal, con la **cinta de fases** como elemento
  firma (§8.1 del RFC): quién lleva qué tramo y dónde, de un vistazo.
- **Agenda** vertical como segunda vista (la que §8.5 ya reservaba a móvil).
- **Asignar en dos toques**: tocar fase → selector de personas ordenado por
  «quién lleva más sin subir», con búsqueda, interruptor «solo púlpito / todos»
  y alta rápida. Actualización optimista con revert.
- **Panel del día** con una sección por sede, reunión puntual, cancelar y
  «añadir programación de otra sede».
- **Ajustes**: patrones semanales con sus fases, sedes (nombre, ciudad, color),
  renombrar y borrar calendario, y **crear calendario desde plantilla**
  (púlpito, recepción, sonido, biblias, vigilancia, ofrenda, enviar
  programación — las mismas siete de la web, que siembran la semana con
  `defaultWeekFor`).
- **Reparto y avisos** (§7.3) como panel propio.
- **Lámina compartible** (§9): compuesta, no capturada; día, semana, dos a
  cuatro semanas, mes o rango; claro/oscuro; a WhatsApp con la hoja nativa.
- **Festivos** (RFC 0011) en la rejilla y en el panel del día.

**No entra** (y por qué):

- **Modo conectado**: cuando RFC 0024 Fase 3-4 conecte el móvil a la API, los
  repositorios se cambian por los hooks de `@navis/api-client` **sin tocar las
  pantallas** — la frontera repo (§3.1) es exactamente para eso.
- **Vistas semana y personas**: en 375 px la semana no añade nada sobre la
  agenda (§8.5 ya decidió que debajo de `md` la agenda es la vista), y la de
  personas vive mejor en el panel de reparto. Quedan para una ampliación.
- **Arrastrar y soltar**: descartado ya en la web por inservible en móvil.
- **Notificaciones de la RFC 0006**.

## 2. Hallazgos de la investigación

Base local `ui-ux-pro-max`: sin coincidencias para calendar/agenda/event (0
resultados en `ux-guidelines` y `react-native`) — se asume y se apoya el
criterio en Refero y en las reglas del repo.

Referencias (Refero, iOS), con qué se toma de cada una:

| Referencia                                 | Qué se toma                                                                                                                                           | Qué se evita                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Mela** — agenda de recetas (cocina)      | El bloque por día: número **grande y ligero** a la izquierda, filas de contenido a la derecha, «+» en línea por día. Es la agenda del RFC hecha móvil | Que el «+» sea la única acción: aquí la acción es tocar la fase            |
| **Planny** — calendario oscuro             | Los **chips de fecha** con punto-contador (cuántas fases sin cubrir), y el aviso destacado «vuelve a hoy» cuando no estás en él                       | Poner las tarjetas flotando sin jerarquía de sede                          |
| **Monday** — programación de publicaciones | Las **barras de color** como marca compacta en la rejilla del mes (una por reunión, color de sede) y la tarjeta de detalle al tocar el día            | La rejilla editable de 7 columnas con menús dentro: ilegible a 375 px      |
| **Amie** — día color-codificado            | La franja de **semana navegable** arriba de la agenda y el color como atributo de lectura, nunca la única señal                                       | El timeline por horas: aquí la unidad es la **fase**, no la hora           |
| **Poppy** — crear evento                   | La **creación con chips de atajo** («mañana», «este domingo») y un CTA grande al pie                                                                  | Formularios largos en pantalla completa: en móvil va todo en `BottomSheet` |

Y la referencia que manda sobre todas: la **cinta de fases** de la propia web
(§8.1). En móvil se mantiene literal —carril del color de la sede, fase en
versalitas, hueco como línea de puntos—, que es lo que da continuidad entre
lo que un hermano ve en el móvil y lo que llega por WhatsApp en la lámina.

## 3. Dirección de diseño

- **Tokens de `packages/theme`**, nada de hex sueltos; los colores que tocan a
  props nativas salen de `themeColorsHex` (Regla 3 §5). El accent de cada sede
  (`primary`/`accent`/`success`…) es un **token**, no un color.
- **Elemento firma**: la cinta de fases en cada tarjeta de reunión.
- **Mes**: la `CalendarGrid` existente (`components/ui/calendar-grid.tsx`)
  **no se toca** (la usan `DatePicker` y `DateRangePicker`): se escribe un
  `CalendarMonth` propio que reutiliza `buildDateGrid` y añade lo suyo —
  barra por reunión con el color de la sede (máximo dos, «+3» si hay más),
  punto de festivo bajo el número y el día de hoy en `bg-brand`.
- **Jerarquía tipográfica con saltos**: número del día grande (`tabular-nums`
  no existe en nativo: `fontVariant: ['tabular-nums']`), fase a 11 px con
  `tracking` abierto y `muted`, nombre de persona a 13 px medio.
- **Los objetivos táctiles de 44 px** (Regla 5): la celda del mes, la fase en
  la cinta y la fila del selector, todas por encima.
- **Navegación**: la pestaña «Calendario» ya existe en el tab-bar; el resto
  (día completo, ajustes, reparto) son rutas apiladas o `BottomSheet`.
- **Estados**: esqueleto (ya existe `Skeleton`), vacío por calendario con
  invitación a crear el primer patrón, error con reintentar, y **modo
  lectura** sin `calendar.manage`: sin fases interactivas ni botones de
  gestión (igual que la web).

## 4. Arquitectura

### 4.1 Esquema local (`packages/shared/src/local-schema.ts`)

Cuatro tablas nuevas, **espejo de las entidades de TypeORM** (el test de
paridad las exigirá — ese es el test que hay que copiar):

```
calendars          — espejo de Calendar
meeting_patterns   — espejo de MeetingPattern
pattern_phases     — espejo de PatternPhase
meeting_slots      — espejo de MeetingSlot
```

`meetings` **ya existe** en el esquema local (la usa el dashboard). Índices
nuevos en `LOCAL_INDEXES`:

- `IDX_meetings_calendar_date (calendar_id, date)`
- `IDX_meeting_slots_meeting (meeting_id, position)`
- `IDX_pattern_phases_pattern (pattern_id, position)`
- `UQ_meeting_pattern_date (pattern_id, date)` **parcial**:
  `WHERE pattern_id IS NOT NULL AND deleted_at IS NULL`. SQLite admite índices
  parciales con `WHERE`; hace falta añadir el campo `where?` a
  `LOCAL_INDEXES` y a `createIndexSql`.

### 4.2 Migración y siembra (`apps/mobile/src/data/db.ts`)

Versión nueva de `PRAGMA user_version`, en una transacción (o entera o nada):

1. Crea las cuatro tablas y sus índices.
2. Siembra los **cuatro calendarios de serie** (`pulpito`, `recepcion`,
   `sonido`, `biblias`) con la misma regla de la API.
3. Siembra la **semana por defecto** de cada calendario **por sede** con
   `defaultWeekFor` (ya en `packages/shared` — la usan la migración de la API
   y sus tests). No pisa nada: si la pareja calendario–sede ya tiene alguna
   reunión fija, no siembra. Idempotente por si el teléfono restaura una
   copia vieja.

### 4.3 Repositorios (`apps/mobile/src/data/repos/`)

Frontera dura: las pantallas y hooks no saben que los datos son SQLite. Un
fichero por responsabilidad (Regla 6) — el patrón de `believers-repo` +
`believers-sql`:

| Fichero                 | Qué vive ahí                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `calendar-repo.ts`      | Listado de calendarios, CRUD de calendario (crear con plantilla, renombrar, borrar — nunca el último)                                                                |
| `calendar-schedule.ts`  | **La expansión del tramo** (patrones → propuestas), `assignSlot` con materialización en transacción (§7.2), CRUD de reuniones, la lista de días con festivos pegados |
| `calendar-settings.ts`  | CRUD de patrones (con fases, D7: editar no reescribe lo materializado), CRUD de sedes,                                                                               |
| `calendar-preachers.ts` | Candidatos con su reparto, paginado de 25, orden por tiempo sin subir, filtro por ministerio con interruptor «todos»                                                 |
| `calendar-balance.ts`   | Reparto por persona y **avisos** (sin asignar, repetido el mismo día, días seguidos, dos sedes el mismo día)                                                         |

Las fechas y el `julianday` del SQL se escriben **aquí**, no en las pantallas.
Todo por la **cola** de `db.ts` (la trampa de Android ya documentada) y las
escrituras dentro de `withTransactionAsync`.

### 4.4 Hooks (`apps/mobile/src/hooks/use-calendar.ts`)

Claves colgando de `['calendar', churchId, …]` — se invalidan juntas, como
`['believers', churchId]`:

```
useCalendars()                  — los cuatro de serie (o los que haya)
useCalendarSchedule(from, to)   — el tramo, con placeholderData del mes anterior
useCalendarDay(date)            — el día completo con sus sedes y fases
usePreachers(from, to, { q, all })
useCalendarBalance(from, to)
useAssignSlot()                 — optimista: pinta al instante, revierte si falla
useCreateMeeting / useUpdateMeeting / useDeleteMeeting
usePatterns / useCreatePattern / useUpdatePattern / useDeletePattern
useCreateCalendar / useUpdateCalendar / useDeleteCalendar
useCongregations / useCreateCongregation / useUpdateCongregation / useDeleteCongregation
```

Los nombres y contratos son los de `packages/api-client` a propósito: el día
que el móvil hable con la API, se cambia el `import` del repositorio por el
hook del cliente sin tocar pantallas.

### 4.5 Permisos

En local no hay roles de servidor (`local_user` no los lleva). El propietario
de la iglesia local es quien gestiona: `canManage = true` **centralizado en un
solo sitio** (`lib/calendar/permissions.ts`), con la firma `can(permiso)` que
ya usa la web, para que RFC 0024 Fase 3 solo tenga que enchufar la sesión.

### 4.6 Festivos

El móvil local no tiene la API delante. Se replica la decisión del RFC 0011
con la fuente directa: `fetch` a date.nager.at al abrir un mes, validado con
zod, **cacheado un año entero** en un JSON de AsyncStorage (unas cincuenta
entradas que siempre se leen juntas — D3), refresco a los 30 días (D4) y
**si la fuente falla, se sirve lo cacheado o nada, y ni un error** (D5). El
resto del código no sabe de dónde vienen. Cuando el móvil hable con la API,
los festivos vuelven a llegar dentro del día (D1) y este módulo se apaga.

### 4.7 La lámina

La misma decisión D13 de la web, en su versión nativa: **se compone, no se
captura**. Una carpeta `components/calendar/poster/`:

- `poster.tsx` — la lámina como componentes `react-native-svg` (ya está en el
  `package.json`, lo usa `ProgressRing`): `Rect`/`Text`/`Line`, sin clases
  Tailwind, con `themeColorsHex` y los nombres de meses y días por `Intl`.
  Vertical (un día, una semana) y apaisada en rejilla (tres/cuatro semanas,
  mes), al doble de escala.
- `poster-range.ts` — los rangos (hoy, esta semana, N semanas, mes, a mano),
  con la misma aritmética que la web.
- La salida: `Svg.toDataURL()` → `expo-file-system` (ya está) → **`expo-sharing`
  (dependencia nueva, la única de este plan — `Share.share` nativo no comparte
  ficheros con fiabilidad en los dos sistemas)**, que abre la hoja del sistema
  y de ahí a WhatsApp. «Copiar como texto» queda como salida de respaldo, sin
  dependencias.

### 4.8 Pantallas y componentes

```
apps/mobile/
├── app/(tabs)/calendar.tsx                — la pantalla (mes ⇄ agenda)
├── app/calendar/settings.tsx              — ajustes de un calendario (pushed)
├── app/calendar/balance.tsx               — reparto y avisos (pushed) [o sheet]
└── src/components/calendar/
    ├── calendar-switcher.tsx              — chips de calendario (púlpito, sonido…)
    ├── calendar-month.tsx                 — la rejilla con barras y festivos
    ├── month-header.tsx                   — mes, flechas, «Hoy», salto a fecha
    ├── meeting-ribbon.tsx                 — la cinta de fases (la firma)
    ├── day-sheet.tsx                      — el día en BottomSheet, por sede
    ├── meeting-form-sheet.tsx             — reunión puntual (chips de Poppy)
    ├── preacher-picker-sheet.tsx          — el selector de personas
    ├── agenda-list.tsx                    — la agenda (bloques de Mela)
    ├── balance-list.tsx                   — reparto y avisos
    └── poster/{poster.tsx, poster-range.ts, share-sheet.tsx}
```

Los formularios de patrones y sedes reutilizan los campos que ya existen
(`TextField`, `Select`, `FieldButton`, `DatePicker`) dentro de
`BottomSheet` — que ya resuelve el teclado en Android por todos (la trampa
documentada). La hoja de ajustes usa `ListRow` + `ControlRow`, con las
confirmaciones de borrado en `Alert` como el resto de la app.

### 4.9 Lo que la web tiene y aquí se simplifica a propósito

**Decidido** (2026-09-20):

- **Agenda con chips de fecha** (Planny): la fila de días con contador de
  fases sin cubrir va, y «vuelve a hoy» con ella.
- **El reparto va como pantalla apilada** (`app/calendar/balance.tsx`): una
  lista de reparto con avisos quiere altura completa; las hojas quedan para
  formularios.

- **Densidad compacta/cómoda**: en móvil solo hay una densidad — la cómoda.
- **Filtro por persona y por texto**: viven en el panel de reparto y en el
  selector, no en la barra. La barra es: navegación, calendario activo, vista.
- **El rango a mano arrastrando**: en móvil se elige con los dos `DatePicker`
  de la hoja de compartir, que ya existen.

## 5. Pasos ordenados

Cada paso es entregable y deja el tab «Calendario» mejor de lo que estaba:

1. **Esquema y siembra** — las cuatro tablas, índice parcial, migración con
   siembra idempotente, y el test de paridad actualizado. Tab verde.
2. **Repositorio** — expansión del tramo, asignar/materializar (idempotente,
   con reintento ante la carrera), settings CRUD, preachers, balance. Sus
   tests con el adaptador de `test-support.js`.
3. **Hooks y queryKeys** — con las claves de §4.4.
4. **Pantalla principal** — conmutador de calendario, rejilla del mes con
   barras y festivos, navegación (flechas, «Hoy», salto a fecha), estados de
   carga/vacío/error, y su `useStatusBarClaim` (la trampa que acabamos de
   arreglar en creyentes).
5. **El día y asignar** — `day-sheet` por sede, cintas, `preacher-picker`
   optimista, reunión puntual, «añadir programación de otra sede», cancelar.
6. **Agenda** — bloques de Mela con la cinta dentro; chips de fecha con
   contador de huecos (Planny) y «vuelve a hoy».
7. **Ajustes** — patrones por sede con sus fases, sedes, renombrar/borrar
   calendario, y **crear calendario con plantilla** (los chips de la web).
8. **Reparto, avisos y lámina** — `balance-list`, `poster` en SVG, hoja de
   compartir con vista previa real (el PNG que se manda), y copiar como
   texto.
9. **i18n, temas y cierre** — claves nuevas en los seis idiomas, revisión de
   claro/oscuro, `pnpm check` completo y `expo-doctor`.

## 6. Animaciones e interacciones

- Las cintas de la agenda entran con `FadeInDown` escalonado por día — ya es
  el patrón de las tarjetas de creyentes, y una sola vez por sesión (misma
  regla: al volver de una ficha no vuelven a bailar).
- Al asignar: el nombre aparece con un fundido de 150 ms; al quitar, se va con
  el mismo gesto. Optimista: la cinta cambia al instante y revierte con aviso
  si falla.
- Cambio de mes: la rejilla se desplaza en el sentido de la flecha con
  `transform` y `opacity` — nada más.
- El sheet del día y el selector usan la transición nativa de `BottomSheet`;
  el pulso háptico (`expo-haptics`, ya en uso) al asignar, como en las notas.
- Todo se apaga con `useReducedMotion` (ya mockeado en `jest.setup.js`).

## 7. i18n

La casi totalidad de `calendar.*` **ya existe en los seis idiomas** (se
escribió entera con la web, incluidas las siete plantillas y «sede» por
idioma). Claves nuevas solo para lo que no existía, en los seis locales
(Regla 2 — `es.ts` define el tipo):

```
calendar.agendaEmpty          calendar.backToMonth
calendar.tapPhaseToAssign     calendar.addForAnotherDay
calendar.created              calendar.patternCreated
calendar.holidaysFailed       calendar.sharePortrait
calendar.shareLandscape
```

Se revisa contra `es.ts` al implementar cada fase: lo que ya esté traducido
no se duplica. Los nombres de fases, patrones y sedes **no se traducen** (D6):
son datos de la iglesia.

## 8. Plan de pruebas

- **Repo** (Jest + `test-support.js`): la expansión de un patrón sobre un
  tramo —incluidos `validFrom`/`validTo` y patrón apagado—; materializar es
  idempotente y sobrevive a dos llamadas seguidas; editar un patrón no toca
  lo ya materializado (D7); el índice único parcial rechaza el duplicado; el
  reparto y los cuatro avisos, con el de dos sedes; nunca se borra la última
  sede ni el último calendario; la siembra de la semana no pisa lo que ya hay.
- **Componentes**: la cinta pinta las fases en orden y marca las vacías; el
  día con tres sedes las agrupa por `position`; la rejilla del mes pinta sus
  barras y el punto de festivo; el selector ordena por tiempo sin subir y la
  mutación optimista se revierte al fallar; el rango de la lámina («cuatro
  semanas desde hoy») cae donde debe.
- **Paridad**: el test de `local-schema` contra las entidades de TypeORM en
  verde (calendario incluido).
- **De verdad, en los dos temas y dos idiomas** (es y de — el alemán rompe
  anchos), a 375 px: sin scroll horizontal en la agenda, la cinta legible, y
  la lámina mandada por la hoja nativa se lee en un móvil ajeno.

  ```bash
  pnpm check                                  # + los tests del release script
  pnpm --filter @navis/mobile test
  pnpm --filter @navis/mobile exec expo-doctor
  ```

## Riesgos y trampas que ya conocemos (CLAUDE.md)

- La **cola** de SQLite: las consultas del mes, del día y del resumen van
  juntas al abrir; la cola ya lo absorbe, pero el `placeholderData` evita que
  se vea el tramo vacío mientras llega el mes nuevo.
- `placeholderTextColor` con `mutedForeground` (arreglado hoy en
  `TextField`): los formularios de patrones y sedes lo heredan solos.
- `--muted-foreground` del tema oscuro (`#989fab`) es la señal de «hueco» en
  la cinta: la línea de puntos no va con un gris más apagado, o desaparece en
  oscuro.
- El **flash de salida** de expo-router: el `_layout` raíz ya construye el
  tema de navegación a partir de `themeColorsHex`; el calendario no añade
  pantallas con fondo propio en la zona segura salvo que reclame la barra de
  estado — y entonces lo hace vivo, como las de `useStatusBarClaim`.
- `react-native-svg` publica en ESM: si un test lo monta, entra en
  `transformIgnorePatterns` de `jest.config.js` (la trampa de gifted-charts
  aplica igual).
- Regla 6: la expansión del tramo y la lámina son los dos imanes de ficheros
  de 400 líneas — se parten desde el minuto uno (§4.3 y §4.7 ya lo fijan).
