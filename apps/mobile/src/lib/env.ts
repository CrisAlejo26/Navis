import { mobileEnvSchema, parseEnv } from '@fidus/shared';

/**
 * Variables de entorno de la app móvil, validadas con zod al arrancar.
 *
 * Metro sustituye literalmente `process.env.EXPO_PUBLIC_*` en tiempo de
 * compilación, así que hay que nombrarlas una a una: no existe un objeto
 * `process.env` que recorrer en el bundle.
 *
 * Cambiando estas variables en el `.env` la misma app pasa de un servidor
 * local a uno compartido, sin tocar código.
 */
export const env = parseEnv(
  mobileEnvSchema,
  {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_AUTH_URL: process.env.EXPO_PUBLIC_AUTH_URL,
    EXPO_PUBLIC_APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME,
  },
  'apps/mobile — revisa tu .env',
);
