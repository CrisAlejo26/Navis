import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TASK_PRIORITIES, TASK_REPEAT_END_TYPES, TASK_REPEAT_FREQS } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const booleano = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value === 'true' : value;

/**
 * Crear una tarea (RFC 0018 §5.2, §8.2). `repeatFreq`/`repeatEndType` se
 * comprueban en el servicio contra `isRecurring`: el 422 de «falta la
 * frecuencia» o «falta la fecha de fin» necesita leer dos campos a la vez, y
 * eso una anotación de campo no lo expresa sin repetirse.
 */
export class CreateTaskDto {
  @ApiProperty({ example: 'Preparar la predicación' })
  @IsString()
  @Length(1, 200)
  @Transform(trimmed)
  title: string;

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

  @ApiPropertyOptional({ description: 'Nulo: todo el día', example: '09:00' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time?: string | null;

  @ApiPropertyOptional({ enum: TASK_PRIORITIES, default: 'media' })
  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority = 'media' as (typeof TASK_PRIORITIES)[number];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  isRecurring: boolean = false;

  @ApiPropertyOptional({ enum: TASK_REPEAT_FREQS })
  @IsOptional()
  @IsIn(TASK_REPEAT_FREQS)
  repeatFreq?: (typeof TASK_REPEAT_FREQS)[number];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(365)
  repeatInterval = 1;

  @ApiPropertyOptional({ enum: TASK_REPEAT_END_TYPES })
  @IsOptional()
  @IsIn(TASK_REPEAT_END_TYPES)
  repeatEndType?: (typeof TASK_REPEAT_END_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  repeatEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(999)
  repeatEndCount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tagIds: string[] = [];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(booleano)
  @IsBoolean()
  reminderEnabled = true;

  @ApiPropertyOptional({ example: '2026-08-15T09:00' })
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

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
