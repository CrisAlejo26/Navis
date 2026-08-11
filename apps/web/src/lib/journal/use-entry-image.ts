import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { canShareFiles, downloadFile, shareFile } from '@/lib/share/files';
import { nodeToPng } from '@/lib/share/rasterize';
import { toast } from '@/lib/toast';

/**
 * Sacar `JournalEntryCard` del navegador: se comparte con la hoja del
 * sistema si existe, o se descarga (D13). Sin PDF ni impresión — a
 * diferencia de la lámina del calendario, esto es una postal de una entrada
 * y no un cartel que alguien vaya a imprimir.
 */
export function useEntryImageExport(node: RefObject<HTMLElement | null>) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const share = async (fileName: string, title: string) => {
    const el = node.current;
    if (!el) return;

    setBusy(true);
    try {
      // Un respiro para que el navegador termine de maquetar la lámina y de
      // decodificar el logo antes de fotografiarla (mismo motivo que `usePosterImage`).
      await new Promise((resolve) => setTimeout(resolve, 120));
      const png = await nodeToPng(el, 2);

      if (canShareFiles(png, fileName)) await shareFile(png, fileName, title);
      else downloadFile(png, fileName);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, share };
}
