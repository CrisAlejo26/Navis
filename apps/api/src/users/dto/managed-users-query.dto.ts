import { ApiPropertyOptional } from '@nestjs/swagger';
import { USER_SORT_FIELDS, type RoleSlug, type UserSortField } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsRoleSlug } from '../../common/dto/role-slug.decorator';

/** `a,b` → `['a', 'b']`. En la query string todo llega como texto. */
const comaSeparada = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

/** Filtros del listado de usuarios. Llegan por query string. */
export class ManagedUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Deja solo las cuentas con ese rol', example: 'pastor' })
  @IsOptional()
  @IsRoleSlug()
  role?: RoleSlug;

  @ApiPropertyOptional({
    description: 'Deja solo las cuentas de esas iglesias, separadas por comas',
    example: 'uuid,uuid',
  })
  @IsOptional()
  @Transform(comaSeparada)
  @IsArray()
  @IsUUID('all', { each: true })
  churchIds?: string[];

  @ApiPropertyOptional({ enum: USER_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sort: UserSortField = 'createdAt';
}
