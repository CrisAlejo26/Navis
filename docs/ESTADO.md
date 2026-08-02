# Estado del proyecto

_Última actualización: 2026-08-02_

## Resumen

El monorepo está creado y **la base compila, pasa los tests y construye**. Falta la app
móvil, la app de escritorio, Docker/CI y los documentos de features.

## Verificado en esta sesión (resultados reales)

| Comando | Resultado |
| --- | --- |
| `pnpm install` | ✅ 1448 paquetes, 9 proyectos del workspace |
| `pnpm build:packages` | ✅ 4 paquetes compilados (shared, theme, i18n, api-client) |
| `pnpm --filter "./packages/*" test` | ✅ 12 tests |
| `pnpm --filter @pastortools/api typecheck` | ✅ sin errores |
| `pnpm --filter @pastortools/api test` | ✅ 4 tests (RolesGuard) |
| `pnpm --filter @pastortools/web typecheck` | ✅ sin errores |
| `pnpm --filter @pastortools/web test` | ✅ 2 tests (ThemeToggle) |
| `pnpm --filter @pastortools/web build` | ✅ build + service worker (18 entradas precacheadas) |

**Todavía NO verificado** (necesita Postgres levantado): migraciones, arranque real de la
API, `pnpm db:seed`, tests e2e de la API y de Playwright.

## Completado

- **Raíz del monorepo**: pnpm workspaces + catálogo de versiones, Turborepo 2.10,
  TypeScript 5.9.3, `.editorconfig`, `.gitignore`, `.env.example`, LICENSE MIT,
  commitlint + husky + lint-staged.
- **Formato y lint**: Prettier 3.9 (con `prettier-plugin-tailwindcss`) + ESLint 10 flat
  config en `packages/eslint-config` (variantes base / react / nest / expo) + Oxlint 1.76
  como pasada rápida. `.vscode/settings.json` con formateo al guardar y `fixAll` de ESLint.
- **`packages/shared`**: tipos, esquemas zod 4 (auth, perfil, paginación, errores),
  contrato de variables de entorno, constantes de roles/idiomas/temas.
- **`packages/theme`**: tokens Tailwind v4 CSS-first (`@theme inline` + `:root` / `.dark`),
  equivalentes en JS y store de tema con zustand (`light` / `dark` / `system`) con
  adaptadores de plataforma inyectables.
- **`packages/i18n`**: seis idiomas (es, en, fr, pt, de, it) con **detección automática del
  idioma del dispositivo** y respaldo a español; tipado estricto de claves; un test
  comprueba que los seis ficheros tienen exactamente las mismas claves.
- **`packages/api-client`**: cliente fetch tipado con normalización de errores
  (`ApiError`), `queryKeys` centralizadas, hooks de TanStack Query y `createQueryClient`
  con política de reintentos.
- **`apps/api`** (NestJS 11): Better Auth 1.6 montado en `/api/auth` con Postgres,
  `SessionGuard` global + `RolesGuard` por jerarquía, entidad `Profile` con TypeORM 1.1 y
  migración inicial, health con Terminus, Swagger, helmet, throttler, pino, filtro de
  excepciones unificado, módulo de IA cableado y desactivado, semilla de admin.
- **`apps/web`** (Vite 8 + React 19 + React Router 8): PWA con `vite-plugin-pwa`
  (manifest, precache, `NetworkFirst` para la API, aviso de actualización), login/registro
  con Better Auth, rutas protegidas, layout con navegación lateral e inferior, ajustes con
  selector de tema e idioma, tests con Vitest + Testing Library y suite Playwright.

## Siguiente paso — por dónde continuar

1. **`apps/mobile`** (tarea en curso). Expo SDK 57 + expo-router + **NativeWind 5.0.0-preview.4
   con Tailwind 4**, `@better-auth/expo` con `expo-secure-store`, i18n con
   `expo-localization`, tema compartido vía `Appearance` + `colorScheme` de NativeWind.
   - Crear las dependencias nativas siempre con `pnpm dlx expo install`, nunca a mano.
   - `metro.config.js` necesita `watchFolders` a la raíz y `nodeModulesPaths` (monorepo).
   - Riesgo conocido: NativeWind 5 es preview. Si bloquea, el plan B es NativeWind 4 +
     Tailwind 3 solo en móvil.
2. **`apps/desktop`**: Tauri 2.11 (Rust 1.95 ya instalado) envolviendo `apps/web`
   (`devUrl` 5173 / `frontendDist` `../../web/dist`), plugins `os` y `window-state`.
   Los iconos se generan con `tauri icon` a partir de `apps/web/public/favicon.svg`.
3. **Docker + CI**: `docker-compose.yml` con `postgres:18-alpine`, Dockerfiles multi-stage
   de api (usar `pnpm deploy --legacy`, ver nota abajo) y web (nginx), placeholder Python
   de `apps/ai`, y workflow de GitHub Actions con lint → typecheck → test → build.
4. **Verificación end-to-end con base de datos**: `pnpm db:up && pnpm db:migrate &&
   pnpm db:seed`, arrancar la API, probar registro/login y `GET /api/v1/me/profile`,
   y lanzar `pnpm --filter @pastortools/api test:e2e` y `pnpm --filter @pastortools/web test:e2e`.
5. **Documentación de features**: escribir los seis RFC listados en
   [`README.md`](./README.md) y los cinco ADR de las decisiones ya tomadas.

## Decisiones y trampas ya resueltas (no repetir)

- **`inject-workspace-packages` debe estar desactivado**: copiaba los paquetes del
  workspace en vez de enlazarlos y congelaba su `dist` en el momento del `install`,
  rompiendo la resolución de tipos. Para Docker se usará `pnpm deploy --legacy`.
- **`node-linker=hoisted`** es obligatorio para que Metro/Expo funcione dentro del
  workspace pnpm.
- **TypeScript se queda en 5.9.3**, no en el 7.0.2 disponible: `@nestjs/cli@11` fija
  internamente 5.9.3 y todo Nest/TypeORM depende de `emitDecoratorMetadata`.
- **Orden de migraciones**: primero `auth:migrate` (crea `user`, `session`, `account`,
  `verification`) y después `migration:run` (la tabla `profiles` tiene una FK contra
  `"user"("id")` y falla con un mensaje explícito si se invierte el orden). El script
  `pnpm db:migrate` de la raíz ya encadena ambos.
- **Los esquemas zod normalizan antes de validar**: `emailSchema` hace `trim` y
  `toLowerCase` y luego valida con `.pipe(z.email())`.
- **Nada de `.default()` en los esquemas que alimentan react-hook-form**: hace que el tipo
  de entrada y el de salida difieran y el resolver deja de encajar.
- **`bodyParser: false` en `NestFactory.create`**: Better Auth necesita el cuerpo crudo, y
  su handler se monta antes que `express.json()`.
- **Rollup 5 (Vite 8) solo admite `manualChunks` como función**, ya no como objeto.

## Cómo retomar

```bash
cd D:/Proyectos_personales/PastorTools
cp .env.example .env          # y genera los secretos que indica el fichero
pnpm install
pnpm build:packages
pnpm db:up && pnpm db:migrate # requiere Docker
pnpm dev                      # api en :3000 y web en :5173
```
