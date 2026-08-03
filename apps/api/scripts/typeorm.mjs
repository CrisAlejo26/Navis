/**
 * Lanza el CLI de TypeORM resolviendo su ruta con `require.resolve`.
 *
 * Hace falta porque el monorepo usa `node-linker=hoisted` (obligatorio para
 * Metro/Expo): typeorm no está en `apps/api/node_modules`, sino en el
 * `node_modules` de la raíz, así que una ruta escrita a mano en el script de
 * package.json se rompe.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

await import(pathToFileURL(require.resolve('typeorm/cli.js')).href);
