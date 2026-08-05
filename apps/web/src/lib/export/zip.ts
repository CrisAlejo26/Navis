/**
 * Un ZIP **sin comprimir** (método `store`), que es todo lo que hace falta para
 * escribir un `.xlsx` a mano (RFC 0009 D5).
 *
 * Un `.xlsx` es un ZIP con seis ficheros XML dentro. Comprimir pediría un
 * `deflate`; guardarlos tal cual está permitido, lo abre cualquier hoja de
 * cálculo y deja el fichero entre tres y cinco veces más grande, que con dos
 * mil filas son unos cientos de kilobytes y no molesta a nadie.
 *
 * La fecha de todas las entradas es fija (1980-01-01): así el mismo listado
 * exportado dos veces da **el mismo fichero**, que es lo que permite compararlo
 * en un test sin depender del reloj.
 */
const FIRMA_LOCAL = 0x04034b50;
const FIRMA_CENTRAL = 0x02014b50;
const FIRMA_FINAL = 0x06054b50;

/** 1980-01-01 en el formato de fecha de MS-DOS: (año-1980)<<9 | mes<<5 | día. */
const FECHA_DOS = (0 << 9) | (1 << 5) | 1;

/** Bit 11: los nombres van en UTF-8. Los nuestros son ASCII, pero se declara. */
const BANDERAS = 0x0800;

const CODIFICADOR = new TextEncoder();

export interface ZipEntry {
  name: string;
  data: Uint8Array<ArrayBuffer>;
}

export function buildZip(entries: readonly ZipEntry[], mimeType: string): Blob {
  const partes: Uint8Array<ArrayBuffer>[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nombre = CODIFICADOR.encode(entry.name);
    const crc = crc32(entry.data);

    const cabecera = escribir(30, (view) => {
      view.setUint32(0, FIRMA_LOCAL, true);
      view.setUint16(4, 20, true); // versión necesaria
      view.setUint16(6, BANDERAS, true);
      view.setUint16(8, 0, true); // método: sin comprimir
      view.setUint16(10, 0, true); // hora
      view.setUint16(12, FECHA_DOS, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, entry.data.length, true); // tamaño comprimido
      view.setUint32(22, entry.data.length, true); // tamaño real
      view.setUint16(26, nombre.length, true);
      view.setUint16(28, 0, true); // sin campo extra
    });

    central.push(
      concatenar([
        escribir(46, (view) => {
          view.setUint32(0, FIRMA_CENTRAL, true);
          view.setUint16(4, 20, true); // versión que lo creó
          view.setUint16(6, 20, true);
          view.setUint16(8, BANDERAS, true);
          view.setUint16(10, 0, true);
          view.setUint16(12, 0, true);
          view.setUint16(14, FECHA_DOS, true);
          view.setUint32(16, crc, true);
          view.setUint32(20, entry.data.length, true);
          view.setUint32(24, entry.data.length, true);
          view.setUint16(28, nombre.length, true);
          view.setUint32(42, offset, true);
        }),
        nombre,
      ]),
    );

    partes.push(cabecera, nombre, entry.data);
    offset += cabecera.length + nombre.length + entry.data.length;
  }

  const directorio = concatenar(central);
  const final = escribir(22, (view) => {
    view.setUint32(0, FIRMA_FINAL, true);
    view.setUint16(8, entries.length, true);
    view.setUint16(10, entries.length, true);
    view.setUint32(12, directorio.length, true);
    view.setUint32(16, offset, true);
  });

  return new Blob([...partes, directorio, final], { type: mimeType });
}

function escribir(size: number, fill: (view: DataView) => void): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(size);
  fill(new DataView(buffer));
  return new Uint8Array(buffer);
}

function concatenar(parts: readonly Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const salida = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    salida.set(part, cursor);
    cursor += part.length;
  }

  return salida;
}

let TABLA: Uint32Array | undefined;

/** La tabla de CRC32, calculada la primera vez que hace falta y no antes. */
function tabla(): Uint32Array {
  if (TABLA) return TABLA;

  const nueva = new Uint32Array(256);
  for (let indice = 0; indice < 256; indice += 1) {
    let valor = indice;
    for (let bit = 0; bit < 8; bit += 1) {
      valor = (valor & 1) === 1 ? 0xedb88320 ^ (valor >>> 1) : valor >>> 1;
    }
    nueva[indice] = valor >>> 0;
  }

  TABLA = nueva;
  return nueva;
}

export function crc32(data: Uint8Array): number {
  const tablaCrc = tabla();
  let valor = 0xffffffff;
  for (const byte of data) valor = tablaCrc[(valor ^ byte) & 0xff] ^ (valor >>> 8);

  return (valor ^ 0xffffffff) >>> 0;
}

export function utf8(value: string): Uint8Array<ArrayBuffer> {
  return CODIFICADOR.encode(value);
}
