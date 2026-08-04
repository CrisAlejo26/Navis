import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_PHASES, MEETING_STATUSES, type MeetingStatus } from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { PhaseDto } from './pattern.dto';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Una reunión puntual: la que no nace de ningún patrón. */
export class CreateMeetingDto {
  @ApiProperty()
  @IsUUID()
  congregationId: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsISO8601({ strict: true })
  date: string;

  @ApiProperty({ example: '20:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'La hora debe tener el formato HH:MM' })
  startTime: string;

  @ApiProperty({ example: 'Vigilia' })
  @IsString()
  @Transform(trimmed)
  @Matches(/\S\S/, { message: 'La reunión necesita un nombre' })
  name: string;

  @ApiProperty({ type: [PhaseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PHASES)
  @ValidateNested({ each: true })
  @Type(() => PhaseDto)
  phases: PhaseDto[];
}

export class UpdateMeetingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trimmed)
  @Matches(/\S\S/)
  name?: string;

  @ApiPropertyOptional({ example: '20:30' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiPropertyOptional({ enum: MEETING_STATUSES })
  @IsOptional()
  @IsIn(MEETING_STATUSES)
  status?: MeetingStatus;

  @ApiPropertyOptional({ description: 'Mover la reunión a otra sede' })
  @IsOptional()
  @IsUUID()
  congregationId?: string;
}

/** Fase con su asignación, para reemplazar la lista entera de una reunión. */
export class SlotDto extends PhaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  believerId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(160)
  note?: string | null;
}

export class SetSlotsDto {
  @ApiProperty({ type: [SlotDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PHASES)
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots: SlotDto[];
}
