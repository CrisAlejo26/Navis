import { createApiClient } from '@navis/api-client';

import { env } from '@/lib/env';
import { getLocale } from '@/lib/i18n';

/**
 * El cliente de **la página pública de una lista** (RFC 0010 §7.3).
 *
 * Es el mismo `createApiClient` de siempre pero **sin `onUnauthorized`**, y esa
 * es toda la razón de que exista: el 401 de una lista restringida no es una
 * sesión caducada, es **la puerta**, y con el cliente de la aplicación mandaría
 * a `/login` a alguien que no tiene cuenta ni la va a tener (D22, D40).
 */
export const publicApi = createApiClient({
  baseUrl: env.VITE_API_URL,
  getLocale,
});
