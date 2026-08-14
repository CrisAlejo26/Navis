import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ACCENT_PATTERN,
  MAX_SELECT_OPTIONS,
  MAX_TABLE_COLUMNS,
  TABLE_COLUMN_TYPES,
  type TableColumnType,
} from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Una opción de selección única o múltiple. `value` es opcional: si falta, se genera. */
export class ColumnOptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 60)
  value?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 80)
  @Transform(trimmed)
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(ACCENT_PATTERN)
  color?: string;
}

/** Decimales, moneda o si la fecha lleva hora: ajustes propios de un tipo. */
export class ColumnConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  decimals?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeTime?: boolean;
}

export class CreateTableColumnDto {
  @ApiProperty({ example: 'Fecha de lectura' })
  @IsString()
  @Length(1, 80)
  @Transform(trimmed)
  label: string;

  @ApiProperty({ enum: TABLE_COLUMN_TYPES })
  @IsIn(TABLE_COLUMN_TYPES)
  type: TableColumnType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ type: [ColumnOptionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_SELECT_OPTIONS)
  @ValidateNested({ each: true })
  @Type(() => ColumnOptionDto)
  options?: ColumnOptionDto[];

  @ApiPropertyOptional({ type: ColumnConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ColumnConfigDto)
  config?: ColumnConfigDto;
}

export class UpdateTableColumnDto extends PartialType(CreateTableColumnDto) {}

/** El orden entero de las columnas, mandado de golpe (D8). */
export class ReorderTableColumnsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(MAX_TABLE_COLUMNS)
  @IsUUID(undefined, { each: true })
  columnIds: string[];
}
