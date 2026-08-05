import { BadRequestException, Injectable } from '@nestjs/common';
import { IMAGE_EXTENSIONS, isImageMimeType, MAX_IMAGE_BYTES } from '@navis/shared';
import type { ReadStream } from 'node:fs';

import { FileStorageService, type FileScope } from './file-storage.service';

/**
 * Las imágenes: **qué se acepta como imagen** y poco más.
 *
 * Gemelo de `AudioStorageService` sobre el mismo `FileStorageService`. Lo único
 * propio son los tipos —sin `svg`, que es un documento con scripts dentro— y el
 * tope de ocho megas.
 */
@Injectable()
export class ImageStorageService {
  constructor(private readonly files: FileStorageService) {}

  async save(
    scope: FileScope,
    file: { buffer: Buffer; mimetype: string; size: number },
  ): Promise<{ storageKey: string; mimeType: string }> {
    if (!isImageMimeType(file.mimetype)) {
      throw new BadRequestException('Ese fichero no es una imagen');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('La imagen es demasiado grande');
    }

    const mimeType = file.mimetype.split(';')[0]?.trim().toLowerCase() ?? '';
    const extension = isImageMimeType(mimeType) ? IMAGE_EXTENSIONS[mimeType] : 'bin';

    return { storageKey: await this.files.write(scope, file.buffer, extension), mimeType };
  }

  read(storageKey: string): ReadStream {
    return this.files.read(storageKey);
  }

  async remove(storageKey: string): Promise<void> {
    await this.files.remove(storageKey);
  }
}
