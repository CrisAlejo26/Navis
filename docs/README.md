# Documentación de Navis

Estructura estándar de la industria para separar **decisiones** de **propuestas**:

| Carpeta                            | Qué contiene                                                                                                                                                                                                 | Cuándo se escribe                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| [`adr/`](./adr)                    | **Architecture Decision Records** (formato Nygard). Decisiones técnicas tomadas, con su contexto y consecuencias. Son inmutables: si una decisión cambia, se escribe un ADR nuevo que supersede al anterior. | Al elegir una tecnología o un patrón |
| [`rfcs/`](./rfcs)                  | **Request for Comments**: propuestas de funcionalidad. Describen el problema, el modelo de datos, la API y la UI antes de escribir código.                                                                   | Antes de implementar cada feature    |
| [`DESPLIEGUE.md`](./DESPLIEGUE.md) | Cómo llega el código a producción y qué hay que configurar una sola vez.                                                                                                                                     | Al cambiar el flujo de despliegue    |
| [`ESTADO.md`](./ESTADO.md)         | Estado actual del proyecto y siguiente paso.                                                                                                                                                                 | Al final de cada sesión de trabajo   |

## Convenciones

- Numeración de cuatro dígitos correlativa y nombre en kebab-case: `0003-creyentes-y-notas.md`.
- Los RFC nacen en estado `Borrador`, pasan a `Aceptado` cuando se aprueba la propuesta
  y a `Implementado` cuando el código está en `main`.
- Cada RFC se escribe sobre [`rfcs/0000-plantilla.md`](./rfcs/0000-plantilla.md).
- Los números de RFC se referencian desde el código: las páginas aún sin
  implementar en web y móvil muestran la ruta de su documento.

## Índice de RFCs

| #                                                             | Feature                                                                | Estado       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------ |
| [0001](./rfcs/0001-panel-de-metricas.md)                      | Panel de inicio con métricas                                           | Implementado |
| [0002](./rfcs/0002-calendario-de-programaciones.md)           | Calendario de programaciones                                           | Borrador     |
| [0003](./rfcs/0003-creyentes-y-notas.md)                      | Creyentes con detalle y notas                                          | Implementado |
| [0004](./rfcs/0004-profecias-personales.md)                   | Profecías personales                                                   | Borrador     |
| [0005](./rfcs/0005-suenos-personales.md)                      | Sueños personales                                                      | Borrador     |
| [0006](./rfcs/0006-comunicaciones.md)                         | Comunicaciones (chat y avisos)                                         | Implementado |
| [0007](./rfcs/0007-modo-local-y-servidor.md)                  | Modo local y servidor compartido                                       | Implementado |
| [0008](./rfcs/0008-iglesias-como-espacios-de-trabajo.md)      | Iglesias como espacios de trabajo, y permisos por vista                | Borrador     |
| [0009](./rfcs/0009-exportar-listados.md)                      | Exportar lo que se ve                                                  | Implementado |
| [0010](./rfcs/0010-listas-compartidas.md)                     | Listas compartidas, con enlace público y accesos                       | Implementado |
| [0014](./rfcs/0014-alcance-de-pastor-y-superadministrador.md) | Tope de roles, onboarding del pastor y alcance del superadmin          | Implementado |
| [0016](./rfcs/0016-chat-comunicaciones-plan.md)               | Chat de Comunicaciones: plan de implementación (amplía 0006)           | Implementado |
| [0017](./rfcs/0017-notas-de-iglesia.md)                       | El cuaderno de la iglesia                                              | Implementado |
| [0018](./rfcs/0018-tareas-y-habitos-implementado.md)          | Tareas y hábitos                                                       | Implementado |
| [0019](./rfcs/0019-comunicaciones-mejoras-plan.md)            | Comunicaciones: menú por chat, emoji, formato y exportar (amplía 0016) | Implementado |

Orden sugerido de implementación: **0008 → 0003 → 0002 → 0001 → 0006 → 0004 →
0005**. El 0008 va primero porque decide de quién son los datos y quién los ve:
los creyentes, el calendario y las comunicaciones nacen ya con su `church_id` en
vez de tener que migrarlo después. Después, los creyentes son el núcleo del que
cuelga todo lo demás; el panel de métricas no tiene sentido hasta que hay datos
que contar.

## Índice de ADRs

| #                                                               | Decisión                                           | Estado                |
| --------------------------------------------------------------- | -------------------------------------------------- | --------------------- |
| [0001](./adr/0001-monorepo-pnpm-turborepo.md)                   | Monorepo con pnpm y Turborepo                      | Aceptada              |
| [0002](./adr/0002-nestjs-typeorm-en-lugar-de-fastapi.md)        | NestJS + TypeORM, con microservicio Python para IA | Aceptada              |
| [0003](./adr/0003-better-auth-con-sesiones-en-base-de-datos.md) | Better Auth con sesiones en base de datos          | Aceptada              |
| [0004](./adr/0004-tailwind-v4-y-nativewind-5.md)                | Tailwind v4 y NativeWind 5 preview                 | Aceptada (con riesgo) |
| [0005](./adr/0005-eslint-prettier-oxlint.md)                    | ESLint + Prettier + Oxlint                         | Aceptada              |
| [0006](./adr/0006-sqlite-por-defecto-postgres-para-equipos.md)  | SQLite por defecto, Postgres para equipos          | Aceptada              |
