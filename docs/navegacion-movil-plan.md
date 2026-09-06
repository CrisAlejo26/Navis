# Plan — Navegación y estructura de la app móvil

Rediseño de la navegación de `apps/mobile` con el espejo de la sidebar web, en
claro y oscuro y en los seis idiomas, con todas sus páginas como puente
(pendientes de implementar). Sigue `docs/referencias-app-movil.md`.

Estado: **Implementado** (2026-08-30). Se ejecutó `pnpm check` en verde y
`expo-doctor` 20/20. Ver «Notas» al final.

---

## 1. Objetivo y alcance

**Qué resuelve**

- Una navegación móvil moderna, dinámica y animada que da acceso a **las 13
  entradas de la sidebar web** (`apps/web/src/lib/nav.ts`), que hoy la app no
  cubre: faltan Listas, Tablas, Cuaderno, Tareas y Usuarios.
- Barra inferior animada (pill deslizante + haptics) con el límite de **≤5
  pestañas** de la regla de UX, y un menú «Más» que despliega el resto,
  agrupado **igual que la sidebar** (General / La iglesia).
- Todas las secciones sin implementar quedan en **pantallas puente** con su
  RFC de referencia (las de hoy ya lo hacen: `PlaceholderScreen`).
- Funciona en **claro y oscuro** (tokens existentes, sin hex sueltos) y en
  **los seis idiomas** (`es, en, fr, pt, de, it`).

**Qué NO entra**

- Implementar ninguna funcionalidad (métricas, creyentes, calendario…): solo
  navegación y pantallas puente.
- Cambiar los tokens de tema ni la marca (`packages/theme` se lee, no se
  escribe) — salvo que haga falta un color nuevo, que se añadiría a `tokens.css`
  con su versión clara y oscura (Regla 3).
- Rediseñar el flujo de autenticación (login/register se tocan solo si hace
  falta algo de marca, y no es el objetivo).

---

## 2. Hallazgos de la fase 2 (referencias)

De `docs/referencias-app-movil.md`, lo que se toma y lo que se evita:

| Referencia                                                  | Qué se toma                                                                                     | Qué se evita                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Linear Tab Bar** (rnmotion.dev/animations/linear-tab-bar) | Pill de cristal que se desliza con spring, glow que sigue el dedo, menú escalonado (40ms)       | La complejidad del morph pill→menú completo (se hace un bottom sheet, más accesible) |
| **Liquid Glass Navbar** (OmarShayya)                        | Gesture-driven, haptic al cruzar pestañas, tint que sigue la pill                               | El cristal nativo requiere build con Xcode 26: se usa blur estándar + tokens         |
| **Telegram Swipe / Motionary**                              | Filas del menú que entran en cascada mientras se despliega                                      | Swipe sobre filas del menú (aquí no aplica)                                          |
| **Dead forms, live forms** (Ruixen)                         | Springs para todo lo que se mueve: la pill y el sheet usan `withSpring`, no `withTiming` lineal | —                                                                                    |
| **7 UI Patterns 2026** (Muzli)                              | Bottom sheet como contenedor dominante de contenido secundario; haptic como capa de feedback    | —                                                                                    |
| **Bento / dashboard**                                       | (solo dirección futura) El tab «Inicio» queda placeholder; el bento se hará con el RFC 0001     | Meter el bento ahora sin datos                                                       |

Principio rector tomado de Muzli: **coger 2-3 patrones y ejecutarlos con
precisión** → pill animada + bottom sheet escalonado + haptics.

---

## 3. Dirección de diseño

- **Estilo**: bold & vibrante pero contenido — energía de neo-brutalismo
  (tipografía grande, bloques de color seguros) filtrada por la marca.
- **Paleta**: solo tokens semánticos. Fondo `bg-background`, superficies
  `bg-card`, texto `text-foreground` / `text-muted-foreground`, bordes
  `border-border`, marca `bg-primary`/`text-primary` (azul `#2140cf`),
  acento cálido `bg-accent` para el detalle del menú. En props nativas
  (color de iconos, glow, blur del sheet) → `themeColorsHex[resolvedTheme]`.
- **Tipografía**: la actual (semibold/bold en títulos, `text-muted-foreground`
  para secundario). En el tab bar, etiqueta del activo en `font-medium`.
- **Sin cruces** en iconos (Regla 7): Ionicons de `@expo/vector-icons`, ya en
  uso. El símbolo de marca (barco) no entra en la navegación.

---

## 4. Arquitectura

### 4.1 Cómo se estilan las cosas en móvil (Tailwind v4 + NativeWind 5)

Para quien implemente, el modelo real de este repo:

- `apps/mobile/src/global.css` importa `tailwindcss`, `nativewind/theme` y
  `@navis/theme/tokens.native.css`, con `@source` apuntando a `app/` y `src/`
  (la detección automática de Tailwind no cruza el monorepo).
- **Los estilos son clases** en `className`, compuestas con `cn()` (clsx +
  tailwind-merge, `src/lib/cn.ts`). Nada de `StyleSheet.create` salvo estilos
  verdaderamente dinámicos.
- **Claro/oscuro**: en móvil **no hay clase `.dark`**. `tokens.native.css`
  reanuda los alias a la paleta oscura con `@media (prefers-color-scheme:
dark)`, y `src/lib/theme.ts` fuerza el modo con `Appearance.setColorScheme()`.
  Por eso el tab bar y el menú **solo usan clases de tokens** (`bg-card`,
  `text-foreground`…) y los props nativos sacan el color de
  `themeColorsHex[resolvedTheme]`.
- **`oklch()` no viaja a props nativas** de React Native: color de `Ionicons`,
  glow, blur del sheet y barra de estado salen de `themeColorsHex` / `tokens.ts`,
  que es el único sitio con hex.
- **Safe areas**: `SafeAreaProvider` ya está en la raíz; tab bar y bottom sheet
  usan `useSafeAreaInsets()`.
- **Ficheros cortos** (objetivo ≤100 líneas) y un componente por fichero
  (Regla 6 y regla de `react-refresh/only-export-components`).
- En Jest el preset de NativeWind está desactivado: los tests comprueban
  comportamiento, no estilos.

### 4.2 Estructura de rutas (expo-router)

Estado actual → destino:

```
app/
  _layout.tsx            existe    + añadir los nuevos screens al <Stack>
  index.tsx              existe    redirect sesión (sin cambios)
  (tabs)/_layout.tsx     existe    + tab bar custom animado (tabBar propio)
  (tabs)/index.tsx       existe    Inicio: placeholder (bento con RFC 0001)
  (tabs)/calendar.tsx    existe    placeholder (RFC 0002)
  (tabs)/believers.tsx   existe    placeholder (RFC 0003)
  (tabs)/more.tsx        existe    pasa a ser el contenido del menú «Más»
  (tabs)/settings.tsx    existe    Ajustes (sin cambios)
  (auth)/…               existe    login/register (sin cambios)
  prophecies.tsx         existe    placeholder (RFC 0004)
  dreams.tsx             existe    placeholder (RFC 0005)
  teachings.tsx          existe    placeholder (RFC 0022)
  communications.tsx     existe    placeholder (RFC 0006)
  lists.tsx              NUEVO     placeholder (RFC 0010)
  tables.tsx             NUEVO     placeholder (RFC 0021)
  journal.tsx            NUEVO     placeholder (RFC 0017)
  tasks.tsx              NUEVO     placeholder (RFC 0018)
  users.tsx              NUEVO     placeholder (RFC 0008)
  +not-found.tsx         existe
```

### 4.3 Componentes nuevos (en `apps/mobile/src/`)

| Componente        | Ruta                                          | Responsabilidad                                                                                          |
| ----------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `AnimatedTabBar`  | `components/navigation/animated-tab-bar.tsx`  | Pintar el `tabBar` del `Tabs`: pill deslizante, iconos animados, botón «Más». Recibe `BottomTabBarProps` |
| `MoreMenu`        | `components/navigation/more-menu.tsx`         | Bottom sheet con el listado completo (componentes reales, backdrop, swipe-down)                          |
| `MoreMenuContent` | `components/navigation/more-menu-content.tsx` | La lista de entradas agrupada (General / La iglesia); la reutilizan el sheet y `more.tsx`                |
| `nav-mobile.ts`   | `lib/nav-mobile.ts`                           | Definición de las entradas móviles (ruta + `labelKey` + icono + RFC), espejo de `nav.ts` de web          |

### 4.4 Las 13 entradas y dónde viven

Barra inferior (5): **Inicio**, **Calendario**, **Creyentes**, **Más**,
**Ajustes**. «Más» despliega el resto en dos grupos, como la sidebar:

- **General**: Profecías, Sueños, Enseñanzas.
- **La iglesia**: Listas, Tablas, Cuaderno, Tareas, Comunicaciones, Usuarios.

Los `labelKey` (`nav.*`) y los encabezados de grupo (`nav.groupGeneral`,
`nav.groupChurch`) **ya existen en los seis idiomas** → el menú no necesita
traducciones nuevas de las entradas.

### 4.5 `PlaceholderScreen` se generaliza

- Ampliar el tipo `NavKey` de `components/placeholder-screen.tsx` a todas las
  claves `nav.*` (hoy solo cubre 6).
- Mantener el «Especificación: docs/rfcs/<rfc>» actual.

---

## 5. Pasos ordenados

1. **Base de navegación**: `src/lib/nav-mobile.ts` con las 13 entradas
   (ruta, `labelKey`, icono Ionicons, RFC).
2. **Generalizar `PlaceholderScreen`** (NavKey completo).
3. **Pantallas puente nuevas**: `lists.tsx`, `tables.tsx`, `journal.tsx`,
   `tasks.tsx`, `users.tsx` (4-6 líneas cada una, patrón de `calendar.tsx`).
4. **Registrar los nuevos screens** en el `<Stack>` de `app/_layout.tsx`
   (como los `stackScreens` actuales, con `headerShown: true` y su título).
5. **`AnimatedTabBar`**: pill deslizante + iconos con spring + haptics,
   conectado como `tabBar` del `Tabs` de `(tabs)/_layout.tsx`.
6. **`MoreMenu` + `MoreMenuContent`**: bottom sheet con entrada escalonada y
   cierre por backdrop/swipe; `more.tsx` usa `MoreMenuContent`.
7. **Refinar** (i18n, animaciones, reduced-motion) y **probar**.

---

## 6. Animaciones e interacciones

Todas con `react-native-reanimated` (ya en el proyecto) y `expo-haptics` (**hay
que instalarlo**: no está en `package.json`).

1. **Pill activa**: se desliza entre pestañas con `withSpring`
   (stiffness ~200, damping ~20) interpolando la posición del índice activo.
   Haptic `selectionAsync` al cambiar.
2. **Icono activo**: `scale` con spring con overshoot (1 → 1.15 → 1) usando
   `useAnimatedStyle`; el inactivo queda a opacidad `mutedForeground`. Los
   iconos reciben `(active, color, progress)` para animarse al seleccionar
   (patrón de la librería Liquid Glass).
3. **Bottom sheet «Más»**: sube con `withSpring` desde abajo, backdrop con
   `opacity`, y las filas entran **en cascada a 40ms** (layout animations de
   Reanimated: `FadeInDown`/`SlideInDown` con `delay` escalonado). Cierre por
   backdrop, swipe down (`Gesture.Pan`) o botón; haptic `impactAsync` al
   abrir/cerrar.
4. **Reduced motion**: `useReducedMotion()` de Reanimated — si está activado,
   la pill se posiciona sin spring, el sheet sin cascada (estados deterministas).
5. **Transiciones de pantalla**: se mantienen las nativas del `Stack`/`Tabs`;
   el `headerShown: true` de las pantallas puente ya da el back esperado.

**Estados de cada pantalla puente**: título + tarjeta «Próximamente» con la RFC
(ya existe el patrón). No hace falta estado de carga/error porque no consultan
nada todavía.

---

## 7. i18n

- **Claves existentes y reutilizadas** (en los seis locales): `nav.dashboard`,
  `nav.calendar`, `nav.believers`, `nav.more`, `nav.settings`, `nav.prophecies`,
  `nav.dreams`, `nav.teachings`, `nav.communications`, `nav.lists`,
  `nav.tables`, `nav.journal`, `nav.tasks`, `nav.users`, `nav.groupGeneral`,
  `nav.groupChurch`, `common.comingSoon`.
- **Claves nuevas** (añadir PRIMERO a `es.ts`, que tipa al resto — no compila
  hasta traducir las seis):
  - `nav.allSections`: «Todo» (subtítulo del sheet «Más»).
  - `nav.closeMenu`: «Cerrar el menú» (accessibilityLabel del backdrop/cierre).
- `PlaceholderScreen` y los `stackScreens` del `_layout` ya usan `t(labelKey)`;
  los nuevos screens se registran igual.

---

## 8. Plan de pruebas

- `pnpm check` (formato + lint + tipos + tests del repo; los `nav.*` nuevos
  fallan tipos hasta traducir los seis idiomas, a propósito).
- Tests Jest de móvil con `@testing-library/react-native` (render/fireEvent
  **asíncronos**, nota de CLAUDE.md; NativeWind desactivado → comportamiento):
  - `MoreMenu`/`MoreMenuContent`: al pulsar una entrada navega a la ruta
    correcta; al pulsar el backdrop cierra; las 13 entradas presentes.
  - `AnimatedTabBar`: pulsar una pestaña llama a `navigation.navigate`; «Más»
    abre el menú en vez de navegar.
- `pnpm --filter @navis/mobile exec expo-doctor`.
- Verificación manual: **dos temas** (claro y oscuro forzados y sistema) y
  **al menos dos idiomas** (es + en o fr), en Android e iOS (simulador o Expo Go).
- `expo-haptics` se instala con `pnpm add expo-haptics` (o el alias `rtk` que
  use el repo), y se verifica que el tab bar funciona sin él si el dispositivo
  no da haptics.

---

## Notas

- Al terminar, marcar lo completado en este plan (feature-builder fase 5) y
  actualizar `docs/README.md` solo si nace un RFC nuevo (aquí no nace: es un
  cambio de interfaz).
- Los botones y filas del menú son elementos reales (no gestos ocultos) y
  cumplen los objetivos táctiles ≥44 px (Regla 5).

## Registro de implementación

- **Barra inferior**: `AnimatedTabBar` con pill de marca (`--primary`) que se
  desliza con spring, iconos con rebote (spring 1.2→1) y haptics
  (`expo-haptics`, nueva dependencia). El botón «Más» abre el menú en vez de
  navegar; cuando está abierto, el icono se resalta sobre el acento.
- **Menú «Más»**: `MoreMenu` (bottom sheet con backdrop y lámina con spring)
  - `MoreMenuContent` (filas en cascada a 40 ms, agrupadas General / La
    iglesia). `(tabs)/more.tsx` reutiliza el contenido como pantalla de respaldo.
- **13 entradas**: `src/lib/nav-mobile.ts` es la fuente única (ruta + labelKey
  - icono + RFC); el `<Stack>` raíz deriva sus pantallas de ahí.
- **Pantallas puente nuevas**: `lists`, `tables`, `journal`, `tasks`, `users`;
  `PlaceholderScreen` acepta todas las claves `nav.*`.
- **i18n**: claves nuevas `nav.allSections` y `nav.closeMenu` en los seis
  idiomas (es tipa al resto).
- **Tests** (Jest + @testing-library/react-native): `AnimatedTabBar` (5
  pestañas, navega, «Más» abre) y `MoreMenuContent` (grupos, entradas, rutas).
  En `jest.setup.js` se sustituyó Reanimated por un stub (el mock oficial
  arrastraba `react-native-worklets` y fallaba en Jest).
- **Verificación**: `pnpm check` (formato + lint + tipos + tests, incluidos
  los de scripts) y `expo-doctor` 20/20.

## Fase 2 — Dashboard con datos reales (2026-09-06)

Investigación con el MCP de Refero (`refero_search_screens`, `platform: ios`,
referencias de apps nativas, no web) más el grafo del proyecto, que reveló que
el RFC 0001 **ya está implementado por completo en la API** (`useDashboardSummary`,
una sola llamada) y solo faltaba cablearlo en móvil: `(tabs)/index.tsx` era
un placeholder.

**Referencias tomadas**: Andante (rejilla 2×2 de métricas + calendario de
actividad + tab bar de tres), Wispr Flow (tarjeta hero con la cifra grande +
tab bar flotante en pill — valida el `AnimatedTabBar` ya implementado, mismo
patrón), Poppy (cabecera de saludo + chips + rejilla de accesos), TIDE
(tarjeta de estadística + lista corta). Screens completas en
`docs/referencias-app-movil.md` §2-3 quedan vigentes; esta fase no las repite.

**Decisión de diseño — sin rejilla de accesos aparte**: cada tarjeta del panel
ya navega a su sección al tocarla (creyentes, calendario, tareas, bitácora),
igual que en la web. Añadir además una rejilla de atajos (patrón Poppy)
habría duplicado el menú «Más» sin aportar nada nuevo: la portada ya es el
acceso rápido que pedía la tarea.

**Qué se implementó**: `WelcomeHeader`, `StatusCard` (creyentes + atención,
apiladas), `EventsCard`, `NotesCard`, `TodayTasksCard`, `CompositionSection` +
`BucketBars`, `ActivityCard` (estela con `react-native-svg`), todas en
`apps/mobile/src/components/home/`, con entrada en cascada (`FadeInDown`,
40 ms) y `RefreshControl` para refrescar a mano.

**Qué NO se implementó**: el `WeekCalendar` de la web (rejilla de 7 columnas +
`MeetingRibbon`) — es la interfaz del calendario en sí (RFC 0002), que en
móvil sigue siendo puente; se aborda cuando se implemente esa pantalla, no
antes, para no duplicar su UI.

**Lógica movida a paquetes compartidos** (Regla 1: dos apps ya la necesitan):

- `wakeShape` → `packages/shared/src/wake-path.ts` (antes en
  `apps/web/src/lib/lists/wake-path.ts`, que ahora reexporta).
- `greetingKeyFor` → `packages/shared/src/greeting.ts` (ídem, web reexporta).
- `accentHex` → `packages/theme/src/accent-hex.ts` (antes en
  `apps/web/src/lib/accents.ts`, que ahora reexporta; con su propio test
  nuevo, `accent-hex.test.ts`). Nace nuevo el tipo `ThemeColors` en
  `packages/theme/src/tokens.ts`.
- `apps/mobile/src/lib/format.ts` y `.../lib/color.ts` (nuevos): el
  subconjunto de `formatX` que usa el panel, y `hexAlpha` para los tintes de
  icono que en web son una clase (`bg-primary/12`) y en RN necesitan un color
  de verdad (Regla 3 §5).

**Verificación**: `pnpm check` en verde (incluye el `accentHex` movido y sus
ocho sitios de uso en web, sin tocarlos) y `pnpm build`. `expo-doctor` marca 1
fallo preexistente y ajeno a este cambio (desfase de parche en paquetes de
Expo SDK 57, `expo install --check` lo arregla aparte).
