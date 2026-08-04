import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  BELIEVER_STATUSES,
  MAX_ALERT_AFTER_DAYS,
  MAX_PAGE_SIZE,
  type BelieverStatus,
  type Ministry,
} from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
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

/** El alta de una persona: su ficha completa (RFC 0003 §7.6). */
export class CreateBelieverDto {
  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  @Length(2, 80)
  @Transform(trimmed)
  firstName: string;

  @ApiPropertyOptional({ example: 'Ruiz' })
  @IsOptional()
  @IsString()
  @Length(0, 80)
  @Transform(trimmed)
  lastName?: string;

  @ApiPropertyOptional({ example: '+34 600 000 000' })
  @IsOptional()
  @IsString()
  @Length(0, 40)
  @Transform(trimmed)
  phone?: string;

  @ApiPropertyOptional({ description: 'Su sede habitual. No acota nada: solo ordena y etiqueta' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  congregationId?: string | null;

  @ApiPropertyOptional({ enum: BELIEVER_STATUSES, description: 'Dónde está hoy (D2)' })
  @IsOptional()
  @IsIn(BELIEVER_STATUSES)
  status?: BelieverStatus;

  /** `null` apaga el aviso. Un solo significado por columna: nada de «0 es sin aviso» (D3). */
  @ApiPropertyOptional({ description: 'Días sin nota antes de avisar. `null` lo apaga' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(MAX_ALERT_AFTER_DAYS)
  alertAfterDays?: number | null;

  /** Sus **labores**: los slugs de los roles con los que se le puede programar. */
  @ApiPropertyOptional({ example: ['pulpito'] })
  @IsOptional()
  @IsArray()
  @Matches(/^[a-z0-9-]{2,40}$/, { each: true })
  ministries?: Ministry[];

  @ApiPropertyOptional({ description: 'Los dones que ya se le conocen, del catálogo (D5)' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  giftIds?: string[];
}

export class UpdateBelieverDto extends PartialType(CreateBelieverDto) {}

/**
 * Poner la misma sede a varias personas de una vez.
 *
 * Va con su propio DTO y no como un `PATCH` repetido porque son dos cosas
 * distintas: aquí no se edita una ficha, se corrige un dato que faltaba en
 * muchas —el de quien nació desde el selector del calendario, que no pregunta
 * la sede—.
 */
export class SetCongregationDto {
  @ApiProperty({ description: 'A quiénes; como mucho una página entera' })
  @IsArray()
  @ArrayMaxSize(MAX_PAGE_SIZE)
  @IsUUID('all', { each: true })
  believerIds: string[];

  @ApiPropertyOptional({ description: 'La sede, o `null` para dejarlos sin ninguna' })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  congregationId: string | null;
}
