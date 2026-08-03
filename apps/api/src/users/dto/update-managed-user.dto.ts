import { ApiPropertyOptional } from '@nestjs/swagger';
import type { RoleSlug } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

import { IsRoleSlug } from '../../common/dto/role-slug.decorator';

/** Edición de una cuenta ajena desde la administración de accesos. */
export class UpdateManagedUserDto {
  @ApiPropertyOptional({ example: 'Ana Pastora' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ example: 'ana@iglesia.es' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email no válido' })
  @Length(3, 255)
  email?: string;

  @ApiPropertyOptional({ example: 'pastor' })
  @IsOptional()
  @IsRoleSlug()
  role?: RoleSlug;
}
