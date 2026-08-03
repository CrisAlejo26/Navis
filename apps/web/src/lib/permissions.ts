import { useMyRole } from '@navis/api-client';
import { hasPermission, type Permission } from '@navis/shared';
import { useMemo } from 'react';

import { api } from './api';
import { useSession } from './auth-client';

export interface Permissions {
  /** Si el rol de quien ha entrado tiene ese permiso. */
  can: (permission: Permission) => boolean;
  /** Mientras se sabe, no se decide: ni se pinta el menú ni se echa a nadie. */
  isLoading: boolean;
}

/**
 * Lo que puede hacer quien ha entrado.
 *
 * Los permisos no viajan en la sesión: viven en la tabla `roles`, que es donde
 * se cambian en caliente desde la administración de accesos, así que se piden
 * a la API (`/roles/mine`) y se cachean unos minutos.
 *
 * Esto decide lo que se **enseña**. Lo que se **puede** lo decide el guard de
 * la API: esconder una entrada del menú es cortesía, no seguridad.
 */
export function usePermissions(): Permissions {
  const { data: session } = useSession();
  const { data, isLoading } = useMyRole(api, Boolean(session));
  const permissions = data?.permissions;

  return useMemo(
    () => ({
      can: (permission: Permission) => hasPermission(permissions ?? [], permission),
      isLoading: Boolean(session) && isLoading,
    }),
    [permissions, session, isLoading],
  );
}
