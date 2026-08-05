/**
 * Leer un ZIP «store», que es la contraparte de `buildZip`.
 *
 * **Solo lo usan los tests**, y por eso está aquí y no dentro de uno: es lo
 * que permite comprobar que lo que se escribe se puede volver a leer —nombres,
 * tamaños y CRC— sin meter una librería de descompresión en el paquete. Nada
 * del código de la aplicación lo importa, así que no viaja en el bundle.
 */
const FIRMA_FINAL = 0x06054b50;
const FIRMA_CENTRAL = 0x02014b50;
const DECODIFICADOR = new TextDecoder();

export interface ZipRead {
  name: string;
  crc: number;
  data: Uint8Array;
}

export function readZip(bytes: Uint8Array): ZipRead[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const final = findFinal(view, bytes.length);
  const total = view.getUint16(final + 10, true);

  let cursor = view.getUint32(final + 16, true);
  const entries: ZipRead[] = [];

  for (let indice = 0; indice < total; indice += 1) {
    if (view.getUint32(cursor, true) !== FIRMA_CENTRAL) {
      throw new Error('El directorio central no cuadra');
    }

    const crc = view.getUint32(cursor + 16, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const offset = view.getUint32(cursor + 42, true);

    const name = DECODIFICADOR.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));

    // La cabecera local mide 30 bytes más el nombre y el campo extra.
    const localName = view.getUint16(offset + 26, true);
    const localExtra = view.getUint16(offset + 28, true);
    const start = offset + 30 + localName + localExtra;

    entries.push({ name, crc, data: bytes.subarray(start, start + size) });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

/** El final del directorio va al final del fichero, y se busca hacia atrás. */
function findFinal(view: DataView, length: number): number {
  for (let cursor = length - 22; cursor >= 0; cursor -= 1) {
    if (view.getUint32(cursor, true) === FIRMA_FINAL) return cursor;
  }

  throw new Error('Esto no es un ZIP');
}

export function textOf(entry: ZipRead): string {
  return DECODIFICADOR.decode(entry.data);
}
