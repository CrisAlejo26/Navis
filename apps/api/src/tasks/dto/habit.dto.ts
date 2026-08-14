import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { HABIT_REPEAT_FREQS } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const booleano = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value === 'true' : value;

/** Crear un hábito (RFC 0018 §5.3, §8.2): repetición simple, sin intervalo ni fin. */
export class CreateHabitDto {
  @ApiProperty({ example: 'Leer la Biblia' })
  @IsString()
  @Length(1, 200)
  @Transform(trimmed)
  title: string;

  @ApiPropertyOptional({ example: 'Un capítulo al día' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  @Transform(trimmed)
  goal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  @Transform(trimmed)
  description?: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  date: string;

  @ApiPropertyOptional({ description: 'Nulo: todo el día', example: '06:30' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time?: string | null;

  @ApiPropertyOptional({ enum: HABIT_REPEAT_FREQS, default: 'ninguna' })
  @IsOptional()
  @IsIn(HABIT_REPEAT_FREQS)
  repeatFreq: (typeof HABIT_REPEAT_FREQS)[number] = 'ninguna';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tagIds: string[] = [];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  reminderEnabled: boolean = true;

  @ApiPropertyOptional({ example: '2026-08-15T06:30' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  reminderAt?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  reminderTagIds: string[] = [];
}

export class UpdateHabitDto extends PartialType(CreateHabitDto) {}
