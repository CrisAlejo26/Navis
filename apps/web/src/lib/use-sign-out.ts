import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { signOut } from './auth-client';

/**
 * Cierra sesión y vuelve al login. Lo comparten las dos pantallas con botón
 * de salir (`SessionFooter` y `NoAccessPage`).
 *
 * Limpia la caché de TanStack Query **antes** de navegar: ninguna clave de
 * `queryKeys` lleva el id de usuario, así que sin este `clear()` quien entra
 * después en el mismo navegador (crear una cuenta y probarla, un ordenador
 * compartido) seguía viendo iglesias, perfil y listados de la cuenta
 * anterior hasta que expiraba su `staleTime` — hasta 30 segundos enseñando
 * datos que no son suyos, y a `ChurchGate` sin enterarse de que la cuenta
 * nueva no tiene iglesia todavía.
 */
export function useSignOut(): () => Promise<void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    await signOut();
    queryClient.clear();
    await navigate('/login', { replace: true });
  };
}
