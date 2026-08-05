import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';

/**
 * Una **visita** a la página pública (RFC 0010 §6.5).
 *
 * Sin `BaseEntity` a propósito: no se edita ni se borra lógicamente, se poda a
 * los 180 días (D34). Y **sin la dirección IP entera** (D32): el prefijo dice
 * el operador y la zona, y el hash cuenta personas distintas y deja de servir
 * para identificar a nadie en cuanto la sal rota, a medianoche.
 */
@Entity('list_views')
@Index('IDX_list_views_recent', ['listId', 'viewedAt'])
export class ListView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'list_id', type: UUID })
  listId: string;

  @ApiPropertyOptional({ description: 'El acceso que la abrió. Nulo si es abierta (D35)' })
  @Column({ name: 'viewer_id', type: UUID, nullable: true })
  viewerId: string | null;

  @ApiProperty()
  @Column({ name: 'viewed_at', type: TIMESTAMP })
  viewedAt: Date;

  @ApiProperty({ description: 'sha256(sal del día + IP + user-agent), truncado (D32)' })
  @Index('IDX_list_views_visitor')
  @Column({ name: 'visitor_hash', type: 'text' })
  visitorHash: string;

  @ApiProperty({ example: '81.34.12.0' })
  @Column({ name: 'ip_prefix', type: 'text', default: '' })
  ipPrefix: string;

  @ApiProperty({ description: 'mobile | tablet | desktop' })
  @Column({ type: 'text', default: 'desktop' })
  device: string;

  @ApiPropertyOptional({ example: 'Android' })
  @Column({ type: 'text', nullable: true })
  platform: string | null;

  @ApiPropertyOptional({ description: '`wa.me`, `t.co`… Nulo ⇒ directo' })
  @Column({ name: 'referrer_host', type: 'text', nullable: true })
  referrerHost: string | null;

  @ApiProperty({ description: 'Recargas dentro de la ventana de 30 minutos (D33)' })
  @Column({ type: 'int', default: 1 })
  views: number;
}
