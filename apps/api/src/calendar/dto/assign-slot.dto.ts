import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_PHASES } from '@navis/shared';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Poner a alguien en una fase, que es la acción que más se repite (D4).
 *
 * Con `patternId` y `date` basta: si la reunión de ese día todavía era una
 * propuesta, el servidor la materializa con todas sus fases antes de escribir.
 */
export class AssignSlotDto {
  @ApiProperty({ example: '2026-08-15' })
  @IsISO8601({ strict: true })
  date: string;

  @ApiPropertyOptional({ description: 'El patrón del que nace, si aún no existía la reunión' })
  @IsOptional()
  @IsUUID()
  patternId?: string;

  @ApiPropertyOptional({ description: 'La reunión, si ya existe' })
  @IsOptional()
  @IsUUID()
  meetingId?: string;

  @ApiProperty({ description: 'La fase, por su posición dentro de la reunión', example: 1 })
  @IsInt()
  @Min(0)
  @Max(MAX_PHASES)
  position: number;

  @ApiPropertyOptional({ description: 'Quién la ocupa. `null` la deja libre' })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  believerId: string | null;

  @ApiPropertyOptional({ example: 'Tema: Hechos 2' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(160)
  note?: string | null;
}
