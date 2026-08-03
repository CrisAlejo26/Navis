import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useChurches } from '@/lib/churches';
import { usePermissions } from '@/lib/permissions';

/**
 * Nadie entra a la aplicación sin una iglesia sobre la que trabajar.
 *
 * Quien puede crearlas va a la bienvenida a poner el nombre y la ciudad; quien
 * no, a la pantalla que se lo explica —mandarle a un formulario que no puede
 * rellenar sería peor que no decirle nada (RFC 0008 §7.2)—.
 */
export function ChurchGate({ children }: { children: ReactNode }) {
  const { items, isLoading } = useChurches();
  const { can, isLoading: loadingPermissions } = usePermissions();

  if (isLoading || loadingPermissions) {
    return <PageSkeleton className="max-w-5xl p-6 md:p-8 mx-auto" />;
  }

  if (items.length === 0) {
    return <Navigate to={can('churches.manage') ? '/welcome' : '/no-access'} replace />;
  }

  return children;
}
