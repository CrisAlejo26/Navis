import { serializeXhtml } from './rasterize';

/**
 * Imprimir la lámina —o guardarla como PDF— sin librerías.
 *
 * Es el respaldo cuando el navegador no sabe rasterizar a PNG, y a la vez la
 * forma de sacar el mes en un A4 para colgarlo: la lámina ya es HTML
 * autocontenido, así que basta con abrirla sola en una ventana y pedir
 * imprimir.
 */
export function printNode(node: HTMLElement, title: string, landscape: boolean): void {
  const ventana = window.open('', '_blank', 'width=1024,height=768');
  if (!ventana) throw new Error('El navegador ha bloqueado la ventana de impresión');

  const markup = serializeXhtml(node);

  ventana.document.write(
    [
      '<!doctype html><html><head><meta charset="utf-8">',
      `<title>${title}</title>`,
      `<style>@page{size:${landscape ? 'A4 landscape' : 'A4'};margin:8mm}`,
      'body{margin:0}img{max-width:100%}</style>',
      `</head><body>${markup}</body></html>`,
    ].join(''),
  );

  ventana.document.close();
  ventana.focus();
  // Un respiro para que la imagen del logo termine de decodificarse: sin él,
  // Chrome imprime el hueco en blanco.
  setTimeout(() => {
    ventana.print();
  }, 300);
}
