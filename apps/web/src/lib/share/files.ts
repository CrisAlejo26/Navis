/**
 * Sacar un fichero del navegador por los tres caminos posibles.
 *
 * No son alternativas de adorno: en el móvil el bueno es el primero —abre la
 * hoja del sistema y de ahí a WhatsApp—, en un escritorio el segundo, y el
 * tercero es el que siempre funciona.
 *
 * Vive en `lib/share` y no en `lib/calendar` porque a partir del RFC 0009 lo
 * usan la lámina del calendario **y** las tres exportaciones. No es que se
 * parezcan: es la misma cosa (Regla 1 §5).
 */
function toFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
}

/** Si este aparato sabe compartir ficheros. En varios escritorios, no. */
export function canShareFiles(blob: Blob, fileName: string): boolean {
  return navigator.canShare?.({ files: [toFile(blob, fileName)] }) ?? false;
}

export async function shareFile(blob: Blob, fileName: string, title: string): Promise<void> {
  await navigator.share({ files: [toFile(blob, fileName)], title });
}

export function canCopyImage(): boolean {
  return typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';
}

export async function copyImage(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  // Sin esto, el objeto se queda en memoria hasta que se recarga la página.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/**
 * «Iglesia El Faro» → `iglesia-el-faro`. Para meterlo en el nombre de un
 * fichero, donde un acento o un espacio se convierten en `%20` en cuanto el
 * fichero viaja por algún sitio.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
