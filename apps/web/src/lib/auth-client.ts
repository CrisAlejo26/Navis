import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { env } from './env';

/**
 * Cliente de Better Auth. La sesión viaja en una cookie httpOnly emitida por
 * la API, así que no hay token en localStorage.
 *
 * `inferAdditionalFields` replica en el cliente los campos extra que la API
 * añadió a la tabla `user` (role, locale) para que vengan tipados.
 */
export const authClient = createAuthClient({
  baseURL: env.VITE_AUTH_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        // `input: false` igual que en el servidor: son campos de solo lectura,
        // el cliente no los envía al registrarse.
        role: { type: 'string', input: false },
        locale: { type: 'string', input: false },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
