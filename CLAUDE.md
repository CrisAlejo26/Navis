# Navis — convenciones del repositorio

Contexto para quien (o lo que) trabaje en este código.

- Las **reglas del proyecto** están en [`.claude/rules/`](./.claude/rules) y se
  aplican a todo lo que se escriba aquí.
- Cómo colaborar, en [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- Aquí abajo, lo que hay que saber del terreno para no tropezar.

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
- **Una migración que importa de `@navis/shared` no está congelada**:
  `CreateRoles` siembra a partir de `ROLES`, así que al cambiar esa constante
  cambió lo que crea en una base de datos **nueva**, no en las que ya existían.
  Las migraciones siguientes que tocan lo mismo tienen que valer para los dos
  casos (ver `SeedMinistryRoles`, que renombra si encuentra lo viejo y siembra
  si no).
- **`queryRunner.query` devuelve `any`** y no acepta genérico: lo que sale de un
  `SELECT` en una migración se comprueba antes de usarlo (Regla 10).
- **`apps/api/src/metadata.ts` lo genera el build y está en `.gitignore`**: con
  `nest start --watch` corriendo, `tsc` lo pillaba a medio escribir y `pnpm
check` fallaba con errores de sintaxis en un fichero que nadie había tocado.
  Está excluido del `tsconfig.json` de la API —no lo importa nadie—, así que si
  vuelve a aparecer el problema es que alguien lo ha vuelto a incluir.
- **`/health` es `VERSION_NEUTRAL`**: el versionado por URI lo dejaría en
  `/v1/health` y tanto Docker como el despliegue consultan `/health`.
- **En postgres:18 el volumen va en `/var/lib/postgresql`**, no en `/data`.
- **En Jest (móvil) el preset de NativeWind se desactiva**: sus componentes
  chocan con los mocks de React Native. Los tests comprueban comportamiento, no
  estilos.
- **`@testing-library/react-native` 14: `render` y `fireEvent` son asíncronos.**
- **La identidad (nombre e icono) no se toca a mano**: `pnpm rename <Nombre>` y
  `pnpm icons`, con `brand.json` y `packages/theme/src/logo/` como fuentes. Hay
  tests que comprueban que está aplicada en todas partes.
- **`pnpm rename` recorre `git ls-files`**, así que lo ignorado por git no lo
  vería: por eso trata aparte `.env*` y `data/` (ahí vivía la base de datos
  local con el nombre viejo), y apunta el slug abandonado en
  `docker/marcas-anteriores.txt` para que `scripts/limpiar-docker.sh` pueda
  borrar del servidor las imágenes que deja atrás.
- **El `.icns` que genera Tauri no es reproducible byte a byte**: sale distinto
  en cada ejecución de `pnpm icons`. Si aparece como único cambio, es ruido.
- **La versión vive en siete sitios** (package.json de la raíz y de cada app,
  app.config.ts, tauri.conf.json, Cargo.toml y Cargo.lock). No la toques a
  mano: `pnpm release` los sincroniza y hay un test que falla si alguno se
  queda descolgado.
- **GHCR solo acepta nombres de imagen en minúsculas**, y `github.repository`
  conserva las mayúsculas (`CrisAlejo26/Navis`). El workflow de despliegue lo
  baja a minúsculas en el paso `meta` y pasa ese nombre al servidor; sin eso,
  `docker buildx` corta con «repository name must be lowercase».

## Antes de dar algo por terminado

```bash
pnpm check        # formato + lint + tipos + tests (incluye los del script de release)
pnpm test:e2e     # API y web
```

Y, si has tocado la app móvil o la de escritorio:

```bash
pnpm --filter @navis/mobile exec expo-doctor
cd apps/desktop/src-tauri && cargo check
```
