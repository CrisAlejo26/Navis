# Documentación de PastorTools

Estructura estándar de la industria para separar **decisiones** de **propuestas**:

| Carpeta | Qué contiene | Cuándo se escribe |
| --- | --- | --- |
| [`adr/`](./adr) | **Architecture Decision Records** (formato Nygard). Decisiones técnicas tomadas, con su contexto y consecuencias. Son inmutables: si una decisión cambia, se escribe un ADR nuevo que supersede al anterior. | Al elegir una tecnología o un patrón |
| [`rfcs/`](./rfcs) | **Request for Comments**: propuestas de funcionalidad. Describen el problema, el modelo de datos, la API y la UI antes de escribir código. | Antes de implementar cada feature |
| [`ESTADO.md`](./ESTADO.md) | Estado actual del proyecto y siguiente paso. Se actualiza al final de cada sesión de trabajo. | Continuamente |

## Convenciones

- Numeración de cuatro dígitos correlativa y nombre en kebab-case: `0003-creyentes-y-notas.md`.
- Los RFC nacen en estado `Borrador`, pasan a `Aceptado` cuando se aprueba la propuesta
  y a `Implementado` cuando el código está en `main`.
- Cada RFC se escribe sobre [`rfcs/0000-plantilla.md`](./rfcs/0000-plantilla.md).
- Los números de RFC se referencian desde el código y desde los issues: las páginas
  aún sin implementar en `apps/web` muestran la ruta de su RFC.

## Índice de RFCs

| # | Feature | Estado |
| --- | --- | --- |
| 0001 | Panel de inicio con métricas | Pendiente de escribir |
| 0002 | Calendario de programaciones | Pendiente de escribir |
| 0003 | Creyentes con detalle y notas | Pendiente de escribir |
| 0004 | Profecías personales | Pendiente de escribir |
| 0005 | Sueños personales | Pendiente de escribir |
| 0006 | Comunicaciones (chat) | Pendiente de escribir |

## Índice de ADRs

| # | Decisión | Estado |
| --- | --- | --- |
| 0001 | Monorepo pnpm + Turborepo | Pendiente de escribir |
| 0002 | NestJS + TypeORM en lugar de FastAPI | Pendiente de escribir |
| 0003 | Better Auth con sesiones en Postgres | Pendiente de escribir |
| 0004 | Tailwind v4 + NativeWind 5 preview | Pendiente de escribir |
| 0005 | ESLint + Prettier + Oxlint | Pendiente de escribir |
