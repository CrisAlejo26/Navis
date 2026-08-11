import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EntryKind } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import { JournalEntryAudio } from './journal-entry-audio.entity';

/**
 * Una entrada del **cuaderno** de la iglesia (RFC 0017 §5.1).
 *
 * De la iglesia activa y no de quien la escribe (D1), al revés que las
 * profecías (RFC 0004 D1): cambiar de iglesia cambia el cuaderno entero.
 * `author_id` da crédito, no restringe: quien tiene `journal.view` ve todas
 * las entradas.
 *
 * `occurred_at` es `date` y no `timestamptz` (D5): lo que pasó el 14 de julio
 * pasó el 14 de julio en cualquier huso. `remind_at` sí es un instante (D6):
 * «el martes a las siete» es una hora concreta, no un día.
 */
@Entity('journal_entries')
@Index('IDX_journal_entries_church', ['churchId', 'occurredAt'])
@Index('IDX_journal_entries_kind', ['churchId', 'kind'])
@Index('IDX_journal_entries_remind', ['churchId', 'remindAt'])
export class JournalEntry extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ description: 'No se trunca en el listado (D3)' })
  @Column({ type: 'text' })
  title: string;

  @ApiProperty({ example: 'testimonio' })
  @Column({ type: 'text' })
  kind: EntryKind;

  @ApiProperty({ description: 'Cuándo pasó, no cuándo se escribió', example: '2026-07-14' })
  @Column({ name: 'occurred_at', type: 'date' })
  occurredAt: string;

  @ApiProperty({ description: 'Lo que se observó, contó o decidió. Texto plano' })
  @Column({ type: 'text' })
  annotation: string;

  @ApiPropertyOptional({ description: 'La reflexión sobre lo anotado. Puede no haberla' })
  @Column({ type: 'text', nullable: true })
  learned: string | null;

  @ApiProperty({ description: 'Título + anotación + lo aprendido, normalizado (D8)' })
  @Column({ name: 'search_text', type: 'text' })
  searchText: string;

  @ApiPropertyOptional({ description: 'Cuándo hay que acordarse. Día y hora (D6)' })
  @Column({ name: 'remind_at', type: TIMESTAMP, nullable: true })
  remindAt: Date | null;

  @ApiPropertyOptional({ description: 'De qué hay que acordarse' })
  @Column({ name: 'remind_text', type: 'text', nullable: true })
  remindText: string | null;

  @ApiPropertyOptional({ description: 'Cuándo se dio por atendido; nulo mientras siga pendiente' })
  @Column({ name: 'remind_done_at', type: TIMESTAMP, nullable: true })
  remindDoneAt: Date | null;

  @ApiPropertyOptional({ description: 'Quién la escribió' })
  @Column({ name: 'author_id', type: 'text', nullable: true })
  authorId: string | null;

  @OneToMany(() => JournalEntryAudio, (audio) => audio.entry, { cascade: true })
  audios: JournalEntryAudio[];
}
