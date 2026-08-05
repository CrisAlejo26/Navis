import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_PROPHECY_SORT,
  DEFAULT_PROPHECY_WINDOW,
  PROPHECY_SORT_FIELDS,
  PROPHECY_STATES,
  PROPHECY_WINDOWS,
  type ProphecySortField,
  type ProphecyState,
  type ProphecyWindow,
} from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsISO8601, IsOptional, Length } from 'class-validator';

import { commaList } from '../../common/dto/comma-list';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Filtros del listado de profecías (RFC 0004 §6.1). */
export class PropheciesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PROPHECY_STATES, isArray: true })
  @IsOptional()
  @Transform(commaList)
  @IsArray()
  @IsIn(PROPHECY_STATES, { each: true })
  state?: ProphecyState[];

  @ApiPropertyOptional({ enum: PROPHECY_WINDOWS, default: DEFAULT_PROPHECY_WINDOW })
  @IsOptional()
  @IsIn(PROPHECY_WINDOWS)
  window: ProphecyWindow = DEFAULT_PROPHECY_WINDOW;

  @ApiPropertyOptional({
    description: 'Ventana a medida, si `window` no llega',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  to?: string;

  @ApiPropertyOptional({ enum: PROPHECY_SORT_FIELDS, default: DEFAULT_PROPHECY_SORT })
  @IsOptional()
  @IsIn(PROPHECY_SORT_FIELDS)
  sort: ProphecySortField = DEFAULT_PROPHECY_SORT;
}
