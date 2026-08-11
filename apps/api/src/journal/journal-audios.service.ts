import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { ReadStream } from 'node:fs';

import { AudioStorageService, churchScope } from '../media/audio-storage.service';
import { JournalEntryAudio } from './journal-entry-audio.entity';

/** Lo que llega de multer, reducido a lo que de verdad se usa (Regla 10). */
export interface UploadedAudio {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * Los audios de una entrada del cuaderno: la ficha en la base y el fichero en
 * disco, siempre los dos a la vez. Gemelo exacto de `NoteAudiosService` (D7).
 *
 * Escribir primero el fichero y después la fila es deliberado: si falla la
 * segunda queda un fichero huérfano —recuperable, invisible—, mientras que al
 * revés quedaría una fila que apunta a nada y la interfaz enseñaría un audio
 * roto.
 */
@Injectable()
export class JournalAudiosService {
  constructor(
    @InjectRepository(JournalEntryAudio) private readonly audios: Repository<JournalEntryAudio>,
    private readonly storage: AudioStorageService,
  ) {}

  async add(
    churchId: string,
    entryId: string,
    file: UploadedAudio,
    options: { recorded: boolean; durationSeconds: number | null },
  ): Promise<JournalEntryAudio> {
    const stored = await this.storage.save(churchScope(churchId), file);

    return this.audios.save(
      this.audios.create({
        churchId,
        entryId,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        durationSeconds: options.durationSeconds,
        recorded: options.recorded,
      }),
    );
  }

  /** Los de esas entradas, para pintar una página sin N consultas. */
  async forEntries(entryIds: readonly string[]): Promise<Map<string, JournalEntryAudio[]>> {
    if (entryIds.length === 0) return new Map();

    const rows = await this.audios.find({
      where: { entryId: In([...entryIds]) },
      order: { createdAt: 'ASC' },
    });

    const grouped = new Map<string, JournalEntryAudio[]>();
    for (const audio of rows) {
      grouped.set(audio.entryId, [...(grouped.get(audio.entryId) ?? []), audio]);
    }

    return grouped;
  }

  /**
   * El fichero para descargarlo, comprobando **antes** que es de esta iglesia:
   * sin eso, un identificador robado valdría para escuchar el audio de
   * cualquier otra congregación.
   */
  async stream(
    churchId: string,
    id: string,
  ): Promise<{ audio: JournalEntryAudio; file: ReadStream }> {
    const audio = await this.require(churchId, id);
    return { audio, file: this.storage.read(audio.storageKey) };
  }

  async remove(churchId: string, id: string): Promise<void> {
    const audio = await this.require(churchId, id);

    await this.audios.softRemove(audio);
    await this.storage.remove(audio.storageKey);
  }

  private async require(churchId: string, id: string): Promise<JournalEntryAudio> {
    const audio = await this.audios.findOne({ where: { id, churchId } });
    if (!audio) throw new NotFoundException('Ese audio no existe en esta iglesia');
    return audio;
  }
}
