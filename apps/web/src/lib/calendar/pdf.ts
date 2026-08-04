/**
 * Un PDF de una página con la lámina dentro, sin librerías.
 *
 * Merece la pena frente a mandar el PNG: WhatsApp recomprime las imágenes y se
 * come la letra pequeña, pero un **documento** llega tal cual. Y para imprimir
 * o guardar, un PDF es lo que la gente espera.
 *
 * El formato es más simple de lo que parece: cinco objetos, la imagen JPEG
 * incrustada tal cual (`DCTDecode`) y una tabla de posiciones al final.
 */
const CODIFICADOR = new TextEncoder();

/** El PDF mide en puntos: 72 por pulgada frente a los 96 del navegador. */
const PUNTOS_POR_PIXEL = 0.75;

export interface PdfImage {
  /** El JPEG ya codificado. Sobre `ArrayBuffer` y no `ArrayBufferLike`: es lo
   *  que acepta `Blob`, que no sabe de memoria compartida. */
  bytes: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
}

export function buildPdf({ bytes, width, height }: PdfImage): Blob {
  const ancho = Math.round(width * PUNTOS_POR_PIXEL);
  const alto = Math.round(height * PUNTOS_POR_PIXEL);
  const dibujo = `q ${String(ancho)} 0 0 ${String(alto)} 0 0 cm /Im0 Do Q`;

  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${String(ancho)} ${String(alto)}] ` +
      '/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>',
    `<< /Type /XObject /Subtype /Image /Width ${String(width)} /Height ${String(height)} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${String(bytes.length)} >>`,
    `<< /Length ${String(dibujo.length)} >>`,
  ];

  const trozos: (Uint8Array<ArrayBuffer> | string)[] = ['%PDF-1.4\n'];
  const posiciones: number[] = [];
  let offset = trozos[0].length;

  const escribir = (trozo: Uint8Array<ArrayBuffer> | string) => {
    trozos.push(trozo);
    offset += typeof trozo === 'string' ? trozo.length : trozo.length;
  };

  objetos.forEach((cuerpo, indice) => {
    posiciones.push(offset);
    escribir(`${String(indice + 1)} 0 obj\n${cuerpo}\n`);

    // Los dos últimos objetos llevan flujo: la imagen y las órdenes de dibujo.
    if (indice === 3) {
      escribir('stream\n');
      escribir(bytes);
      escribir('\nendstream\n');
    }
    if (indice === 4) escribir(`stream\n${dibujo}\nendstream\n`);

    escribir('endobj\n');
  });

  const inicioXref = offset;
  const xref = [
    `xref\n0 ${String(objetos.length + 1)}\n`,
    '0000000000 65535 f \n',
    ...posiciones.map((posicion) => `${posicion.toString().padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${String(objetos.length + 1)} /Root 1 0 R >>\nstartxref\n${String(inicioXref)}\n%%EOF`,
  ].join('');

  escribir(xref);

  const partes: BlobPart[] = trozos.map((trozo) =>
    typeof trozo === 'string' ? CODIFICADOR.encode(trozo) : trozo,
  );

  return new Blob(partes, { type: 'application/pdf' });
}
