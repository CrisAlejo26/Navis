import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';

import { ShipLoader } from '@/components/ui/ship-loader';
import { useSession } from '@/lib/auth-client';

/** Bloquea el acceso a las rutas privadas mientras no haya sesión válida. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <ShipLoader size="lg" label={t('common.loading')} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
