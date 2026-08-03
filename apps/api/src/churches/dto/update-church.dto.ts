import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

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
}
