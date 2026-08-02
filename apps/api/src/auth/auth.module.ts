import { Global, Module } from '@nestjs/common';

import { AuthService } from './auth.service';

/**
 * Los endpoints de Better Auth (`/api/auth/*`) NO son controladores de Nest:
 * se montan como middleware de Express en `main.ts`, antes del body parser,
 * porque Better Auth necesita leer el cuerpo crudo de la petición.
 *
 * Este módulo solo expone el servicio que usan los guards para leer la sesión.
 */
@Global()
@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
