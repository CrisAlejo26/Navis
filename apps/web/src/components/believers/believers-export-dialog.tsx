import { useBelieversExport } from '@navis/api-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ExportSheet } from '@/components/export/export-sheet';
import { api } from '@/lib/api';
import { useBelieverExportColumns } from '@/lib/believers/export-columns';
import type { BelieversScreen } from '@/lib/believers/use-believers-screen';
import { useChurches } from '@/lib/churches';
import { buildDocument } from '@/lib/export/document';

/**
 * Exportar el listado de creyentes (RFC 0009 §7.1).
 *
 * Aquí se decide **qué** se lleva: los filtros de la pantalla, o la selección
 * si la hay. El diálogo de `ExportSheet` no sabe nada de creyentes.
 */
export function BelieversExportDialog({
  open,
  onClose,
  screen,
  selected,
}: {
  open: boolean;
  onClose: () => void;
  screen: BelieversScreen;
  /** Las filas marcadas. Si hay alguna, manda sobre los filtros (D1). */
  selected: readonly string[];
}) {
  const { t } = useTranslation();
  const { active } = useChurches();
  const columns = useBelieverExportColumns({
    congregations: screen.congregations,
    ministries: screen.ministries,
  });

  const filters = screen.filters;
  const { data, isFetching } = useBelieversExport(
    api,
    {
      search: screen.query.search || undefined,
      status: filters.status,
      congregationId: filters.congregationId || undefined,
      giftId: filters.giftId || undefined,
      attention: filters.attention || undefined,
      sort: screen.query.sort,
      order: screen.query.order,
      ids: selected.length > 0 ? [...selected] : undefined,
    },
    open,
  );

  const doc = useMemo(() => {
    if (!data) return null;

    const label = t('believers.title');
    const partes = [
      selected.length > 0
        ? t('export.selected', { count: selected.length })
        : t('export.rows', { count: data.returned, total: data.total }),
      ...palabras(),
    ];

    return buildDocument({
      label,
      title: [active?.name, label].filter(Boolean).join(' · '),
      subtitle: partes.join(' · '),
      columns,
      rows: data.rows,
    });

    /** Los filtros puestos, en palabras y no en código (§7.2). */
    function palabras(): string[] {
      if (selected.length > 0) return [];

      const sede = screen.congregations.find((one) => one.id === filters.congregationId);
      const don = screen.gifts.find((one) => one.id === filters.giftId);

      return [
        screen.query.search ? `${t('believers.search')}: ${screen.query.search}` : '',
        filters.status.length > 0
          ? `${t('believers.statusLabel')}: ${filters.status.map((one) => t(`believers.status.${one}`)).join(', ')}`
          : '',
        sede ? `${t('believers.congregation')}: ${sede.name}` : '',
        don ? `${t('believers.gift')}: ${don.name}` : '',
        filters.attention ? t('believers.onlyAttention') : '',
      ].filter(Boolean);
    }
  }, [data, columns, active, filters, screen, selected, t]);

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
