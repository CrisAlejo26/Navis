import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * La iglesia sobre la que se está trabajando, puesta por `ActiveChurchGuard`.
 *
 * La pone **el servidor** y nunca el cliente (RFC 0008 D2): si la iglesia
 * llegase en el cuerpo o en una cabecera, cualquiera podría pedir los datos de
 * otra congregación sin más que cambiar un identificador.
 *
 *   listar(@CurrentChurch() churchId: string) { … }
 */
export const CurrentChurch = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>();
  return request.churchId;
});
