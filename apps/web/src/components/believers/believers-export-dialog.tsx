import { useBelieversExport } from '@navis/api-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFilterText } from '@/components/data-table/filters/use-filter-text';
import { ExportSheet } from '@/components/export/export-sheet';
import { api } from '@/lib/api';
import { toBelieversQuery } from '@/lib/believers/believers-query';
import { useBelieverExportColumns } from '@/lib/believers/export-columns';
import type { BelieversScreen } from '@/lib/believers/use-believers-screen';
import { useChurches } from '@/lib/churches';
import { buildDocument } from '@/lib/export/document';

/**
 * Exportar el listado de creyentes (RFC 0009 §7.1).
 *
 * Aquí se decide **qué** se lleva: los filtros de la pantalla, o la selección
 * si la hay. El diálogo de `ExportSheet` no sabe nada de creyentes. Las columnas
 * del fichero son las propias de creyentes —con teléfono, correo y cuentas de
 * notas— y no las que estén visibles en la tabla: quien exporta quiere la ficha
 * entera aunque haya ocultado columnas para leer mejor.
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
    const filterText = useFilterText();
    const columns = useBelieverExportColumns({
        congregations: screen.congregations,
        ministries: screen.ministries,
    });

    const { request } = screen.state;
    // El fichero lleva todas las filas: sin página ni tamaño de página.
    const query = { ...toBelieversQuery(request), page: undefined, limit: undefined };
    const { data, isFetching } = useBelieversExport(
        api,
        { ...query, ids: selected.length > 0 ? [...selected] : undefined },
        open,
    );

    const doc = useMemo(() => {
        if (!data) return null;

        const label = t('believers.title');
        const byId = new Map(screen.columns.map((column) => [column.id, column]));
        // Los filtros puestos, en palabras y no en código (§7.2).
        const words =
            selected.length > 0
                ? []
                : [
                      request.search ? `${t('believers.search')}: ${request.search}` : '',
                      ...request.filters.flatMap((filter) => {
                          const column = byId.get(filter.columnId);
                          return column ? [filterText(filter, column)] : [];
                      }),
                  ].filter(Boolean);

        return buildDocument({
            label,
            title: [active?.name, label].filter(Boolean).join(' · '),
            subtitle: [
                selected.length > 0
                    ? t('export.selected', { count: selected.length })
                    : t('export.rows', { count: data.returned, total: data.total }),
                ...words,
            ].join(' · '),
            columns,
            rows: data.rows,
        });
    }, [data, columns, active, request, screen.columns, selected, filterText, t]);

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
