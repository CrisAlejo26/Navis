import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { Ministry } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * El alta de una persona pide lo justo para poder programarla. El resto de la
 * ficha —correo, familia, notas— llega con la RFC 0003.
 */
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

  /** Sus **labores**: los slugs de los roles con los que se le puede programar. */
  @ApiPropertyOptional({ example: ['pulpito'] })
  @IsOptional()
  @IsArray()
  @Matches(/^[a-z0-9-]{2,40}$/, { each: true })
  ministries?: Ministry[];
}

export class UpdateBelieverDto extends PartialType(CreateBelieverDto) {
  @ApiPropertyOptional({ description: 'Quien ya no está deja de proponerse' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
