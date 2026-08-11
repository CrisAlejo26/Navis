import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { JournalEntry } from './journal-entry.entity';

/**
 * Un audio adjunto a una entrada del cuaderno: grabado ahí mismo o traído ya
 * hecho. Gemelo exacto de `NoteAudio` (RFC 0017 D7).
 *
 * **El fichero no está aquí**: vive en disco, bajo `UPLOADS_PATH`, y esta fila
 * es su ficha — mismo motivo que las notas de creyentes (`CLAUDE.md`).
 */
@Entity('journal_entry_audios')
@Index('IDX_journal_entry_audios_entry', ['entryId'])
export class JournalEntryAudio extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty()
  @Column({ name: 'entry_id', type: UUID })
  entryId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('JournalEntry', 'audios', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry: Relation<JournalEntry>;

  @ApiProperty({ description: 'El nombre del fichero en disco, generado aquí' })
  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @ApiProperty({ example: 'audio/webm' })
  @Column({ name: 'mime_type', type: 'text' })
  mimeType: string;

  @ApiProperty()
  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;

  @ApiPropertyOptional({ description: 'Lo que dura, si el navegador lo supo medir' })
  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds: number | null;

  @ApiProperty({ description: 'Grabado en la aplicación, o adjuntado ya hecho' })
  @Column({ type: 'boolean', default: false })
  recorded: boolean;
}
