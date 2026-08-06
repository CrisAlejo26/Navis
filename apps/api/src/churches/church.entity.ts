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

  /**
   * De dónde salen los festivos del calendario (RFC 0011).
   *
   * `country` tiene valor por defecto porque un calendario sin país no puede
   * marcar nada; `region` nace nula a propósito: adivinarle la comunidad a una
   * iglesia por su ciudad es acertar a medias, y un festivo de otra comunidad
   * pintado en su calendario es peor que ninguno.
   */
  @ApiProperty({ description: 'ISO 3166-1 alfa-2', example: 'ES' })
  @Column({ type: 'text', default: 'ES' })
  country: string;

  @ApiPropertyOptional({ description: 'ISO 3166-2; nulo ⇒ solo festivos nacionales' })
  @Column({ type: 'text', nullable: true })
  region: string | null;

  @ApiProperty({ description: 'Quién la creó' })
  @Index()
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;
}
