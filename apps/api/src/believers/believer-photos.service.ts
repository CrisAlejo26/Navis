import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ReadStream } from 'node:fs';

import { churchScope } from '../media/file-storage.service';
import { ImageStorageService } from '../media/image-storage.service';
import { Believer } from './believer.entity';
import { BelieversService } from './believers.service';

/** Lo que llega de multer, reducido a lo que de verdad se usa (Regla 10). */
export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/** El tipo que se sirve, a partir de la extensión con la que se guardó. */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

/**
 * La fotografía de un creyente: la clave en la fila y el fichero en disco,
 * siempre los dos a la vez.
 *
 * Escribir primero el fichero y después la fila es deliberado, igual que con
 * los audios: si falla lo segundo queda un fichero huérfano —recuperable,
 * invisible—, mientras que al revés quedaría una fila apuntando a nada y la
 * ficha enseñaría una imagen rota.
 *
 * Al **reemplazar** una foto se borra la anterior: si no, cada cambio de retrato
 * dejaría un fichero para siempre en el volumen.
 */
@Injectable()
export class BelieverPhotosService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    private readonly people: BelieversService,
    private readonly images: ImageStorageService,
  ) {}

  async set(churchId: string, id: string, file: UploadedImage): Promise<Believer> {
    const believer = await this.people.require(churchId, id);
    const previous = believer.photoKey;

    const stored = await this.images.save(churchScope(churchId), file);
    believer.photoKey = stored.storageKey;
    const saved = await this.believers.save(believer);

    if (previous) await this.images.remove(previous);

    return saved;
  }

  /** El fichero para servirlo, comprobando **antes** que es de esta iglesia. */
  async stream(churchId: string, id: string): Promise<{ file: ReadStream; mimeType: string }> {
    const believer = await this.people.require(churchId, id);
    if (!believer.photoKey) throw new NotFoundException('Esa persona no tiene fotografía');

    const extension = believer.photoKey.split('.').pop() ?? '';

    return {
      file: this.images.read(believer.photoKey),
      mimeType: MIME_BY_EXTENSION[extension] ?? 'application/octet-stream',
    };
  }

  async remove(churchId: string, id: string): Promise<Believer> {
    const believer = await this.people.require(churchId, id);
    const previous = believer.photoKey;

    believer.photoKey = null;
    const saved = await this.believers.save(believer);

    if (previous) await this.images.remove(previous);

    return saved;
  }
}
