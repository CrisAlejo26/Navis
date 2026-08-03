---
name: feature-builder
description: 'Lleva una funcionalidad nueva o un rediseño de interfaz de Navis desde la idea hasta código probado: explora el proyecto con el grafo de codebase-memory, investiga cómo lo han resuelto otros productos, escribe el plan en docs/, aplica las skills de diseño (frontend-design y ui-ux-pro-max) e implementa con animaciones, interacciones y los seis idiomas. Úsala cuando pidan agregar una feature, un módulo, una pantalla, una sección o un rediseño visual, o cuando digan implementar, construir, crear, diseñar o rediseñar algo de la interfaz.'
---

# Feature Builder — Navis

Orquesta una funcionalidad o un rediseño de principio a fin. **No saltes
fases.** El objetivo es interfaz con criterio propio (nada de aspecto
«plantilla de IA»), accesible, animada, traducida y que respete las reglas de
`.claude/rules/`.

## Antes de nada: ¿ya hay RFC?

La funcionalidad de negocio de Navis está especificada en `docs/rfcs/`. Mira
primero si lo que piden ya tiene RFC:

- **Sí lo tiene** → la mecánica (entidad, migración, módulo Nest, cliente) la
  manda la skill **`implementar-rfc`**. Esta skill aporta entonces solo las
  fases 2, 4 y 5: referencias, diseño e implementación pulida de la interfaz.
- **No lo tiene** → recórrela entera y, en la fase 3, escribe un RFC nuevo con
  `docs/rfcs/0000-plantilla.md`.

## Reglas del proyecto que siempre aplican

Están completas en `.claude/rules/`. En corto, y ninguna es negociable:

1. **Reutilizar antes de escribir** — `packages/shared`, `theme`, `i18n`,
   `api-client`. Lo que valga para más de una app va a `packages/`.
2. **Seis idiomas** — es, en, fr, pt, de, it, en `packages/i18n/src/locales/`.
   `es.ts` define el tipo: hasta que no estén los seis, no compila.
3. **Claro y oscuro** — tokens semánticos de `packages/theme/src/tokens.css`.
   Nada de hexadecimales sueltos; en React Native, `themeColorsHex`.
4. **Probado, no supuesto** — `rtk pnpm check` y lo que toque según la app.
5. **Responsive** — móvil, tablet y escritorio; objetivos táctiles de 44 px.
6. **Ficheros cortos** — objetivo de 100 líneas.
7. **Identidad visual** — **prohibida la cruz**; el símbolo es el barco y sale
   de `packages/theme/src/logo/`. Azul de marca `#2140cf`.

Y las trampas técnicas del repositorio están en `CLAUDE.md`: léelas antes de
tocar base de datos, Metro, Tauri o el versionado.

---

## Fase 1 — Analizar el proyecto (con el grafo, no a mano)

**Actualiza el índice y consulta el grafo** antes de abrir ficheros sueltos
(Regla 8):

```
index_repository(repo_path="D:/Proyectos_personales/Navis", mode="full")
get_architecture(project="D-Proyectos_personales-Navis", aspects=["overview"])
search_code(project="D-Proyectos_personales-Navis", pattern="<lo que buscas>")
```

Con eso identifica:

- Dónde encaja la feature: `apps/api/src/<modulo>`, `apps/web/src/`,
  `apps/mobile/app/`, y qué paquete compartido le toca.
- Qué ya existe y se reutiliza: componentes, hooks, `queryKeys`, entidades,
  claves de traducción, tokens de tema.
- Qué patrones sigue el código vecino (store de zustand, TanStack Query,
  módulos Nest) para no inventar uno nuevo.

Cierra la fase con 3–6 líneas: qué hay, qué falta, qué se reutiliza.

## Fase 2 — Investigar referencias del sector

Con **WebSearch / WebFetch**, mira cómo resuelven esto productos reales
(herramientas de gestión de comunidades, CRM, agendas, apps de notas). De cada
referencia extrae flujos, estados (vacío, carga, error, éxito),
microinteracciones, jerarquía visual y accesibilidad.

Anota **3–5 referencias concretas**, con qué tomar de cada una y qué evitar. Es
material para el plan, no un adorno.

## Fase 3 — Escribir el plan

- Feature de negocio sin RFC → `docs/rfcs/000X-<nombre>.md` con la plantilla, y
  añádelo al índice de `docs/README.md`.
- Rediseño o cambio solo de interfaz → `docs/<nombre>-plan.md`.

Contenido, en orden de implementación:

1. **Objetivo y alcance** — qué resuelve y qué **no** entra.
2. **Hallazgos de la fase 2** — referencias y qué se toma de cada una.
3. **Dirección de diseño** — la estética elegida (frontend-design) y paleta,
   tipografía y patrón (ui-ux-pro-max), **conciliados con los tokens y con el
   azul de marca**.
4. **Arquitectura** — entidades y migración, endpoints, esquemas de
   `packages/shared`, hooks de `packages/api-client`, componentes y pantallas
   de web y móvil.
5. **Pasos ordenados** — datos → lógica → interfaz → animación → i18n → tests.
6. **Animaciones e interacciones** — qué se anima y cómo.
7. **i18n** — las claves nuevas que hay que añadir en los seis locales.
8. **Plan de pruebas** — qué se verifica y con qué comando.

Enseña el plan y espera confirmación antes de un cambio grande.

## Fase 4 — Diseñar con las dos skills

Se usan **juntas**, y cada una manda en lo suyo: `ui-ux-pro-max` en
accesibilidad, tamaños táctiles y patrones de UX; `frontend-design` en la
dirección visual y la personalidad. Las reglas del proyecto mandan sobre las
dos.

**`ui-ux-pro-max`** — datos y reglas. El stack de este repo es `react` (web) y
`react-native` (móvil); **no** es Next.js:

```bash
python ".claude/skills/ui-ux-pro-max/scripts/search.py" "<feature> <tono>" --design-system -p "Navis"
python ".claude/skills/ui-ux-pro-max/scripts/search.py" "<feature>" --domain ux
python ".claude/skills/ui-ux-pro-max/scripts/search.py" "<feature>" --domain typography
python ".claude/skills/ui-ux-pro-max/scripts/search.py" "<keyword>" --stack react
python ".claude/skills/ui-ux-pro-max/scripts/search.py" "<keyword>" --stack react-native
```

No uses `--persist`: escribiría un `design-system/` en la raíz que duplica lo
que ya está en `packages/theme`.

**`frontend-design`** — criterio estético: una dirección con opinión, jerarquía
del hero o de la pantalla, personalidad tipográfica y **una** decisión audaz
justificada. Léela entera, incluido su addendum de Navis.

De los colores que devuelva la base de datos toma la **intención** (contraste,
peso, jerarquía), no los hexadecimales: los valores salen de los tokens, y si
hace falta uno nuevo se añade a `tokens.css` con su versión clara y su versión
oscura.

## Fase 5 — Implementar y probar

- **Animación e interacción**: entradas y salidas, estados de hover, press y
  focus, esqueletos de carga, confirmación de éxito y error, revelados al
  hacer scroll. Primero CSS y transiciones nativas; una librería de animación
  solo si hace falta orquestar de verdad, instalada con `rtk pnpm add` y
  justificada en el plan. Respeta siempre `prefers-reduced-motion`.
- **Estados completos**: vacío, cargando, error y éxito. Foco y teclado
  correctos.
- **Las cuatro aplicaciones**: lo que se hace en web tiene que sobrevivir en
  React Native (sin CSS arbitrario, sin `oklch` en props nativas) y dentro de
  Tauri.
- **Probar de verdad**:

  ```bash
  rtk pnpm check       # formato + lint + tipos + tests
  rtk pnpm test:e2e    # API y web
  ```

  Y si has tocado móvil o escritorio, `expo-doctor` y `cargo check`. Mira el
  resultado en **los dos temas**, en **móvil y escritorio** y en **dos idiomas**
  como mínimo. Nada de «listo» sin evidencia (Regla 4).

Al terminar, marca lo completado en el plan y, si era un RFC, pásalo a
**Implementado** en `docs/README.md`.

---

`Analizar con el grafo → Investigar → Plan en docs/ → Diseñar → Implementar animado → Probar`
