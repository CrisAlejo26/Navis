import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@navis/shared';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Permisos que exige la ruta. Con varios, se exigen **todos**.
 *
 * Puesto en la clase vale para todos sus métodos, y un método con el suyo
 * propio manda sobre el de la clase (`getAllAndOverride`): así el controlador
 * de usuarios pide `users.view` de arriba y `users.manage` solo en lo que
 * escribe.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
