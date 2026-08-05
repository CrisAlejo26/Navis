/**
 * De un trozo de página a un PNG, sin librerías.
 *
 * El truco es meter el nodo dentro de un `<foreignObject>` de un SVG y dejar
 * que el navegador lo pinte en un `<canvas>`. Solo funciona si el nodo es
 * **autocontenido**: estilos en línea —nada de clases—, colores en
 * hexadecimal —`oklch` no sobrevive al viaje— e imágenes en `data:`. Por eso
 * la lámina se compone aparte y no se captura la pantalla (RFC 0002 D13 y D14).
 */
/**
 * El nodo como XHTML autocontenido.
 *
 * El `xmlns` va sobre una copia y no sobre el elemento de React: dentro de un
 * `<foreignObject>` el contenido tiene que declararse como XHTML o el
 * navegador no pinta nada, y no es un atributo que pinte la interfaz.
 */
export function serializeXhtml(node: HTMLElement): string {
  const copy = node.cloneNode(true) as HTMLElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  return new XMLSerializer().serializeToString(copy);
}

export async function nodeToPng(node: HTMLElement, scale = 3): Promise<Blob> {
  const canvas = await nodeToCanvas(node, scale);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) throw new Error('No se ha podido generar la imagen');

  return blob;
}

/** La misma lámina en JPEG, que es lo que se puede incrustar en un PDF. */
export async function nodeToJpeg(
  node: HTMLElement,
  scale = 3,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; width: number; height: number }> {
  const canvas = await nodeToCanvas(node, scale);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
  if (!blob) throw new Error('No se ha podido generar la imagen');

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
  };
}

async function nodeToCanvas(node: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  /*
   * `offsetWidth`/`offsetHeight` y **no** `getBoundingClientRect`: la vista
   * previa enseña la lámina reducida con `transform: scale`, y el rectángulo
   * del cliente vendría ya escalado —la imagen saldría recortada a un tercio—.
   * Estas dos propiedades dan la caja de diseño, ajena a las transformaciones.
   */
  const ancho = node.offsetWidth;
  const alto = node.offsetHeight;

  const markup = serializeXhtml(node);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(ancho)}" height="${String(alto)}">`,
    `<foreignObject x="0" y="0" width="100%" height="100%">${markup}</foreignObject>`,
    '</svg>',
  ].join('');

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = ancho * scale;
  canvas.height = alto * scale;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no ha dado contexto de canvas');

  // Fondo opaco: ni un PNG transparente sobre el verde de WhatsApp ni un JPEG,
  // que directamente no sabe de transparencias.
  context.fillStyle = getComputedStyle(node).backgroundColor || '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(scale, scale);
  context.drawImage(image, 0, 0, ancho, alto);

  return canvas;
}
