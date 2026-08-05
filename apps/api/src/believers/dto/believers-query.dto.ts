import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  BELIEVER_SORT_FIELDS,
  BELIEVER_STATUSES,
  DEFAULT_BELIEVER_SORT,
  type BelieverSortField,
  type BelieverStatus,
} from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

import { commaList } from '../../common/dto/comma-list';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const booleano = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value === 'true' : value;

/**
 * Filtros del listado de creyentes (RFC 0003 §6.1).
 *
 * Los identificadores vienen validados como UUID a propósito: es lo que impide
 * que llegue una cadena vacía a un `IN ('')` contra una columna `uuid`, que en
 * Postgres revienta la consulta entera (CLAUDE.md).
 */
export class BelieversQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BELIEVER_STATUSES, isArray: true })
  @IsOptional()
  @Transform(commaList)
  @IsArray()
  @IsIn(BELIEVER_STATUSES, { each: true })
  status?: BelieverStatus[];

  @ApiPropertyOptional({ description: 'Solo los de esa sede' })
  @IsOptional()
  @IsUUID()
  congregationId?: string;

  @ApiPropertyOptional({ description: 'Solo quien tenga ese don' })
  @IsOptional()
  @IsUUID()
  giftId?: string;

  @ApiPropertyOptional({ description: 'Solo quien tenga esa labor', example: 'pulpito' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  ministry?: string;

  @ApiPropertyOptional({ description: 'Solo quien esté en esa lista (RFC 0010 §8.7)' })
  @IsOptional()
  @IsUUID()
  listId?: string;

  @ApiPropertyOptional({ description: 'Solo quien esté en esa cantidad de listas o más (D36)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(50)
  inLists?: number;

  @ApiPropertyOptional({ description: 'Deja solo a quien ha agotado su margen' })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  attention?: boolean;

  @ApiPropertyOptional({ enum: BELIEVER_SORT_FIELDS, default: DEFAULT_BELIEVER_SORT })
  @IsOptional()
  @IsIn(BELIEVER_SORT_FIELDS)
  sort: BelieverSortField = DEFAULT_BELIEVER_SORT;
}
