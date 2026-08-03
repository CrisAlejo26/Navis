import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useSession } from '@/lib/auth-client';

/** Bloquea el acceso a las rutas privadas mientras no haya sesión válida. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  // Mientras se resuelve la sesión, el hueco de lo que viene: es la misma
  // espera que en el resto de la aplicación (esqueletos, no indicadores).
  if (isPending) return <PageSkeleton className="max-w-5xl p-6 md:p-8 mx-auto" />;

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
