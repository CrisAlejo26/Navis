import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { NOTE_KINDS, type NoteKind } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Una entrada de la bitácora (RFC 0003 §6.3).
 *
 * El cuerpo son dos campos (D15): lo que contó —obligatorio— y la indicación
 * que se le dio, que puede no haberla porque escuchar también es acompañar.
 *
 * `giftId` es obligatorio si y solo si el tipo es `don`; que lo sea se
 * comprueba en el servicio, junto con que ese don sea de esta iglesia —aquí no
 * se puede mirar la base de datos—.
 */
export class CreateNoteDto {
  @ApiProperty({ enum: NOTE_KINDS })
  @IsIn(NOTE_KINDS)
  kind: NoteKind;

  @ApiProperty({ description: 'Cuándo pasó, no cuándo se escribió', example: '2026-07-14' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  occurredAt: string;

  @ApiProperty({ description: 'Lo que contó' })
  @IsString()
  @Length(1, 8000)
  @Transform(trimmed)
  told: string;

  @ApiPropertyOptional({ description: 'La indicación dada' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(0, 8000)
  @Transform(trimmed)
  advice?: string | null;

  @ApiPropertyOptional({ description: 'Obligatorio si y solo si `kind` es `don` (D8)' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  giftId?: string | null;

  /** Día **y hora**: un recordatorio sin hora no recuerda a tiempo (D16). */
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

export class UpdateNoteDto extends PartialType(CreateNoteDto) {
  @ApiPropertyOptional({
    description: 'Da el recordatorio por atendido, o lo devuelve a pendiente',
  })
  @IsOptional()
  @IsBoolean()
  remindDone?: boolean;
}

/** La bitácora se lee de 20 en 20, se filtra por tipo y se busca (§7.5). */
export class NotesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({ enum: NOTE_KINDS })
  @IsOptional()
  @IsIn(NOTE_KINDS)
  kind?: NoteKind;

  @ApiPropertyOptional({ description: 'Busca en lo que contó, la indicación y el recordatorio' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  @Transform(trimmed)
  search?: string;
}

/** El tramo que pinta la vista de calendario. */
export class NoteDaysQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  from: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  to: string;
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
