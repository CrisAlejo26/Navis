import { SetMetadata } from '@nestjs/common';
import type { Role } from '@fidus/shared';

export const ROLES_KEY = 'roles';

/**
 * Rol mínimo exigido por la ruta. La comparación usa ROLE_HIERARCHY, así que
 * `@Roles('leader')` deja pasar también a `pastor` y `admin`.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
