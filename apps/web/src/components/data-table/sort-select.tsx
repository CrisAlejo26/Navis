import type { TableSort } from '@navis/shared';
import { ArrowDownUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconAction } from '@/components/ui/icon-action';
import { Select } from '@/components/ui/select';

interface SortSelectProps {
    /** Solo las columnas ordenables, con su etiqueta ya traducida. */
    options: readonly { id: string; label: string }[];
    sorts: readonly TableSort[];
    onChange: (sorts: readonly TableSort[]) => void;
}

/**
 * El orden en pantallas estrechas. Las fichas no tienen cabeceras donde pulsar,
 * así que el mismo criterio se elige aquí. Un solo criterio: el orden múltiple
 * es cosa de la cabecera (Mayús + clic), que en un teléfono no existe.
 */
export function SortSelect({ options, sorts, onChange }: SortSelectProps) {
    const { t } = useTranslation();
    const current = sorts[0];

    return (
        <div className="gap-2 flex items-center">
            <Select
                size="sm"
                value={current?.columnId ?? ''}
                aria-label={t('dataTable.sortLabel')}
                className="min-w-0 flex-1"
                onChange={(event) => {
                    const columnId = event.target.value;
                    onChange(columnId ? [{ columnId, dir: current?.dir ?? 'asc' }] : []);
                }}
            >
                <option value="">{t('dataTable.sortDefault')}</option>
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </Select>
            <IconAction
                tone="primary"
                disabled={!current}
                aria-label={t('dataTable.sortReverse')}
                onClick={() => {
                    if (current)
                        onChange([{ ...current, dir: current.dir === 'asc' ? 'desc' : 'asc' }]);
                }}
            >
                <ArrowDownUp size={16} aria-hidden />
            </IconAction>
        </div>
    );
}
