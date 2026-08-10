import { existsSync } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { uploadsPath } from '../config/env';
import { churchScope, FileStorageService, userScope } from './file-storage.service';

/**
 * `moveScope`/`rekey` son la mitad del traslado de una iglesia (RFC 0015):
 * mueven los audios y fotos de disco y dejan la clave lista para guardarse en
 * la fila. Se prueba contra disco de verdad —como el resto del servicio, no
 * tiene mocks que valga la pena montar— con carpetas de prueba que se borran
 * al terminar.
 */
describe('FileStorageService', () => {
  const service = new FileStorageService();
  const carpetas: string[] = [];

  afterEach(async () => {
    await Promise.all(
      carpetas.map((carpeta) => rm(join(uploadsPath, carpeta), { recursive: true, force: true })),
    );
    carpetas.length = 0;
  });

  it('mueve los ficheros de un ámbito de iglesia a otro y borra la carpeta de origen', async () => {
    const origenId = `test-origen-${String(Date.now())}`;
    const destinoId = `test-destino-${String(Date.now())}`;
    carpetas.push(origenId, destinoId);

    const clave = await service.write(churchScope(origenId), Buffer.from('audio'), 'mp3');

    const movidos = await service.moveScope(churchScope(origenId), churchScope(destinoId));

    expect(movidos).toBe(1);
    expect(existsSync(join(uploadsPath, origenId))).toBe(false);
    const nuevaRuta = service.rekey(clave, churchScope(origenId), churchScope(destinoId));
    expect(await readFile(join(uploadsPath, nuevaRuta), 'utf8')).toBe('audio');
  });

  it('funde el contenido si el destino ya tiene ficheros propios', async () => {
    const origenId = `test-origen-${String(Date.now())}-b`;
    const destinoId = `test-destino-${String(Date.now())}-b`;
    carpetas.push(origenId, destinoId);

    await service.write(churchScope(destinoId), Buffer.from('ya estaba'), 'mp3');
    await service.write(churchScope(origenId), Buffer.from('llega ahora'), 'mp3');

    const movidos = await service.moveScope(churchScope(origenId), churchScope(destinoId));

    expect(movidos).toBe(1);
    expect(existsSync(join(uploadsPath, destinoId))).toBe(true);
  });

  it('no falla si el ámbito de origen no tiene ficheros', async () => {
    const origenId = `test-vacio-${String(Date.now())}`;
    const destinoId = `test-vacio-destino-${String(Date.now())}`;
    carpetas.push(origenId, destinoId);

    const movidos = await service.moveScope(churchScope(origenId), churchScope(destinoId));

    expect(movidos).toBe(0);
  });

  it('rekey reescribe solo el prefijo del ámbito, conservando el nombre del fichero', () => {
    const clave = join('origen-id', 'archivo.mp3');

    const reescrita = service.rekey(clave, churchScope('origen-id'), churchScope('destino-id'));

    expect(reescrita).toBe(join('destino-id', 'archivo.mp3'));
  });

  it('rekey también funciona con el ámbito de usuario, cuya carpeta lleva un nivel más', async () => {
    const origenId = `test-user-origen-${String(Date.now())}`;
    carpetas.push(join('users', origenId));

    const clave = await service.write(userScope(origenId), Buffer.from('foto'), 'jpg');

    const reescrita = service.rekey(clave, userScope(origenId), userScope('otro-usuario'));

    expect(reescrita).toBe(join('users', 'otro-usuario', clave.split(/[/\\]/).pop() as string));
  });

  it('mkdir crea el destino aunque no exista todavía ninguna carpeta suya', async () => {
    const origenId = `test-nuevo-${String(Date.now())}`;
    const destinoId = `test-nuevo-destino-${String(Date.now())}`;
    carpetas.push(origenId, destinoId);
    await mkdir(join(uploadsPath, origenId), { recursive: true });

    const movidos = await service.moveScope(churchScope(origenId), churchScope(destinoId));

    expect(movidos).toBe(0);
    expect(existsSync(join(uploadsPath, destinoId))).toBe(true);
  });
});
