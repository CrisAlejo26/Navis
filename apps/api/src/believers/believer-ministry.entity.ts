import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Believer } from './believer.entity';

/**
 * Para qué está disponible una persona: hoy, `pulpito` y nada más.
 *
 * No es un rol de la tabla `roles` —eso son permisos de una cuenta— ni todavía
 * una etiqueta de la RFC 0003, que son libres y descriptivas. Responde a una
 * pregunta operativa: «¿a quién puedo poner en el púlpito?» (RFC 0002 §6.2).
 */
@Entity('believer_ministries')
@Index('UQ_believer_ministries', ['believerId', 'ministry'], { unique: true })
export class BelieverMinistry extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'believer_id', type: UUID })
  believerId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('Believer', 'ministries', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'believer_id' })
  believer: Relation<Believer>;

  @ApiProperty({ example: 'pulpito' })
  @Column({ type: 'text' })
  ministry: string;

  /**
   * Mes y año en que empezó con ella, con el día 1 (RFC 0012). Nulo es lo
   * normal: la labor se hace igual sin saber desde cuándo.
   */
  @ApiPropertyOptional({ description: 'Cuándo empezó; se guarda el día 1 del mes' })
  @Column({ name: 'started_at', type: 'date', nullable: true })
  startedAt: string | null;
}
