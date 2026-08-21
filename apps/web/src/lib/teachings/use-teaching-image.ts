import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { canShareFiles, downloadFile, shareFile } from '@/lib/share/files';
import { nodeToPng } from '@/lib/share/rasterize';
import { toast } from '@/lib/toast';

/**
 * Sacar la postal de una enseñanza del navegador, en alta resolución (RFC
 * 0022 §4.5): se comparte con la hoja del sistema si existe, o se descarga.
 * `nodeToPng(el, 2)` es la «excelente calidad» pedida — el mismo factor ×2
 * que ya usa `useEntryImageExport` del cuaderno.
 */
export function useTeachingImageExport(node: RefObject<HTMLElement | null>) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const share = async (fileName: string, title: string) => {
    const el = node.current;
    if (!el) return;

    setBusy(true);
    try {
      // Un respiro para que el navegador termine de maquetar la postal antes
      // de fotografiarla (mismo motivo que `useEntryImageExport`).
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
