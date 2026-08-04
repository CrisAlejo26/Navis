import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AUDIO_EXTENSIONS, isAudioMimeType, MAX_AUDIO_BYTES } from '@navis/shared';
import { createReadStream, existsSync, type ReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { uploadsPath } from '../config/env';

/**
 * Los ficheros de audio, en disco.
 *
 * Fuera de la base de datos a propósito: un audio de dos minutos es un mega, y
 * meterlos dentro engorda cada volcado sin dar nada a cambio. La carpeta se
 * configura con `UPLOADS_PATH` y en Docker es un volumen, así que entra en las
 * copias de seguridad como una carpeta más.
 *
 * **El nombre del fichero lo pone este servicio**, nunca el cliente: es un
 * identificador nuevo más la extensión que corresponde a su tipo. Un nombre
 * venido de fuera es la puerta clásica al `../../etc/passwd`, y aquí no hay
 * ninguna forma de que llegue hasta el disco.
 *
 * Se guarda por iglesia (`<uploads>/<churchId>/<id>.<ext>`) porque el día que
 * haya que exportar o borrar una entera es una carpeta y no una consulta.
 */
@Injectable()
export class AudioStorageService {
  /** Guarda el fichero y devuelve la clave con la que se vuelve a encontrar. */
  async save(
    churchId: string,
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
    const storageKey = join(churchId, `${crypto.randomUUID()}.${extension}`);

    await mkdir(join(uploadsPath, churchId), { recursive: true });
    await writeFile(this.pathOf(storageKey), file.buffer);

    return { storageKey, mimeType, sizeBytes: file.size };
  }

  /** El fichero, para servirlo. 404 si el disco y la base ya no coinciden. */
  read(storageKey: string): ReadStream {
    const path = this.pathOf(storageKey);
    if (!existsSync(path)) throw new NotFoundException('Ese audio ya no está');

    return createReadStream(path);
  }

  /** Borrar la ficha sin borrar el fichero deja basura que nadie recoge. */
  async remove(storageKey: string): Promise<void> {
    const path = this.pathOf(storageKey);
    if (existsSync(path)) await unlink(path);
  }

  /**
   * La ruta absoluta, comprobando que **de verdad** cae dentro de la carpeta.
   *
   * Es un cinturón sobre los tirantes: la clave la genera `save` y no puede
   * traer `..`, pero esto es lo único que hay entre una clave manipulada y el
   * resto del disco, y cuesta tres líneas.
   */
  private pathOf(storageKey: string): string {
    const path = resolve(uploadsPath, storageKey);
    if (!path.startsWith(resolve(uploadsPath))) {
      throw new BadRequestException('Ruta de audio inválida');
    }

    return path;
  }
}
