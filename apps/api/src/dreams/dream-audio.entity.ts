import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Dream } from './dream.entity';

/**
 * Un audio de un sueño: grabado al despertar o traído ya hecho.
 *
 * Espejo de `note_audios` (RFC 0003) menos el `church_id`, que aquí no existe:
 * el dueño se alcanza por el sueño (D1). **El fichero no está aquí**: vive en
 * disco bajo `UPLOADS_PATH`, en `users/<ownerId>/`, y esta fila es su ficha.
 *
 * `storage_key` es lo que hay que buscar en el disco, y **nunca** lleva el
 * nombre que mandó el cliente: lo genera `AudioStorageService`.
 */
@Entity('dream_audios')
@Index('IDX_dream_audios_dream', ['dreamId'])
export class DreamAudio extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'dream_id', type: UUID })
  dreamId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('Dream', 'audios', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dream_id' })
  dream: Relation<Dream>;

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
