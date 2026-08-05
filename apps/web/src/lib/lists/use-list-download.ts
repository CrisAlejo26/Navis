import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { downloadFile } from '@/lib/share/files';
import { buildPdf } from '@/lib/share/pdf';
import { nodeToJpeg, nodeToPng } from '@/lib/share/rasterize';
import { toast } from '@/lib/toast';

/**
 * Descargar el cartel desde la página pública: PDF e imagen (RFC 0010 §8.6).
 *
 * Se rasteriza **la misma lámina** que se ve, no una captura de la pantalla: es
 * lo que hace que el botón de descargar no mienta (D39).
 */
export function useListDownload(
  poster: RefObject<HTMLDivElement | null>,
  name: string,
): { busy: boolean; png: () => void; pdf: () => void } {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const con = async (action: (node: HTMLDivElement) => Promise<void>) => {
    const node = poster.current;
    if (!node) return;

    setBusy(true);
    try {
      await action(node);
    } catch {
      toast.error(t('lists.downloadFailed'));
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    png: () =>
      void con(async (node) => {
        downloadFile(await nodeToPng(node), `${name}.png`);
      }),
    // Un documento llega tal cual por WhatsApp; una imagen se recomprime hasta
    // perder la letra pequeña (RFC 0009 D6).
    pdf: () =>
      void con(async (node) => {
        downloadFile(buildPdf([await nodeToJpeg(node)]), `${name}.pdf`);
      }),
  };
}
