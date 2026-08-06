import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const vacíoEsNulo = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

/** Edición de la ficha de una iglesia. El identificador no se toca. */
export class UpdateChurchDto {
  @ApiPropertyOptional({ example: 'Iglesia Central' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional({ example: 'Madrid' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  @Transform(trimmed)
  city?: string;

  @ApiPropertyOptional({ example: 'Europe/Madrid' })
  @IsOptional()
  @IsString()
  @Length(3, 64)
  timezone?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alfa-2', example: 'ES' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'El país va en código de dos letras' })
  @Transform(trimmed)
  country?: string;

  /**
   * Vacío se guarda como nulo: un `select` manda `''` cuando no hay nada
   * elegido, y guardar esa cadena dejaría una comunidad que no existe y que no
   * casaría con ningún festivo.
   */
  @ApiPropertyOptional({ description: 'ISO 3166-2; vacío ⇒ solo nacionales', example: 'ES-MD' })
  @IsOptional()
  @IsString()
  @Length(0, 10)
  @Transform(vacíoEsNulo)
  region?: string | null;
}
