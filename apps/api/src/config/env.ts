import { apiEnvSchema, type ApiEnv, parseEnv } from '@navis/shared';
import { config as loadDotenv } from 'dotenv';
import { isAbsolute, resolve } from 'node:path';

/** Raíz del monorepo, calculada desde apps/api. */
export const monorepoRoot = resolve(process.cwd(), '../..');

// El .env vive en la raíz del monorepo: así api, docker compose y los
// scripts de migración comparten exactamente los mismos valores.
loadDotenv({ path: resolve(monorepoRoot, '.env'), quiet: true });
loadDotenv({ quiet: true });

/**
 * Entorno validado con zod. Se evalúa una sola vez al importar el módulo, de
 * modo que un .env incompleto tumba el proceso al arrancar y no a mitad de una
 * petición. Lo consumen Nest (ConfigModule), Better Auth y el CLI de TypeORM.
 */
export const env: ApiEnv = parseEnv(apiEnvSchema, process.env, 'apps/api — revisa tu .env');

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * Ruta absoluta del fichero SQLite. Se resuelve contra la raíz del monorepo
 * para que dé igual desde dónde se lance el comando (raíz, apps/api o Docker).
 */
export const sqlitePath = isAbsolute(env.DB_SQLITE_PATH)
  ? env.DB_SQLITE_PATH
  : resolve(monorepoRoot, env.DB_SQLITE_PATH);
