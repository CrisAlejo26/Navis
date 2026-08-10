import { BadRequestException, Injectable } from '@nestjs/common';
import { FILE_EXTENSIONS, isFileMimeType, MAX_FILE_BYTES } from '@navis/shared';
import type { ReadStream } from 'node:fs';

import { FileStorageService, type FileScope } from './file-storage.service';

/** Lo que llega de multer, reducido a lo que de verdad se usa (Regla 10). */
export interface UploadedDocument {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * Los archivos de un mensaje (RFC 0016 §7): **qué se acepta como documento**
 * y poco más. Gemelo de `AudioStorageService`/`ImageStorageService` sobre el
 * mismo `FileStorageService`.
 */
@Injectable()
export class DocumentStorageService {
  constructor(private readonly files: FileStorageService) {}

  async save(
    scope: FileScope,
    file: UploadedDocument,
  ): Promise<{ storageKey: string; mimeType: string }> {
    if (!isFileMimeType(file.mimetype)) {
      throw new BadRequestException('Ese tipo de archivo no está permitido');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('El archivo pesa demasiado');
    }

    const mimeType = file.mimetype.split(';')[0]?.trim().toLowerCase() ?? '';
    const extension = isFileMimeType(mimeType) ? FILE_EXTENSIONS[mimeType] : 'bin';

    return { storageKey: await this.files.write(scope, file.buffer, extension), mimeType };
  }

  read(storageKey: string): ReadStream {
    return this.files.read(storageKey);
  }

  async remove(storageKey: string): Promise<void> {
    await this.files.remove(storageKey);
  }
}
