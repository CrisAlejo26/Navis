import { ApiPropertyOptional } from '@nestjs/swagger';
import type { Ministry } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

const booleano = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value === 'true' : value;

/** Filtros del listado de personas. Llegan por query string. */
export class BelieversQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nombre o apellidos' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ example: 'pulpito' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  ministry?: Ministry;

  @ApiPropertyOptional({ description: 'Incluye también a quien ya no está' })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  includeInactive?: boolean;
}
