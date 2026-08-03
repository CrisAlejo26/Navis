# ADR 0001: Monorepo con pnpm y Turborepo

- **Estado**: Aceptada
- **Fecha**: 2026-08-02

## Contexto

PastorTools son cuatro clientes (API, web, móvil y escritorio) que comparten
tipos, esquemas de validación, tema visual, traducciones y cliente HTTP. Con
repositorios separados, cada cambio de contrato obliga a publicar un paquete y
actualizar tres repos.

## Decisión

Un único repositorio con **pnpm workspaces** (`apps/*` y `packages/*`) y
**Turborepo** para orquestar tareas.

- Las versiones se centralizan en el **catálogo** de `pnpm-workspace.yaml`: una
  línea actualiza toda la dependencia en el monorepo.
- `node-linker=hoisted` en `.npmrc`, **obligatorio**: Metro (Expo) no resuelve
  el store aislado de pnpm.
- `inject-workspace-packages` queda **desactivado**: copia los paquetes en vez
  de enlazarlos y congela su `dist` en el momento del install. Para Docker se
  usa `pnpm deploy --legacy`, que no lo necesita.

## Consecuencias

- Un cambio en `packages/shared` rompe la compilación de quien lo use en el
  mismo commit, que es exactamente lo que se quiere.
- `pnpm build` respeta el grafo de dependencias y cachea; en CI se reutiliza.
- `hoisted` significa una sola copia de cada paquete en la raíz: hay que vigilar
  las dependencias fantasma, que ESLint y TypeScript detectan.
- El build de escritorio queda **fuera** de `pnpm build`: compilar Rust en
  release tarda minutos y no aporta en cada cambio de la web.
