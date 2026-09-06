# Plan — Sistema de componentes de `apps/mobile`

Construir una librería de componentes de interfaz para la app móvil, con
variantes reales (no una sola forma de cada cosa) y con la tipografía
centralizada en un solo sitio. Cada fase de este plan es **un componente**:
se investiga en Refero, se decide qué se toma y qué no, se define la matriz
de variantes y se implementa sobre los tokens existentes (Regla 3).

Estado: **plan** (2026-09-06). Ninguna fase implementada todavía.

---

## 1. Objetivo y alcance

**Qué resuelve**

- Una carpeta `apps/mobile/src/components/ui/` con **más variantes** de lo que
  hay hoy (`button.tsx`, `card.tsx`, `text-field.tsx` cubren un caso cada uno)
  y con las piezas que faltan: iconos, selectores, checkbox/radio, tarjetas de
  estadística, gráficas, carruseles, etc.
- Un **sistema tipográfico**: escala de títulos/subtítulos/cuerpo con nombre
  (no `text-lg font-bold` repetido a mano en cada pantalla) y la fuente en
  **un solo lugar** para poder cambiarla sin tocar componentes.
- Cada componente con su matriz de variantes documentada (tamaños, estados,
  con/sin icono…), probado en claro/oscuro y con texto en alemán (Reglas 2, 3,
  5), y con test de comportamiento (Regla 4).

**Qué NO entra**

- Tocar la web ni el escritorio: es un plan de `apps/mobile`. Si un token sale
  reutilizable (la fuente, por ejemplo), se define en `packages/theme` para que
  la web lo adopte **cuando le toque**, pero esta ronda no la implementa ahí.
- Rediseñar pantallas completas. Este plan produce piezas de `components/ui`;
  usarlas en una pantalla concreta es trabajo de la feature que la toque.
- Cambiar la paleta de color o el logo (Reglas 3 y 7): los componentes nuevos
  consumen los tokens que ya existen.

## 2. Restricciones que ya están decididas (no se investigan)

- **Marca**: azul `#2140cf` (`--primary`), acento ocre (`--accent`), **nada de
  cruces** (Regla 7). Refero da patrones de layout, jerarquía y estados —no
  paleta.
- **Anti-genérico** (Regla 9): nada de emoji como icono, nada de degradados de
  relleno, nada de sombra por todas partes. Cada componente necesita al menos
  una decisión que lo haga reconociblemente Navis (el vocabulario náutico:
  cartas, rumbos, sondas, cuadernos, ya se usó en el panel de inicio).
  Referencia de estilo general encontrada en esta sesión: **Perplexity** y
  **ChatGPT** (calma, mucho blanco, tipografía como jerarquía en vez de color,
  bordes finos casi invisibles) — sirve de contrapeso a cualquier tentación de
  saturar de color los componentes nuevos.
- **Un fichero por responsabilidad, ≤100 líneas** (Regla 6): una familia con
  muchas variantes (botón, input) reparte tamaños/estados en mapas dentro del
  fichero del componente; si crece más, el mapa de variantes sale a su propio
  fichero, como ya hace `lib/prophecies/state-icons.ts` en la web.
- **Sin `any`** en las props de variante: uniones literales (`'sm' | 'md' |
'lg'`), nunca `string` suelto (Regla 10).

## 3. Dónde vive cada cosa

| Qué                                                      | Va en                                          |
| -------------------------------------------------------- | ---------------------------------------------- |
| Componente de interfaz (botón, card, input…)             | `apps/mobile/src/components/ui/<nombre>.tsx`   |
| Mapa de variantes que crece demasiado para el componente | `apps/mobile/src/lib/ui/<nombre>-variants.ts`  |
| Tokens de fuente (familia, pesos, escala)                | `packages/theme/src/fonts.ts` (nuevo, Regla 1) |
| Carga de las fuentes físicas en la app                   | `apps/mobile/app/_layout.tsx` (`useFonts`)     |
| Ficheros de fuente (`.ttf`)                              | `apps/mobile/assets/fonts/`                    |
| Tests de cada componente                                 | junto al componente, `<nombre>.test.tsx`       |

Antes de crear un componente, `search_code`/`search_graph` sobre
`apps/mobile/src/components` para confirmar que no existe ya con otro nombre
(Regla 1, punto 1).

## 4. Metodología de cada fase (se repite igual en todas)

1. **Buscar en Refero.** `refero_search_screens` (`platform: "ios"`) con
   términos concretos del componente («radio button selection», «bottom sheet
   date picker»…) para ver cómo lo resuelven apps reales; si el componente
   tiene también una dimensión de identidad visual (tipografía, tarjetas),
   `refero_search_styles` para dirección. 3-5 referencias por fase basta —
   `refero_get_similar_screens` sobre la mejor amplía sin gastar más búsquedas.
2. **Filtrar por lo que aplica aquí.** Descartar lo que no encaja con la marca
   o con Regla 9 (genérico, degradados, emoji); anotar en el plan **qué se
   toma y qué se evita**, como ya hace `docs/navegacion-movil-plan.md`.
3. **Definir la matriz de variantes** de ese componente: tamaños, estados
   (normal/hover→pressed/disabled/loading/error), con icono / sin icono, y si
   aplica, día/noche visualmente distintos más allá del token de color.
4. **Implementar** en `components/ui`, sobre tokens existentes, con las props
   tipadas (uniones literales, Regla 10) y accesibilidad (rol, `accessibilityLabel`
   cuando no hay texto visible — Regla 2).
5. **Probar**: test de comportamiento con Testing Library (`render`/`fireEvent`
   asíncronos, Regla 4) — qué variante aplica qué clase o qué se dispara al
   pulsar, no el aspecto. Si el componente ya existe y se amplía, primero el
   test de la variante nueva.
6. **Verificar a ojo**: emulador, claro y oscuro, con `de.ts` activo si el
   componente lleva texto (Reglas 2, 3, 5).
7. Marcar la fase como hecha en este documento con la fecha.

## 5. Fase 0 — Infraestructura tipográfica (fuente en un solo lugar)

Va primero porque títulos, subtítulos y varios componentes (cards, botones)
dependen de ella.

**Estado: hecho (2026-09-06).** Pareja elegida con `ui-ux-pro-max --domain
typography`/`--domain google-fonts`: **Libre Caslon Display** (títulos —
carácter de cuaderno de bitácora náutico, Regla 9) + **Public Sans** (cuerpo —
humanista, cívica, sin aire de plantilla SaaS); las dos con subset
`latin`+`latin-ext` verificado para los seis idiomas. `packages/theme/src/
fonts.ts` (`FONT_FAMILIES`, `TYPE_SCALE`) es el único sitio a tocar para
cambiarla; `tokens.native.css` expone `font-display`/`font-sans*` a Tailwind
con los mismos nombres que carga `useFonts` en `app/_layout.tsx`
(`@expo-google-fonts/libre-caslon-display`, `@expo-google-fonts/public-sans`).
Aplicada a los tres componentes de `ui/` existentes (`Button`, `Card`,
`TextField`) y a los dos títulos más visibles (panel de inicio, eslogan de
acceso). `pnpm check` en verde; `expo-doctor` 19/20 (el fallo es un desfase de
versiones parche de Expo ya presente antes de esta fase, sin relación).

- **Investigar**: `refero_search_styles` con términos de tipografía editorial
  /calma (ya cubierto arriba con Perplexity/ChatGPT) más 2-3 búsquedas
  específicas: una fuente serif/display para títulos con carácter náutico
  (algo con un poco de peso e identidad, no una geométrica genérica) y una
  sans muy legible para cuerpo. Decidir **una pareja** (display + texto), como
  hace `ui-ux-pro-max` con sus 74 combinaciones — esa skill es más rápida que
  Refero para esto en concreto, úsala en la fase.
- **Diseño**: `packages/theme/src/fonts.ts` exporta `FONT_FAMILIES` (claves
  lógicas: `display`, `sans`) y `TYPE_SCALE` (nombre → tamaño/peso/tracking:
  `display`, `h1`, `h2`, `h3`, `body`, `bodySmall`, `caption`), igual de
  centralizado que `themeColors` en `tokens.ts`.
- **Carga en móvil**: los `.ttf` en `apps/mobile/assets/fonts/`, cargados una
  vez con `useFonts` en `app/_layout.tsx` bajo los mismos nombres lógicos;
  `global.css` mapea `font-display`/`font-sans` de Tailwind a esos nombres
  (hoy no hay ningún `@theme` de fuente — se añade).
- **Cambiar la fuente de toda la app** después de esta fase: sustituir los
  `.ttf` y el valor en `fonts.ts`. Nada más.
- **Criterio de hecho**: un texto de prueba en cada nivel de `TYPE_SCALE` se ve
  con la fuente nueva en los dos temas, y `expo-doctor` sigue en verde.

## 6. Fase 1 — Tipografía y jerarquía (Title, Subtitle, Text)

**Estado: hecho (2026-09-06).** `refero_search_screens` (ios) — «Open»
(cabecera grande + subtítulo de una línea) y «MasterClass» (título + subtítulo
sobre lista) confirmaron el patrón título-y-apoyo; «Waterllama» mostró la
etiqueta de sección en versalitas trackeadas, que aquí se cubre componiendo
`Caption` con `className` en vez de un quinto componente (Regla 1 §5). Salida:
`components/ui/title.tsx` (tamaños `xl`/`lg`/`md` → `display`/`h1`/`h2` de
`TYPE_SCALE`, con `accessibilityRole="header"` y el tracking cerrado como
firma — solo en tamaños grandes), `subtitle.tsx` (fijo en `h3`), `text.tsx`
(`BodyText` con `weight` `regular`/`medium`, y `Caption`). Comparten el
cálculo de estilo en `lib/ui/type-style.ts` para no repetirlo cuatro veces.
Se sustituyeron los usos manuales de la Fase 0 en `WelcomeHeader` y
`BrandHeader` por estos componentes. Test de comportamiento
(`typography.test.tsx`): `Title` expone `accessibilityRole="header"`, los
cuatro renderizan su texto. `pnpm check` en verde.

- **Buscar**: `refero_search_screens` — «large headline mobile dashboard»,
  «section title with subtitle mobile» — para ver proporciones de salto entre
  niveles, no solo tamaño.
- **Variantes**: `Title` (tamaños `xl`/`lg`/`md`), `Subtitle`, `Body`,
  `Caption`, todas leyendo `TYPE_SCALE` de la fase 0. Sin prop de color: el
  color lo pone quien la usa con `className` (Regla 1, «sin envoltorios que
  solo renombran»).
- **Firma**: elegir **un** rasgo tipográfico distintivo para los títulos de
  sección (p. ej. un tracking negativo marcado o una variante numérica
  distinta) y usarlo en todas las pantallas — es la «firma» de Regla 9.

## 7. Fase 2 — Iconos

**Estado: hecho (2026-09-06).** `refero_search_screens` (ios) sobre iconos con
fondo y filas con icono no dio patrones nuevos que ya no estuvieran resueltos
en el propio repositorio: `TileHeader` (panel de inicio) ya tenía exactamente
este problema resuelto a mano (icono en pastilla teñida, con `hexAlpha` porque
`bg-primary/12` no se resuelve en nativo — Regla 3 §5), así que la Fase 2 fue
extraerlo a un componente reutilizable en vez de inventar uno desde cero
(Regla 1 §1). Salida: `components/ui/icon.tsx` — tamaños `sm`/`md`/`lg`, tono
(`default`/`primary`/`success`/`warning`/`destructive`/`accent`, los tokens
semánticos existentes), contenedor `none`/`soft` con forma `circle`/`square`.
Resuelve su propio color desde el tema (como ya hacían `ThemeToggle` y
`MoreMenuContent`), así que ninguna pantalla tiene que pasarle una paleta.
Decisión de accesibilidad (Regla 2): con `accessibilityLabel` se anuncia: sin
ella, se oculta del lector de pantalla (`accessibilityElementsHidden` +
`importantForAccessibility="no-hide-descendants"`) para no leerse dos veces
junto al texto que ya lo acompaña — es lo único de este componente que es
comportamiento y no estilo, así que es lo único que tiene test
(`icon.test.tsx`). `TileHeader` ahora usa `Icon` para sus tonos semánticos; su
caso `filled` (icono invertido sobre una tarjeta ya coloreada) se quedó fuera
a propósito — no es un tono, es una inversión por contexto, y forzarlo dentro
de `Icon` habría sido la bandera booleana que la Regla 1 §5 dice que no hay
que perseguir. `pnpm check` en verde.

- **Buscar**: `refero_search_screens` — «icon buttons with background»,
  «feature icon rounded square» — para variantes de contenedor (circular,
  cuadrado redondeado, solo trazo).
- **Variantes**: tamaños (`sm`/`md`/`lg`), con/sin fondo (`bg-muted`,
  `bg-primary/10`…), tono (`default`/`primary`/`destructive`/`success`/
  `warning`, usando los tokens y no colores sueltos).
- **Origen de los iconos**: Ionicons (ya en uso), revisando cada uno contra
  Regla 7 (nada de cruces ni parecidos).
- **Salida**: `components/ui/icon.tsx`, envoltorio fino que aplica tamaño y
  contenedor; el mapa nombre→icono de cada dominio (si aparece) va aparte,
  como los mapas de la web.

## 8. Fase 3 — Botones (ampliar `button.tsx`)

Hoy: `primary`/`secondary`/`ghost`/`destructive`, tamaños `sm`/`md`/`lg`.

**Estado: hecho (2026-09-06).** `refero_search_screens` (ios) sobre pares de
botón, FAB e icon-only no dio un patrón nuevo que aplique aquí: los CTA de
Comet/LEGO Builder confirman el pill/full-width que `Button` ya hacía, y los
FAB de Bear/Notion/Andante son todos de **una acción global de "crear"** — hoy
ningún flujo de la app tiene esa acción (una búsqueda de texto sobre
`FAB`/`floating action` en `apps/mobile/src` no encontró nada), así que,
siguiendo la propia Regla 1 punto 5, el FAB **no se construye todavía**: se
decide el día que un flujo real lo pida, no antes. Salida:

- **`button.tsx`** ampliado con variantes `outline` (borde `border-input`,
  sin relleno) y `link` (solo texto, subrayado, sin contenedor) — mismos
  `BUTTON_CONTAINERS`/`BUTTON_LABELS` para las seis variantes. Añadido
  `leadingIcon`/`trailingIcon` (nombre de Ionicon): el icono es decorativo y
  se oculta del lector de pantalla porque `title` ya dice lo mismo — la
  etiqueta accesible del botón ahora la fija `accessibilityLabel={title}` en
  vez de dejar que se infiera del texto visible, porque con un icono al lado
  RNTL (y VoiceOver/TalkBack) ya no la calculan igual con un solo `Text`.
- **`icon-button.tsx`** (nuevo): botón solo icono. `accessibilityLabel` es
  obligatorio en el tipo — sin texto al lado, no hay otra forma de anunciarlo
  (Regla 2). El área táctil es **siempre** de 44 px vía `hitSlop`, aunque la
  caja visible (`sm` = 32 px) sea menor: crece el hueco de toque, no el icono
  — es justo lo que pedía el plan, y hay un test que lo comprueba.
- **`lib/ui/button-variants.ts`** (nuevo): los mapas de variante compartidos
  por los dos componentes (Regla 6: el fichero de un componente no debía
  crecer con un sexto mapa). Incluye `BUTTON_ICON_TONE`, que dice qué clave de
  `themeColorsHex` da el color de un icono dentro de cada variante — tiene que
  coincidir con el `text-*` de `BUTTON_LABELS` para esa misma variante.
- **`packages/theme/src/tokens.ts`**: le faltaban los `-foreground` en
  hexadecimal de `secondary`, `accent`, `destructive`, `success` y `warning`
  (nadie los había necesitado: llegaba con la clase de Tailwind). Un icono
  dentro de un botón `destructive`/`secondary` sí necesita el hex — Regla 3
  §6 dice que los dos ficheros van a la par, así que se completó el mirror con
  la misma conversión oklch→sRGB que ya usaban los demás valores (verificada
  reproduciendo los cuatro hex existentes antes de fiarse de los nuevos).
- **Test** (`button.test.tsx`, `icon-button.test.tsx`, ninguno existía antes):
  `onPress` se dispara al pulsar y no se dispara ni deshabilitado ni en
  `loading`; `loading` se anuncia como `busy`; el icono decorativo no tapa el
  nombre accesible; `IconButton` expone su etiqueta y amplía el `hitSlop`
  hasta 44 px en el tamaño pequeño.

`pnpm check` en verde (recompilado `packages/theme` antes del `typecheck` de
móvil, que resuelve ese paquete por su `dist`).

**Comprobación antes de seguir (2026-09-06, a petición explícita).** Antes de
tocar la Fase 4 se revisó si lo hecho en las fases 0-3 necesita retoque a la
luz de lo que piden las fases de búsqueda/calendario/filtros de abajo: no. El
recorte de icono decorativo (`Icon`), el botón solo-icono con área táctil de
44 px (`IconButton`) y las seis variantes de `Button` ya cubren lo que esas
referencias necesitan — el icono de limpiar de un campo de búsqueda, las
flechas de mes de un calendario, el par Cancelar/Aplicar de una hoja de
filtros — sin ampliar nada. Se reutilizan tal cual en las fases que siguen.

## 9. Fase 4 — Campos de texto (ampliar `text-field.tsx`)

**Estado: hecho (2026-09-06).** `TextField` gana foco visible (borde de color
en vez de un `ring-*` que en nativo no existe — Regla 3 punto 6, con el ancho
del borde fijo en `border-2` para que marcar el foco no desplace nada), error
con icono además del texto (`Icon` tono `destructive`, Regla 3 §7), y dos
huecos `leadingIcon`/`trailingIcon` genéricos para que las variantes no
reimplementen el campo. Sobre esos huecos:

- **`PasswordField`** (nuevo) — el icono de mostrar/ocultar reutiliza las
  claves `auth.showPassword`/`auth.hidePassword` que ya existían (Regla 1: se
  buscó antes de traducir de nuevo) y el botón es un `IconButton` de la Fase 3.
- **`SearchField`** (nuevo) — lupa fija y decorativa (`Icon`, sin
  `accessibilityLabel`: se oculta sola del lector de pantalla) y botón de
  limpiar (`IconButton`) que solo aparece con texto escrito. Completamente
  controlado (`value`/`onChangeText`), como conviene a un campo que
  normalmente dispara una búsqueda en vivo. Hizo falta una clave nueva,
  `common.clearSearch` (en los seis idiomas), porque no había ninguna genérica
  para «vaciar este campo» distinta de `common.delete` (que es destructivo, no
  esto).
- **Multilínea**: no se creó un `Textarea` aparte — habría sido justo el
  envoltorio de una línea que prohíbe la Regla 1 punto 4, porque no cambia
  nada más que el prop `multiline` que `TextField` ya reenvía a `TextInput`.

**Descartado**: `Textarea` como componente propio (ver arriba) y un icono
dedicado para el estado de error más allá del genérico `alert-circle` de
`Icon` (no hacía falta uno nuevo).

`pnpm check` en verde. Al tocar `packages/i18n/src/locales/*.ts` hizo falta
`pnpm --filter @navis/i18n build` antes de que el test de `SearchField` viera
la clave nueva — la misma trampa de resolución por `dist` que ya había mordido
con `packages/theme` en la Fase 3, ahora anotada en `CLAUDE.md`.

- **Buscar**: `refero_search_screens` — «search bar with recent searches
  mobile» (1Password: campo + recientes + botón añadir; Monday.com: campo +
  icono de filtro + alternar archivados; Target: campo + tabs + recientes;
  Figma: estado vacío «sin búsquedas recientes»; Spotify: recientes + borrar
  historial) — más «password field with toggle», «OTP code input», «multiline
  note field» para el resto de variantes.
- **Variantes**: texto simple (ya existe, revisar estados de error/ayuda),
  contraseña (icono de mostrar/ocultar), **búsqueda** (icono de lupa fijo a la
  izquierda, botón de limpiar que solo aparece con texto escrito — reutiliza
  `IconButton` de la Fase 3 en vez de montar un `Pressable` a mano), multilínea
  (`Textarea`), y si algún RFC ya usa PIN/OTP, ese patrón.
- **Estados transversales**: reposo, foco (`focus-visible:ring-2`, Regla 3),
  error (borde + texto + icono, nunca solo color — Regla 3 punto 7), deshabilitado.

## 10. Fase 5 — Selectores

- **Buscar**: `refero_search_screens` — «segmented control mobile», «dropdown
  select bottom sheet», «slider range mobile», más una tanda específica de
  calendario/rango de fechas: **Airbnb** (hoja inferior para cambiar entre
  vista Año/Mes/Lista, con radio), **Napper** (rango morado resaltado en la
  cuadrícula, acciones «Pick dates»/«Back»), **Superlist** (hoja con atajos de
  fecha, cuadrícula del mes y filas de hora/recordatorio/repetición — muy
  cercano a lo que pediría el RFC 0018 de tareas), **Revolut** (botón «Hoy»
  para saltar al día actual sin salir del modal), **Wise** y **TikTok**
  (atajos tipo `chip` + fechas de inicio/fin manuales + rango resaltado en la
  cuadrícula + botón «Actualizar»).
- **Variantes**: `Select` (abre un `bottom sheet` con la lista, patrón ya
  investigado en `docs/referencias-app-movil.md` §1 como «contenedor
  dominante»), `SegmentedControl` (2-4 opciones visibles, como el que ya usa
  una referencia de la fase de navegación), `DatePicker` (hoja inferior con
  cuadrícula del mes, navegación de mes con `IconButton` y atajo «Hoy»),
  `DateRangePicker` (mismo patrón + selección de dos fechas resaltando el
  tramo entre ellas + atajos «Hoy»/«Esta semana»/«Este mes» como fila de
  `Chip` — el de la Fase 13 §18.1, necesarios también para la pantalla de
  filtros de la Fase 7).
- Antes de construir el de fecha: `search_graph` sobre «date picker» /
  «calendar» — el RFC 0002 (calendario) puede ya tener uno que solo haga falta
  extraer a `components/ui`.

## 11. Fase 6 — Checkbox, radio y switches

- **Buscar**: `refero_search_screens` — «checkbox list settings», «radio
  button selection card», «toggle switch settings list».
- **Variantes**: `Checkbox` suelto y en lista con etiqueta a la derecha;
  `RadioGroup` (contenedor que gestiona la selección única, cada opción con
  o sin descripción); `Switch` para ajustes on/off. Los tres del mismo alto de
  fila para poder combinarse en una lista de ajustes.
- Área táctil 44 px alrededor del control aunque el dibujo sea menor
  (Regla 5 punto 4).

## 12. Fase 7 — Formularios (composición, no un componente nuevo)

- **Buscar**: `refero_search_flows` — «multi step form mobile», «settings form
  with validation» — para ver dónde se muestra el error (inline vs. resumen) y
  cómo se agrupan campos relacionados. Para la pantalla de filtros en
  concreto: **Asana** (hoja «Time Periods» con casillas jerárquicas por año
  fiscal y un «Clear»), **Shopify** («Manage filters»: filas
  columna/condición/valor, añadir/quitar fila, Cancelar/Aplicar) y
  **Monday.com** («Advanced Filters»: mismas filas, con una hoja inferior para
  elegir la columna).
- **Salida**: `FormField` (etiqueta + control + texto de ayuda/error, envuelve
  cualquier input de las fases 4-6 sin duplicar su lógica); si aparece un
  flujo de varios pasos, un `Stepper` de progreso (puntos o barra); y
  **`FilterSheet`**, la composición que pedía esta sesión para un listado con
  filtros — hoja inferior con `SearchField` (Fase 4), `DateRangePicker` (Fase
  5), `Checkbox`/`RadioGroup` (Fase 6) por sección, y el par
  Cancelar/Aplicar con `Button` (ya en la Fase 3, variantes `outline`/
  `primary`). No es un componente nuevo de verdad: es el orden en que se
  colocan los que ya existen, como el resto de esta fase.
- Esta fase depende de que 4, 5 y 6 estén hechas: es la que los combina.

## 13. Fase 8 — Barras de navegación

Ya hay una implementación (RFC de navegación móvil); esta fase es ampliar
variantes reutilizables, no repetir ese trabajo.

- **Buscar**: ya investigado en `docs/referencias-app-movil.md` — reutilizar
  esas referencias (pill deslizante, bottom sheet escalonado) antes de buscar
  otras nuevas. Si falta algo puntual (p. ej. una cabecera con acción a la
  derecha), una búsqueda dirigida: «top app bar with action button mobile».
- **Variantes**: `TopBar` (título solo / título + acción / con botón atrás),
  para las pantallas que hoy improvisan su cabecera.

## 14. Fase 9 — Tarjetas de contenido (ampliar `card.tsx`)

- **Buscar**: `refero_search_screens` — «list item card with icon», «settings
  card with chevron», «content card with image and tag».
- **Variantes**: tarjeta simple (ya existe), tarjeta-fila para listados
  (icono/avatar + título + subtítulo + `chevron`, para no repetir la fila a
  mano en cada listado), tarjeta con etiqueta/estado (`Badge` de la Fase 13
  §18.1, nunca solo color — Regla 3 punto 7).

## 15. Fase 10 — Tarjetas de estadística y números

- **Buscar**: ya adelantado en esta sesión — **Dock** y **Copilot** (stat cards
  compactas, número grande + etiqueta + variación pequeña) y **GO Club** /
  **Checker** (número muy grande como protagonista único de la tarjeta, con
  progreso en cuadrícula). `refero_get_similar_screens` sobre alguno de esos
  screen IDs para ampliar el set antes de decidir.
- **Variantes**: `StatCard` (número + etiqueta + icono opcional + indicador de
  cambio ↑/↓ con color `success`/`destructive` y texto, no solo color),
  `NumberCard` (número como protagonista, para el panel de inicio o un
  contador de racha — el vocabulario de «sonda» ya mencionado en `CLAUDE.md`
  para creyentes encaja aquí como firma visual).

## 16. Fase 11 — Gráficas

- **Buscar**: `refero_search_screens` — «line chart card mobile», «bar chart
  stats card», «donut chart progress mobile». Las referencias de la fase 10
  (Dock, Copilot, Plane Finder) ya traen gráficas de barras/líneas dentro de
  tarjeta: reusar esa investigación.
- **Decisión pendiente en esta fase**: qué librería de gráficas para React
  Native (evaluar `react-native-gifted-charts` o `victory-native` contra el
  peso del bundle y compatibilidad con Expo 57/Reanimated — la web usa
  `recharts` detrás de `React.lazy`, Regla 1, pero ese paquete es de DOM y no
  sirve en móvil).
- **Variantes**: línea, barras, donut/progreso circular, sparkline (mini
  gráfica sin ejes para meter dentro de un `StatCard`).

## 17. Fase 12 — Carruseles

- **Buscar**: `refero_search_screens` — «horizontal card carousel mobile»,
  «onboarding carousel with dots», «featured story carousel». La referencia
  «Ground News» de esta sesión ya muestra un carrusel de artículos destacados
  dentro de un feed, útil como punto de partida.
- **Variantes**: carrusel de tarjetas (snap por tarjeta, `FlatList` horizontal
  — Regla 5 punto 5, nunca `ScrollView` con `map`), indicador de página
  (puntos), y si hace falta para onboarding, autoplay con pausa al tocar.

## 18. Fase 13 — Complementarios (lo que falta para que el set esté completo)

Catch-all deliberado: aquí van piezas pequeñas que no merecen fase propia pero
que las fases anteriores van a necesitar. **`Badge`/`Chip` va primero y con
más detalle** (pedido explícito de esta sesión, 2026-09-06): varias fases de
más arriba ya lo daban por hecho sin que existiera — los atajos de fecha de
la Fase 5 y las casillas de la Fase 7 son `Chip` sin nombrar.

### 18.1 Etiquetas: `Badge` (estado, no interactivo) y `Chip` (seleccionable)

Son dos cosas distintas aunque se parezcan, y Refero lo confirma:

- **`Badge`** — pastilla de estado que **no se toca**: «Imported» (Mailchimp),
  el estado de una tarea (Notion, Asana), el promocional de una tarjeta (Uber
  Eats). Ya existe en la web (`apps/web/src/components/ui/badge.tsx`): cuatro
  variantes de token (`brand`/`accent`/`muted`/`outline`), sin lógica —
  directamente portable, cambiando `span`+`HTMLAttributes` por `View`+`Text`.
- **`Chip`** — se toca: pastillas de género que se marcan/desmarcan con
  «Clear»/«Show results» (ElevenReader), tags de clase/fuente que se
  añaden y quitan con una X (Plane Finder), filtros activos removibles
  (Matter). Es el `Chip` que ya pedían sin nombrarlo la Fase 5 (atajos
  «Hoy»/«Esta semana») y la Fase 7 (`FilterSheet`).
- **Ya existe en la web algo más específico**: `apps/web/src/components/
tasks/tag-chip.tsx`, la etiqueta de una tarea/creyente con su propio color
  (no uno de los cuatro tokens fijos). Usa `color-mix()` en CSS — no existe en
  nativo. El equivalente en móvil es `hexAlpha` (`lib/color.ts`, ya en uso en
  `TileHeader` e `Icon`) para conseguir el mismo «borde al 35%, fondo al 14%,
  texto al 100%» a partir del hexadecimal de la etiqueta. **No se resuelve en
  esta fase**: ese color por etiqueta pertenece a cuando móvil implemente de
  verdad las tareas/creyentes con etiquetas (RFC 0018), no al componente base.
  Aquí solo se deja `Chip` preparado para aceptar un color por prop, además de
  los tonos semánticos.
- **Variantes**: `Badge` (tono semántico, con o sin icono delante — reutiliza
  `Icon` tamaño `sm`); `Chip` (seleccionado/no seleccionado, con `x` para
  quitar o sin ella, tono semántico o color propio vía `hexAlpha`). Los dos
  del mismo alto para poder mezclarse en una fila.

### 18.2 El resto

- **Buscar** (una tanda por grupo, no todo junto): «empty state illustration
  card», «bottom sheet action menu», «toast notification mobile», «skeleton
  loading list».
- **Piezas**: `EmptyState` (icono + título + acción, ya hay un patrón
  parecido en pantallas puente — mirar `PlaceholderScreen` antes de crear uno
  nuevo, Regla 1), `Avatar`, `BottomSheet` genérico (si las fases 5 y 8 no
  dejaron ya uno reutilizable — comprobar antes de duplicar), skeleton de
  carga (usar `opacity`/`transform`, nunca parpadeo de color plano que no
  respeta Regla 9 punto 5).

## 19. Orden y dependencias

```
Fase 0 (fuente) ─┬─▶ Fase 1 (tipografía)
                 ├─▶ Fase 2 (iconos) ─┬─▶ Fase 3 (botones)
                 │                    ├─▶ Fase 9 (cards)
                 │                    └─▶ Fase 10 (stat cards) ─▶ Fase 11 (gráficas)
                 ├─▶ Fase 4 (inputs) ─┬─▶ Fase 7 (formularios)
                 ├─▶ Fase 5 (selectores) ─┘
                 ├─▶ Fase 6 (checkbox/radio) ─┘
                 ├─▶ Fase 8 (nav) [ya arrancada, solo variantes]
                 ├─▶ Fase 12 (carruseles)
                 └─▶ Fase 13 (complementarios) [al final, tapa huecos]
```

No hace falta seguir el orden a rajatabla, pero **la fase 0 va siempre
primero**: cualquier componente con texto la usa.

## 20. Cómo se ejecuta cada fase

Una fase = un mensaje/sesión: «vamos con la fase 3, botones» dispara los pasos
del punto 4 para ese componente. No se hacen dos fases en paralelo en la misma
sesión — es lo que pediste al decir «un componente a la vez»— y cada fase deja
en este documento, debajo de su sección, una línea de **Estado** con la fecha
y qué se tomó de Refero, igual que hace `docs/navegacion-movil-plan.md` con
sus hallazgos.

Antes de dar una fase por cerrada: `pnpm check`, mirar el componente en el
emulador en claro/oscuro con `de.ts` activo, y `pnpm --filter @navis/mobile
exec expo-doctor` si se tocó una dependencia nueva (una librería de gráficas,
por ejemplo).

---

## Notas

- Este documento es el equivalente de `docs/navegacion-movil-plan.md` pero
  para componentes en vez de navegación; sigue su mismo formato para que se
  lean igual.
- Los ejemplos de Refero citados arriba (Perplexity, ChatGPT, Dock, Copilot,
  GO Club, Checker, Ground News) son los que salieron en la investigación
  inicial de esta sesión (2026-09-06) para validar el enfoque; cada fase
  vuelve a buscar con términos más específicos de su componente antes de
  decidir nada.
