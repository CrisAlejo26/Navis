# Documentación de Navis

Cada carpeta responde a una pregunta distinta:

| Carpeta                            | Qué contiene                                                                                                                               | Cuándo se escribe                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [`adr/`](./adr)                    | **Decisiones técnicas** (formato Nygard): qué se eligió y por qué. Inmutables: si una decisión cambia, un ADR nuevo supersede al anterior. | Al elegir una tecnología o un patrón                      |
| [`rfcs/`](./rfcs)                  | **Propuestas de funcionalidad**: problema, modelo de datos, API e interfaz antes de escribir código.                                       | Antes de implementar cada feature                         |
| [`planes/`](./planes)              | **Planes de implementación** que amplían un RFC sin llegar a serlo (una app concreta, un rediseño, una mejora). Separados por estado.      | Cuando un RFC necesita un documento propio para una parte |
| [`referencias/`](./referencias)    | Material de consulta que no es una decisión: inventario de pantallas de la web, referencias de diseño móvil.                               | Al investigar                                             |
| [`pruebas/`](./pruebas)            | Guiones de pruebas manuales, para quien tenga que mirar lo que solo se ve mirando.                                                         | Al cerrar una funcionalidad visual                        |
| [`historico/`](./historico)        | Documentos archivados que ya no se mantienen.                                                                                              | Al retirar un documento                                   |
| [`DESPLIEGUE.md`](./DESPLIEGUE.md) | Cómo llega el código a producción y qué se configura una sola vez.                                                                         | Al cambiar el flujo de despliegue                         |
| [`RELEASES.md`](./RELEASES.md)     | Cómo publicar una versión (APK, instaladores de escritorio y web).                                                                         | Al cambiar el flujo de releases                           |

## Convenciones

- **RFC**: numeración correlativa de cuatro dígitos y nombre en kebab-case. Mientras se
  escribe o se construye, el fichero se llama `NNNN-nombre.md`; cuando el código está en
  `main`, pasa a `NNNN-nombre-implementado.md` y su estado a `Implementado`. Así el estado
  se lee en el propio listado de la carpeta.
- Cada RFC se escribe sobre [`rfcs/0000-plantilla.md`](./rfcs/0000-plantilla.md).
- **Planes**: viven en `planes/pendientes/` mientras se trabajan y pasan a
  `planes/implementados/` al terminar. Hoy no hay ninguno pendiente (la carpeta se crea al
  hacer falta).
- Los números de RFC se referencian desde el código: las pantallas puente de web y móvil
  muestran la ruta de su documento.
- Al mover o renombrar un documento, se actualizan también las referencias del código
  (`git grep "docs/"`).

## Pendiente

| Qué                                        | Dónde                                           | Falta                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Login completo en móvil                    | [RFC 0024](./rfcs/0024-login-completo-movil.md) | Fase 1 hecha (pendiente de probar en dispositivo); fases 2-5: PIN y huella, conectar y desconectar del servidor, recuperar contraseña |
| Secciones móviles aún como pantalla puente | `apps/mobile/app/*.tsx`                         | Sueños, tareas, tablas, listas, cuaderno, enseñanzas, comunicaciones y usuarios no tienen plan propio todavía                         |

## Índice de RFCs

| #                                                                          | Feature                                                                             | Estado       |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------ |
| [0001](./rfcs/0001-panel-de-metricas-implementado.md)                      | Panel de inicio con métricas                                                        | Implementado |
| [0002](./rfcs/0002-calendario-de-programaciones-implementado.md)           | Calendario de programaciones del púlpito                                            | Implementado |
| [0003](./rfcs/0003-creyentes-y-notas-implementado.md)                      | Creyentes, su historial y el aviso de inactividad                                   | Implementado |
| [0004](./rfcs/0004-profecias-personales-implementado.md)                   | Profecías personales                                                                | Implementado |
| [0005](./rfcs/0005-suenos-personales-implementado.md)                      | Sueños personales                                                                   | Implementado |
| [0006](./rfcs/0006-comunicaciones-implementado.md)                         | Comunicaciones (chat y avisos)                                                      | Implementado |
| [0007](./rfcs/0007-modo-local-y-servidor-implementado.md)                  | Modo local y servidor compartido                                                    | Implementado |
| [0008](./rfcs/0008-iglesias-como-espacios-de-trabajo-implementado.md)      | Iglesias como espacios de trabajo, y permisos por vista                             | Implementado |
| [0009](./rfcs/0009-exportar-listados-implementado.md)                      | Exportar lo que se ve                                                               | Implementado |
| [0010](./rfcs/0010-listas-compartidas-implementado.md)                     | Listas                                                                              | Implementado |
| [0011](./rfcs/0011-festivos-en-el-calendario-implementado.md)              | Los festivos en el calendario                                                       | Implementado |
| [0012](./rfcs/0012-trayectoria-del-creyente-implementado.md)               | La trayectoria de un creyente                                                       | Implementado |
| [0013](./rfcs/0013-cuadrantes-implementado.md)                             | Cuadrantes                                                                          | Implementado |
| [0014](./rfcs/0014-alcance-de-pastor-y-superadministrador-implementado.md) | Tope de roles, onboarding independiente del pastor y alcance del superadministrador | Implementado |
| [0015](./rfcs/0015-baja-dueno-iglesia-plan-implementado.md)                | Baja de una cuenta dueña de una iglesia: qué conservar y qué no                     | Implementado |
| [0016](./rfcs/0016-chat-comunicaciones-plan-implementado.md)               | Chat en Comunicaciones: plan de implementación                                      | Implementado |
| [0017](./rfcs/0017-notas-de-iglesia-implementado.md)                       | El cuaderno de la iglesia                                                           | Implementado |
| [0018](./rfcs/0018-tareas-y-habitos-implementado.md)                       | Tareas y hábitos                                                                    | Implementado |
| [0019](./rfcs/0019-comunicaciones-mejoras-plan-implementado.md)            | Comunicaciones: menú por chat, emoji, exportar y compositor a todo lo ancho         | Implementado |
| [0020](./rfcs/0020-rediseno-ficha-cuaderno-plan-implementado.md)           | Rediseño — La ficha del cuaderno, a la par de sueño y profecía                      | Implementado |
| [0021](./rfcs/0021-tablas-personalizadas-implementado.md)                  | Tablas personalizadas                                                               | Implementado |
| [0022](./rfcs/0022-ensenanzas-personales-plan-implementado.md)             | Enseñanzas personales                                                               | Implementado |
| [0023](./rfcs/0023-recuperar-contrasena-implementado.md)                   | Recuperar contraseña                                                                | Implementado |
| [0024](./rfcs/0024-login-completo-movil.md)                                | Login completo en móvil (local primero, servidor después)                           | En curso     |
| [0025](./rfcs/0025-tablas-vinculadas-a-creyentes-implementado.md)          | Tablas vinculadas a creyentes                                                       | Implementado |

## Planes

| Plan                                                                                                                  | Estado       |
| --------------------------------------------------------------------------------------------------------------------- | ------------ |
| [Calendario de programaciones en móvil (amplía 0002 y 0011)](./planes/implementados/calendario-movil-plan.md)         | Implementado |
| [Creyentes en móvil (adapta 0003)](./planes/implementados/creyentes-movil-plan.md)                                    | Implementado |
| [Filtros de tablas: popover por columna, chips y vistas (mejora 0021)](./planes/implementados/filtros-tablas-plan.md) | Implementado |
| [Navegación y estructura de la app móvil](./planes/implementados/navegacion-movil-plan.md)                            | Implementado |
| [Profecías en móvil (enmienda a 0004 §7.10)](./planes/implementados/profecias-movil-plan.md)                          | Implementado |
| [PWA instalable por lista compartida (amplía 0010)](./planes/implementados/pwa-instalable-por-lista.md)               | Implementado |
| [Selector geográfico en cascada (amplía 0011)](./planes/implementados/selector-geografico-plan.md)                    | Implementado |
| [Sistema de componentes de `apps/mobile`](./planes/implementados/sistema-componentes-movil-plan.md)                   | Implementado |
| [Tarjetas de creyentes en móvil: altura uniforme y gestos](./planes/implementados/tarjetas-creyentes-plan.md)         | Implementado |

## Índice de ADRs

| #                                                               | Decisión                                           | Estado                |
| --------------------------------------------------------------- | -------------------------------------------------- | --------------------- |
| [0001](./adr/0001-monorepo-pnpm-turborepo.md)                   | Monorepo con pnpm y Turborepo                      | Aceptada              |
| [0002](./adr/0002-nestjs-typeorm-en-lugar-de-fastapi.md)        | NestJS + TypeORM, con microservicio Python para IA | Aceptada              |
| [0003](./adr/0003-better-auth-con-sesiones-en-base-de-datos.md) | Better Auth con sesiones en base de datos          | Aceptada              |
| [0004](./adr/0004-tailwind-v4-y-nativewind-5.md)                | Tailwind v4 y NativeWind 5 preview                 | Aceptada (con riesgo) |
| [0005](./adr/0005-eslint-prettier-oxlint.md)                    | ESLint + Prettier + Oxlint                         | Aceptada              |
| [0006](./adr/0006-sqlite-por-defecto-postgres-para-equipos.md)  | SQLite por defecto, Postgres para equipos          | Aceptada              |
