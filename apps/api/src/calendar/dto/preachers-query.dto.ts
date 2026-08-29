import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** `'true'` → `true`. En la query string todo llega como texto. */
const booleano = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value === 'true' : value;

/** Los candidatos del selector, con su reparto en el tramo que se está mirando. */
export class PreachersQueryDto {
  @ApiProperty({ example: '2026-08-01' })
  @IsISO8601({ strict: true })
  from: string;

  @ApiProperty({ example: '2026-08-31' })
  @IsISO8601({ strict: true })
  to: string;

  @ApiPropertyOptional({ description: 'Busca por nombre o apellidos' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({
    description: 'Cualquier creyente activo, no solo quien tiene el ministerio de púlpito',
  })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  all?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;
}
