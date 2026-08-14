import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { RowFilterDto } from './table-row-filter.dto';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Solo tablero o calendario: la de cuadrícula se sintetiza y no se crea (D25). */
export class CreateTableViewDto {
  @ApiProperty({ example: 'Por estado' })
  @IsString()
  @Length(1, 60)
  @Transform(trimmed)
  name: string;

  @ApiProperty({ enum: ['kanban', 'calendar'] })
  @IsIn(['kanban', 'calendar'])
  type: 'kanban' | 'calendar';

  @ApiPropertyOptional({ description: 'La key de la columna de selección, en kanban' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'La key de la columna de fecha, en calendar' })
  @IsOptional()
  @IsString()
  dateColumn?: string;
}

export class UpdateTableViewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 60)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional({ type: [RowFilterDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => RowFilterDto)
  filters?: RowFilterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string | null;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
