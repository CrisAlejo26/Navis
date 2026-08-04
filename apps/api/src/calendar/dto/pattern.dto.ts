import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CONGREGATION_ACCENTS, MAX_PHASES, type CongregationAccent } from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** El nombre de una fase, tal y como lo escribe cada iglesia (D6). */
export class PhaseDto {
  @ApiProperty({ example: 'Enseñanza' })
  @IsString()
  @Transform(trimmed)
  @Matches(/\S/, { message: 'La fase necesita un nombre' })
  name: string;
}

/** «Los viernes en Elda a las 20:00, con estas fases». */
export class CreatePatternDto {
  @ApiProperty()
  @IsUUID()
  congregationId: string;

  @ApiProperty({ example: 'Culto' })
  @IsString()
  @Transform(trimmed)
  @Matches(/\S\S/, { message: 'La reunión necesita un nombre' })
  name: string;

  @ApiProperty({ description: 'Domingo es 0', example: 5 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @ApiProperty({ example: '20:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'La hora debe tener el formato HH:MM' })
  startTime: string;

  @ApiPropertyOptional({ enum: CONGREGATION_ACCENTS })
  @IsOptional()
  @IsIn(CONGREGATION_ACCENTS)
  accent?: CongregationAccent;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601({ strict: true })
  validFrom?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601({ strict: true })
  validTo?: string | null;

  @ApiProperty({ type: [PhaseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PHASES)
  @ValidateNested({ each: true })
  @Type(() => PhaseDto)
  phases: PhaseDto[];
}

export class UpdatePatternDto extends PartialType(CreatePatternDto) {
  @ApiPropertyOptional({ description: 'Apagarlo deja de proponer sus reuniones' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
