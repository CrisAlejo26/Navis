import { z } from 'zod';

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) => (typeof value === 'boolean' ? value : value.toLowerCase() === 'true'));

/**
 * Contrato de variables de entorno de la API. Se valida al arrancar
 * (ver apps/api/src/config/configuration.ts): si falta algo, el proceso
 * muere inmediatamente en vez de fallar a mitad de una petición.
 */
export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_PREFIX: z.string().default('api'),
  API_VERSION: z.string().default('1'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().int().default(5432),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),

  // --- Better Auth (sesiones persistidas en Postgres) ---
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET debe tener al menos 32 caracteres'),
  BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
  /** Orígenes de confianza extra (deep links de la app móvil, etc.). */
  AUTH_TRUSTED_ORIGINS: z
    .string()
    .default('http://localhost:5173,pastortools://')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  SESSION_EXPIRES_IN_DAYS: z.coerce.number().int().min(1).default(30),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  AI_ENABLED: booleanish.default(false),
  AI_PROVIDER: z.enum(['anthropic', 'python-service']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-sonnet-5'),
  AI_SERVICE_URL: z.url().optional(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
