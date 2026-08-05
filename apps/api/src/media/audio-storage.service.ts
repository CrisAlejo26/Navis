import { BadRequestException, Injectable } from '@nestjs/common';
import { AUDIO_EXTENSIONS, isAudioMimeType, MAX_AUDIO_BYTES } from '@navis/shared';
import type { ReadStream } from 'node:fs';

import { FileStorageService, type FileScope } from './file-storage.service';

export { churchScope, userScope, type FileScope as AudioScope } from './file-storage.service';

/**
 * Los audios: **qué se acepta como audio** y poco más.
 *
 * La mecánica de disco —escribir, leer, borrar y no salirse de la carpeta— vive
 * en `FileStorageService`, que es la misma para audios y para fotografías. Aquí
 * solo queda lo propio: los tipos que valen, el tope de tamaño y con qué
 * extensión se guarda cada uno.
 */
@Injectable()
export class AudioStorageService {
  constructor(private readonly files: FileStorageService) {}

  /** Guarda el fichero y devuelve la clave con la que se vuelve a encontrar. */
  async save(
    scope: FileScope,
    file: { buffer: Buffer; mimetype: string; size: number },
  ): Promise<{ storageKey: string; mimeType: string; sizeBytes: number }> {
    if (!isAudioMimeType(file.mimetype)) {
      throw new BadRequestException('Ese fichero no es un audio');
    }
    if (file.size > MAX_AUDIO_BYTES) {
      throw new BadRequestException('El audio es demasiado largo');
    }

    // El tipo llega con el códec pegado: `audio/webm;codecs=opus`.
    const mimeType = file.mimetype.split(';')[0]?.trim().toLowerCase() ?? '';
    const extension = isAudioMimeType(mimeType) ? AUDIO_EXTENSIONS[mimeType] : 'bin';

    return {
      storageKey: await this.files.write(scope, file.buffer, extension),
      mimeType,
      sizeBytes: file.size,
    };
  }

  read(storageKey: string): ReadStream {
    return this.files.read(storageKey);
  }

  async remove(storageKey: string): Promise<void> {
    await this.files.remove(storageKey);
  }
}
