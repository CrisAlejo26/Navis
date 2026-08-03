import { ApiProperty } from '@nestjs/swagger';
import type { RoleSlug } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

import { IsStrongPassword } from '../../common/dto/password.decorator';
import { IsRoleSlug } from '../../common/dto/role-slug.decorator';

/** Alta de una cuenta hecha por un administrador. */
export class CreateManagedUserDto {
  @ApiProperty({ example: 'Ana Pastora' })
  @IsString()
  @Length(2, 120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({ example: 'ana@iglesia.es' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email no válido' })
  @Length(3, 255)
  email: string;

  @ApiProperty({ minLength: 10, example: 'Rebano2026Seguro' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'member' })
  @IsRoleSlug()
  role: RoleSlug;
}
