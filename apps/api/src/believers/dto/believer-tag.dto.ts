import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ACCENT_PATTERN } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Una etiqueta de creyente que añade la iglesia a su catálogo. */
export class CreateBelieverTagDto {
  @ApiProperty({ example: 'En busca de trabajo' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  @ApiPropertyOptional({ description: 'Token de la paleta o hexadecimal', example: '#0d9488' })
  @IsOptional()
  @Matches(ACCENT_PATTERN)
  accent?: string;
}

export class UpdateBelieverTagDto extends PartialType(CreateBelieverTagDto) {
  @ApiPropertyOptional({ description: 'Apagada deja de proponerse, sin perder historial' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
