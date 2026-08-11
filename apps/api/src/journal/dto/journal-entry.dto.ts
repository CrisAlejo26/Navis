import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ENTRY_KINDS, type EntryKind } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Una entrada del cuaderno (RFC 0017 §6.3).
 *
 * El cuerpo son dos campos (D4): la anotación —obligatoria— y lo aprendido,
 * que puede no haberlo. `giftId` no existe aquí: no hay nada equivalente que
 * enlazar (Alcance).
 */
export class CreateEntryDto {
  @ApiProperty({ example: 'Visita a la familia Gómez' })
  @IsString()
  @Length(1, 200)
  @Transform(trimmed)
  title: string;

  @ApiProperty({ enum: ENTRY_KINDS })
  @IsIn(ENTRY_KINDS)
  kind: EntryKind;

  @ApiProperty({ description: 'Cuándo pasó, no cuándo se escribió', example: '2026-07-14' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  occurredAt: string;

  @ApiProperty({ description: 'Lo que se observó, contó o decidió' })
  @IsString()
  @Length(1, 8000)
  @Transform(trimmed)
  annotation: string;

  @ApiPropertyOptional({ description: 'La reflexión sobre lo anotado' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(0, 8000)
  @Transform(trimmed)
  learned?: string | null;

  /** Día **y hora**: un recordatorio sin hora no recuerda a tiempo (D6). */
  @ApiPropertyOptional({ description: 'Cuándo hay que acordarse', example: '2026-08-12T19:00' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  remindAt?: string | null;

  @ApiPropertyOptional({ description: 'De qué hay que acordarse' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(0, 500)
  @Transform(trimmed)
  remindText?: string | null;
}

export class UpdateEntryDto extends PartialType(CreateEntryDto) {
  @ApiPropertyOptional({
    description: 'Da el recordatorio por atendido, o lo devuelve a pendiente',
  })
  @IsOptional()
  @IsBoolean()
  remindDone?: boolean;
}

/** Lo que acompaña al fichero al subir un audio. Llega como multipart. */
export class UploadAudioDto {
  @ApiPropertyOptional({ description: 'Grabado en la aplicación, o adjuntado ya hecho' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  recorded?: boolean;

  @ApiPropertyOptional({ description: 'Lo que dura, si el navegador lo supo medir' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
