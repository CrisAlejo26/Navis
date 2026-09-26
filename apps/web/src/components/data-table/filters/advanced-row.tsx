import { TABLE_OPERATORS_BY_KIND, type TableFilter, type TableOperator } from '@navis/shared';
import type { RowData as TableRowData } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOperatorLabels } from '@/components/data-table/filters/use-operator-labels';
import { ValueFields } from '@/components/data-table/filters/value-fields';
import { IconAction } from '@/components/ui/icon-action';
import { Select } from '@/components/ui/select';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { defaultOperator, toFilter } from '@/lib/data-table/filter-defaults';
import { EMPTY_DRAFT, draftFromValue, valueFromDraft } from '@/lib/data-table/filter-draft';

/** Lo que tarda en aplicarse un filtro tras la última pulsación: una petición y no diez. */
const APPLY_DELAY_MS = 300;

interface AdvancedRowProps<TItem extends TableRowData> {
    column: DataTableColumn<TItem>;
    filter: TableFilter | undefined;
    onChange: (filter: TableFilter | null) => void;
}

/**
 * La condición de una columna: qué cumple (operador) y con qué valor.
 *
 * Lleva su **borrador**: mientras el valor está a medias no hay filtro, y una
 * condición recién elegida no vacía la tabla. Cuando el filtro cambia desde
 * fuera (se quita un chip, se limpia todo) el borrador se pone al día; cuando
 * el cambio lo acaba de mandar esta misma fila, no, o el campo perdería el
 * cursor al teclear.
 */
export function AdvancedRow<TItem extends TableRowData>({
    column,
    filter,
    onChange,
}: AdvancedRowProps<TItem>) {
    const { t } = useTranslation();
    const labels = useOperatorLabels();
    const incoming = JSON.stringify(filter ?? null);
    const operatorsOf = column.operators ?? TABLE_OPERATORS_BY_KIND[column.kind];

    const [operator, setOperator] = useState<TableOperator>(
        filter?.operator ?? operatorsOf[0] ?? defaultOperator(column.kind),
    );
    const [draft, setDraft] = useState(() => draftFromValue(column.kind, operator, filter?.value));
    const [seen, setSeen] = useState(incoming);
    const [sent, setSent] = useState(incoming);

    if (incoming !== seen) {
        setSeen(incoming);
        if (incoming !== sent) {
            const next = filter?.operator ?? operatorsOf[0] ?? defaultOperator(column.kind);
            setOperator(next);
            setDraft(draftFromValue(column.kind, next, filter?.value));
            setSent(incoming);
        }
    }

    useEffect(() => {
        const next = toFilter(column.id, operator, valueFromDraft(column.kind, operator, draft));
        const key = JSON.stringify(next);
        if (key === sent) return;
        const timer = setTimeout(() => {
            setSent(key);
            onChange(next);
        }, APPLY_DELAY_MS);
        return () => {
            clearTimeout(timer);
        };
    }, [column.id, column.kind, operator, draft, sent, onChange]);

    return (
        <li className="gap-2 py-3 flex flex-col">
            <div className="gap-2 flex items-start justify-between">
                <div className="gap-0.5 flex flex-col">
                    <span className="text-sm font-medium text-foreground">{column.label}</span>
                    {column.description && (
                        <span className="text-xs text-muted-foreground">{column.description}</span>
                    )}
                </div>
                {filter && (
                    <IconAction
                        tone="destructive"
                        className="-my-2 h-8 w-8"
                        aria-label={t('dataTable.filters.clearColumn')}
                        title={t('dataTable.filters.clearColumn')}
                        onClick={() => {
                            setOperator(defaultOperator(column.kind));
                            setDraft(EMPTY_DRAFT);
                        }}
                    >
                        <X size={14} aria-hidden />
                    </IconAction>
                )}
            </div>
            <Select
                size="sm"
                aria-label={`${column.label}: ${t('dataTable.filters.condition')}`}
                value={operator}
                onChange={(event) => {
                    const chosen = operatorsOf.find(
                        (candidate) => candidate === event.target.value,
                    );
                    if (chosen) setOperator(chosen);
                }}
            >
                {operatorsOf.map((candidate) => (
                    <option key={candidate} value={candidate}>
                        {labels[candidate]}
                    </option>
                ))}
            </Select>
            <ValueFields
                kind={column.kind}
                operator={operator}
                draft={draft}
                options={column.options ?? []}
                label={column.label}
                single={column.single}
                onChange={setDraft}
            />
        </li>
    );
}
