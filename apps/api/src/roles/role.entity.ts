import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';

/**
 * Catálogo de roles. Trae los cuatro de serie —sembrados en su migración a
 * partir de `ROLES` y `ROLE_HIERARCHY` de `@navis/shared`— y los que cree cada
 * instalación desde la administración de accesos.
 *
 * `slug` es texto libre y no la unión de los roles de serie: el catálogo se
 * amplía en caliente, así que el tipo no puede cerrarse en compilación.
 *
 * `level` es lo que compara el guard: a mayor número, más privilegios. Los de
 * serie no cambian de nivel; los propios se quedan por debajo del
 * administrador (ver `MAX_CUSTOM_ROLE_LEVEL`).
 *
 * No hay clave foránea desde `user.role`: esa tabla la gestiona Better Auth y
 * SQLite no sabe añadir una restricción a una tabla ya creada. La validación
 * la hace RolesService antes de escribir.
 */
@Entity('roles')
export class Role extends BaseEntity {
  @ApiProperty({ description: 'Identificador estable del rol', example: 'pastor' })
  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @ApiPropertyOptional({ description: 'Nombre propio. Nulo en los de serie, que se traducen' })
  @Column({ type: 'text', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ description: 'Qué puede hacer, en los roles propios' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Posición en la jerarquía: a mayor número, más privilegios' })
  @Column({ type: 'int' })
  level: number;

  /**
   * Los permisos del rol, que es lo que compara PermissionsGuard.
   *
   * `simple-json` guarda el array como texto en los dos motores, así que no
   * hace falta un tipo por driver: en Postgres sería `jsonb` y en SQLite no
   * existe, y aquí no se consulta nunca por dentro del JSON.
   */
  @ApiProperty({ description: 'Qué puede hacer, vista por vista', type: [String] })
  @Column({ type: 'simple-json', default: '[]' })
  permissions: string[];

  @ApiProperty({ description: 'Los roles de serie no se pueden borrar' })
  @Column({ name: 'is_system', type: 'boolean', default: true })
  isSystem: boolean;
}
