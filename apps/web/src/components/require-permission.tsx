import type { Permission } from '@navis/shared';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { PageSkeleton } from '@/components/ui/page-skeleton';
import { usePermissions } from '@/lib/permissions';

/**
 * Deja pasar solo a quien tiene el permiso; al resto lo manda a la pantalla que
 * lo explica. Mientras se sabe qué permisos hay, la página aparece en hueco:
 * echar a alguien antes de tener la respuesta lo sacaría de su propia
 * aplicación al recargar.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can, isLoading } = usePermissions();

  if (isLoading) return <PageSkeleton />;
  if (!can(permission)) return <Navigate to="/no-access" replace />;

  return children;
}
