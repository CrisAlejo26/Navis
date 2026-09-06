# Referencias para la app móvil de Navis (2026)

Referencias recopiladas en internet para rediseñar la app móvil con un enfoque
**moderno, dinámico y con animaciones**, en un estilo **bold y vibrante**.
Investigación hecha el 30 de agosto de 2026.

Áreas cubiertas: look & feel general, navegación móvil, dashboard/inicio,
listados, formularios y microinteracciones, onboarding/marca, librerías para el
stack (Expo) y galerías de pantallas de apps reales.

---

## Contexto y restricciones de Navis (leer antes)

- La app móvil es **Expo 57 + expo-router + NativeWind 5** (`apps/mobile/`).
- La **marca ya está decidida** y manda sobre cualquier sugerencia: el azul de
  marca es `#2140cf` (`--brand`) y el azul de interfaz es el mismo azul
  (`--primary`, en claro exactamente `#2140cf`). El acento es cálido (`--accent`,
  ocre). Los tokens viven en `packages/theme/src/tokens.css` y **no se sustituyen**
  con colores de estas referencias: se toman patrones, jerarquía, UX, accesibilidad
  y motion (Regla 3).
- **Nada de cruces** en iconos ni elementos decorativos (Regla 7).
- La **sidebar web** (`apps/web/src/lib/nav.ts`) tiene 13 entradas:
  - **General**: Panel, Profecías, Sueños, Enseñanzas.
  - **Iglesia**: Calendario, Listas, Tablas, Creyentes, Cuaderno, Tareas,
    Comunicaciones, Usuarios.
  - **Sin bloque**: Ajustes.
- La app móvil hoy usa **5 pestañas** (Inicio, Calendario, Creyentes, Más,
  Ajustes) y agrupa profecías/sueños/enseñanzas/comunicaciones en «Más»
  (`apps/mobile/app/(tabs)/_layout.tsx`).
- Regla de navegación de la skill ui-ux-pro-max: **barra inferior ≤ 5 pestañas**.

---

## 1. Look & feel general (bold & vibrante)

- **Top Mobile App UI/UX Design Trends 2026 — zealousys**
  https://zealousys.com/blog/top-mobile-app-ui-ux-design-trends/
  Accionable: microinteracciones **propositivas** (no decorativas), profundidad
  espacial (layering + sombras + elevación = jerarquía), diseño thumb-friendly,
  dark mode como sistema independiente (no inversión del claro), motion 3D
  expresivo solo en momentos con valor emocional, y **60fps duro** con fallback
  en dispositivos bajos.
- **7 Mobile UI Patterns 2026 — Muzli**
  https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/
  Claves: **bottom-sheet como contenedor dominante** para contenido secundario,
  capas espaciales (elevación: sombra + escala + blur), **haptic como capa de
  feedback** («lo sentí funcionar»), y el consejo de coger solo 2-3 patrones y
  ejecutarlos con precisión.
- **Mobile UX/UI trends 2026: design that sells — GMI Software**
  https://gmi.software/blog/mobile-app-design-trends
  Habla explícitamente del stack: **React Native Reanimated + Hermes + haptics**,
  y del _motion budget_: la animación confirma la acción, no disimula lentitud.
  En 2026 RN con Expo apenas se distingue de una app nativa.
- **Neo-brutalist Mobile App UI Design 2026 — Design Signal**
  https://designsignal.ai/articles/neo-brutalist-mobile-app-design
  No llevarlo entero (demasiado agresivo para una herramienta de iglesia), pero
  robar su energía:
  - **Tipografía grande y segura** (headings 36-52px en móvil).
  - **Bloques de color planos** con bordes de 2px y paletas restringidas (3-5
    colores; uno dominante, un acento, negro/azul para borde y texto).
  - **Botón con offset shadow**: la sombra sólida se desplaza 4-6px en diagonal
    y colapsa en ~80ms al pulsar, con spring al soltar. Directamente
    implementable con Reanimated.
  - Transiciones de página duras (slide horizontal o flash de color) en vez de
    fundidos.
- **12 Mobile App UI/UX Design Trends 2026 — The Brands Bureau**
  https://thebrandsbureau.com/mobile-app-design-trends-2026/
  Colores bold + vibrantes, microinteracciones, neumorfismo selectivo, glassmorphism.
- **13 Mobile App UI/UX Design Trends 2026 — Design Studio**
  https://www.designstudiouiux.com/blog/mobile-app-ui-ux-design-trends/
  Tabla de adopción/complejidad/riesgo por tendencia: flat, neumorfismo,
  glassmorphism, dark mode, layouts asimétricos, bottom navigation.
- **Beyond the Glass: 7 Mobile UI Trends — Abdul Aziz Ahwan**
  https://www.abdulazizahwan.com/2026/02/beyond-the-glass-7-mobile-ui-trends-defining-2026.html
  Bento grids, microinteracciones **emocionales** (deleting con «pop», confeti
  al completar + haptic), ambient mode (dark con matices de color, no negro puro).
- **Mobile App UI/UX Design Trends 2026 — Digital Pilots**
  https://digitalpilots.in/blog/mobile-app-ui-ux-design-trends-2026/
  Glassmorphism para profundidad sin perder jerarquía.

---

## 2. Navegación móvil (espejo de la sidebar web)

Referencias para hacer la barra inferior moderna y animada, manteniendo el
espejo con las 13 entradas de la web:

- **Linear Tab Bar (React Native Motion)** — código Reanimated completo
  https://rnmotion.dev/animations/linear-tab-bar
  Una pill de cristal que se estira al arrastrar, un **glow radial que sigue el
  dedo**, y que **se convierte en un menú escalonado al arrastrar hacia arriba**.
  Patrón ideal para Navis: la pestaña central podría desplegar el resto de
  entradas de la sidebar (calendarios, listas, tablas, cuaderno, tareas,
  usuarios). Estándares de timing incluidos (40ms de stagger al abrir, 10ms al
  cerrar).
- **Liquid Glass Navbar para Expo / React Native**
  https://github.com/OmarShayya/Liquid-Glass-Navbar-React-Native-Expo
  Barra iOS 26 «Liquid Glass» real (via `expo-router` `NativeTabs`) y versión
  gesture-driven con pill elástica, tint tipo Telegram que sigue la pill,
  scroll-to-minimize y haptics al cruzar pestañas. Iconos animables con
  `progress` (0→1) para que reaccionen al seleccionarse. Nota: el cristal
  nativo solo se ve en iOS 26 con Xcode 26; el resto cae a blur estándar.
- **Dribbble — Tab Bar Animation (Purrweb)**
  https://dribbble.com/shots/10827165-Tab-Bar-Animation
- **Dribbble — Heartbeat Tab Bar (tubik)**
  https://dribbble.com/shots/6196299-Heartbeat-Tab-Bar-Animation
- **Dribbble — Tab Bar Animation Dark Version**
  https://dribbble.com/shots/17159039--Tab-Bar-Animation-Dark-Version
- **30 Animated Navigation / Tab Bar Designs (inspiración)**
  https://www.mockplus.com/resource/post/30-best-animated-navigation-bar-or-tab-bar-designs-for-inspiration

---

## 3. Dashboard / inicio

- **Bento Grid Design: The 2026 UI Layout Playbook — Brainy**
  https://brainy.ink/paper/bento-grid-design
  La guía más completa. Regla clave para móvil: **no encoger el grid, re-fluir a
  una columna reordenada por importancia** (la métrica principal arriba). 4-8
  celdas; una celda hero; rejillas de 3 o 4 columnas en escritorio. Restraint en
  color: la mayoría de celdas comparten fondo, 1-2 se invierten o usan acento.
- **Bento Grid Layout: A Modular Approach — Peterdraw**
  https://peterdraw.studio/blog/bento-grid-layou
  Bento en dashboards y apps móviles; microinteracciones y animación para que la
  rejilla «se sienta viva».
- **Bento 39 — Analytics dashboard bento with charts (Shadcnblocks)**
  https://www.shadcnblocks.com/block/bento39
  Ejemplo visual: **barras que crecen en scroll, anillos de progreso que se
  dibujan con gradiente, contadores que cuentan hacia arriba**, tiles con estado
  «dashboard-en-una-tarjeta».
- **Bento 10 — Analytics bento (Shadcnblocks)**
  https://www.shadcnblocks.com/block/bento10
  Barras verticales animadas con stagger, tono fintech/productividad.
- **Animated Bento Dashboard Hero — Aura**
  https://www.aura.build/component/E89ECD
  Hero de bento con métricas animadas y toggle interactivo.

Encaja con el RFC 0001 (panel de métricas): tarjeta hero con la métrica
principal, contadores animados, y el tile de la iglesia activa usando los tintes
`--church-*`.

---

## 4. Listados (entrada en cascada + acciones)

- **React Native Stagger (@animatereactnative/stagger)** — componente Reanimated
  https://github.com/animate-react-native/stagger
  Entrada/escalonada de filas (stagger 40-50ms, duración ~300ms) con layout
  animations de Reanimated. Funciona con Expo.
- **ReanimatedSwipeable — React Native Gesture Handler (oficial)**
  https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/
  El estándar de swipe row reescrito con Reanimated.
- **expo-ios-like-swipe-actions — rit3zh**
  https://github.com/rit3zh/expo-ios-like-swipe-actions
  Swipe tipo iOS con haptics en reveal y commit, full-swipe commit, API compuesta
  con Reanimated 4 + Gesture Handler 2.
- **Telegram Swipe Actions — Motionary**
  https://motionary.dev/animations/telegram-swipe-actions
  **Los botones de acción entran en cascada a medida que la fila se desplaza**,
  el botón del borde se estira en pill al sobrearrastrar, y solo una fila queda
  abierta a la vez. Todo en el hilo de UI, funciona en Expo Go.

---

## 5. Formularios y microinteracciones

- **Dead forms, live forms — Ruixen UI** (el mejor recurso)
  https://ruixen.com/blog/dead-forms-live-forms
  Sustituir cada transición CSS por **springs**:
  - Focus ring que crece con overshoot (ripple).
  - **Error con shake físico de amplitud decreciente** (`-8, 6, -4, 2, 0`) +
    sonido tick.
  - Labels flotantes con momentum (spring stiffness ~300, damping ~25).
  - Botón de submit con estados: idle → loading (respira con spring) → éxito
    (checkmark + celebración) → error (shake). Cada transición con un spring
    distinto (stiff para press, suave para éxito, duro para error).
- **Animated Form Inputs with Floating Labels — Animation Patterns**
  https://animationpatterns.art/animations/animated-form-inputs/
  Tres variantes: outlined notch, underline slide (barra que se engrosa en
  focus), glow border (halo con gradiente). Validación con `:user-invalid`
  (solo tras tocar el campo). **Regla de oro: el label debe ser un `<label>`
  real asociado al input** — el placeholder nunca sustituye a la instrucción.
- **Forms & Input Animation Principles — Animation Principles (skill)**
  https://skillselion.com/skills/dylantarre/animation-principles/forms-inputs
  Tabla de timing lista para usar:
  - Focus border: 100-150ms · Label float: 150-200ms · Validación: 200ms ·
    Error shake: 300ms (3-4 ciclos, 4-6px) · Success check: 250ms · Toggle: 150ms.
  - Easing: focus `ease-out`, validación `ease-in-out`, label
    `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Ultimate Guide to Microinteractions in Forms — UXPin**
  https://www.uxpin.com/studio/blog/ultimate-guide-to-microinteractions-in-forms/
  Validación en tiempo real reduce errores ~22-30%; feedback en **capas**
  (color + icono + texto); checkmark animado y estados del botón; respetar
  `prefers-reduced-motion`.
- **Responsive Floating Label for Mobile (iOS zoom) — CodeFronts**
  https://codefronts.com/components/css-floating-label-inputs/responsive-floating-label-for-mobile-no-ios-zoom/
  Cuidados específicos móviles: input ≥16px para que iOS no haga zoom,
  touch targets ≥48px, y que el label flotante nunca pise el texto en 320px.

---

## 6. Onboarding / marca

- **7 App Onboarding Trends for 2026 — ScreensDesign**
  https://screensdesign.com/articles/app-onboarding-trends-2026/
  El onboarding pasa de explicar a **mostrar el resultado antes de explicar**:
  pregunta de alto valor → consecuencia visible → personalización → prueba
  contextual → permisos como elección → **rehearsal** (el usuario hace la tarea
  real en un entorno seguro) → compromiso tras continuidad.
- **7 Onboarding Screen Design Patterns Used by Top Apps in 2026 — Gummble**
  https://gummble.com/blog/top-onboarding-screen-designs
  Patrones: progressive disclosure, value-first, preguntas de personalización,
  walkthrough animado, social proof, permission priming, checklist.
  Reglas compartidas de los mejores flujos: **3-5 pantallas máximo**, propuesta
  de valor por paso, indicador de progreso visible, **botón «Skip» siempre
  visible**, pulido visual consistente.
  Ejemplos citados: Duolingo (aprender haciendo), Revolut (card-flip), Arc
  Search (intro animada <30s), Slack (progressive disclosure con prompts
  contextuales), Notion (loops embebidos).
- **Top Welcome Screens — Reactscript** (kit Expo directamente reutilizable)
  https://reactscript.com/top-welcome-screens/
  10 pantallas de bienvenida/onboarding animadas con **Reanimated para Expo
  Router** (Duolingo, Strava, MyFitnessPal, Perplexity, Yazio…), con
  reduced-motion, estados deterministas y splash nativo hasta que cargan
  fuentes/imágenes.
- **12 Best App Onboarding Video Examples in 2026 — Vidico**
  https://vidico.com/news/best-app-onboarding-video-examples/
  Loops animados <5s, beneficios antes que features, cascada sobre tutoriales.
- **Daze Intro Animation — 60fps.design**
  https://60fps.design/shots/daze-intro-animation
  Ejemplo de secuencia intro con parallax, fondo de marca y elementos que
  aparecen en cascada.
- **Mobbin — flujos de onboarding reales**
  https://mobbin.com/explore/mobile/flows/onboarding
  Flujos de onboarding reales (Revolut, Uber, etc.) con capturas navegables.

---

## 7. Galerías de vistas de apps reales (páginas de screenshots)

Para ver cómo apps de verdad resuelven cada patrón, antes de copiar nada:

- **Mobbin** — la más grande: 600.000+ screens de 1.000+ apps (iOS/Android/web),
  flujos navegables, plugin de Figma, búsqueda por patrón/industria.
  https://mobbin.com/ · (onboarding: https://mobbin.com/explore/mobile/flows/onboarding)
- **Page Flows** — grabaciones de flujos completos anotadas (onboarding,
  checkout, login…). Screenlane se fusionó en esta marca (2024).
  https://pageflows.com/
- **Gummble** — alternativa curada (~1.500 apps iOS/web) a buen precio.
  https://gummble.com/
- **UI Sources** — gratuita, organizada por patrones (iOS + Android).
  https://uisources.com/
- **Refero** — búsqueda visual con IA, orientada a web/SaaS + iOS.
  https://refero.design/
- **Dribbble** — shots de diseño de UI (tab bars animadas, dashboards, etc.).
  https://dribbble.com/
- **Behance** — portafolios completos y sistemas de diseño.
  https://www.behance.net/
- **Lookup.design** — solo web/marketing; útil para páginas de aterrizaje.
  https://lookup.design/
- **Figma Community** — kits de UI gratuitos/de pago para experimentar.
  https://www.figma.com/community

Comparativa de alternativas a Mobbin: https://gummble.com/blog/best-mobbin-alternatives-2026

---

## 8. Librerías para el stack (Expo 57 + React Native)

| Librería                       | Para qué                                                               | Estado                                                                          |
| ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `react-native-reanimated`      | Springs, layout animations, `useAnimatedStyle`, gestures en hilo de UI | Ya en el proyecto                                                               |
| `react-native-gesture-handler` | Swipe, drag, gestos compuestos (`ReanimatedSwipeable`)                 | Ya en el proyecto                                                               |
| `expo-haptics`                 | El «lo sentí funcionar»: haptic en reveal de swipe, success, error     | Añadir                                                                          |
| `@animatereactnative/stagger`  | Entrada en cascada de listas                                           | Opcional                                                                        |
| `expo-liquid-glass-tabs`       | Barra Liquid Glass iOS 26 + pill gesture-driven                        | Opcional (el cristal nativo requiere build con Xcode 26; cae a blur en Expo Go) |
| `lottie-react-native`          | Animaciones vectoriales embebidas                                      | Opcional                                                                        |

Todo lo de Reanimated/Gesture Handler funciona en **Expo Go** salvo los efectos
que requieren build nativo (p. ej. Liquid Glass real).

---

## 9. Síntesis: propuesta de dirección para Navis

1. **Dashboard** (`(tabs)/index.tsx`): bento con hero card (métrica principal),
   contadores animados que cuentan al entrar, y el tile de iglesia activa con su
   `--church-*`. Marca: azul `--primary` + acento ocre `--accent`.
2. **Tab bar** (`(tabs)/_layout.tsx`): mantener ≤5 pestañas; usar una pill
   animada (patrón Linear) o gesture-driven (Liquid Glass) que **despliegue en
   un menú escalonado el resto de entradas de la sidebar** (calendarios, listas,
   tablas, cuaderno, tareas, usuarios). Iconos que reaccionan al seleccionarse.
3. **Listados**: stagger de entrada (40-50ms) + swipe actions con haptics
   (patrón Telegram/Motionary) para creyentes, notas, tareas.
4. **Formularios**: springs en focus (ring con overshoot), shake físico en
   error, labels flotantes con momentum, botón con estados
   idle→loading→success/error. Timing de la tabla de la §5.
5. **Onboarding** (`(auth)/login`/`register` + marca): 3-4 pantallas con el azul
   de marca (`--brand`) de fondo, indicador de progreso, «Skip» visible, y un
   momento de celebración (confeti + haptic) al terminar.
6. **En todas partes**: dark mode como sistema independiente (ya tienes
   `--dark-*`), respetar `prefers-reduced-motion`, touch targets ≥48px, y haptics
   solo en momentos con significado.

---

## Notas

- Fechas de los artículos: 2026 (tendencias vigentes a agosto 2026).
- «Regla 3», «Regla 7»… se refieren a las reglas del proyecto en
  `.claude/rules/` (ver CLAUDE.md).
- Fuentes de la investigación original: búsquedas web (tendencias 2026,
  navegación, bento/dashboard, listados, formularios, onboarding, galerías) +
  base de diseño de la skill `ui-ux-pro-max` (que sugirió la dirección
  «Kinetic Brutalism»; se filtra a energía sin caer en lo agresivo).
