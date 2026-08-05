import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LIST_USERNAME_PATTERN } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

import { IsListPassword } from './list-password.decorator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** El usuario se guarda en minúsculas: en un móvil, «Ancianos» es el fallo nº 1. */
const lowered = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateListViewerDto {
  @ApiProperty({ example: 'Ancianos', description: 'Para reconocerlo en el directorio' })
  @IsString()
  @Length(2, 80)
  @Transform(trimmed)
  label: string;

  @ApiProperty({ example: 'juan.perez' })
  @IsString()
  @Transform(lowered)
  @Matches(LIST_USERNAME_PATTERN, {
    message: 'El usuario va en minúsculas, de 3 a 40 caracteres',
  })
  username: string;

  @ApiProperty({ example: 'k7fr-m3np-t9wx', description: 'Se enseña una sola vez (D24)' })
  @IsListPassword()
  password: string;

  @ApiPropertyOptional({ description: 'El creyente al que pertenece, si lo hay (D20)' })
  @IsOptional()
  @IsUUID()
  believerId?: string | null;

  @ApiPropertyOptional({ description: 'Caducidad propia, aparte de la de la lista' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'A qué listas llega, de una vez (D19)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID(undefined, { each: true })
  listIds?: string[];
}

/** Sin `username` ni `password`: el usuario no se cambia y la clave se regenera. */
export class UpdateListViewerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 80)
  @Transform(trimmed)
  label?: string;

  @ApiPropertyOptional({ description: 'Apagarlo echa fuera al momento a quien esté dentro' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  believerId?: string | null;
}

export class RegenerateListPasswordDto {
  @ApiProperty({ example: 'k7fr-m3np-t9wx' })
  @IsListPassword()
  password: string;
}

/** Las concesiones, escritas de una vez desde cualquiera de los dos lados. */
export class SetListGrantsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID(undefined, { each: true })
  ids: string[];
}
