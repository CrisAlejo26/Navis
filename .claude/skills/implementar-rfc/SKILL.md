---
name: implementar-rfc
description: Implementa una funcionalidad de Navis a partir de su RFC en docs/rfcs. Úsala cuando pidan implementar o empezar creyentes, notas, calendario, programaciones, panel de métricas, comunicaciones, chat, profecías o sueños; cuando digan "implementa el RFC 000X", "vamos con la siguiente feature", "añade la pantalla de X"; o cuando haya que crear una entidad nueva, una migración o un módulo de la API en este monorepo.
---

# Implementar una feature desde su RFC

Toda la funcionalidad de negocio de Navis está especificada y sin escribir. El
orden importa: la base de datos tiene trampas conocidas y los textos tienen que
salir en seis idiomas desde el primer commit.

## 1. Lee el RFC entero antes de tocar nada

Están en `docs/rfcs/`. Traen el modelo de datos, la API, la interfaz y —lo más
importante— **qué NO entra** y qué alternativas se descartaron y por qué.

Si algo del RFC te parece equivocado, dilo antes de programar. No lo cambies
por tu cuenta: la propuesta está acordada.

Orden acordado: **0003 creyentes → 0002 calendario → 0001 panel → 0006
comunicaciones → 0004 profecías → 0005 sueños**. Los creyentes son el núcleo
del que cuelga el resto.

## 2. Modelo de datos, que es donde están las trampas

1. **Entidad** en `apps/api/src/<modulo>/<nombre>.entity.ts`, heredando de
   `BaseEntity`. Para las fechas usa `TIMESTAMP` de
   `apps/api/src/database/column-types.ts`, nunca `'timestamptz'` a pelo: en
   SQLite ese tipo no existe y la app no arranca.
2. **Regístrala a mano** en el array `entities` de
   `apps/api/src/database/data-source.ts`. Nada de globs: TypeORM haría
   `require()` de ficheros `.ts` al correr los tests sobre el fuente.
3. **Migración** con `rtk pnpm db:generate`, y después **revísala**: tiene que
   valer en SQLite y en Postgres. Se escribe con la API `Table` de TypeORM, no
   con SQL literal, y lo que difiera entre motores se resuelve mirando
   `queryRunner.connection.options.type`.
4. **Pruébala en los dos motores**, cambiando `DB_DRIVER` en el `.env`:
   ```bash
   rtk pnpm db:migrate && rtk pnpm db:seed
   ```
5. **Compatible hacia atrás**: el despliegue migra antes de arrancar la versión
   nueva y una reversión no deshace la migración. Renombrar o borrar una
   columna se hace en dos entregas.

## 3. API

- Módulo Nest con su controlador y su servicio. El controlador valida y
  delega; la lógica va en el servicio.
- **Permisos**: `@Roles('leader')` o el que diga el RFC. El `SessionGuard` ya
  es global, así que lo que es público se marca con `@Public()`.
- **Privacidad**: si el RFC dice que algo es privado, el filtro por propietario
  va **en el repositorio**, no en el controlador. Así no se puede olvidar en un
  endpoint nuevo.
- Los DTO usan `class-validator`; los esquemas que comparten API y clientes van
  en `packages/shared/src/schemas/`.

## 4. Clientes

- `queryKeys` y hooks nuevos en `packages/api-client`, no sueltos en cada app.
- **Web**: sustituye el marcador de posición de `apps/web/src/router.tsx` por la
  pantalla real.
- **Móvil**: lo mismo en `apps/mobile/app/`.
- Los **textos**, en los seis idiomas de `packages/i18n` (Regla 2). Empieza por
  `es.ts`: hasta que no estén los seis, no compila.

## 5. Antes de darlo por hecho

```bash
rtk pnpm check
rtk pnpm test:e2e
```

Y repasa las reglas de `.claude/rules/`: seis idiomas, los dos temas, móvil y
escritorio, tests de lo que has escrito, y ficheros que no se disparen de largo.

Cuando esté en `main`, cambia el estado del RFC a **Implementado** y actualiza
el índice de `docs/README.md`.
