# Fidus — convenciones del repositorio

Contexto para quien (o lo que) trabaje en este código. Las reglas de
colaboración están en [`CONTRIBUTING.md`](./CONTRIBUTING.md); aquí va lo que hay
que saber del terreno para no tropezar.

## Qué es

Monorepo pnpm con cuatro clientes (API, web, móvil, escritorio) sobre paquetes
compartidos. La funcionalidad de negocio **todavía no está implementada**: cada
sección tiene su propuesta escrita en [`docs/rfcs`](./docs/rfcs) y una pantalla
puente que enlaza a ella.

## Mapa

```
apps/api        NestJS 11 + TypeORM 1 + Better Auth
apps/web        Vite 8 + React 19 + React Router 8 (PWA)
apps/mobile     Expo 57 + expo-router + NativeWind 5
apps/desktop    Tauri 2 (Rust) envolviendo apps/web
apps/ai         microservicio Python (esqueleto)
packages/shared      tipos y esquemas zod, incluido el contrato de entorno
packages/theme       tokens Tailwind v4 y store de tema (light/dark/system)
packages/i18n        seis idiomas, con detección del idioma del dispositivo
packages/api-client  cliente HTTP tipado y hooks de TanStack Query
```

## Trampas de este repositorio

Cosas que ya han costado un rato y no hace falta volver a descubrir.

- **`node-linker=hoisted`** es obligatorio (Metro/Expo). Consecuencia: los
  paquetes viven en el `node_modules` de la raíz, no en el de cada app. Por eso
  el CLI de TypeORM se lanza desde `apps/api/scripts/typeorm.mjs`, que lo
  resuelve con `require.resolve`.
- **`inject-workspace-packages` debe seguir desactivado**: copia los paquetes
  del workspace en vez de enlazarlos y congela su `dist`.
- **TypeScript se queda en 5.9.3**: `@nestjs/cli@11` lo fija internamente y todo
  Nest/TypeORM depende de `emitDecoratorMetadata`.
- **`lightningcss` fijado en 1.30.1**: con 1.33 el compilador de
  react-native-css falla y no se puede empaquetar la app móvil.
- **`bodyParser: false` en `NestFactory.create`**: Better Auth necesita el
  cuerpo crudo y su handler se monta antes que `express.json()`.
- **`tsconfig.build.json` de la API no lleva `rootDir`**: el builder de SWC solo
  aplica `stripLeadingPaths` si no lo hay; con él, la salida sería
  `dist/src/main.js`.
- **Las entidades de TypeORM se listan a mano**, sin globs: con glob, TypeORM
  hace `require()` de ficheros `.ts` al correr los tests sobre el fuente.
- **El `DataSource` es la única exportación de su tipo** en `data-source.ts`: el
  CLI de TypeORM falla si encuentra dos (por eso no hay `export default`).
- **`/health` es `VERSION_NEUTRAL`**: el versionado por URI lo dejaría en
  `/v1/health` y tanto Docker como el despliegue consultan `/health`.
- **En postgres:18 el volumen va en `/var/lib/postgresql`**, no en `/data`.
- **En Jest (móvil) el preset de NativeWind se desactiva**: sus componentes
  chocan con los mocks de React Native. Los tests comprueban comportamiento, no
  estilos.
- **`@testing-library/react-native` 14: `render` y `fireEvent` son asíncronos.**
- **La versión vive en siete sitios** (package.json de la raíz y de cada app,
  app.config.ts, tauri.conf.json, Cargo.toml y Cargo.lock). No la toques a
  mano: `pnpm release` los sincroniza y hay un test que falla si alguno se
  queda descolgado.

## Antes de dar algo por terminado

```bash
pnpm check        # formato + lint + tipos + tests (incluye los del script de release)
pnpm test:e2e     # API y web
```

Y, si has tocado la app móvil o la de escritorio:

```bash
pnpm --filter @fidus/mobile exec expo-doctor
cd apps/desktop/src-tauri && cargo check
```
