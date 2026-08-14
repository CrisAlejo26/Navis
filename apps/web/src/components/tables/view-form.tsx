import { useCreateTableView } from '@navis/api-client';
import type { CustomTableColumn } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { ViewFormColumnPicker } from '@/components/tables/view-form-column-picker';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Crear una vista de tablero o calendario (RFC 0021 D25).
 *
 * Solo se ofrece el tipo que la tabla puede soportar: sin una columna de
 * selección única no hay tablero, sin una de fecha no hay calendario.
 */
export function ViewForm({
  open,
  onClose,
  tableId,
  columns,
}: {
  open: boolean;
  onClose: () => void;
  tableId: string;
  columns: readonly CustomTableColumn[];
}) {
  const { t } = useTranslation();
  const create = useCreateTableView(api);

  const selectColumns = columns.filter((one) => one.type === 'single_select');
  const dateColumns = columns.filter((one) => one.type === 'date');
  const [type, setType] = useState<'kanban' | 'calendar'>(
    selectColumns.length > 0 ? 'kanban' : 'calendar',
  );
  const [groupBy, setGroupBy] = useState(selectColumns[0]?.key ?? '');
  const [dateColumn, setDateColumn] = useState(dateColumns[0]?.key ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = formText(form.get('name')).trim();

    if (!name) {
      setError(t('tables.viewNameRequired'));
      return;
    }

    setError(null);
    create.mutate(
      {
        tableId,
        name,
        type,
        groupBy: type === 'kanban' ? groupBy : undefined,
        dateColumn: type === 'calendar' ? dateColumn : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('tables.viewCreated'));
          onClose();
        },
        onError: () => {
          setError(t('errors.generic'));
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('tables.newView')}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('tables.viewName')} required />

        <Select
          label={t('tables.viewTypeLabel')}
          value={type}
          onChange={(event) => {
            setType(event.target.value === 'calendar' ? 'calendar' : 'kanban');
          }}
        >
          {selectColumns.length > 0 && <option value="kanban">{t('tables.view.kanban')}</option>}
          {dateColumns.length > 0 && <option value="calendar">{t('tables.view.calendar')}</option>}
        </Select>

        {type === 'kanban' && (
          <ViewFormColumnPicker
            label={t('tables.groupByColumn')}
            columns={selectColumns}
            value={groupBy}
            onChange={setGroupBy}
            emptyHint={t('tables.noSingleSelectForKanban')}
          />
        )}

        {type === 'calendar' && (
          <ViewFormColumnPicker
            label={t('tables.dateColumnLabel')}
            columns={dateColumns}
            value={dateColumn}
            onChange={setDateColumn}
            emptyHint={t('tables.noDateForCalendar')}
          />
        )}

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={create.isPending}
          disabled={
            (type === 'kanban' && selectColumns.length === 0) ||
            (type === 'calendar' && dateColumns.length === 0)
          }
        >
          {t('tables.newView')}
        </Button>
      </form>
    </Dialog>
  );
}
