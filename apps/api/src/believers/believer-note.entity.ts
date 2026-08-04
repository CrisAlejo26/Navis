import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NoteKind } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import { NoteAudio } from './note-audio.entity';

/**
 * Una entrada de la **bitácora** de un hermano (RFC 0003 §5.3).
 *
 * `occurred_at` es `date` y no `timestamptz` (D9): lo que pasó el 14 de julio
 * pasó el 14 de julio en cualquier huso. `remind_at` sí es un instante (D16):
 * «el martes a las siete» es una hora concreta, no un día.
 *
 * `church_id` está duplicado a propósito: las cuentas de la cabecera y el
 * filtro de «pide atención» se resuelven sin unir con `believers`, y el guard
 * de iglesia activa comprueba una columna en vez de una relación.
 */
@Entity('believer_notes')
@Index('IDX_believer_notes_believer', ['believerId', 'occurredAt'])
@Index('IDX_believer_notes_church', ['churchId', 'occurredAt'])
@Index('IDX_believer_notes_remind', ['churchId', 'remindAt'])
export class BelieverNote extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty()
  @Column({ name: 'believer_id', type: UUID })
  believerId: string;

  @ApiProperty({ example: 'testimonio' })
  @Column({ type: 'text' })
  kind: NoteKind;

  @ApiProperty({ description: 'Cuándo pasó, no cuándo se escribió', example: '2026-07-14' })
  @Column({ name: 'occurred_at', type: 'date' })
  occurredAt: string;

  @ApiProperty({ description: 'Lo que contó. Texto plano: el editor no lleva Markdown' })
  @Column({ type: 'text' })
  told: string;

  @ApiPropertyOptional({ description: 'La indicación dada. Puede no haberla' })
  @Column({ type: 'text', nullable: true })
  advice: string | null;

  @ApiPropertyOptional({ description: 'Obligatorio si y solo si `kind` es `don` (D8)' })
  @Column({ name: 'gift_id', type: UUID, nullable: true })
  giftId: string | null;

  @ApiPropertyOptional({ description: 'Cuándo hay que acordarse. Día y hora (D16)' })
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

  @OneToMany(() => NoteAudio, (audio) => audio.note, { cascade: true })
  audios: NoteAudio[];
}
