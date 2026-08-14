import { useCreateTable, useUpdateTable } from '@navis/api-client';
import {
  ACCENT_PALETTE,
  createCustomTableSchema,
  DEFAULT_TASK_ICON,
  type CustomTable,
} from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { IconPicker } from '@/components/tasks/icon-picker';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Alta y edición de una tabla personalizada (RFC 0021 D1–D5).
 *
 * Nace vacía: solo pide nombre, icono y color. Las columnas se añaden después,
 * desde la ficha.
 */
export function TableForm({
  open,
  onClose,
  table,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se crea. */
  table?: CustomTable;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createTable = useCreateTable(api);
  const updateTable = useUpdateTable(api);
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState(table?.icon ?? DEFAULT_TASK_ICON);
  const [accent, setAccent] = useState(table?.accent ?? ACCENT_PALETTE[0]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createCustomTableSchema.safeParse({
      name: formText(form.get('name')),
      icon,
      accent,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const onError = () => {
      setError(t('tables.saveFailed'));
    };

    if (table) {
      updateTable.mutate(
        { id: table.id, ...parsed.data },
        {
          onSuccess: (guardada) => {
            toast.success(t('tables.saved', { name: guardada.name }));
            onClose();
          },
          onError,
        },
      );
      return;
    }

    createTable.mutate(parsed.data, {
      onSuccess: (creada) => {
        toast.success(t('tables.created', { name: creada.name }));
        onClose();
        void navigate(`/tables/${creada.slug}`);
      },
      onError,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={table ? t('tables.edit') : t('tables.newTable')}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('tables.name')} defaultValue={table?.name} required />

        <IconPicker value={icon} onChange={setIcon} />
        <ColorPicker value={accent} onChange={setAccent} label={t('tables.color')} />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createTable.isPending || updateTable.isPending}
        >
          {table ? t('common.save') : t('tables.newTable')}
        </Button>
      </form>
    </Dialog>
  );
}
