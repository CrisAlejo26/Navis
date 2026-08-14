import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ACCENT_PALETTE,
  ACCENT_PATTERN,
  CONGREGATION_ACCENTS,
  TASK_ICON_CATALOG,
} from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const TASK_ICON_KEYS = TASK_ICON_CATALOG.map((entry) => entry.key);

export class CreateCustomTableDto {
  @ApiProperty({ example: 'Asistencia a la lectura' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  @ApiProperty({ description: 'Clave del catálogo de iconos (D4)', example: 'book-open' })
  @IsIn(TASK_ICON_KEYS)
  icon: string;

  @ApiPropertyOptional({
    description: 'Un token de la paleta o un hexadecimal',
    examples: [...CONGREGATION_ACCENTS, ...ACCENT_PALETTE],
  })
  @IsOptional()
  @Matches(ACCENT_PATTERN)
  accent?: string;
}

export class UpdateCustomTableDto extends PartialType(CreateCustomTableDto) {
  @ApiPropertyOptional({ description: 'Apagada sale de la barra lateral, no se borra' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'El orden en la barra lateral' })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
