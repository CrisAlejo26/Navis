# Rediseño — La ficha del cuaderno, a la par de sueño y profecía

**Estado: implementado.** `EntryIdentity` y `JournalEntryPage` rediseñados
(cabecera ancha teñida + oleaje). `DreamIdentity`/`ProphecyIdentity` revisadas
al lado de la nueva cabecera: ya respiraban igual, sin retoques. RFC 0017
§7.7 actualizada para reflejar el diseño nuevo. Verificado en los dos temas y
en 375/768/1280 px con capturas de Playwright (descartadas tras la revisión,
no forman parte de la suite).

## 1. Objetivo y alcance

La ficha de una entrada del cuaderno (`/journal/:id`, RFC 0017 §7.7) se quedó
con el patrón antiguo: columna izquierda angosta y fija con la identidad,
columna derecha con el texto. Es el mismo patrón que tuvieron sueño y
profecía **antes** de su propio rediseño (ver el comentario de
`ProphecyIdentity`: «antes la identidad vivía en una columna de 20 rem a la
izquierda»), y hoy es la única de las tres fichas de «entrada personal» que no
lo tiene.

**Entra:**

- Cabecera a lo ancho, teñida con el color del tipo de la entrada (el dato
  pone el color, no la pantalla — mismo criterio que sueño y profecía).
- El oleaje (D14 de la RFC 0017), hoy solo en la portada y el listado, se trae
  a la ficha: es el elemento que falta para que las tres pantallas del
  cuaderno compartan identidad.
- Reflow del resto del contenido a una sola columna a lo ancho, con el mismo
  ritmo de entrada escalonada (`animate-rise-in`) que ya usan las otras dos
  fichas.
- Retoques menores en `DreamIdentity`/`ProphecyIdentity` si al ponerlas una
  al lado de la otra alguna respira distinto (paddings, tamaños de meta-línea).

**No entra:**

- Un conmutador de «vistas» en el cuaderno: una entrada es una anotación, no
  cuatro lecturas distintas de la misma información — no hay nada que
  conmutar. El oleaje es su firma, no un conmutador.
- Cambios de datos, esquema o endpoints: es solo interfaz.
- App móvil: el cuaderno no existe ahí (RFC 0017 §7.11).

## 2. Referencias

- **Day One** (revisión general): tipografía editorial para el cuerpo del
  texto, jerarquía clara entre metadatos y contenido. Se toma la idea de una
  línea de metadatos discreta encima del título; se descarta cualquier cosa
  que no sea texto y espacio — Day One no tiene el problema de Regla 9 porque
  no compite con una marca.
- **Cuadernos de bitácora náuticos** (búsqueda genérica): confirman el
  vocabulario ya elegido por la RFC 0017 — fecha, tipo de anotación, cuerpo —
  y refuerzan que el oleaje (una línea de horizonte) es la referencia correcta
  para el elemento firma, no un adorno añadido.
- **El propio repositorio**, la referencia que más pesa: `DreamIdentity` y
  `ProphecyIdentity` ya resolvieron «cabecera ancha teñida por el dato» con
  buen resultado, documentado y con tests. Se reutiliza el patrón (Regla 1),
  no se inventa uno nuevo.

## 3. Dirección de diseño

- **Paleta**: la del tipo de entrada, ya existente en `ENTRY_KIND_STYLES`
  (`accent` de `ACCENT_PALETTE`). Igual mecánica que `DreamIdentity` (tinte
  por emoción) y `ProphecyIdentity` (tinte por estado): variable CSS
  `--acento` + `bg-gradient-to-br from-[var(--acento)]/22 to-[var(--acento)]/5`.
- **Tipografía**: título a 24px `tracking-[-0.02em]` (sin cambios, ya está
  bien); línea de metadatos en mayúsculas pequeñas encima del título, como
  `DreamIdentity` (`text-xs tracking-wide uppercase text-muted-foreground`),
  en vez de debajo como hoy.
- **Composición**: cabecera a lo ancho → oleaje → recordatorio (si lo hay) →
  anotación/lo aprendido → audios. Una sola columna con `max-w-prose` en el
  texto, igual que profecía.
- **Elemento firma**: el oleaje, ya existe y ya está descrito (D14). Se
  reutiliza tal cual — nada de inventar una segunda animación en la misma
  pantalla (Regla 9 §4).

## 4. Arquitectura

Solo componentes de `apps/web/src`, sin tocar `packages/` ni la API:

- `components/journal/entry-identity.tsx` — cabecera a lo ancho teñida,
  metadatos arriba, acciones en fila.
- `routes/journal-entry.tsx` — una columna, con `<Oleaje />` bajo la cabecera.
- `components/journal/entry-annotation.tsx` y `entry-audios.tsx` — sin
  cambios de lógica, solo se acomodan al nuevo ancho.
- Retoque opcional de paddings en `dream-identity.tsx` / `prophecy-identity.tsx`
  si la comparación visual lo pide.

## 5. Pasos

1. `EntryIdentity`: cabecera a lo ancho teñida, meta arriba, acciones en fila.
2. `journal-entry.tsx`: layout a una columna, `<Oleaje />` bajo la cabecera.
3. Revisar `dream-identity.tsx` / `prophecy-identity.tsx` al lado de la nueva
   cabecera del cuaderno; ajustar solo si algo desentona.
4. i18n: no se esperan claves nuevas (se reordena texto existente); revisar al
   final.
5. Comprobación en los dos temas y en los tres anchos (Regla 3, Regla 5).

## 6. Animación

- La cabecera entra con `animate-rise-in`, igual que las otras dos.
- El oleaje reutiliza `animate-oleaje` sin cambios.
- Nada nuevo que animar: no hay conmutador de vistas en esta ficha.

## 7. i18n

Ninguna clave nueva prevista. Si el reflow deja algún texto huérfano se
reutiliza lo que ya existe en `journal.*`.

## 8. Plan de pruebas

- `pnpm check` (formato, lint, tipos, tests).
- `pnpm test:e2e` (web) — hay specs de cuaderno que abren la ficha.
- Revisión visual manual: dos temas, tres anchos (375/768/1280), con alemán
  activo para el texto más largo.
