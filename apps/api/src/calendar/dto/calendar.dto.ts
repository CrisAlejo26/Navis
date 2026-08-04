import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { Ministry } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Matches, Min, ValidateIf } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Un calendario nuevo: nombre y, si aplica, a quién propone (D16). */
export class CreateCalendarDto {
  @ApiProperty({ example: 'Alabanza' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  /** La **labor**: el slug de un rol del catálogo (`pulpito`, `sonido`…). */
  @ApiPropertyOptional({ example: 'pulpito' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Matches(/^[a-z0-9-]{2,40}$/)
  ministry?: Ministry | null;
}

export class UpdateCalendarDto extends PartialType(CreateCalendarDto) {
  @ApiPropertyOptional({ description: 'El orden en la barra lateral' })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
