# PastorTools

Herramientas open source para el trabajo pastoral: agenda, seguimiento de
creyentes, notas, profecías, sueños y comunicación del equipo. Web, móvil y
escritorio, en seis idiomas y con tema claro, oscuro o el del sistema.

**Funciona sin servidor.** Por defecto guarda todo en un fichero local (SQLite):
se instala y se usa. Cuando una iglesia necesita que varias personas compartan
los mismos datos, se cambia **una variable** y todas las apps apuntan al mismo
Postgres. Ver [RFC 0007](./docs/rfcs/0007-modo-local-y-servidor.md).

> Estado: **infraestructura completa, funcionalidad por implementar**. Las
> pantallas de creyentes, calendario, profecías, sueños y comunicaciones son
> marcadores de posición que enlazan a su documento en [`docs/rfcs`](./docs/rfcs).

## Arranque rápido

Necesitas Node 24 y pnpm 10. Nada más.

```bash
pnpm install
cp .env.example .env          # genera BETTER_AUTH_SECRET como indica el fichero
pnpm build:packages
pnpm db:migrate && pnpm db:seed
pnpm dev                      # API en :3000 y web en :5173
```

Entra con `admin@pastortools.local` / `PastorTools2026`.

Para trabajar en equipo, pon `DB_DRIVER=postgres` en el `.env`, arranca la base
de datos con `pnpm db:up` (necesita Docker) y repite `pnpm db:migrate`.

## Las apps

| App                              | Qué es                                             | Cómo se arranca                     |
| -------------------------------- | -------------------------------------------------- | ----------------------------------- |
| [`apps/api`](./apps/api)         | NestJS 11 + TypeORM 1 + Better Auth                | `pnpm dev:api`                      |
| [`apps/web`](./apps/web)         | Vite 8 + React 19 + React Router 8, PWA instalable | `pnpm dev:web`                      |
| [`apps/mobile`](./apps/mobile)   | Expo 57 + expo-router + NativeWind 5               | `pnpm dev:mobile`                   |
| [`apps/desktop`](./apps/desktop) | Tauri 2 (Rust) envolviendo la PWA                  | `pnpm dev:desktop`                  |
| [`apps/ai`](./apps/ai)           | Microservicio Python (esqueleto)                   | `docker compose --profile ai up ai` |

Y lo que comparten: [`packages/shared`](./packages/shared) (tipos y esquemas
zod), [`packages/theme`](./packages/theme) (tokens y store de tema),
[`packages/i18n`](./packages/i18n) (es, en, fr, pt, de, it) y
[`packages/api-client`](./packages/api-client) (cliente HTTP y hooks de
TanStack Query).

## Comandos

| Comando                                    | Qué hace                                                         |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `pnpm dev`                                 | API y web con recarga en caliente                                |
| `pnpm check`                               | Formato, lint, tipos y tests: lo mismo que la CI                 |
| `pnpm test` / `pnpm test:e2e`              | Tests unitarios / end-to-end                                     |
| `pnpm build`                               | Construye todo menos el escritorio (compilar Rust tarda minutos) |
| `pnpm db:migrate` / `db:seed` / `db:reset` | Base de datos                                                    |
| `pnpm docker:dev`                          | Todo el stack en contenedores                                    |

## Documentación

- [`docs/`](./docs) — índice de decisiones (ADR) y propuestas de features (RFC)
- [`docs/DESPLIEGUE.md`](./docs/DESPLIEGUE.md) — cómo se despliega a producción
- [`docs/ESTADO.md`](./docs/ESTADO.md) — en qué punto está el proyecto

Antes de tocar código conviene leer [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
