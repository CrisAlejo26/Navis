import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

import { IsStrongPassword } from '../../common/dto/password.decorator';

/** Las normalizaciones, tipadas: `TransformFnParams` trae `value` como `any`. */
const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizedEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Cuenta de administrador del primer arranque. */
export class CreateFirstAdminDto {
  @ApiProperty({ example: 'Ana Pastora' })
  @IsString()
  @Length(2, 120)
  @Transform(trimmed)
  name: string;

  // El orden importa, igual que en el esquema de zod: primero se normaliza y
  // después se valida, para que «  Ana@Iglesia.ES » sea un email válido.
  @ApiProperty({ example: 'ana@iglesia.es' })
  @Transform(normalizedEmail)
  @IsEmail({}, { message: 'Email no válido' })
  @Length(3, 255)
  email: string;

  @ApiProperty({ minLength: 10, example: 'Rebano2026Seguro' })
  @IsStrongPassword()
  password: string;
}
