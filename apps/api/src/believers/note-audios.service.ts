import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { ReadStream } from 'node:fs';

import { AudioStorageService, churchScope } from '../media/audio-storage.service';
import { NoteAudio } from './note-audio.entity';

/** Lo que llega de multer, reducido a lo que de verdad se usa (Regla 10). */
export interface UploadedAudio {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * Los audios de una nota: la ficha en la base y el fichero en disco, siempre
 * los dos a la vez.
 *
 * Escribir primero el fichero y después la fila es deliberado: si falla la
 * segunda queda un fichero huérfano —recuperable, invisible—, mientras que al
 * revés quedaría una fila que apunta a nada y la interfaz enseñaría un audio
 * roto.
 */
@Injectable()
export class NoteAudiosService {
  constructor(
    @InjectRepository(NoteAudio) private readonly audios: Repository<NoteAudio>,
    private readonly storage: AudioStorageService,
  ) {}

  async add(
    churchId: string,
    noteId: string,
    file: UploadedAudio,
    options: { recorded: boolean; durationSeconds: number | null },
  ): Promise<NoteAudio> {
    const stored = await this.storage.save(churchScope(churchId), file);

    return this.audios.save(
      this.audios.create({
        churchId,
        noteId,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        durationSeconds: options.durationSeconds,
        recorded: options.recorded,
      }),
    );
  }

  /** Los de esas notas, para pintar una página de bitácora sin N consultas. */
  async forNotes(noteIds: readonly string[]): Promise<Map<string, NoteAudio[]>> {
    if (noteIds.length === 0) return new Map();

    const rows = await this.audios.find({
      where: { noteId: In([...noteIds]) },
      order: { createdAt: 'ASC' },
    });

    const grouped = new Map<string, NoteAudio[]>();
    for (const audio of rows) {
      grouped.set(audio.noteId, [...(grouped.get(audio.noteId) ?? []), audio]);
    }

    return grouped;
  }

  /**
   * El fichero para descargarlo, comprobando **antes** que es de esta iglesia:
   * sin eso, un identificador robado valdría para escuchar la nota de voz de
   * cualquier otra congregación.
   */
  async stream(churchId: string, id: string): Promise<{ audio: NoteAudio; file: ReadStream }> {
    const audio = await this.require(churchId, id);
    return { audio, file: this.storage.read(audio.storageKey) };
  }

  async remove(churchId: string, id: string): Promise<void> {
    const audio = await this.require(churchId, id);

    await this.audios.softRemove(audio);
    await this.storage.remove(audio.storageKey);
  }

  private async require(churchId: string, id: string): Promise<NoteAudio> {
    const audio = await this.audios.findOne({ where: { id, churchId } });
    if (!audio) throw new NotFoundException('Ese audio no existe en esta iglesia');
    return audio;
  }
}
