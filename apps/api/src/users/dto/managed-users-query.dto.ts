import { ApiPropertyOptional } from '@nestjs/swagger';
import { USER_SORT_FIELDS, type RoleSlug, type UserSortField } from '@navis/shared';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsRoleSlug } from '../../common/dto/role-slug.decorator';

/** Filtros del listado de usuarios. Llegan por query string. */
export class ManagedUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Deja solo las cuentas con ese rol', example: 'pastor' })
  @IsOptional()
  @IsRoleSlug()
  role?: RoleSlug;

  @ApiPropertyOptional({ description: 'Deja solo las cuentas de esa iglesia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  churchId?: string;

  @ApiPropertyOptional({ enum: USER_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sort: UserSortField = 'createdAt';
}
