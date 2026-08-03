---
description: Publica una versión nueva (APK de Android, instaladores de escritorio y sitio web)
argument-hint: '[patch|minor|major|X.Y.Z] [--dry-run] [--skip-checks]'
allowed-tools: Bash(pnpm release:*), Bash(pnpm release:dry:*), Bash(git status:*), Bash(git log:*), Bash(gh run list:*), Bash(gh run watch:*), Bash(gh release view:*)
---

Publica una versión nueva de Fidus.

Argumentos recibidos: `$ARGUMENTS` (si vienen vacíos, usa `patch`).

Haz esto, en orden:

1. Comprueba con `git status --short` que el árbol está limpio y que estás en
   `main`. Si no, para y dilo: un release sale de un árbol limpio.
2. Enseña qué versión saldría con `pnpm release:dry <bump>` y **confirma con la
   persona** antes de seguir. Es una acción pública e irreversible: la etiqueta
   queda en el repositorio remoto.
3. Lanza `pnpm release <bump>`. El script verifica (formato, lint, tipos y
   tests), sincroniza la versión en las cuatro apps, crea la etiqueta `vX.Y.Z`
   y la empuja.
4. Con `gh run list --workflow=release.yml --limit 1` localiza la ejecución y
   sigue su avance. Tarda unos 20 minutos: compila cuatro instaladores de
   escritorio y el APK.
5. Cuando termine, resume qué artefactos se han adjuntado y recuerda que el
   release queda **en borrador**: hay que revisarlo y darle a «Publish release»
   en GitHub.

Si algo falla, di exactamente qué job y con qué error; no lo relances sin
preguntar.

Detalles del flujo: `docs/RELEASES.md`.
