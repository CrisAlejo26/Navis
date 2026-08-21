import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';

/**
 * Una enseñanza personal recibida (RFC 0022 §4.1).
 *
 * **No lleva `church_id`, a propósito** — mismo modelo que `Prophecy` (RFC
 * 0004 D1): es de quien la escribe, no de una iglesia.
 *
 * `bodyJson` es `text` con `JSON.stringify`, igual en los dos motores, y no
 * el `jsonb` nativo de TypeORM, que se comporta distinto en Postgres y en
 * SQLite — la misma decisión que `CustomTableRow.data` (RFC 0021 D13). Se
 * valida con `teachingBodySchema` al leer, nunca con un `JSON.parse` a pelo.
 */
@Entity('teachings')
@Index('IDX_teachings_owner_received', ['ownerId', 'receivedAt'])
@Index('IDX_teachings_owner_search', ['ownerId', 'searchText'])
export class Teaching extends BaseEntity {
  @ApiProperty({ description: 'De quién es. La única barrera de acceso que hay' })
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  title: string;

  @ApiProperty({ description: 'El documento del editor, JSON.stringify' })
  @Column({ name: 'body_json', type: 'text' })
  bodyJson: string;

  @ApiProperty({ description: 'Título y texto del cuerpo, en minúsculas y sin acentos' })
  @Column({ name: 'search_text', type: 'text' })
  searchText: string;

  @ApiProperty({ description: 'Cuándo se recibió', example: '2026-03-14' })
  @Column({ name: 'received_at', type: 'date' })
  receivedAt: string;
}
