import { useSetupStatus } from '@navis/api-client';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { api } from '@/lib/api';

/**
 * Encamina según el estado de la instalación.
 *
 *   expects="ready" → login y alta: si no hay ninguna cuenta, a `/setup`.
 *   expects="empty" → primer arranque: si ya hay cuentas, a `/login`.
 *
 * Mientras llega la respuesta no pinta nada: es una consulta corta, se cachea
 * para toda la sesión (`staleTime: Infinity`) y enseñar un login que a los
 * 100 ms se convierte en otra pantalla se ve peor que un instante en blanco.
 *
 * Si la API no responde, deja pasar: más vale un login que dará un error de red
 * al enviar que una aplicación que no arranca.
 */
export function SetupGate({
  expects,
  children,
}: {
  expects: 'ready' | 'empty';
  children: ReactNode;
}) {
  const { data, isPending, isError } = useSetupStatus(api);

  if (isPending) return null;

  if (!isError && data) {
    if (expects === 'ready' && data.needsSetup) return <Navigate to="/setup" replace />;
    if (expects === 'empty' && !data.needsSetup) return <Navigate to="/login" replace />;
  }

  return children;
}
