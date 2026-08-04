import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ACCENT_PATTERN } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Un don que añade la iglesia a su catálogo (RFC 0003 D5). */
export class CreateGiftDto {
  @ApiProperty({ example: 'Interpretación de lenguas' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  @ApiPropertyOptional({ description: 'Token de la paleta o hexadecimal', example: '#0d9488' })
  @IsOptional()
  @Matches(ACCENT_PATTERN)
  accent?: string;
}

export class UpdateGiftDto extends PartialType(CreateGiftDto) {
  @ApiPropertyOptional({ description: 'Apagado deja de proponerse, sin perder historial' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
