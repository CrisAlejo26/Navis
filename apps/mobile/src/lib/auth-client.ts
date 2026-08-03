import { expoClient } from '@better-auth/expo/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { env } from './env';

/**
 * Cliente de Better Auth para React Native.
 *
 * A diferencia de la web, aquí no hay cookies del navegador: el plugin `expo`
 * guarda la cookie de sesión en el almacén seguro del sistema (Keychain en iOS,
 * EncryptedSharedPreferences en Android) y la adjunta en cada petición.
 */
export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_AUTH_URL,
  plugins: [
    // El `getActions` que declara expoClient en 1.6.25 no encaja con la firma
    // de `BetterAuthClientPlugin` (su `BetterFetch` lleva el genérico del
    // esquema y el de la interfaz no). Es un desajuste solo de tipos: en
    // ejecución funciona. Se silencia aquí en lugar de castear el plugin,
    // porque el cast rompería la inferencia del tipo de la sesión.
    // @ts-expect-error incompatibilidad de tipos de @better-auth/expo 1.6.25
    expoClient({
      scheme: env.EXPO_PUBLIC_APP_SCHEME,
      storagePrefix: 'fidus',
      storage: SecureStore,
    }),
    inferAdditionalFields({
      user: {
        // `input: false` igual que en el servidor: campos de solo lectura.
        role: { type: 'string', input: false },
        locale: { type: 'string', input: false },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Cookie de sesión guardada por el plugin de Expo, para adjuntarla a las
 * llamadas que no pasan por Better Auth (ver `api.ts`).
 */
export function getSessionCookie(): string {
  // El `@ts-expect-error` de arriba deja al plugin sin contribuir sus acciones
  // al tipo del cliente, así que `getCookie` se declara aquí a mano.
  return (authClient as unknown as { getCookie: () => string }).getCookie();
}
