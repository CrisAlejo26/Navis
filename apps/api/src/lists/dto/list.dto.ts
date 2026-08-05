import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ACCENT_PALETTE, ACCENT_PATTERN, CONGREGATION_ACCENTS } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

/** Las normalizaciones, tipadas: `TransformFnParams` trae `value` como `any`. */
const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateListDto {
  @ApiProperty({ example: 'Púlpito' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  @ApiPropertyOptional({ description: 'Sale en la tarjeta de WhatsApp' })
  @IsOptional()
  @IsString()
  @Length(0, 280)
  @Transform(trimmed)
  description?: string;

  @ApiPropertyOptional({
    description: 'Un token de la paleta o un hexadecimal',
    examples: [...CONGREGATION_ACCENTS, ...ACCENT_PALETTE],
  })
  @IsOptional()
  @Matches(ACCENT_PATTERN)
  accent?: string;
}

export class UpdateListDto extends PartialType(CreateListDto) {
  @ApiPropertyOptional({ description: 'Apagada sale de la barra lateral, no se borra' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'El orden en la barra lateral' })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: 'Si la página pública deja descargar el cartel' })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;
}
