import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ACCENT_PATTERN } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Una labor que añade la iglesia a su catálogo.
 *
 * El `slug` no se pide: lo genera el servicio a partir del nombre. Es un
 * identificador, no un dato que se escriba (ver `MinistriesService`).
 */
export class CreateMinistryDto {
  @ApiProperty({ example: 'Profecía por primera vez' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  @ApiPropertyOptional({ description: 'Token de la paleta o hexadecimal', example: '#0d9488' })
  @IsOptional()
  @Matches(ACCENT_PATTERN)
  accent?: string;
}

export class UpdateMinistryDto extends PartialType(CreateMinistryDto) {
  @ApiPropertyOptional({ description: 'Apagada deja de proponerse, sin perder historial' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
