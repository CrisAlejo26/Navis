import { createApiClient } from '@pastortools/api-client';
import { router } from 'expo-router';

import { getSessionCookie } from './auth-client';
import { env } from './env';
import { getLocale } from './i18n';

/**
 * Cliente de la API de dominio (/api/v1/**). Los endpoints de autenticación
 * NO pasan por aquí: los gestiona `auth-client.ts`.
 *
 * En móvil no hay cookies de navegador, así que la cookie de sesión que
 * guarda Better Auth en el almacén seguro se adjunta a mano en cada petición.
 */
export const api = createApiClient({
  baseUrl: env.EXPO_PUBLIC_API_URL,
  getLocale,
  getAuthHeaders: (): Record<string, string> => {
    const cookie = getSessionCookie();
    return cookie ? { cookie } : {};
  },
  onUnauthorized: () => {
    router.replace('/login');
  },
});
