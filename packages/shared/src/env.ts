import { z } from 'zod';

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) => (typeof value === 'boolean' ? value : value.toLowerCase() === 'true'));

const csv = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );

/**
 * Motor de base de datos. `sqlite` es el modo por defecto: una instalación
 * recién clonada arranca contra un fichero local sin depender de Docker.
 * `postgres` es el modo compartido: varias instalaciones (web, móvil,
 * escritorio) apuntan al mismo servidor.
 */
export const DB_DRIVERS = ['sqlite', 'postgres'] as const;
export type DbDriver = (typeof DB_DRIVERS)[number];

/**
 * Contrato de variables de entorno de la API. Se valida al arrancar
 * (ver apps/api/src/config/env.ts): si falta algo, el proceso muere
 * inmediatamente en vez de fallar a mitad de una petición.
 */
export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    API_PREFIX: z.string().default('api'),
    API_VERSION: z.string().default('1'),
    CORS_ORIGINS: csv('http://localhost:5173'),

    // --- Base de datos ------------------------------------------------------
    DB_DRIVER: z.enum(DB_DRIVERS).default('sqlite'),
    /** Solo para `DB_DRIVER=sqlite`. Ruta relativa a la raíz del monorepo. */
    DB_SQLITE_PATH: z.string().default('./data/fidus.sqlite'),

    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.coerce.number().int().default(5432),
    POSTGRES_USER: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    POSTGRES_DB: z.string().optional(),

    // --- Better Auth (sesiones persistidas en la base de datos) -------------
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET debe tener al menos 32 caracteres'),
    BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
    /** Orígenes de confianza extra (deep links de la app móvil, etc.). */
    AUTH_TRUSTED_ORIGINS: csv('http://localhost:5173,fidus://'),
    SESSION_EXPIRES_IN_DAYS: z.coerce.number().int().min(1).default(30),

    /**
     * Actívalo SOLO si la API está detrás de un proxy de confianza (nginx,
     * Traefik, Cloudflare). Con él, la IP del cliente se lee de las cabeceras
     * `X-Forwarded-For`; sin proxy delante, cualquiera podría falsificarla y
     * saltarse el límite de peticiones.
     */
    TRUST_PROXY: booleanish.default(false),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    AI_ENABLED: booleanish.default(false),
    AI_PROVIDER: z.enum(['anthropic', 'python-service']).default('anthropic'),
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default('claude-sonnet-5'),
    AI_SERVICE_URL: z.url().optional(),
  })
  .superRefine((env, ctx) => {
    // Las credenciales de Postgres solo son obligatorias si se usa Postgres:
    // en modo sqlite el fichero .env puede no tenerlas siquiera.
    if (env.DB_DRIVER !== 'postgres') return;
    for (const key of ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} es obligatoria cuando DB_DRIVER=postgres`,
        });
      }
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;

/**
 * Contrato de las variables que Vite expone al navegador (`import.meta.env`).
 * Todo lo que empieza por `VITE_` acaba en el bundle: aquí NO va ningún secreto.
 */
export const webEnvSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3000/api/v1'),
  VITE_AUTH_URL: z.url().default('http://localhost:3000'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

/**
 * Contrato de las variables que Expo expone al bundle (`EXPO_PUBLIC_*`).
 * Mismo aviso que en web: son públicas, nunca pongas secretos.
 */
export const mobileEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url().default('http://localhost:3000/api/v1'),
  EXPO_PUBLIC_AUTH_URL: z.url().default('http://localhost:3000'),
  EXPO_PUBLIC_APP_SCHEME: z.string().default('fidus'),
});

export type MobileEnv = z.infer<typeof mobileEnvSchema>;

/**
 * Valida un objeto de entorno y, si falla, lanza un error con todas las
 * variables mal puestas de una vez en lugar de la primera que encuentre.
 */
export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: unknown,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const detail = result.error.issues
    .map((issue) => `  · ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Variables de entorno inválidas (${label}):\n${detail}`);
}
