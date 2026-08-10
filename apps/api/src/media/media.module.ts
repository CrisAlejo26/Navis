import { Module } from '@nestjs/common';

import { AudioStorageService } from './audio-storage.service';
import { DocumentStorageService } from './document-storage.service';
import { FileStorageService } from './file-storage.service';
import { ImageStorageService } from './image-storage.service';

/**
 * Los ficheros subidos, que no son de ningún módulo en concreto.
 *
 * Nació dentro de creyentes, con los audios de la bitácora (RFC 0003). Al
 * llegar los sueños pasó a haber un segundo dueño posible —una persona, que no
 * tiene iglesia— y con las fotografías, un segundo tipo de fichero, y con los
 * archivos adjuntos del chat (RFC 0016), un cuarto. La mecánica de disco es la
 * misma para los cuatro, así que vive una vez en `FileStorageService`; lo que
 * cambia —qué se acepta y cuánto pesa— vive en el servicio de cada tipo (RFC
 * 0005 D13).
 */
@Module({
  providers: [FileStorageService, AudioStorageService, ImageStorageService, DocumentStorageService],
  exports: [FileStorageService, AudioStorageService, ImageStorageService, DocumentStorageService],
})
export class MediaModule {}
