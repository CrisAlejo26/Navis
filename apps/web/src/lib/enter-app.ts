import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { signIn } from './auth-client';

/**
 * Inicia sesión con unas credenciales recién creadas y entra al panel.
 * Lo comparten las dos pantallas que crean cuentas: el alta y el primer
 * arranque.
 *
 * Se inicia sesión de forma explícita aunque la API tenga `autoSignIn`: la
 * respuesta de `signIn` deja la sesión ya cargada en el cliente de Better
 * Auth. Sin eso, `ProtectedRoute` llegaba a mirar antes de que el alta
 * refrescase el estado, no veía sesión y devolvía al login con la cuenta ya
 * creada.
 *
 * Devuelve el mensaje de error a enseñar, o `null` si ha entrado.
 */
export function useEnterApp(): (email: string, password: string) => Promise<string | null> {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return async (email, password) => {
    const { error } = await signIn.email({ email, password, rememberMe: true });
    if (error) return t('errors.generic');

    await navigate('/', { replace: true });
    return null;
  };
}
