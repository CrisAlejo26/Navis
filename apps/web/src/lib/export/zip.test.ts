import { describe, expect, it } from 'vitest';

import { readZip, textOf } from './zip-reader';
import { buildZip, crc32, utf8 } from './zip';

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('crc32', () => {
  it('calcula el valor conocido de una cadena', () => {
    // 0x3610a686 es el CRC32 de «hello» en cualquier implementación.
    expect(crc32(utf8('hello'))).toBe(0x3610a686);
  });

  it('devuelve cero para lo vacío', () => {
    expect(crc32(utf8(''))).toBe(0);
  });
});

describe('buildZip', () => {
  it('escribe un ZIP que se puede volver a leer entero', async () => {
    const zip = buildZip(
      [
        { name: 'uno.txt', data: utf8('primero') },
        { name: 'carpeta/dos.xml', data: utf8('<a>ñandú</a>') },
      ],
      'application/zip',
    );

    const entries = readZip(await bytesOf(zip));

    expect(entries.map((entry) => entry.name)).toEqual(['uno.txt', 'carpeta/dos.xml']);
    expect(textOf(entries[0])).toBe('primero');
    expect(textOf(entries[1])).toBe('<a>ñandú</a>');
  });

  it('guarda el CRC de cada entrada, que es lo que valida quien lo abre', async () => {
    const data = utf8('lo que sea');
    const entries = readZip(await bytesOf(buildZip([{ name: 'a.txt', data }], 'application/zip')));

    expect(entries[0]?.crc).toBe(crc32(data));
  });

  /**
   * La fecha de las entradas es fija a propósito: sin eso, el mismo listado
   * exportado dos veces daría ficheros distintos y esto no se podría comparar.
   */
  it('es reproducible: dos veces lo mismo da los mismos bytes', async () => {
    const hacer = () => buildZip([{ name: 'a.txt', data: utf8('igual') }], 'application/zip');

    expect(await bytesOf(hacer())).toEqual(await bytesOf(hacer()));
  });
});
