# Regla 1 — Patrones de diseño, código legible y sin repetición (DRY)

Cualquier IA que escriba código en este proyecto **debe**:

- **Aplicar patrones de diseño** apropiados al problema (Factory, Strategy, Adapter,
  Repository, Composition, custom hooks, etc.) en lugar de soluciones ad-hoc. Elegir
  el patrón más simple que resuelva el caso; no sobre-ingenierizar.
- **No repetir código (DRY).** Antes de escribir algo nuevo, buscar si ya existe una
  utilidad, componente, hook o tipo que lo cubra y reutilizarlo. Extraer lógica común a
  `src/lib/`, `src/components/`, `src/stores/` o un hook compartido.
- **Escribir código legible y mantenible:** nombres descriptivos, funciones cortas con
  una sola responsabilidad, sin abreviaturas crípticas, y siguiendo el estilo del código
  existente (Prettier/ESLint del repo).
- **Respetar la arquitectura existente** y las convenciones de esta versión de Next.js
  (ver `AGENTS.md`: leer la guía en `node_modules/next/dist/docs/` antes de escribir).

> Objetivo: que el código sea reutilizable, predecible y fácil de leer por otra persona.
