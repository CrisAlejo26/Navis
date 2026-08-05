import { usePropheciesExport } from '@navis/api-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ExportSheet } from '@/components/export/export-sheet';
import { api } from '@/lib/api';
import { buildDocument } from '@/lib/export/document';
import { useProphecyExportColumns } from '@/lib/prophecies/export-columns';
import type { PropheciesScreen } from '@/lib/prophecies/use-prophecies-screen';
import { formatDay } from '@/lib/format';

/**
 * Exportar el listado de profecías (RFC 0009 §7.1).
 *
 * Sin nombre de iglesia en el título: esto es de cada usuario y no de una
 * iglesia (RFC 0004 D1), así que ponerlo sería decir algo que no es verdad.
 */
export function PropheciesExportDialog({
  open,
  onClose,
  screen,
}: {
  open: boolean;
  onClose: () => void;
  screen: PropheciesScreen;
}) {
  const { t } = useTranslation();
  const columns = useProphecyExportColumns();
  const filters = screen.filters;

  const { data, isFetching } = usePropheciesExport(
    api,
    {
      search: screen.query.search || undefined,
      state: filters.state,
      window: filters.window,
      from: filters.from || undefined,
      to: filters.to || undefined,
      sort: screen.query.sort,
      order: screen.query.order,
    },
    open,
  );

  const doc = useMemo(() => {
    if (!data) return null;

    const label = t('prophecies.title');
    const partes = [
      t('export.rows', { count: data.returned, total: data.total }),
      screen.query.search ? `${t('prophecies.search')}: ${screen.query.search}` : '',
      filters.state.length > 0
        ? `${t('export.state')}: ${filters.state.map((one) => t(`prophecies.state.${one}`)).join(', ')}`
        : '',
      filters.from || filters.to
        ? [filters.from, filters.to]
            .filter(Boolean)
            .map((day) => formatDay(day))
            .join(' – ')
        : '',
    ].filter(Boolean);

    return buildDocument({
      label,
      title: label,
      subtitle: partes.join(' · '),
      columns,
      rows: data.rows,
    });
  }, [data, columns, filters, screen.query.search, t]);

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
