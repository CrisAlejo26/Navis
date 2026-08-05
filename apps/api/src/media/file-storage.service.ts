import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, existsSync, type ReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { uploadsPath } from '../config/env';

/**
 * De quién es lo que se guarda (RFC 0005 D13).
 *
 * Existe porque hay dos dueños posibles: lo de la bitácora de creyentes es de
 * una iglesia y lo de los sueños es de una persona, que no tiene ninguna.
 */
export type FileScope = { kind: 'church'; id: string } | { kind: 'user'; id: string };

export const churchScope = (id: string): FileScope => ({ kind: 'church', id });
export const userScope = (id: string): FileScope => ({ kind: 'user', id });

/**
 * La carpeta de cada ámbito.
 *
 * La de iglesia **no lleva prefijo** a propósito: los audios ya guardados viven
 * en `<uploads>/<churchId>/` y su `storage_key` apunta ahí. Moverlos para que
 * quedase simétrico obligaría a tocar disco y base de datos a la vez para no
 * ganar nada.
 */
function scopePath(scope: FileScope): string {
  return scope.kind === 'church' ? scope.id : join('users', scope.id);
}

/**
 * Los ficheros subidos, en disco. **La mecánica, sin saber qué son.**
 *
 * Fuera de la base de datos a propósito: meterlos dentro engorda cada volcado
 * sin dar nada a cambio. La carpeta se configura con `UPLOADS_PATH` y en Docker
 * es un volumen, así que entra en las copias de seguridad como una carpeta más.
 *
 * **El nombre del fichero lo pone este servicio**, nunca el cliente: es un
 * identificador nuevo más la extensión que le corresponda. Un nombre venido de
 * fuera es la puerta clásica al `../../etc/passwd`, y aquí no hay ninguna forma
 * de que llegue hasta el disco.
 *
 * Quién decide **qué** se puede subir son los servicios de encima —audio,
 * imagen—, cada uno con sus tipos y su tope. Esto solo escribe y lee.
 */
@Injectable()
export class FileStorageService {
  /** Guarda el fichero y devuelve la clave con la que se vuelve a encontrar. */
  async write(scope: FileScope, buffer: Buffer, extension: string): Promise<string> {
    const folder = scopePath(scope);
    const storageKey = join(folder, `${crypto.randomUUID()}.${extension}`);

    await mkdir(join(uploadsPath, folder), { recursive: true });
    await writeFile(this.pathOf(storageKey), buffer);

    return storageKey;
  }

  /** El fichero, para servirlo. 404 si el disco y la base ya no coinciden. */
  read(storageKey: string): ReadStream {
    const path = this.pathOf(storageKey);
    if (!existsSync(path)) throw new NotFoundException('Ese fichero ya no está');

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
   * Es un cinturón sobre los tirantes: la clave la genera `write` y no puede
   * traer `..`, pero esto es lo único que hay entre una clave manipulada y el
   * resto del disco, y cuesta tres líneas.
   */
  private pathOf(storageKey: string): string {
    const path = resolve(uploadsPath, storageKey);
    if (!path.startsWith(resolve(uploadsPath))) {
      throw new BadRequestException('Ruta de fichero inválida');
    }

    return path;
  }
}
