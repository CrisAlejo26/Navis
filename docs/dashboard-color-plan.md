# Rediseño del panel de inicio: color y homogeneidad de la primera fila

- **Tipo**: rediseño de interfaz (sin RFC nuevo — RFC 0001 sigue vigente,
  «Implementado»).
- **Apps afectadas**: web.
- **Motivo**: el panel de inicio (`/`) se ve descolorido frente a las portadas
  de Sueños y Profecías, y la fila de «Próximos eventos» / «Notas recientes»
  se percibe desfasada respecto a la tarjeta de estado que tiene al lado.

## 1. Objetivo y alcance

Entra:

- Dar a `StatusCard`, `EventsCard` y `NotesCard` el mismo lenguaje de color
  que ya usan `StatCard`/`stat-tones.ts` en Sueños y Profecías (RFC 0005
  §7.1): una tarjeta rellena por rejilla, acentos de verdad (≥12 % de tinte,
  nunca degradados que no se ven) y cada acento con su pareja `-foreground`.
- Unificar el **cascarón visual** de las cuatro «columnas» de la primera fila
  (Creyentes, Atención, Eventos, Notas) — mismo tratamiento de cabecera (icono
  en pastilla teñida), mismo filo superior de color, mismo pie con enlace —
  para que se lean como un solo instrumento de cuatro caras y no como dos
  familias de componente distintas puestas una al lado de la otra.
- Teñir por dato lo que hoy es neutro: el icono de cada nota reciente con el
  color de su tipo (ya existe esa paleta en `NOTE_STYLES`, se usa en
  `NotesCards` de la ficha de un creyente pero no aquí).

No entra:

- Tocar `WeekCalendar`, `CompositionSection` (`BucketBars`) ni `ActivityCard`:
  ya tienen color propio y con significado (sede en el calendario, acento por
  cubo, trazo `primary` de la estela). Repasados en la fase 1, no son el
  problema.
- Cambiar el endpoint `GET /api/v1/dashboard/summary` ni el modelo de datos:
  es puramente de interfaz.
- Mover Believers/Attention a cuatro tarjetas sueltas: la RFC 0001 (D-panel-4)
  ya rechazó explícitamente «cuatro cajas blancas idénticas» y ese argumento
  sigue siendo válido. Se mantiene el instrumento partido en dos, pero con
  color.

## 2. Diagnóstico (fase 1, con el código)

- La rejilla (`dashboard.tsx:29`) es correcta en su mecánica: `grid` estira
  por defecto los hijos a la altura de la fila, y tanto `StatusCard` como
  `EventsCard`/`NotesCard` fijan el enlace del pie con `mt-auto`. En escritorio
  (`lg`, 4 columnas: 2+1+1) las tres cajas **sí** miden lo mismo de alto. El
  «desfase» que se percibe no es un bug de grid — es que **no pesan igual**:
  `StatusCard` tiene un número grande (`text-3xl`) justo bajo la cabecera
  (`MetricCard`), mientras que `EventsCard`/`NotesCard` pasan directo a una
  lista sin nada que haga de ancla visual, y sus iconos de cabecera están en
  `text-muted-foreground` sin pastilla. El ojo las lee como un componente de
  «lista genérica» al lado de un «instrumento», no como cuatro caras de una
  misma cosa.
- El único color de la fila hoy es el filete de 3 px por evento
  (`accentVars(event.accent)` en `events-card.tsx:29`) — correcto y ya sigue
  el patrón de dato-primero, pero es sutil y no compensa que la cabecera y el
  resto de la tarjeta sean neutros.
- `StatusCard`/`MetricCard` no tienen ningún color: icono, número y enlace
  van en `text-muted-foreground` / `text-foreground` / `text-primary` (solo el
  enlace). Comparado con `StatGrid` de Sueños y Profecías —que desde la RFC
  0005 §7.1 usan `tone="filled"` en el ancla y `tone="accent"` en el resto—
  esta es la pieza que más se nota en blanco.
- `NotesCard` ya calcula `NOTE_STYLES[note.kind]` pero solo usa el icono, en
  gris; `NotesCards` (ficha de un creyente) sí tiñe icono, texto y borde
  izquierdo con `accentVars(accent)` — es el patrón a reutilizar, no a
  reinventar (Regla 1).

## 3. Hallazgos de la fase 2 (referencias externas)

- [Baymard — Dashboard cards must be highly consistent](https://baymard.com/blog/cards-dashboard-layout):
  confirma que la inconsistencia de tratamiento entre tarjetas vecinas —no
  solo de tamaño— es lo que más rompe la sensación de «panel». Se toma: dar a
  las cuatro caras el mismo cascarón (pastilla de icono, filo de color, pie
  con enlace) en vez de mezclar «tarjeta con número» y «tarjeta con lista».
- [sixtythirtyten — SaaS dashboard color palette (60-30-10 + semántico)](https://www.sixtythirtyten.co/blog/saas-dashboard-color-palette-css-tailwind):
  confirma limitarse a 3-4 acentos con lectura semántica en vez de un color
  por tarjeta sin motivo. Se toma: los mismos cuatro `STAT_ACCENTS` que ya usa
  el repositorio (`primary`, `success`, `accent`, `warning`), no una paleta
  nueva.
- [925 Studios — SaaS dashboard trends 2026](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)
  y [Muzli — 50 dashboard examples](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/):
  el patrón que repiten los paneles bien valorados es «un número ancla con
  relleno de color + el resto en acento suave», exactamente lo que ya hace
  `StatGrid` en este repositorio. Se toma como validación de reutilizar
  `stat-tones.ts` en vez de inventar un esquema nuevo para el panel de inicio.
- Qué se evita: ninguna de las referencias sugiere teñir el fondo de la
  página ni usar más de un acento «grande» por fila — coincide con la Regla
  9 y con RFC 0005 §7.1.4 («el lienzo se queda neutro»), así que el fondo de
  `<section>` no cambia.

## 4. Dirección de diseño

Mapa de acento por «cara» de la primera fila, usando los cuatro
`STAT_ACCENTS` que ya existen en `lib/stat-tones.ts` — ninguno nuevo:

| Cara             | Tono                    | Motivo                                                                                                                   |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Creyentes        | `filled` (`bg-primary`) | El ancla de la fila: cuántos somos. Una sola tarjeta rellena, la primera que se lee (RFC 0005 §7.1.2).                   |
| Piden atención   | `accent` con `warning`  | Es un aviso — coincide con `TriangleAlert` y con el uso de `warning` en el resto del proyecto para «hay que mirar esto». |
| Próximos eventos | `accent` con `primary`  | Calendario de púlpito: mismo azul que ya usa el propio calendario para lo programado.                                    |
| Notas recientes  | `accent` con `success`  | Escribir una nota es la acción que crece con el tiempo — mismo verde que «cumplidas» en Sueños/Profecías.                |

Tratamiento común a las cuatro caras (nuevo, hoy solo lo tiene `StatCard`):

- Icono en una **pastilla teñida** (`bg-<tono>/12` o `bg-<tono>` sólido en el
  caso `warning`, igual que `ACCENT_TONE` ya decide), no un icono suelto en
  gris.
- Un **filo superior de 3 px** con el color del tono (`border-t-[3px]
border-t-<tono>`), igual que `StatCard`.
- El pie con el enlace se queda como está (`mt-auto`, `text-primary`
  subrayado al pasar el ratón) — es ya el mismo patrón en las cuatro.

Con esto la fila entera —Creyentes | Atención | Eventos | Notas— comparte
cabecera, filo y pie, y la única diferencia real entre las cuatro es su
contenido, que es justo lo que las hace no genéricas (Regla 9 §1).

Dentro de `NotesCard`, cada fila de nota se tiñe con `accentVars(NOTE_STYLES[note.kind].accent)`
— icono y una franja izquierda de 2 px, igual que ya hace `NotesCards` en la
ficha de un creyente (Regla 1: mismo patrón, no uno nuevo) — en vez de un
gris plano. `EventsCard` no cambia su filete por evento: ya está bien.

Contraste: `warning`/`accent` no se usan como color del número grande (RFC
0005 §7.1, `stat-tones.ts:36-43`: sobre blanco quedan por debajo de 3:1); en
esas dos caras el número se queda en `foreground` y el color vive en la
pastilla y el filo, exactamente como ya hace `ACCENT_TONE`.

## 5. Arquitectura (solo componentes de `apps/web`)

Ningún cambio de tipos de `packages/shared` ni de `packages/api-client`: los
datos ya llegan completos en `DashboardSummary`.

- **`lib/stat-tones.ts`**: se reutiliza tal cual (`ACCENT_TONE`,
  `FILLED_TONE`). No se toca — es el mismo import que usa `StatCard`.
- **`components/home/metric-card.tsx`**: añade `tone` (`'filled' | StatAccent`)
  y pinta la pastilla del icono, el número (solo si el tono lo permite) y el
  filo superior con `ACCENT_TONE`/`FILLED_TONE`. Firma nueva, tipada, sin
  `any` (Regla 10).
- **`components/home/status-card.tsx`**: pasa `tone="filled"` al panel de
  Creyentes y `tone="warning"` al de Atención. En el panel `filled`, el fondo
  cubre solo su mitad — el `Card` exterior ya tiene `overflow-hidden`, así que
  basta con la clase de fondo en el hijo (mismo truco que ya usa `StatCard`
  con `FILLED_TONE.card`, pero sin el borde propio: aquí el borde es el del
  `Card` compartido).
- **`components/home/events-card.tsx`** y **`components/home/notes-card.tsx`**:
  cambian su cabecera actual (icono suelto en `text-muted-foreground`) por el
  mismo bloque de pastilla + filo que `metric-card.tsx`, con tono `primary` y
  `success` respectivamente. Para no duplicar la pastilla/filo en tres
  ficheros, se extrae un pequeño componente compartido —
  **`components/home/tile-header.tsx`** (icono, etiqueta, tono) — que usan
  `MetricCard`, `EventsCard` y `NotesCard`. Nuevo fichero, corto (Regla 6);
  evita copiar la misma clase `cn(...)` tres veces (Regla 1 §5, a la tercera
  se extrae).
- **`components/home/notes-card.tsx`**: cada `<li>` pasa a llevar
  `accentVars(NOTE_STYLES[note.kind].accent)` y `border-l-2 border-l-[var(--acento)]`
  en el icono/texto, calcado de `notes-cards.tsx`.
- **`components/home/dashboard-tile.test.tsx`** (o el test que ya exista de
  `status-card`/`activity-card`, ampliado): comprueba que el tono correcto se
  aplica y que el estado vacío sigue funcionando.

Nada de esto toca `dashboard.tsx` — la rejilla (`sm:grid-cols-2
lg:grid-cols-4`, los `col-span`) se queda igual, porque el diagnóstico (§2)
confirma que la mecánica ya es correcta.

## 6. Pasos ordenados

1. `tile-header.tsx`: el bloque compartido de pastilla + etiqueta + filo
   superior, parametrizado por `tone`.
2. `metric-card.tsx`: adopta `tile-header`, añade la prop `tone`.
3. `status-card.tsx`: pasa `tone="filled"` / `tone="warning"` a sus dos
   `MetricCard`.
4. `events-card.tsx` y `notes-card.tsx`: adoptan `tile-header` con
   `tone="primary"` / `tone="success"`.
5. `notes-card.tsx`: tiñe cada fila con el acento de `NOTE_STYLES`.
6. Revisar en los dos temas y en los tres anchos (Regla 3, Regla 5) — sin
   tocar textos, no hace falta ninguna clave de `i18n` nueva.
7. `rtk pnpm check` y `rtk pnpm test:e2e`.

## 7. Animaciones e interacciones

Ninguna nueva: la fila ya entra con `animate-page-in` heredado de la
`<section>` del panel. No se añade una segunda animación por tarjeta —
`prefers-reduced-motion` ya está cubierto por las clases existentes.

## 8. i18n

Ninguna clave nueva: no cambia ningún texto, solo tratamiento visual.

## 9. Plan de pruebas

- `rtk pnpm check` (formato, lint, tipos, tests).
- `rtk pnpm test:e2e` (web) — el panel de inicio tiene cobertura e2e que no
  debe romperse por las clases nuevas.
- Visual: los dos temas, tres anchos (375 / 768 / 1280) y con el idioma alemán
  activo para confirmar que la pastilla nueva no rompe el ajuste de texto de
  la cabecera (Regla 2, Regla 5).

## Criterios de aceptación

- [ ] La primera fila del panel (Creyentes, Atención, Eventos, Notas) tiene
      un cascarón visual idéntico entre sus cuatro caras: pastilla de icono,
      filo superior, pie con enlace.
- [ ] Hay exactamente una tarjeta `filled` en la fila (Creyentes).
- [ ] Cada nota reciente lleva el color de su tipo, no gris.
- [ ] Se ve correcto en claro/oscuro, en 375/768/1280 px y con alemán activo.
- [ ] `rtk pnpm check` y `rtk pnpm test:e2e` en verde.
