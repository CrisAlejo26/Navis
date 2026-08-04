import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { buildPdf } from '@/lib/calendar/pdf';
import { printNode } from '@/lib/calendar/print';
import { nodeToJpeg } from '@/lib/calendar/rasterize';
import {
  canCopyImage,
  canShareFiles,
  copyImage,
  copyText,
  downloadFile,
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
  options: {
    fileName: string;
    pdfName: string;
    title: string;
    landscape: boolean;
    text: () => string;
  },
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
        downloadFile(png, options.fileName);
      }),
    copy: () =>
      withPng(async (png) => {
        await copyImage(png);
        toast.success(t('calendar.shareCopied'));
      }),
    download: () =>
      withPng((png) => {
        downloadFile(png, options.fileName);
      }),
    /**
     * En PDF, que es lo que conviene mandar por WhatsApp: un documento llega
     * tal cual y una imagen se recomprime hasta perder la letra pequeña.
     */
    pdf: async () => {
      const node = poster.current;
      if (!node) return;

      setBusy(true);
      try {
        const documento = buildPdf(await nodeToJpeg(node));

        if (canShareFiles(documento, options.pdfName)) {
          await shareFile(documento, options.pdfName, options.title);
          return;
        }
        downloadFile(documento, options.pdfName);
      } catch {
        toast.error(t('calendar.shareFailed'));
      } finally {
        setBusy(false);
      }
    },
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
