import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsISO8601, IsOptional, IsUUID } from 'class-validator';

/** `a,b` → `['a', 'b']`. En la query string todo llega como texto. */
const comaSeparada = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

/**
 * El tramo que se pide del calendario. `from` y `to` son obligatorios: sin
 * tope, una petición sin filtros expandiría los patrones hasta el infinito
 * (el máximo, 92 días, lo comprueba `CalendarService`).
 */
export class RangeQueryDto {
  @ApiProperty({ example: '2026-08-01' })
  @IsISO8601({ strict: true })
  from: string;

  @ApiProperty({ example: '2026-08-31' })
  @IsISO8601({ strict: true })
  to: string;

  @ApiPropertyOptional({
    description: 'Sedes a las que acotar, separadas por comas. Sin esto, todas',
  })
  @IsOptional()
  @Transform(comaSeparada)
  @IsArray()
  @IsUUID('all', { each: true })
  congregation?: string[];
}
