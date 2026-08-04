import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
