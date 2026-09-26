import type { TableColumnKind, TableOperator } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import {
    DATE_PRESETS,
    datePresetRange,
    needsValue,
    type DatePreset,
} from '@/lib/data-table/filter-defaults';
import type { FilterDraft } from '@/lib/data-table/filter-draft';

// 16 px como el resto de campos: por debajo, Safari/iOS hace zoom al enfocar (Regla 5).
const FIELD =
    'h-9 w-full min-w-0 rounded-lg border bg-card px-2.5 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35';

interface ValueFieldsProps {
    kind: TableColumnKind;
    operator: TableOperator;
    draft: FilterDraft;
    options: readonly { value: string; label: string; hint?: string }[];
    /** Nombre de la columna, para el lector de pantalla. */
    label: string;
    onChange: (draft: FilterDraft) => void;
}

/** Los campos que pide una condición: uno, dos (un rango), una lista de opciones o ninguno. */
export function ValueFields({ kind, operator, draft, options, label, onChange }: ValueFieldsProps) {
    const { t } = useTranslation();
    if (!needsValue(operator)) return null;

    if (kind === 'boolean') {
        return (
            <Select
                size="sm"
                aria-label={label}
                value={draft.flag === null ? '' : String(draft.flag)}
                onChange={(event) => {
                    const flag = event.target.value === '' ? null : event.target.value === 'true';
                    onChange({ ...draft, flag });
                }}
            >
                <option value="">—</option>
                <option value="true">{t('dataTable.filters.yes')}</option>
                <option value="false">{t('dataTable.filters.no')}</option>
            </Select>
        );
    }

    if (kind === 'select') {
        if (options.length === 0) {
            return (
                <p className="text-xs text-muted-foreground">{t('dataTable.filters.noOptions')}</p>
            );
        }
        return (
            <div role="group" aria-label={label} className="max-h-44 overflow-y-auto">
                {options.map((option) => (
                    <Checkbox
                        key={option.value}
                        label={option.label}
                        hint={option.hint}
                        checked={draft.list.includes(option.value)}
                        onChange={(event) => {
                            const list = event.target.checked
                                ? [...draft.list, option.value]
                                : draft.list.filter((one) => one !== option.value);
                            onChange({ ...draft, list });
                        }}
                    />
                ))}
            </div>
        );
    }

    const type = kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text';
    const isRange = operator === 'between';
    const isDate = kind === 'date';
    const first = isRange
        ? isDate
            ? t('dataTable.filters.from')
            : t('dataTable.filters.min')
        : label;
    const second = isDate ? t('dataTable.filters.to') : t('dataTable.filters.max');
    const presets: Record<DatePreset, string> = {
        today: t('dataTable.filters.presetToday'),
        last7: t('dataTable.filters.presetLast7'),
        thisMonth: t('dataTable.filters.presetThisMonth'),
        thisYear: t('dataTable.filters.presetThisYear'),
    };

    return (
        <div className="gap-2 flex flex-col">
            <div className={cn('gap-2 flex', !isRange && 'flex-col')}>
                <input
                    type={type}
                    aria-label={`${label}: ${first}`}
                    value={draft.a}
                    onChange={(event) => {
                        onChange({ ...draft, a: event.target.value });
                    }}
                    className={FIELD}
                />
                {isRange && (
                    <input
                        type={type}
                        aria-label={`${label}: ${second}`}
                        value={draft.b}
                        onChange={(event) => {
                            onChange({ ...draft, b: event.target.value });
                        }}
                        className={FIELD}
                    />
                )}
            </div>
            {isDate && isRange && (
                <div className="gap-1.5 flex flex-wrap">
                    {DATE_PRESETS.map((preset) => (
                        <Chip
                            key={preset}
                            active={false}
                            onClick={() => {
                                const { from, to } = datePresetRange(preset);
                                onChange({ ...draft, a: from, b: to });
                            }}
                        >
                            {presets[preset]}
                        </Chip>
                    ))}
                </div>
            )}
        </div>
    );
}
