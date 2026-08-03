import { applyDecorators } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';

/**
 * Identificador de un rol en la frontera de la API.
 *
 * NO es una lista cerrada: además de los cuatro de serie, cada instalación
 * crea los suyos, y esos no existen en tiempo de compilación. Aquí solo se
 * comprueba la forma; que el rol exista de verdad lo mira
 * `RolesService.ensureExists` contra la tabla, que es la única fuente fiable.
 */
export const IsRoleSlug = (): PropertyDecorator =>
  applyDecorators(IsString(), Length(2, 40), Matches(/^[a-z0-9-]+$/, { message: 'Rol no válido' }));
