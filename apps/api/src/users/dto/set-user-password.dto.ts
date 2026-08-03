import { ApiProperty } from '@nestjs/swagger';

import { IsStrongPassword } from '../../common/dto/password.decorator';

/** Contraseña puesta por un administrador. Cierra las sesiones abiertas. */
export class SetUserPasswordDto {
  @ApiProperty({ minLength: 10, example: 'Rebano2026Seguro' })
  @IsStrongPassword()
  password: string;
}
