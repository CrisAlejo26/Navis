import { useCreateTableRow, useUpdateTableRow } from '@navis/api-client';
import type { CustomTableColumn, CustomTableRow, RowData } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PasswordRowField } from '@/components/tables/password-row-field';
import { RowField } from '@/components/tables/row-field';
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
 */
export function RowForm({
  open,
  onClose,
  tableId,
  columns,
  row,
}: {
  open: boolean;
  onClose: () => void;
  tableId: string;
  columns: readonly CustomTableColumn[];
  /** Si viene, se edita; si no, se crea. */
  row?: CustomTableRow;
}) {
  const { t } = useTranslation();
  const create = useCreateTableRow(api);
  const update = useUpdateTableRow(api);
  const [values, setValues] = useState<RowData>(() => initial(columns, row));
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const onError = () => {
      setError(t('errors.generic'));
    };
    const onSuccess = () => {
      toast.success(row ? t('tables.rowSaved') : t('tables.rowAdded'));
      onClose();
    };

    if (row) {
      update.mutate({ tableId, id: row.id, data: values }, { onSuccess, onError });
    } else {
      create.mutate({ tableId, data: values }, { onSuccess, onError });
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
        {columns.map((column) =>
          column.type === 'password' && row ? (
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
          ) : (
            <RowField
              key={column.key}
              column={column}
              value={values[column.key]}
              onChange={(value) => {
                setValues((prev) => ({ ...prev, [column.key]: value }));
              }}
            />
          ),
        )}

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

/** El punto de partida: los valores ya escritos, sin las contraseñas —esas se piden aparte (D22). */
function initial(columns: readonly CustomTableColumn[], row?: CustomTableRow): RowData {
  if (!row) return {};

  const data: RowData = {};
  for (const column of columns) {
    if (column.type === 'password') continue;
    if (column.key in row.data) data[column.key] = row.data[column.key];
  }
  return data;
}
