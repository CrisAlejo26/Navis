import { useAddListMembers } from '@navis/api-client';
import type { ListSummary } from '@navis/shared';
import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * **Añadir a una lista** lo que está marcado (RFC 0010 §8.7).
 *
 * Es la tercera acción de la barra de selección, junto a poner sede y exportar,
 * y es la que hace realidad D5: se filtra por labor, sede, don o estado, se
 * marca a quien interese y se añade. El filtro es la herramienta; la pertenencia
 * es la decisión.
 *
 * Como las otras dos, **no borra nada**.
 */
export function BulkListAction({
  selected,
  lists,
  onDone,
}: {
  selected: readonly string[];
  lists: readonly ListSummary[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const add = useAddListMembers(api);
  const [listId, setListId] = useState('');

  const activas = lists.filter((one) => one.isActive);
  if (activas.length === 0) return null;

  return (
    <>
      <Select
        size="sm"
        value={listId}
        aria-label={t('lists.filterByList')}
        className="w-44"
        onChange={(event) => {
          setListId(event.target.value);
        }}
      >
        <option value="">{t('lists.allLists')}</option>
        {activas.map((one) => (
          <option key={one.id} value={one.id}>
            {one.name}
          </option>
        ))}
      </Select>

      <Button
        size="sm"
        disabled={!listId}
        isLoading={add.isPending}
        onClick={() => {
          const lista = activas.find((one) => one.id === listId);
          if (!lista) return;

          add.mutate(
            { listId, believerIds: [...selected] },
            {
              onSuccess: () => {
                toast.success(t('lists.addedToList', { count: selected.length, name: lista.name }));
                onDone();
              },
              onError: () => {
                toast.error(t('errors.generic'));
              },
            },
          );
        }}
      >
        <ClipboardList size={14} aria-hidden />
        {t('lists.addToList')}
      </Button>
    </>
  );
}
