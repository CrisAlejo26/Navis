import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { signIn, useSession } from './auth-client';

/**
 * Inicia sesión con unas credenciales recién creadas y entra al panel.
 * Lo comparten las dos pantallas que crean cuentas: el alta y el primer
 * arranque.
 *
 * Se inicia sesión de forma explícita aunque la API tenga `autoSignIn`, pero
 * eso no basta por sí solo: el store de sesión de Better Auth (nanostores)
 * solo se refresca mientras algo sigue suscrito a `useSession()`, y ni
 * `register.tsx` ni `setup.tsx` tienen ningún consumidor de sesión antes de
 * esto. Sin el `refetchSession()` de abajo, `ProtectedRoute` podía llegar a
 * mirar con el store todavía sin actualizar, no ver sesión y devolver al
 * login con la cuenta ya creada — intermitente, según lo rápido que
 * `onMount` del store llegara a dispararse.
 *
 * Limpia la caché de TanStack Query antes de navegar: quien acaba de crear
 * esta cuenta puede venir de administrar otra en el mismo navegador (crear un
 * pastor y entrar con él para probarlo), y ninguna clave de `queryKeys` lleva
 * el id de usuario — sin el `clear()`, `ChurchGate` vería las iglesias de la
 * cuenta anterior en caché y no mandaría a `/welcome` a quien de verdad no
 * tiene ninguna.
 *
 * Devuelve el mensaje de error a enseñar, o `null` si ha entrado.
 */
export function useEnterApp(): (email: string, password: string) => Promise<string | null> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refetch: refetchSession } = useSession();

  return async (email, password) => {
    const { error } = await signIn.email({ email, password, rememberMe: true });
    if (error) return t('errors.generic');

    await refetchSession();
    queryClient.clear();
    await navigate('/', { replace: true });
    return null;
  };
}
