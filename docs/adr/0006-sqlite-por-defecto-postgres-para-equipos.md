# ADR 0006: SQLite por defecto, Postgres para trabajo en equipo

- **Estado**: Aceptada
- **Fecha**: 2026-08-03
- **Detalle**: [RFC 0007](../rfcs/0007-modo-local-y-servidor.md)

## Contexto

Exigir Docker y Postgres para abrir la aplicación es una barrera enorme para el
usuario objetivo, que es un pastor, no un desarrollador. Pero una iglesia con
varias personas necesita datos compartidos.

## Decisión

Un solo motor elegido por entorno: `DB_DRIVER=sqlite` (por defecto) o
`DB_DRIVER=postgres`. Toda la configuración se valida con **zod** al arrancar.

- Better Auth y TypeORM comparten conexión y motor.
- Las migraciones se escriben con la API `Table` de TypeORM, nunca con SQL
  literal, para que valgan en ambos.
- Los tipos de columna que difieren entre motores viven en
  `apps/api/src/database/column-types.ts`, no repartidos por las entidades.
- Las credenciales de Postgres solo son obligatorias cuando se usa Postgres.

## Consecuencias

- `pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev` funciona sin
  Docker. Verificado.
- Cambiar una variable pasa al modo compartido. Verificado con las mismas
  migraciones, la misma semilla y los mismos tests e2e.
- **Coste**: cada migración nueva hay que probarla en los dos motores, y las
  funciones específicas de Postgres (`pg_trgm`, `unaccent`) necesitan una
  alternativa degradada en SQLite.
- Las entidades se declaran **explícitamente** en el `DataSource`, sin globs:
  un glob obliga a TypeORM a hacer `require()` de ficheros `.ts` al correr los
  tests sobre el código fuente, y Node no sabe cargarlos.
