import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { printNode } from '@/lib/calendar/print';
import {
  canCopyImage,
  canShareFiles,
  copyImage,
  copyText,
  downloadImage,
  shareFile,
} from '@/lib/calendar/share';
import { toast } from '@/lib/toast';

/**
 * Sacar la lámina del navegador. Tres caminos y un respaldo (§9.3): en el
 * móvil se comparte con la hoja del sistema, en un escritorio se copia al
 * portapapeles, y si nada de eso existe, se descarga o se imprime.
 *
 * El PNG ya está hecho —es el de la vista previa—, así que estas acciones son
 * inmediatas: no se vuelve a rasterizar al pulsar.
 */
export function usePosterExport(
  poster: RefObject<HTMLDivElement | null>,
  blob: Blob | null,
  options: { fileName: string; title: string; landscape: boolean; text: () => string },
) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const withPng = async (action: (png: Blob) => Promise<void> | void) => {
    if (!blob) {
      toast.error(t('calendar.shareFailed'));
      return;
    }

    setBusy(true);
    try {
      await action(blob);
    } catch {
      toast.error(t('calendar.shareFailed'));
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    canCopy: canCopyImage(),
    send: () =>
      withPng(async (png) => {
        if (canShareFiles(png, options.fileName)) {
          await shareFile(png, options.fileName, options.title);
          return;
        }
        // Sin hoja del sistema —pasa en varios escritorios— no se deja a nadie
        // tirado: se baja el fichero, que es lo que siempre funciona.
        downloadImage(png, options.fileName);
      }),
    copy: () =>
      withPng(async (png) => {
        await copyImage(png);
        toast.success(t('calendar.shareCopied'));
      }),
    download: () =>
      withPng((png) => {
        downloadImage(png, options.fileName);
      }),
    print: () => {
      const node = poster.current;
      if (!node) return;

      try {
        printNode(node, options.title, options.landscape);
      } catch {
        toast.error(t('calendar.shareFailed'));
      }
    },
    copyAsText: async () => {
      try {
        await copyText(options.text());
        toast.success(t('calendar.shareCopied'));
      } catch {
        toast.error(t('calendar.shareFailed'));
      }
    },
  };
}
