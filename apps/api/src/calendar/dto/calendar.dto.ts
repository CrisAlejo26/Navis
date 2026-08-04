import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MINISTRIES, type Ministry } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Min, ValidateIf } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Un calendario nuevo: nombre y, si aplica, a quién propone (D16). */
export class CreateCalendarDto {
  @ApiProperty({ example: 'Alabanza' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  @ApiPropertyOptional({ enum: MINISTRIES })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsIn(MINISTRIES)
  ministry?: Ministry | null;
}

export class UpdateCalendarDto extends PartialType(CreateCalendarDto) {
  @ApiPropertyOptional({ description: 'El orden en la barra lateral' })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
