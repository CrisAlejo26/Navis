import { apiEnvSchema, type ApiEnv } from '@pastortools/shared';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

// El .env vive en la raíz del monorepo: así api, docker compose y los
// scripts de migración comparten exactamente los mismos valores.
loadDotenv({ path: resolve(process.cwd(), '../../.env'), quiet: true });
loadDotenv({ quiet: true });

function parseEnv(): ApiEnv {
  const result = apiEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  · ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Variables de entorno inválidas. Revisa tu .env (copia .env.example):\n${issues}`,
    );
  }

  return result.data;
}

/**
 * Entorno validado. Se evalúa una sola vez al importar el módulo, de modo que
 * un .env incompleto tumba el proceso al arrancar y no a mitad de una petición.
 * Lo consumen tanto Nest (ConfigModule) como el CLI de Better Auth y TypeORM.
 */
export const env = parseEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
