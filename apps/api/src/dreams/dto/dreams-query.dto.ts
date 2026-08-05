import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_DREAM_SORT,
  DREAM_SORT_FIELDS,
  DREAM_STATES,
  type DreamSortField,
  type DreamState,
} from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsISO8601, IsOptional, IsUUID, Length, Min } from 'class-validator';

import { commaList } from '../../common/dto/comma-list';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Filtros del listado de sueños (RFC 0005 §6.1). */
export class DreamsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DREAM_STATES, isArray: true })
  @IsOptional()
  @Transform(commaList)
  @IsArray()
  @IsIn(DREAM_STATES, { each: true })
  state?: DreamState[];

  @ApiPropertyOptional({ type: [String], description: 'Suman: el que lleve cualquiera de ellas' })
  @IsOptional()
  @Transform(commaList)
  @IsArray()
  @IsUUID('4', { each: true })
  emotion?: string[];

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  to?: string;

  @ApiPropertyOptional({ description: 'Un año entero, para el selector de la ficha' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year?: number;

  @ApiPropertyOptional({ enum: DREAM_SORT_FIELDS, default: DEFAULT_DREAM_SORT })
  @IsOptional()
  @IsIn(DREAM_SORT_FIELDS)
  sort: DreamSortField = DEFAULT_DREAM_SORT;
}
