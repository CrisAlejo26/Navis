import { useCreateTableColumn, useUpdateTableColumn } from '@navis/api-client';
import {
    BELIEVER_FIELD_COLUMN_TYPES,
    isTableBelieverField,
    isTableColumnType,
    TABLE_BELIEVER_FIELDS,
    type CustomTableColumn,
    type TableBelieverField,
    type TableColumnType,
} from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OptionEditor, type OptionDraft } from '@/components/tables/option-editor';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { COLUMN_TYPE_LABEL_KEY, needsOptions, TABLE_COLUMN_TYPES } from '@/lib/tables/column-types';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Añadir o editar una columna (RFC 0021, «Las columnas»).
 *
 * Cambiar el tipo o las opciones nunca borra nada (D9): la única señal de que
 * pueda haber datos que dejen de encajar es el texto de ayuda, no un aviso
 * bloqueante.
 *
 * Con la tabla enlazada a creyentes (RFC 0025 D2), además decide **«Rellenar
 * con»**: un campo del creyente compatible con el tipo (D3), o «A mano» como
 * siempre. Cambiar el tipo reasienta el campo si deja de encajar con él (D4).
 */
export function ColumnForm({
    tableId,
    column,
    linked,
    onSaved,
}: {
    tableId: string;
    column?: CustomTableColumn;
    /** La tabla está enlazada al listado de creyentes: el selector aparece. */
    linked?: boolean;
    onSaved: () => void;
}) {
    const { t } = useTranslation();
    const create = useCreateTableColumn(api);
    const update = useUpdateTableColumn(api);

    const [label, setLabel] = useState(column?.label ?? '');
    const [type, setType] = useState<TableColumnType>(column?.type ?? 'text');
    const [required, setRequired] = useState(column?.required ?? false);
    const [options, setOptions] = useState<OptionDraft[]>(column?.options ?? []);
    const [believerField, setBelieverField] = useState<TableBelieverField | null>(
        column?.believerField ?? null,
    );
    const [error, setError] = useState<string | null>(null);

    const isPending = create.isPending || update.isPending;
    const compatibles = linked
        ? TABLE_BELIEVER_FIELDS.filter((field) => BELIEVER_FIELD_COLUMN_TYPES[field].includes(type))
        : [];

    const cambiarTipo = (value: string) => {
        if (!isTableColumnType(value)) return;
        setType(value);
        if (
            linked &&
            believerField &&
            !BELIEVER_FIELD_COLUMN_TYPES[believerField].includes(value)
        ) {
            setBelieverField(null);
        }
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!label.trim()) {
            setError(t('tables.columnNameRequired'));
            return;
        }

        setError(null);
        const input = {
            label: label.trim(),
            type,
            required,
            options: needsOptions(type) ? options.filter((one) => one.label.trim()) : undefined,
            believerField: linked ? believerField : undefined,
        };

        const onError = () => {
            setError(t('errors.generic'));
        };
        const onSuccess = () => {
            toast.success(column ? t('tables.columnSaved') : t('tables.columnAdded'));
            onSaved();
        };

        if (column) {
            update.mutate({ tableId, id: column.id, ...input }, { onSuccess, onError });
        } else {
            create.mutate({ tableId, ...input }, { onSuccess, onError });
        }
    };

    return (
        <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
            <Input
                label={t('tables.columnName')}
                value={label}
                onChange={(event) => {
                    setLabel(event.target.value);
                }}
                required
            />

            <Select
                label={t('tables.columnTypeLabel')}
                value={type}
                onChange={(event) => {
                    cambiarTipo(event.target.value);
                }}
            >
                {TABLE_COLUMN_TYPES.map((one) => (
                    <option key={one} value={one}>
                        {t(COLUMN_TYPE_LABEL_KEY[one])}
                    </option>
                ))}
            </Select>

            {linked && (
                <Select
                    label={t('tables.boundTo')}
                    value={believerField ?? ''}
                    onChange={(event) => {
                        const value = event.target.value;
                        setBelieverField(isTableBelieverField(value) ? value : null);
                    }}
                >
                    <option value="">{t('tables.boundManual')}</option>
                    {compatibles.map((field) => (
                        <option key={field} value={field}>
                            {t(`tables.boundField.${field}`)}
                        </option>
                    ))}
                </Select>
            )}

            {linked && (
                <p className="text-xs text-muted-foreground">
                    {believerField ? t('tables.bindOverwriteHint') : t('tables.boundManualHint')}
                </p>
            )}

            {column && !linked && (
                <p className="text-xs text-muted-foreground">{t('tables.typeChangeHint')}</p>
            )}

            <Checkbox
                checked={required}
                label={t('tables.columnRequired')}
                onChange={(event) => {
                    setRequired(event.target.checked);
                }}
            />

            {needsOptions(type) && <OptionEditor options={options} onChange={setOptions} />}

            <FormError message={error} />

            <Button type="submit" isLoading={isPending}>
                {t('common.save')}
            </Button>
        </form>
    );
}
