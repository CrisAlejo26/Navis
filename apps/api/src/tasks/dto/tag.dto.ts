import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ACCENT_PATTERN, isTaskIconKey } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsString,
  Length,
  Matches,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@ValidatorConstraint({ name: 'taskIcon', async: false })
class IsTaskIconConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isTaskIconKey(value);
  }

  defaultMessage(): string {
    return 'Ese icono no está en el catálogo';
  }
}

/** Una etiqueta (RFC 0018 §5.1, §7). */
export class CreateTagDto {
  @ApiProperty({ example: 'Sermón' })
  @IsString()
  @Length(1, 40)
  @Transform(trimmed)
  name: string;

  @ApiProperty({ description: 'Clave del catálogo de iconos (D14)', example: 'book-open' })
  @Validate(IsTaskIconConstraint)
  icon: string;

  @ApiProperty({ description: 'Token o hexadecimal', example: '#2140cf' })
  @Matches(ACCENT_PATTERN)
  accent: string;
}

export class UpdateTagDto extends PartialType(CreateTagDto) {}
