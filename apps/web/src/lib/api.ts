import { createApiClient } from '@pastortools/api-client';

import { env } from './env';
import { getLocale } from './i18n';

/**
 * Cliente de la API de dominio (/api/v1/**). Los endpoints de autenticación
 * NO pasan por aquí: los gestiona `auth-client.ts`.
 */
export const api = createApiClient({
  baseUrl: env.VITE_API_URL,
  getLocale,
  onUnauthorized: () => {
    // Evita bucles: solo redirige si no estamos ya en el login.
    if (!globalThis.location.pathname.startsWith('/login')) {
      globalThis.location.assign('/login');
    }
  },
});
