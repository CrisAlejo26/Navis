import { useState } from 'react';
import {
    TABLE_BELIEVER_FIELDS,
    type CustomTableColumn,
    type CustomTableWithColumns,
    type TableColumnType,
} from '@navis/shared';
import { saveColumn } from '@/data/repos/table-columns';
import { useTableMutation } from './use-tables';

export function useColumnForm(table: CustomTableWithColumns, column?: CustomTableColumn) {
    const [label, setLabel] = useState(column?.label ?? ''),
        [type, setType] = useState<TableColumnType>(column?.type ?? 'text');
    const [required, setRequired] = useState(column?.required ?? false),
        [options, setOptions] = useState(column?.options ?? []);
    const [bound, setBound] = useState(column?.believerField ?? 'manual'),
        [includeTime, setIncludeTime] = useState(column?.config?.includeTime ?? false);
    const [currency, setCurrency] = useState(column?.config?.currency ?? 'EUR'),
        [decimals, setDecimals] = useState(String(column?.config?.decimals ?? 2));
    const save = useTableMutation((context, _: void) =>
        saveColumn(
            context,
            table.id,
            {
                label,
                type,
                required,
                options,
                config: { includeTime, currency, decimals: Number(decimals) },
                believerField: TABLE_BELIEVER_FIELDS.find((field) => field === bound) ?? null,
            },
            column?.id,
        ),
    );
    return {
        label,
        setLabel,
        type,
        setType,
        required,
        setRequired,
        options,
        setOptions,
        bound,
        setBound,
        includeTime,
        setIncludeTime,
        currency,
        setCurrency,
        decimals,
        setDecimals,
        save,
    };
}
