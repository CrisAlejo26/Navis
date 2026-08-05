import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { ExportPage } from '@/components/export/export-page';
import type { ExportCell } from '@/lib/export/columns';
import type { ExportDocument } from '@/lib/export/document';

/**
 * Pinta la lámina página a página y deja que quien llama la fotografíe.
 *
 * Se monta un `createRoot` propio en un contenedor **fuera de la vista** y se
 * renderiza con `flushSync`: hace falta que el DOM esté puesto **antes** de
 * rasterizar, y con el renderizado normal de React eso no se puede esperar. Al
 * ser un árbol aparte no necesita ningún proveedor: `ExportPage` no usa hooks
 * ni contexto a propósito.
 *
 * Se pinta de una en una y no las 112 a la vez: dos mil filas repartidas en
 * páginas son decenas de miles de celdas, y tenerlas todas en el DOM a la vez
 * es lo que cuelga el navegador de quien pulsa el botón.
 */
export async function rasterizePages<TResult>(
  doc: ExportDocument,
  options: { rowsPerPage: number; fixedHeight: boolean },
  capture: (node: HTMLElement) => Promise<TResult>,
): Promise<TResult[]> {
  const paginas = chunk(doc.rows, options.rowsPerPage);
  const host = document.createElement('div');
  // Fuera de la vista y no `display:none`: lo oculto no tiene tamaño, y sin
  // tamaño no hay nada que rasterizar.
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden';
  document.body.append(host);

  const root = createRoot(host);
  const salida: TResult[] = [];

  try {
    for (const [indice, filas] of paginas.entries()) {
      flushSync(() => {
        root.render(
          <ExportPage
            doc={doc}
            rows={filas}
            page={indice + 1}
            pages={paginas.length}
            fixedHeight={options.fixedHeight}
          />,
        );
      });

      const node = host.firstElementChild;
      if (!(node instanceof HTMLElement)) throw new Error('La lámina no se ha pintado');

      salida.push(await capture(node));
    }
  } finally {
    root.unmount();
    host.remove();
  }

  return salida;
}

/** Las filas en grupos del tamaño pedido. Sin filas, una página vacía. */
export function chunk(rows: readonly ExportCell[][], size: number): ExportCell[][][] {
  if (rows.length === 0) return [[]];

  const grupos: ExportCell[][][] = [];
  for (let inicio = 0; inicio < rows.length; inicio += size) {
    grupos.push(rows.slice(inicio, inicio + size).map((row) => [...row]));
  }

  return grupos;
}
