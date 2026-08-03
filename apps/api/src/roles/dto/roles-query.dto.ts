import { ApiPropertyOptional } from '@nestjs/swagger';
import { ROLE_SORT_FIELDS, type RoleSortField } from '@navis/shared';
import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class RolesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ROLE_SORT_FIELDS, default: 'level' })
  @IsOptional()
  @IsIn(ROLE_SORT_FIELDS)
  sort: RoleSortField = 'level';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  override order: 'asc' | 'desc' = 'asc';
}
