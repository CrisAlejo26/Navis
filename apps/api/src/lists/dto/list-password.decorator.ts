import { applyDecorators } from '@nestjs/common';
import { LIST_PASSWORD_MIN_LENGTH, normalizeListPassword } from '@navis/shared';
import { Transform } from 'class-transformer';
import {
  IsString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Se mide **sin los guiones**: `abcd-efgh` son ocho caracteres, no nueve.
 *
 * La normalización es la misma que usa el hash y vive en `@navis/shared`, para
 * que los dos lados cuenten igual: si divergieran, una contraseña buena dejaría
 * de valer al guardarla (D25).
 */
@ValidatorConstraint({ name: 'listPasswordLength' })
export class ListPasswordLength implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      typeof value === 'string' && normalizeListPassword(value).length >= LIST_PASSWORD_MIN_LENGTH
    );
  }

  defaultMessage(): string {
    return `La contraseña necesita al menos ${String(LIST_PASSWORD_MIN_LENGTH)} caracteres`;
  }
}

/**
 * La contraseña de un **acceso**, que no es la de una cuenta (RFC 0010 D22).
 *
 * No lleva la política de `IsStrongPassword`: aquella es para entrar en la
 * aplicación y esta es para leer un cartel desde un teléfono prestado.
 */
export const IsListPassword = (): PropertyDecorator =>
  applyDecorators(
    IsString(),
    MaxLength(200),
    Transform(({ value }: { value: unknown }): unknown =>
      typeof value === 'string' ? value.trim() : value,
    ),
    Validate(ListPasswordLength),
  );
