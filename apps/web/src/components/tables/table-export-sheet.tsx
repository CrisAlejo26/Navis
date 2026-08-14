import { useTableExport } from '@navis/api-client';
import type { CustomTable, CustomTableColumn } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ExportSheet } from '@/components/export/export-sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { buildDocument } from '@/lib/export/document';
import { api } from '@/lib/api';
import { tableExportColumns } from '@/lib/tables/export-columns';

/**
 * Exportar una tabla (RFC 0021 D23): las filas visibles, con los filtros
 * activos. Una tabla con columna de contraseña avisa antes de incluirla en
 * claro, con el mismo cuidado que la hoja de credenciales de listas.
 */
export function TableExportSheet({
  open,
  onClose,
  table,
  columns,
}: {
  open: boolean;
  onClose: () => void;
  table: CustomTable;
  columns: readonly CustomTableColumn[];
}) {
  const { t } = useTranslation();
  const hasPasswords = columns.some((one) => one.type === 'password' && one.isActive);
  const [includePasswords, setIncludePasswords] = useState(false);

  const { data, isLoading } = useTableExport(api, table.id, { includePasswords }, open);

  const doc = data
    ? buildDocument({
        label: table.name,
        title: table.name,
        subtitle: t('export.rowsCount', { count: data.total }),
        columns: tableExportColumns(columns, includePasswords, {
          yes: t('common.yes'),
          no: t('common.no'),
        }),
        rows: data.rows,
      })
    : null;

  return (
    <ExportSheet
      open={open}
      onClose={onClose}
      doc={doc}
      total={data?.total ?? 0}
      truncated={data?.truncated ?? false}
      isLoading={isLoading}
      before={
        hasPasswords && (
          <Checkbox
            checked={includePasswords}
            label={t('tables.exportPasswordWarning', {
              count: columns.filter((c) => c.type === 'password').length,
            })}
            onChange={(event) => {
              setIncludePasswords(event.target.checked);
            }}
          />
        )
      }
    />
  );
}
