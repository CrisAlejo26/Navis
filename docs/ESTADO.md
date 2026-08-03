# Estado del proyecto

_Última actualización: 2026-08-03_

## Resumen

**Toda la infraestructura está terminada y verificada de punta a punta.** Las
cuatro aplicaciones compilan, pasan sus tests y arrancan; las migraciones y la
autenticación funcionan contra SQLite y contra Postgres; las imágenes de Docker
se construyen y se ejecutan; y hay un flujo de despliegue que verifica, migra y
redespliega.

Lo que falta es la **funcionalidad de negocio**: cada sección tiene su propuesta
escrita en [`rfcs/`](./rfcs) y una pantalla puente que enlaza a ella.

## Verificado en esta sesión (resultados reales)

| Comprobación                                  | Resultado                                                             |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm install`                                | ✅ 10 proyectos del workspace                                         |
| `pnpm check` (formato + lint + tipos + tests) | ✅ 11/11 tareas                                                       |
| Tests unitarios                               | ✅ 24: shared 5, theme 6, i18n 5, api-client 2, api 4, web 2, móvil 2 |
| `pnpm --filter @navis/api test:e2e`           | ✅ 5/5, en **SQLite y en Postgres**                                   |
| `pnpm --filter @navis/web test:e2e`           | ✅ 8/8 (Playwright, chromium + móvil)                                 |
| Migraciones y semilla                         | ✅ en los dos motores                                                 |
| Arranque real de la API                       | ✅ `/health`, registro, login, `GET`/`PATCH` de perfil, `/api/docs`   |
| App móvil: `expo export --platform android`   | ✅ 2502 módulos; las clases de NativeWind están en el bundle          |
| App móvil: `expo-doctor`                      | ✅ 20/20                                                              |
| App de escritorio: `cargo check`              | ✅ sin errores (Rust 1.95)                                            |
| Imagen Docker de la API                       | ✅ 472 MB; arranca contra Postgres y su healthcheck da `healthy`      |
| Imagen Docker de la web                       | ✅ 67 MB; manifest, `sw.js` sin caché, fallback de SPA e iconos       |
| Contenedor de migraciones                     | ✅ aplica Better Auth + TypeORM y sale                                |
| `docker compose config`                       | ✅ los tres ficheros (dev, prod y deploy)                             |

**No verificado**: el despliegue real por SSH contra un servidor (hace falta un
servidor) y la app móvil ejecutándose en un dispositivo (solo está comprobado
que empaqueta correctamente).

## Completado

- **Raíz**: pnpm workspaces + catálogo, Turborepo, TypeScript 5.9.3, Prettier +
  ESLint 10 + Oxlint con formateo al guardar, husky + lint-staged + commitlint,
  LICENSE MIT, README, CONTRIBUTING, código de conducta y plantillas de issue/PR.
- **`packages/`**: `shared` (tipos, esquemas zod y contrato de entorno),
  `theme` (tokens Tailwind v4 y store claro/oscuro/sistema), `i18n` (seis
  idiomas con detección del dispositivo), `api-client` (cliente HTTP tipado y
  hooks de TanStack Query), más `eslint-config` y `tsconfig`.
- **`apps/api`**: NestJS 11, Better Auth con sesiones en base de datos,
  **SQLite o Postgres según `DB_DRIVER`**, guardias de sesión y rol, entidad
  `Profile`, health con Terminus, Swagger, helmet, throttler, pino y módulo de
  IA cableado.
- **`apps/web`**: Vite 8 + React 19 + React Router 8, PWA con aviso de
  actualización, login/registro, rutas protegidas y ajustes de tema e idioma.
- **`apps/mobile`**: Expo 57 + expo-router + NativeWind 5 preview, Better Auth
  con `expo-secure-store`, i18n con `expo-localization` y tema compartido.
- **`apps/desktop`**: Tauri 2 envolviendo la PWA, con plugins de sistema
  operativo y estado de ventana, permisos mínimos e iconos generados.
- **`apps/ai`**: esqueleto FastAPI con el contrato que la API ya sabe consumir.
- **Docker**: compose de desarrollo, producción y despliegue; imágenes de API
  (con etapa de migraciones), web sobre nginx y placeholder de IA.
- **CI/CD**: [`ci.yml`](../.github/workflows/ci.yml) (formato, lint, tipos,
  tests, build, e2e, expo-doctor, cargo check e imágenes) y
  [`deploy.yml`](../.github/workflows/deploy.yml), que reutiliza el CI como
  puerta de entrada, publica imágenes, migra, despliega y revierte si `/health`
  no responde. Ver [`DESPLIEGUE.md`](./DESPLIEGUE.md).
- **Documentación**: siete RFC y seis ADR en [`docs/`](./).

## Producción

Desplegado en **<https://navis.officetools.es>** (VPS propio, `/opt/navis`).
Postgres, API, web y el microservicio de IA en Docker, detrás de nginx con
certificado de Let's Encrypt y renovación automática. La API escucha solo en
`127.0.0.1:3010` y la web en `3011`: al mundo sale nginx.

Verificado en el dominio público: la PWA carga con su manifest y su service
worker, `/health` responde con la base de datos arriba, el login funciona,
`GET`/`PATCH` del perfil también, y la API alcanza al contenedor de IA. Ese
contenedor responde a `/health` pero devuelve **501** en `/v1/complete`: el
esqueleto está conectado, la generación de texto no está implementada.

Mientras los contenedores no están arriba, nginx sirve una página de espera con
código 503 en vez de un 502 en blanco.

## Siguiente paso — por dónde continuar

Implementar las features, en este orden:

1. **[RFC 0003](./rfcs/0003-creyentes-y-notas.md) — creyentes y notas.** Es el
   núcleo del que cuelga todo lo demás.
2. **[RFC 0002](./rfcs/0002-calendario-de-programaciones.md) — calendario.**
3. **[RFC 0001](./rfcs/0001-panel-de-metricas.md) — panel de métricas**, que ya
   tendrá datos que contar.
4. **[RFC 0006](./rfcs/0006-comunicaciones.md) — comunicaciones**, la primera
   que añade WebSocket.
5. **[RFC 0004](./rfcs/0004-profecias-personales.md)** y
   **[RFC 0005](./rfcs/0005-suenos-personales.md)**, que comparten el patrón de
   privacidad y son los mejores candidatos para el servicio de IA local.

Pendientes menores, cuando toque:

- Probar el despliegue real contra un servidor y afinar `DESPLIEGUE.md`.
- Ejecutar la app móvil en un dispositivo.
- Vigilar NativeWind 5: sigue en preview. El plan B está en el
  [ADR 0004](./adr/0004-tailwind-v4-y-nativewind-5.md).

## Decisiones y trampas ya resueltas (no repetir)

Están recogidas en [`CLAUDE.md`](../CLAUDE.md), en la raíz del repositorio. Las
más caras han sido: el volumen de `postgres:18`, el `rootDir` que descoloca la
salida del builder de SWC, los globs de entidades de TypeORM cargando ficheros
`.ts`, la versión de `lightningcss` que rompe el empaquetado móvil, y la
rehidratación del store de tema, que perdía la preferencia en cada recarga.

## Cómo retomar

```bash
cd D:/Proyectos_personales/Navis
cp .env.example .env          # y genera los secretos que indica el fichero
pnpm install
pnpm build:packages
pnpm db:migrate && pnpm db:seed
pnpm dev                      # api en :3000 y web en :5173
```

No hace falta Docker: el modo por defecto es una base de datos local en fichero.
