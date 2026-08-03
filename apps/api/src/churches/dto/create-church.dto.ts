import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Dos datos y ya: el nombre y la ciudad. Es la primera pantalla de quien puede
 * crear iglesias, y un formulario largo ahí es un formulario que se abandona.
 */
export class CreateChurchDto {
  @ApiProperty({ example: 'Iglesia Central' })
  @IsString()
  @Length(2, 120)
  @Transform(trimmed)
  name: string;

  @ApiProperty({ example: 'Madrid' })
  @IsString()
  @Length(2, 120)
  @Transform(trimmed)
  city: string;
}
