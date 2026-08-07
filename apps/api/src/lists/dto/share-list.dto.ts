import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LIST_VISIBILITIES, type ListVisibility } from '@navis/shared';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsISO8601, IsObject, IsOptional, ValidateNested } from 'class-validator';

/**
 * Qué campos opcionales salen en público (D16).
 *
 * Es una lista blanca **cerrada**: lo que no está aquí no se puede activar, ni
 * mandando un campo de más —el `ValidationPipe` va con `forbidNonWhitelisted`—.
 */
export class ListPublicFieldsDto {
  @ApiPropertyOptional({ enum: ['full', 'initial'] })
  @IsOptional()
  @IsIn(['full', 'initial'])
  nameStyle?: 'full' | 'initial';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  congregation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ministry?: boolean;

  @ApiPropertyOptional({ description: 'Apagada a propósito: publicar una cara se decide' })
  @IsOptional()
  @IsBoolean()
  photo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  note?: boolean;

  /*
   * La trayectoria (RFC 0012), añadida después de que se cerrara esta lista
   * blanca. Teléfono y correo no llevan su campo aquí y no lo van a llevar
   * (D16): son datos de contacto, esto es historia de la persona.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  arrival?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  bibleReadings?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vivenciasReadings?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  bibleInstituteTimes?: boolean;
}

export class ShareListDto {
  @ApiProperty({ enum: LIST_VISIBILITIES })
  @IsIn([...LIST_VISIBILITIES])
  visibility: ListVisibility;

  @ApiPropertyOptional({ description: 'Nulo ⇒ sin caducidad (D13)' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;

  @ApiPropertyOptional({ type: ListPublicFieldsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ListPublicFieldsDto)
  publicFields?: ListPublicFieldsDto;

  @ApiPropertyOptional({ description: 'Apagado a propósito: llevarse los nombres se decide' })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;
}
