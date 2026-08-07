import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ACCENT_PATTERN } from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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
 * Apuntar un sueño (RFC 0005 §6.3).
 *
 * **Solo el cuerpo y la noche son obligatorios** (D17): el cumplimiento no
 * está aquí —solo tiene sentido cuando el sueño ya existe—. La interpretación
 * sí puede llegar desde el alta: es opcional, como el título, para quien la
 * trae ya pensada y no quiere volver después solo por eso.
 */
export class CreateDreamDto {
  @ApiPropertyOptional({ description: 'Opcional: a las cuatro de la mañana nadie titula' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  @Transform(trimmed)
  title?: string;

  @ApiProperty({ description: 'El sueño tal y como se recuerda. Texto plano' })
  @IsString()
  @Length(1, 20000)
  @Transform(trimmed)
  body: string;

  @ApiProperty({ description: 'La noche en que se soñó', example: '2026-03-14' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  dreamedAt: string;

  @ApiPropertyOptional({ description: 'La posible interpretación, si ya se tiene', nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(0, 20000)
  @Transform(trimmed)
  interpretation?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Las emociones que lleva' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  emotionIds?: string[];
}

/**
 * Al editar aparece además el cumplimiento; la interpretación ya viene
 * heredada de `CreateDreamDto` con la misma forma, así que no se repite aquí.
 *
 * `fulfilledAt` acepta además `null`, que **sí** significa algo: quitar la
 * fecha vuelve a abrir el sueño y se lleva por delante lo que significó (D10).
 */
export class UpdateDreamDto extends PartialType(CreateDreamDto) {
  @ApiPropertyOptional({ description: '`null` lo vuelve a abrir (D10)', nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601({ strict: true })
  @Length(10, 10)
  fulfilledAt?: string | null;

  @ApiPropertyOptional({ description: 'Qué significó, al cerrarlo', nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(0, 20000)
  @Transform(trimmed)
  fulfillmentMeaning?: string | null;
}

/** Una emoción propia. Las de serie no se crean ni se editan (D6). */
export class CreateEmotionDto {
  @ApiProperty({ example: 'Nostalgia' })
  @IsString()
  @Length(1, 40)
  @Transform(trimmed)
  name: string;

  @ApiProperty({ description: 'Token de color o hexadecimal de ACCENT_PALETTE' })
  @Matches(ACCENT_PATTERN, { message: 'El color tiene que ser un token o un hexadecimal' })
  accent: string;
}

export class UpdateEmotionDto extends PartialType(CreateEmotionDto) {}

/** Lo que acompaña al fichero al subir un audio. Igual que en las notas. */
export class UploadDreamAudioDto {
  @ApiPropertyOptional({ description: 'Grabado en la aplicación, o adjuntado ya hecho' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  @IsBoolean()
  recorded?: boolean;

  @ApiPropertyOptional({ description: 'Lo que dura, si el navegador lo supo medir' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
