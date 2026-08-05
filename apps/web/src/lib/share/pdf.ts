/**
 * Un PDF con una imagen por página, sin librerías.
 *
 * Merece la pena frente a mandar el PNG: WhatsApp recomprime las imágenes y se
 * come la letra pequeña, pero un **documento** llega tal cual. Y para imprimir
 * o guardar, un PDF es lo que la gente espera.
 *
 * El formato es más simple de lo que parece: un catálogo, un índice de páginas
 * y tres objetos por página —la página, su JPEG incrustado tal cual
 * (`DCTDecode`) y sus órdenes de dibujo—, con una tabla de posiciones al final.
 *
 * Empezó con una sola página para la lámina del calendario (RFC 0002) y pasó a
 * varias con la exportación de listados (RFC 0009 D6): una tabla de trescientas
 * filas se rasteriza por trozos y cada trozo es una página. Lo que se pierde es
 * poder seleccionar el texto dentro del PDF; lo que se gana es cualquier
 * alfabeto y el diseño exacto de la aplicación.
 */
const CODIFICADOR = new TextEncoder();

/** El PDF mide en puntos: 72 por pulgada frente a los 96 del navegador. */
const PUNTOS_POR_PIXEL = 0.75;

/** Cuántos objetos ocupa cada página: la página, su imagen y su contenido. */
const OBJETOS_POR_PAGINA = 3;

export interface PdfImage {
  /** El JPEG ya codificado. Sobre `ArrayBuffer` y no `ArrayBufferLike`: es lo
   *  que acepta `Blob`, que no sabe de memoria compartida. */
  bytes: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
}

interface Objeto {
  cuerpo: string;
  /** Lo que va entre `stream` y `endstream`, si el objeto lleva flujo. */
  flujo?: Uint8Array<ArrayBuffer> | string;
}

export function buildPdf(pages: readonly PdfImage[]): Blob {
  if (pages.length === 0) throw new Error('Un PDF necesita al menos una página');

  const objetos: Objeto[] = [
    { cuerpo: '<< /Type /Catalog /Pages 2 0 R >>' },
    { cuerpo: indicePaginas(pages.length) },
  ];

  for (const [indice, page] of pages.entries()) objetos.push(...paginaDe(page, indice));

  return ensamblar(objetos);
}

/** `<< /Type /Pages /Kids [3 0 R 6 0 R …] /Count 2 >>`. */
function indicePaginas(total: number): string {
  const kids = Array.from(
    { length: total },
    (_unused, indice) => `${String(primerObjetoDe(indice))} 0 R`,
  ).join(' ');

  return `<< /Type /Pages /Kids [${kids}] /Count ${String(total)} >>`;
}

/** El primer objeto de una página: el catálogo y el índice ocupan el 1 y el 2. */
function primerObjetoDe(indice: number): number {
  return 3 + indice * OBJETOS_POR_PAGINA;
}

function paginaDe(page: PdfImage, indice: number): Objeto[] {
  const base = primerObjetoDe(indice);
  const ancho = Math.round(page.width * PUNTOS_POR_PIXEL);
  const alto = Math.round(page.height * PUNTOS_POR_PIXEL);
  const dibujo = `q ${String(ancho)} 0 0 ${String(alto)} 0 0 cm /Im0 Do Q`;

  return [
    {
      cuerpo:
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${String(ancho)} ${String(alto)}] ` +
        `/Resources << /XObject << /Im0 ${String(base + 1)} 0 R >> >> /Contents ${String(base + 2)} 0 R >>`,
    },
    {
      cuerpo:
        `<< /Type /XObject /Subtype /Image /Width ${String(page.width)} /Height ${String(page.height)} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${String(page.bytes.length)} >>`,
      flujo: page.bytes,
    },
    { cuerpo: `<< /Length ${String(dibujo.length)} >>`, flujo: dibujo },
  ];
}

/**
 * Los objetos, uno detrás de otro, y la tabla de posiciones al final.
 *
 * Las posiciones se cuentan en **bytes**, y por eso todo lo que se escribe
 * como texto aquí es ASCII: con un acento, `String#length` y el número de
 * bytes dejarían de coincidir y el lector no encontraría los objetos. El texto
 * de verdad no pasa por aquí —va dentro del JPEG—, así que no es una
 * limitación, es una invariante.
 */
function ensamblar(objetos: readonly Objeto[]): Blob {
  const trozos: (Uint8Array<ArrayBuffer> | string)[] = ['%PDF-1.4\n'];
  const posiciones: number[] = [];
  let offset = trozos[0].length;

  const escribir = (trozo: Uint8Array<ArrayBuffer> | string) => {
    trozos.push(trozo);
    offset += trozo.length;
  };

  objetos.forEach((objeto, indice) => {
    posiciones.push(offset);
    escribir(`${String(indice + 1)} 0 obj\n${objeto.cuerpo}\n`);

    if (objeto.flujo !== undefined) {
      escribir('stream\n');
      escribir(objeto.flujo);
      escribir('\nendstream\n');
    }

    escribir('endobj\n');
  });

  const inicioXref = offset;
  const total = objetos.length + 1;
  escribir(
    [
      `xref\n0 ${String(total)}\n`,
      '0000000000 65535 f \n',
      ...posiciones.map((posicion) => `${posicion.toString().padStart(10, '0')} 00000 n \n`),
      `trailer\n<< /Size ${String(total)} /Root 1 0 R >>\nstartxref\n${String(inicioXref)}\n%%EOF`,
    ].join(''),
  );

  const partes: BlobPart[] = trozos.map((trozo) =>
    typeof trozo === 'string' ? CODIFICADOR.encode(trozo) : trozo,
  );

  return new Blob(partes, { type: 'application/pdf' });
}
