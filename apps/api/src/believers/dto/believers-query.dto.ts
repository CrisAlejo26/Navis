import { ApiPropertyOptional } from '@nestjs/swagger';
import { MINISTRIES, type Ministry } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const booleano = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value === 'true' : value;

/** Filtros del listado de personas. Llegan por query string. */
export class BelieversQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nombre o apellidos' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ enum: MINISTRIES })
  @IsOptional()
  @IsIn(MINISTRIES)
  ministry?: Ministry;

  @ApiPropertyOptional({ description: 'Incluye también a quien ya no está' })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  includeInactive?: boolean;
}
