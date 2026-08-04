import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { BelieverNote } from './believer-note.entity';

/**
 * Un audio adjunto a una nota: grabado ahí mismo o traído ya hecho.
 *
 * **El fichero no está aquí**: vive en disco, bajo `UPLOADS_PATH`, y esta fila
 * es su ficha. Meterlo en la base de datos engordaría cada volcado sin dar
 * nada a cambio, y sacarlo del disco a un almacenamiento de objetos el día que
 * haga falta solo toca `AudioStorage`.
 *
 * `storage_key` es lo que hay que buscar en el disco. **Nunca** lleva el
 * nombre que mandó el cliente: es un identificador nuevo más la extensión que
 * corresponde a su tipo, y así no hay forma de escaparse de la carpeta.
 */
@Entity('note_audios')
@Index('IDX_note_audios_note', ['noteId'])
export class NoteAudio extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty()
  @Column({ name: 'note_id', type: UUID })
  noteId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('BelieverNote', 'audios', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note: Relation<BelieverNote>;

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
