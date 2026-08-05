import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IMAGE_MAX_ROWS, ROWS_PER_PAGE } from '@/components/export/export-page-styles';
import { toCsv, toCsvText } from '@/lib/export/csv';
import type { ExportDocument } from '@/lib/export/document';
import { exportFileName } from '@/lib/export/file-name';
import { FORMAT_INFO, type ExportFormat } from '@/lib/export/formats';
import { toMarkdown, toMarkdownBlob } from '@/lib/export/markdown';
import { rasterizePages } from '@/lib/export/render-pages';
import { toXlsx } from '@/lib/export/xlsx/workbook';
import {
  canCopyImage,
  canShareFiles,
  copyImage,
  copyText,
  downloadFile,
  shareFile,
} from '@/lib/share/files';
import { buildPdf } from '@/lib/share/pdf';
import { nodeToJpeg, nodeToPng } from '@/lib/share/rasterize';
import { toast } from '@/lib/toast';

export interface ExportActions {
  busy: boolean;
  /** La imagen se apaga con muchas filas: un PNG de trescientas no se lee (D6). */
  imageTooLong: boolean;
  canCopy: boolean;
  download: () => void;
  share: () => void;
  copy: () => void;
}

/**
 * Las tres acciones del diálogo, para el formato que esté elegido (RFC 0009 §7.2).
 *
 * El fichero se construye **al pulsar** y no antes: rasterizar cien páginas
 * para una vista previa que igual nadie descarga sería trabajo tirado.
 */
export function useExport(doc: ExportDocument | null, format: ExportFormat): ExportActions {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const imageTooLong = format === 'image' && (doc?.rows.length ?? 0) > IMAGE_MAX_ROWS;

  const build = async (): Promise<Blob> => {
    if (!doc) throw new Error('No hay nada que exportar');

    if (format === 'csv') return toCsv(doc);
    if (format === 'markdown') return toMarkdownBlob(doc);
    if (format === 'xlsx') {
      return toXlsx(doc, {
        sheet: doc.label,
        summary: t('export.summarySheet'),
        summaryTitle: `${doc.title} · ${t('export.summarySheet')}`,
        rows: t('export.rowsCount', { count: doc.rows.length }),
        empty: t('export.unassigned'),
      });
    }

    if (format === 'image') {
      // Una sola lámina, todo lo alta que haga falta: se pega de un tirón.
      const [png] = await rasterizePages(
        doc,
        { rowsPerPage: Number.MAX_SAFE_INTEGER, fixedHeight: false },
        (node) => nodeToPng(node, 2),
      );
      if (!png) throw new Error('No se ha podido componer la imagen');
      return png;
    }

    return buildPdf(
      await rasterizePages(doc, { rowsPerPage: ROWS_PER_PAGE, fixedHeight: true }, (node) =>
        nodeToJpeg(node, 2),
      ),
    );
  };

  const withFile = (action: (blob: Blob, name: string) => Promise<void> | void) => () => {
    if (!doc || busy) return;

    setBusy(true);
    void (async () => {
      try {
        await action(await build(), exportFileName(doc.label, FORMAT_INFO[format].extension));
      } catch {
        toast.error(t('export.failed'));
      } finally {
        setBusy(false);
      }
    })();
  };

  const copyMode = FORMAT_INFO[format].copy;

  return {
    busy,
    imageTooLong,
    canCopy: copyMode === 'text' || (copyMode === 'image' && canCopyImage()),
    download: withFile((blob, name) => {
      downloadFile(blob, name);
      toast.success(t('export.done'));
    }),
    share: withFile(async (blob, name) => {
      // Sin hoja del sistema —pasa en varios escritorios— no se deja a nadie
      // tirado: se baja el fichero, que es lo que siempre funciona.
      if (!canShareFiles(blob, name)) {
        downloadFile(blob, name);
        return;
      }
      await shareFile(blob, name, doc?.title ?? name);
    }),
    copy: withFile(async (blob) => {
      if (copyMode === 'image') await copyImage(blob);
      else await copyText(doc ? textOf(doc, format) : '');
      toast.success(t('export.copied'));
    }),
  };
}

/** Lo que se copia como texto: el Markdown con su cabecera, o el CSV en crudo. */
function textOf(doc: ExportDocument, format: ExportFormat): string {
  return format === 'markdown' ? toMarkdown(doc) : toCsvText(doc);
}
