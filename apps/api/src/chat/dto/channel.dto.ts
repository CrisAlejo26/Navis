import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CHANNEL_KINDS, MAX_GROUP_MEMBERS, type ChannelKind } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Crear una conversación (RFC 0016 §5, D5). El cruce «individual necesita
 * exactamente una persona» y «grupo/aviso necesita nombre» se comprueba en
 * el servicio, no aquí: es una regla de negocio, no de forma.
 */
export class CreateChannelDto {
  @ApiProperty({ enum: CHANNEL_KINDS })
  @IsIn(CHANNEL_KINDS)
  kind: ChannelKind;

  @ApiProperty({ type: [String], description: 'Sin contar a quien crea la conversación' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_GROUP_MEMBERS)
  @IsString({ each: true })
  memberIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Transform(trimmed)
  description?: string;
}

export class UpdateChannelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Transform(trimmed)
  description?: string | null;
}

/** `until` ausente o vacío quita el silencio; con fecha, silencia hasta entonces. */
export class MuteChannelDto {
  @ApiPropertyOptional({ description: 'Hasta cuándo. Sin ella, quita el silencio' })
  @IsOptional()
  @IsISO8601()
  until?: string;
}

export class ContactsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  @Transform(trimmed)
  search?: string;
}
