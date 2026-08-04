/**
 * Sacar la lámina del navegador por los tres caminos posibles (§9.3).
 *
 * No son alternativas de adorno: en el móvil el bueno es el primero —abre la
 * hoja del sistema y de ahí a WhatsApp—, en un escritorio el segundo, y el
 * tercero es el que siempre funciona.
 */
function toFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: 'image/png' });
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

export function downloadImage(blob: Blob, fileName: string): void {
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

/** `navis-elda-2026-08-15.png`: se entiende sin abrirlo. */
export function posterFileName(from: string, to: string, congregation?: string): string {
  const sede = congregation
    ? `-${congregation
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`
    : '';

  return `navis${sede}-${from}${from === to ? '' : `_${to}`}.png`;
}
