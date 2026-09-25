import { useCreateTableRow, useUpdateTableRow } from '@navis/api-client';
import type { CustomTableColumn, CustomTableRow, RowData } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PasswordRowField } from '@/components/tables/password-row-field';
import { RowField } from '@/components/tables/row-field';
import { RowValueCell } from '@/components/tables/row-value-cell';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Añadir o editar una fila (RFC 0021, «Las filas»): un formulario generado a
 * partir de las columnas activas, en su orden.
 *
 * Los campos de contraseña no reenvían el marcador que llega del listado
 * (D22): mientras no se toquen, ni siquiera viajan en el `PATCH` — es la
 * fusión del servidor la que conserva lo que ya había.
 *
 * Con la tabla enlazada a creyentes (RFC 0025 D13), los campos vinculados se
 * enseñan deshabilitados —su valor viene de la ficha del creyente— y no
 * viajan en el cuerpo: el servidor rechazaría la petición.
 */
export function RowForm({
    open,
    onClose,
    tableId,
    columns,
    row,
    initialData,
    linked,
}: {
    open: boolean;
    onClose: () => void;
    tableId: string;
    columns: readonly CustomTableColumn[];
    /** Si viene, se edita; si no, se crea. */
    row?: CustomTableRow;
    /** Valores con los que nace un alta — la fecha del día pulsado, por ejemplo. */
    initialData?: RowData;
    /** La tabla enlazada al listado de creyentes (RFC 0025). */
    linked?: boolean;
}) {
    const { t } = useTranslation();
    const create = useCreateTableRow(api);
    const update = useUpdateTableRow(api);
    const [values, setValues] = useState<RowData>(() => ({
        ...initial(columns, row, linked),
        ...(row ? {} : initialData),
    }));
    const [error, setError] = useState<string | null>(null);

    /** Solo las columnas a mano: lo que puede entrar en el cuerpo (D13). */
    const aMano = columns.filter((column) => !(linked && column.believerField));

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const datos: RowData = {};
        for (const column of aMano) {
            if (column.key in values) datos[column.key] = values[column.key];
        }

        const onError = () => {
            setError(t('errors.generic'));
        };
        const onSuccess = () => {
            toast.success(row ? t('tables.rowSaved') : t('tables.rowAdded'));
            onClose();
        };

        if (row) {
            update.mutate({ tableId, id: row.id, data: datos }, { onSuccess, onError });
        } else {
            create.mutate({ tableId, data: datos }, { onSuccess, onError });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={row ? t('tables.editRow') : t('tables.newRow')}
            width="min(32rem, calc(100vw - 2rem))"
        >
            <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
                {columns.map((column) => {
                    if (linked && column.believerField) {
                        return <BoundRowField key={column.key} column={column} row={row} />;
                    }
                    if (column.type === 'password' && row) {
                        return (
                            <PasswordRowField
                                key={column.key}
                                tableId={tableId}
                                rowId={row.id}
                                column={column}
                                hasValue={row.data[column.key] === true}
                                onEdit={(value) => {
                                    setValues((prev) => ({ ...prev, [column.key]: value }));
                                }}
                            />
                        );
                    }
                    return (
                        <RowField
                            key={column.key}
                            column={column}
                            value={values[column.key]}
                            onChange={(value) => {
                                setValues((prev) => ({ ...prev, [column.key]: value }));
                            }}
                        />
                    );
                })}

                <FormError message={error} />

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    isLoading={create.isPending || update.isPending}
                >
                    {t('common.save')}
                </Button>
            </form>
        </Dialog>
    );
}

/**
 * El punto de partida: los valores ya escritos de las columnas a mano, sin
 * las contraseñas —esas se piden aparte (D22)— y sin las vinculadas, que no
 * viajan (D13).
 */
function initial(
    columns: readonly CustomTableColumn[],
    row: CustomTableRow | undefined,
    linked?: boolean,
): RowData {
    if (!row) return {};

    const data: RowData = {};
    for (const column of columns) {
        if (column.type === 'password') continue;
        if (linked && column.believerField) continue;
        if (column.key in row.data) data[column.key] = row.data[column.key];
    }
    return data;
}

/** El campo vinculado: se lee, no se edita. Su valor es el de la ficha (D17). */
function BoundRowField({ column, row }: { column: CustomTableColumn; row?: CustomTableRow }) {
    const { t } = useTranslation();
    const value = row?.data[column.key];

    return (
        <div className="gap-1 flex flex-col">
            <p className="text-sm font-medium text-foreground">{column.label}</p>
            <div className="px-3 py-2 text-sm rounded-md border bg-muted/40 text-muted-foreground">
                {value === null || value === undefined ? (
                    '—'
                ) : (
                    <RowValueCell column={column} value={value} />
                )}
            </div>
            <p className="text-xs text-muted-foreground">{t('tables.boundCellHint')}</p>
        </div>
    );
}
