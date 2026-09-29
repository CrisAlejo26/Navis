# Sueños en la app móvil — plan de implementación

- **Estado**: Implementado (sueños en modo local, con emociones, audios y estadísticas)
- **Fecha**: 2026-09-29
- **Depende de**: RFC 0005 (sueños, implementado en api/web), RFC 0024 (base
  local del móvil) y `docs/planes/implementados/profecias-movil-plan.md`, cuyo
  patrón se sigue paso a paso.
- **Sustituye**: `apps/mobile/app/dreams.tsx`, hoy un `PlaceholderScreen`.

## 0. Enmienda a la RFC 0005 («Fuera de alcance: la app móvil»)

Igual que con profecías: la RFC decía que el móvil hablaría con la API, y desde
la RFC 0024 el móvil tiene su **propia base SQLite** y las pantallas consumen
**repositorios locales**. Este plan sigue esa arquitectura. No se usan los hooks
de `packages/api-client`.

## 1. Objetivo y alcance

Los mismos datos y las mismas opciones que la web, en una interfaz pensada para
el móvil — y, como se ha pedido, **con el diseño de profecías reutilizado**.

**Base de datos idéntica** (mismas tablas, mismas columnas, comprobado por el
test de paridad contra las entidades de TypeORM):

| Tabla local      | Entidad API    | Notas                                                                      |
| ---------------- | -------------- | -------------------------------------------------------------------------- |
| `dreams`         | `Dream`        | `owner_id`, sin `church_id` (RFC 0005 D1)                                  |
| `emotions`       | `Emotion`      | `owner_id` nulo ⇒ de serie (D6); las doce se siembran                      |
| `dream_emotions` | `DreamEmotion` | tabla puente                                                               |
| `dream_audios`   | `DreamAudio`   | `storage_key` guarda la URI del fichero en el teléfono, como `note_audios` |

**Entra** (todo lo de la web salvo lo que se dice en §5):

- Portada con métricas: total, este mes, esta semana, cumplidos, racha, último
  cumplido, franja de las últimas doce semanas, noches de la semana, mapa de
  emociones y línea mensual.
- Listado con buscador, filtros por estado, emoción y tramo de fechas, y orden.
- Ficha con las cuatro lecturas (completo, lectura, interpretación, recorrido),
  interpretación editable, marcar como cumplido / reabrir y audios.
- Apuntar y editar (solo el cuerpo es obligatorio, D17), con emociones y audio.
- Gestor de emociones propias (crear, renombrar, recolorear, borrar; las de
  serie no se tocan, D6).
- Los textos ya existen en los seis idiomas (`dreams.*`); se añaden las pocas
  claves que solo tienen sentido en móvil.

## 2. Reutilización del diseño de profecías

| Pieza de profecías                           | En sueños                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ProphecyScene` (azul + paralaje)            | Se sube a `components/ui/hero-scene.tsx` como **`HeroScene`**; profecías y sueños la usan. Es genérica: solo tenía el nombre puesto. |
| `ProphecyHero` (anillo firma)                | `DreamHero`: anillo con la proporción de sueños cumplidos y la frase `dreams.lead`                                                   |
| `ProphecyStatCards`, `StatCard`              | `DreamStatCards`, cada tarjeta lleva al listado con su filtro (D16)                                                                  |
| `ProphecyMonthlyChart`                       | `DreamMonthlyChart` sobre las mismas primitivas de `components/ui`                                                                   |
| `ProphecyFilters` + `FilterSheet`            | `DreamFilters`: chips de estado con cuenta + hoja con emoción y fechas                                                               |
| `ProphecyCard` + `SwipeableRow`              | `DreamCard` (listón de color de la primera emoción, gesto = editar / cumplido)                                                       |
| `ProphecyFormSheet`, `BottomSheet`           | `DreamFormSheet` (+ selector de emociones y grabadora de audio)                                                                      |
| `ProphecyDetailHeader`, degradado por estado | `DreamDetailHeader`                                                                                                                  |
| `audio-recorder.tsx` de creyentes            | Se reutiliza tal cual para los audios del sueño                                                                                      |

**Firma de la portada** (Regla 9, una audacia): en profecías es el anillo de
tasa; en sueños es **la franja de las noches** (doce semanas × siete días) dentro
de la escena azul, que es el elemento que la web ya usa como firma (D19). El
anillo pasa a segundo plano dentro del héroe.

**Firma de la ficha**: el hilo del «Recorrido» (soñaste → le buscaste sentido →
pasó), que es la misma primitiva del hilo de cumplimientos de profecías.

## 3. Arquitectura

### 3.1 Compartido (`packages/shared`)

- `dream-stats.ts` (nuevo): `summarize` sube desde
  `apps/api/src/dreams/dream-stats.ts` **con su test** y pasa a llamarse
  `summarizeDreams` (`summarize` ya existe en `prophecy-stats.ts` y el barril
  reexporta en plano — CLAUDE.md). Ahora tiene dos usos reales (Regla 1 §5),
  igual que le pasó a `prophecy-stats`. La API lo importa de `@navis/shared`.
- `local-schema.ts`: las cuatro tablas y sus índices espejo
  (`IDX_dreams_owner_dreamed`, `IDX_dreams_owner_fulfilled`,
  `IDX_dreams_owner_search`, `IDX_dream_audios_dream`, y los únicos parciales de
  `emotions` y `dream_emotions`).
- Las doce emociones de serie con su color viven **literales en la migración
  local** (D5), no en una constante: mismos slugs, colores y posiciones que
  `1787356800000-CreateDreams.ts`.

### 3.2 Migración local (`db.ts`)

`SCHEMA_VERSION` 7 → 8. Crea solo lo que falte (una base nueva ya recibe las
tablas por `ALL_LOCAL_TABLES` en la migración 1) y **siembra las doce emociones
si no están**, con `owner_id` nulo. Idempotente, como la 4 y la 6.

### 3.3 Repositorios (`apps/mobile/src/data/repos/`)

Un fichero por responsabilidad (Regla 6):

- `dreams-sql.ts` — filtros, orden, fila y `toListItem`.
- `dreams-repo.ts` — `listDreams`, `dreamsStats`, `findDream`, `createDream`,
  `updateDream`, `deleteDream`. Todo método exige `ownerId` (D1). Valida con
  `createDreamSchema`/`updateDreamSchema` y aplica D12 (no cumplirse antes de
  soñarse). `search_text = toSearchName(título + cuerpo + interpretación)`, como
  `toSearchText` de la API. Reabrir (`fulfilledAt: null`) borra el significado.
- `emotions-repo.ts` — listar (serie + propias), crear, editar, borrar
  (comprueba dueño: las de serie devuelven error, D6), y recuento de uso.
- `dream-audios-repo.ts` — añadir, listar y borrar audios, con `audio-storage.ts`.

`dreams.state` se deriva (`dreamState`), sin columna (D8). El filtro por emoción
resuelve primero los ids de sueño y **filtra los vacíos antes** de consultar
(trampa del `IN ('')` de CLAUDE.md).

### 3.4 Hooks (`apps/mobile/src/hooks/`)

`use-dreams.ts` y `use-emotions.ts` con TanStack Query, todo colgado de
`['dreams', ownerId]` y `['emotions', ownerId]`; las mutaciones de sueños
invalidan las dos.

### 3.5 Pantallas y componentes

```
apps/mobile/app/dreams.tsx          portada (sustituye el PlaceholderScreen)
apps/mobile/app/dreams/list.tsx     listado
apps/mobile/app/dreams/[id].tsx     ficha
apps/mobile/src/components/dreams/  hero, stat-cards, nights-strip, weekday-panel,
                                    emotions-map, monthly-chart, card, filters,
                                    form-sheet, emotion-picker, emotions-sheet,
                                    fulfill-sheet, detail-header, state-icons
```

Cada fichero apunta a ≤ 100 líneas (Regla 6).

## 4. Pasos ordenados

1. **Compartido + esquema + migración + repositorios**, con tests (Regla 4):
   creación, cada filtro, D12 rechazada, reabrir borra el significado, las de
   serie no se editan, un `ownerId` no ve los sueños de otro, siembra idempotente.
2. **Hooks.**
3. **`HeroScene`** subida a `ui` y profecías migrada a ella (sin cambio visual).
4. **Portada.**
5. **Listado y formulario** (emociones, audio).
6. **Ficha** (cuatro lecturas, cumplido/reabrir).
7. **Gestor de emociones.**
8. **Rematar**: `pnpm check`, dos temas, alemán a 375 pt, `expo-doctor`,
   este plan pasa a `implementados/` y la RFC 0005 recoge la enmienda.

## 5. Lo que se simplifica o pospone (a propósito)

- **Sin exportar XLSX**: no está pedido para móvil y profecías tampoco lo lleva.
- **La franja se pinta con vistas nativas**, sin recharts (es web). Las dos gráficas (por mes y por noche de la semana) reutilizan `BarChart` de `components/ui`, sin gráfico nuevo.
- **Las escrituras y las lecturas del repositorio van en ficheros aparte** (`dreams-writes.ts`, `dreams-relations.ts`), y `dreams-repo.ts` reexporta las escrituras.
- **Los audios se graban al crear o desde la ficha**, no al editar en la hoja (igual que las notas de creyentes); `sizeBytes` se guarda a 0, como allí.
- **El gestor de emociones vive dentro de la hoja del formulario**, sustituyendo su contenido: dos `Modal` apilados no se llevan en iOS.
- **Las cuatro lecturas de la ficha** son un `SegmentedControl` y se recuerdan
  entre sesiones (`navis.dreamView`, AsyncStorage), como la web.
- **Tabla ↔ fichas**: no hay `DataTable` en móvil; el listado es de fichas
  (Regla 5 §2), igual que profecías.

## 6. Riesgos y trampas

- Mock de Reanimated de `jest.setup.js`: cada animación nueva puede pedir un
  método más (`.damping()`, `withRepeat`). Se amplía el mock, no el componente.
- `react-native-gifted-charts` se **mockea** en los tests de componentes.
- Las fechas son `AAAA-MM-DD`: se formatean con `formatDay`, nunca `formatDate`.
- `pnpm --filter @navis/shared build` (y `i18n`) antes de fiarse de
  `typecheck`/`test` de móvil: resuelven por `dist`.
- Migraciones probadas solo en SQLite del móvil; la API no cambia de esquema.
