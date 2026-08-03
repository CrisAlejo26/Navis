import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { openAPI } from 'better-auth/plugins';
import BetterSqlite3, { type Database as SqliteDatabase } from 'better-sqlite3';
import { Pool } from 'pg';

import { env, isProduction, sqlitePath } from '../config/env';
import { ensureSqliteDirectory } from '../database/data-source';

/**
 * Conexión dedicada a Better Auth, del mismo motor que el resto de la app.
 * Better Auth gestiona sus propias tablas (`user`, `session`, `account`,
 * `verification`) mediante Kysely; el dominio lo gestiona TypeORM en la MISMA
 * base de datos, así que las claves foráneas funcionan entre ambos mundos.
 *
 * Crear el esquema:  pnpm --filter @pastortools/api auth:migrate
 */
function createAuthDatabase(): Pool | SqliteDatabase {
  if (env.DB_DRIVER === 'postgres') {
    return new Pool({
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
      max: 10,
    });
  }

  ensureSqliteDirectory();
  return new BetterSqlite3(sqlitePath);
}

export const authDatabase = createAuthDatabase();

export const auth = betterAuth({
  appName: 'PastorTools',
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  database: authDatabase,

  // Las sesiones se guardan en la tabla `session` de la base de datos, no en
  // un JWT sin estado: así se pueden revocar desde el servidor.
  session: {
    expiresIn: env.SESSION_EXPIRES_IN_DAYS * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
  },

  // Campos propios añadidos a la tabla `user` de Better Auth.
  // `input: false` impide que el cliente los envíe al registrarse.
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'member',
        input: false,
      },
      locale: {
        type: 'string',
        required: false,
        defaultValue: 'es',
        input: false,
      },
    },
  },

  // Web (Vite), Expo dev server y el deep link de la app móvil.
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS,

  advanced: {
    // Sin esto, detrás de un proxy Better Auth no distingue a los clientes y
    // aplica un único cubo de rate limit compartido para todo el mundo.
    ipAddress: env.TRUST_PROXY
      ? { ipAddressHeaders: ['x-forwarded-for', 'cf-connecting-ip'] }
      : undefined,
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
    },
  },

  plugins: [
    // Cliente nativo: guarda la cookie de sesión en expo-secure-store.
    expo(),
    // Documentación viva de los endpoints de auth en /api/auth/reference.
    openAPI(),
  ],

  telemetry: { enabled: false },
});

export type Auth = typeof auth;
export type AuthSession = Auth['$Infer']['Session'];
export type AuthUser = AuthSession['user'];

export default auth;
