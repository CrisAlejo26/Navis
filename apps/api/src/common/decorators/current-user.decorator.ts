import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthUser } from '../../auth/auth';

/**
 * Inyecta el usuario de la sesión activa. Lo rellena SessionGuard, por lo que
 * en rutas `@Public()` puede ser `undefined`.
 *
 *   findAll(@CurrentUser() user: AuthUser) { … }
 *   findOne(@CurrentUser('id') userId: string) { … }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
