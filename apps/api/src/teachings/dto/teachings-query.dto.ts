import { ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_TEACHING_SORT, TEACHING_SORT_FIELDS, type TeachingSortField } from '@navis/shared';
import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Filtros del listado de enseñanzas (RFC 0022 §4.4). */
export class TeachingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TEACHING_SORT_FIELDS, default: DEFAULT_TEACHING_SORT })
  @IsOptional()
  @IsIn(TEACHING_SORT_FIELDS)
  sort: TeachingSortField = DEFAULT_TEACHING_SORT;
}
