import type { ExportResponse, JournalExportRow } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { exportFileName } from '@/lib/export/file-name';
import { toEntriesZip } from '@/lib/export/journal-markdown';
import { api } from '@/lib/api';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { downloadFile } from '@/lib/share/files';
import { toast } from '@/lib/toast';

/**
 * Exportar la selección del listado a Markdown (D12): solo Markdown ahí, la
 * imagen no tiene disposición razonable para varios textos largos (D13).
 *
 * La selección **manda** sobre los filtros (D1, mismo criterio que la
 * exportación tabular de RFC 0009): se piden los identificadores marcados y
 * nada más.
 */
export function useBatchMarkdownExport() {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const exportSelection = async (ids: readonly string[]): Promise<void> => {
    if (ids.length === 0) return;

    setPending(true);
    try {
      const params = new URLSearchParams();
      for (const id of ids) params.append('ids', id);

      const response = await api.get<ExportResponse<JournalExportRow>>(
        `/journal/export?${params.toString()}`,
      );

      const zip = toEntriesZip(response.rows, (row) => t(ENTRY_KIND_STYLES[row.kind].labelKey), {
        frontmatterTitle: t('journal.export.frontmatterTitle'),
        frontmatterKind: t('journal.export.frontmatterKind'),
        frontmatterDate: t('journal.export.frontmatterDate'),
        frontmatterReminder: t('journal.export.frontmatterReminder'),
        annotationHeading: t('journal.export.annotationHeading'),
        learnedHeading: t('journal.export.learnedHeading'),
      });

      // El nombre no se traduce: es un identificador de fichero, no un texto
      // que se lea (Regla 2 §6).
      downloadFile(zip, exportFileName('cuaderno', 'zip'));
      toast.success(t('export.done'));
    } catch {
      toast.error(t('export.failed'));
    } finally {
      setPending(false);
    }
  };

  return { pending, exportSelection };
}
