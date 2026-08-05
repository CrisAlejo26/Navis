import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ReadStream } from 'node:fs';

import { AudioStorageService, userScope } from '../media/audio-storage.service';
import { DreamAudio } from './dream-audio.entity';
import { DreamsRepository } from './dreams.repository';

/** Lo que llega de multer, reducido a lo que de verdad se usa (Regla 10). */
export interface UploadedAudio {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * Los audios de un sueño: la ficha en la base y el fichero en disco, siempre
 * los dos a la vez.
 *
 * Escribir primero el fichero y después la fila es deliberado, igual que en las
 * notas: si falla la segunda queda un fichero huérfano —recuperable,
 * invisible—, mientras que al revés quedaría una fila que apunta a nada y la
 * interfaz enseñaría un audio roto.
 *
 * **Nada se toca sin pasar antes por el sueño**, que es lo único que sabe de
 * quién es esto (D1): un audio no tiene dueño propio, lo hereda.
 */
@Injectable()
export class DreamAudiosService {
  constructor(
    @InjectRepository(DreamAudio) private readonly audios: Repository<DreamAudio>,
    private readonly dreams: DreamsRepository,
    private readonly storage: AudioStorageService,
  ) {}

  async add(
    ownerId: string,
    dreamId: string,
    file: UploadedAudio,
    options: { recorded: boolean; durationSeconds: number | null },
  ): Promise<DreamAudio> {
    // Antes de tocar el disco: si el sueño no es suyo, esto es un 404.
    await this.dreams.require(ownerId, dreamId);

    const stored = await this.storage.save(userScope(ownerId), file);

    return this.audios.save(
      this.audios.create({
        dreamId,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        durationSeconds: options.durationSeconds,
        recorded: options.recorded,
      }),
    );
  }

  /** El fichero para descargarlo, comprobando **antes** que el sueño es suyo. */
  async stream(ownerId: string, id: string): Promise<{ audio: DreamAudio; file: ReadStream }> {
    const audio = await this.require(ownerId, id);
    return { audio, file: this.storage.read(audio.storageKey) };
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const audio = await this.require(ownerId, id);

    await this.audios.softRemove(audio);
    await this.storage.remove(audio.storageKey);
  }

  private async require(ownerId: string, id: string): Promise<DreamAudio> {
    const audio = await this.audios.findOne({ where: { id } });
    if (!audio) throw new NotFoundException('Ese audio no existe');

    // Lanza 404 si el sueño no es suyo, que es la respuesta correcta: un 403
    // confirmaría que el identificador acertó.
    await this.dreams.require(ownerId, audio.dreamId);

    return audio;
  }
}
