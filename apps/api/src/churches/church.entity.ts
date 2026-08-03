import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';

/**
 * Una iglesia: el espacio de trabajo del que cuelga todo lo pastoral (RFC
 * 0008). Quien entra trabaja siempre sobre una, y los datos de una no se ven
 * desde otra.
 *
 * `ownerId` apunta a `user(id)`, que es tabla de Better Auth: no hay clave
 * foránea declarada por lo mismo que en `roles` —SQLite no sabe añadir una
 * restricción a una tabla ya creada—, así que la coherencia la sostiene el
 * servicio.
 */
@Entity('churches')
export class Church extends BaseEntity {
  @ApiProperty({ example: 'Iglesia Central' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Derivado del nombre; estable', example: 'iglesia-central' })
  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @ApiPropertyOptional({ description: 'Nulo solo en las que vienen de una instalación vieja' })
  @Column({ type: 'text', nullable: true })
  city: string | null;

  @ApiProperty({ description: 'Zona horaria IANA de la congregación', example: 'Europe/Madrid' })
  @Column({ type: 'text', default: 'Europe/Madrid' })
  timezone: string;

  @ApiProperty({ description: 'Quién la creó' })
  @Index()
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;
}
