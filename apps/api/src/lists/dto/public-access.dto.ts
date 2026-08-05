import { ApiProperty } from '@nestjs/swagger';
import { LIST_USERNAME_PATTERN } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

import { IsListPassword } from './list-password.decorator';

/**
 * Lo que se teclea en **la puerta** (RFC 0010 §8.6).
 *
 * El usuario se pasa a minúsculas antes de comprobarlo porque en un móvil
 * «Ancianos» con mayúscula inicial es el fallo número uno, y la contraseña entra
 * con guiones o sin ellos (D25).
 */
export class PublicListAccessDto {
  @ApiProperty({ example: 'juan.perez' })
  @IsString()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @Matches(LIST_USERNAME_PATTERN, { message: 'Usuario o contraseña incorrectos' })
  username: string;

  @ApiProperty({ example: 'k7fr-m3np-t9wx' })
  @IsListPassword()
  password: string;
}
