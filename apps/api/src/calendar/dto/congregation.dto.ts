import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CONGREGATION_ACCENTS, type CongregationAccent } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Una sede se crea con **dos campos**, y desde el propio día que se está
 * programando: si crear el sitio donde se reúnen cuesta más que apuntarlo en
 * la hoja de cálculo, nadie lo hará.
 */
export class CreateCongregationDto {
  @ApiProperty({ example: 'Elda' })
  @IsString()
  @Length(2, 80)
  @Transform(trimmed)
  name: string;

  @ApiPropertyOptional({ example: 'Elda' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  @Transform(trimmed)
  city?: string;

  @ApiPropertyOptional({ enum: CONGREGATION_ACCENTS })
  @IsOptional()
  @IsIn(CONGREGATION_ACCENTS)
  accent?: CongregationAccent;
}

export class UpdateCongregationDto extends PartialType(CreateCongregationDto) {
  @ApiPropertyOptional({ description: 'Apagarla la deja fuera de las propuestas' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
