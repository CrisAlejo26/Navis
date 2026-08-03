import { applyDecorators } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';

/**
 * Política de contraseñas en la frontera de la API.
 *
 * Es la misma que `passwordSchema` de `@navis/shared` (que valida los
 * formularios) y que el `minPasswordLength` de Better Auth. Está aquí, en un
 * decorador compuesto, para no repetirla en cada DTO que pida una contraseña:
 * si cambia la política, se cambia en este sitio y en `shared`.
 */
export const IsStrongPassword = (): PropertyDecorator =>
  applyDecorators(
    IsString(),
    Length(10, 128, { message: 'La contraseña debe tener al menos 10 caracteres' }),
    Matches(/[a-z]/, { message: 'Debe incluir una minúscula' }),
    Matches(/[A-Z]/, { message: 'Debe incluir una mayúscula' }),
    Matches(/\d/, { message: 'Debe incluir un número' }),
  );
