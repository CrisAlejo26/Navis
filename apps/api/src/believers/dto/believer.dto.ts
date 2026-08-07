import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  BELIEVER_STATUSES,
  MAX_ALERT_AFTER_DAYS,
  MAX_PAGE_SIZE,
  MAX_READ_COUNT,
  type BelieverStatus,
  type Ministry,
} from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
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

const trimmedLower = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Un día de calendario, no un instante: `AAAA-MM-DD` y nada más. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

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

  @ApiPropertyOptional({ example: 'ana@iglesia.es', description: 'Se guarda en minúsculas' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Transform(trimmedLower)
  @IsEmail({}, { message: 'Email no válido' })
  @Length(0, 255)
  email?: string | null;

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

  /* --- La trayectoria en la iglesia (RFC 0012) ----------------------------- */

  @ApiPropertyOptional({ description: 'Mes y año en que llegó, como AAAA-MM-DD' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Matches(ISO_DAY, { message: 'La fecha va como AAAA-MM-DD' })
  arrivedAt?: string | null;

  @ApiPropertyOptional({ example: 'Iglesia la 40, Tuluá' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(0, 120)
  @Transform(trimmed)
  arrivalSite?: string | null;

  @ApiPropertyOptional({ description: 'Cuántas veces ha leído la Biblia entera' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(MAX_READ_COUNT)
  bibleReadings?: number | null;

  @ApiPropertyOptional({ description: 'Cuántas veces ha leído el libro de vivencias' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(MAX_READ_COUNT)
  vivenciasReadings?: number | null;

  @ApiPropertyOptional({ description: 'En cuántos institutos bíblicos ha participado' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(MAX_READ_COUNT)
  bibleInstituteTimes?: number | null;

  /**
   * Cuándo empezó cada labor, por `slug`. Una clave que no esté en
   * `ministries` se ignora al guardar: no puede quedar la fecha de una labor
   * que ya no tiene.
   */
  @ApiPropertyOptional({ description: '{ "sonido": "2019-05-01" }' })
  @IsOptional()
  @IsObject()
  ministryDates?: Record<string, string | null>;

  @ApiPropertyOptional({ description: 'Cuándo recibió cada don, por identificador' })
  @IsOptional()
  @IsObject()
  giftDates?: Record<string, string | null>;
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
