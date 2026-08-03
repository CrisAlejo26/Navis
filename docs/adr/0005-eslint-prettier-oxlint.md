# ADR 0005: ESLint + Prettier, con Oxlint como pasada rápida

- **Estado**: Aceptada
- **Fecha**: 2026-08-02
- **Supersede a**: la propuesta inicial de usar Biome

## Contexto

Biome haría formato y lint en una sola herramienta rapidísima. Pero el proyecto
depende de configuraciones que solo existen para ESLint: `eslint-config-expo`,
`eslint-plugin-react-hooks`, `eslint-plugin-playwright` y, sobre todo, las
reglas **con información de tipos** de typescript-eslint.

## Decisión

**Prettier** para el formato y **ESLint 10** (flat config) para el lint, con
**Oxlint** delante como pasada rápida.

- `packages/eslint-config` exporta cuatro variantes: base, react, nest y expo.
- `eslint-plugin-oxlint` apaga en ESLint las reglas que Oxlint ya cubre, para
  que no se comprueben dos veces.
- En pre-commit (lint-staged): `oxlint --fix`, `eslint --fix`, `prettier
--write`. Oxlint primero porque es el que descarta lo obvio en milisegundos.
- `prettier-plugin-tailwindcss` ordena las clases automáticamente.
- `.vscode/settings.json` versionado: formateo al guardar y `fixAll` de ESLint,
  para que la configuración no dependa de los ajustes de cada persona.

## Consecuencias

- Se conservan las reglas type-aware, que son las que detectan promesas sin
  esperar y accesos inseguros a `any`. Ninguna otra herramienta las tiene hoy.
- Tres herramientas en vez de una, pero cada una hace lo que mejor hace y la
  configuración vive en un único paquete del workspace.
- Puntos afilados encontrados y ya resueltos en la configuración compartida:
  `eslint-plugin-react-hooks` 7 sigue exponiendo `configs['recommended-latest']`
  en formato antiguo (hay que usar `configs.flat[...]`); `eslint-plugin-react`
  revienta con ESLint 10 si intenta detectar la versión de React, así que va
  fijada; y `eslint-config-expo` necesita la extensión explícita al importarlo
  desde ESM.
