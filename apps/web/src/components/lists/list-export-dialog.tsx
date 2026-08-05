import { useListExport } from '@navis/api-client';
import type { List } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ExportSheet } from '@/components/export/export-sheet';
import { api } from '@/lib/api';
import { buildDocument } from '@/lib/export/document';
import { useListExportColumns } from '@/lib/lists/export-columns';

/**
 * Exportar una lista en los cinco formatos del RFC 0009 (RFC 0010 D41).
 *
 * Sin ningún escritor nuevo: la lista declara sus columnas y el juego de allí
 * hace el resto.
 */
export function ListExportDialog({
  open,
  onClose,
  list,
  churchName,
}: {
  open: boolean;
  onClose: () => void;
  list: List;
  churchName: string;
}) {
  const { t } = useTranslation();
  const columns = useListExportColumns();
  const { data, isFetching } = useListExport(api, list.id, open);

  const doc = useMemo(() => {
    if (!data) return null;

    return buildDocument({
      label: list.name,
      title: list.name,
      subtitle: [churchName, t('export.rows', { count: data.returned, total: data.total })].join(
        ' · ',
      ),
      columns,
      rows: data.rows,
    });
  }, [data, columns, list.name, churchName, t]);

  return (
    <ExportSheet
      open={open}
      onClose={onClose}
      doc={doc}
      total={data?.total ?? 0}
      truncated={data?.truncated ?? false}
      isLoading={isFetching && !data}
    />
  );
}
