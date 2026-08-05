import { useSetCongregation } from '@navis/api-client';
import type { Congregation } from '@navis/shared';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Poner la misma sede a varias personas de una vez (RFC 0003 §7.4).
 *
 * Está en su propio componente y no dentro de `BulkBar` porque la barra tiene
 * ya dos acciones con vidas distintas: esta cambia fichas y pide permiso, y
 * exportar ni cambia nada ni lo pide (Regla 6 §2).
 */
export function BulkCongregationAction({
  selected,
  congregations,
  onDone,
}: {
  selected: readonly string[];
  congregations: readonly Congregation[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const assign = useSetCongregation(api);
  const [congregationId, setCongregationId] = useState('');

  return (
    <>
      <Select
        size="sm"
        value={congregationId}
        aria-label={t('believers.congregation')}
        className="w-44"
        onChange={(event) => {
          setCongregationId(event.target.value);
        }}
      >
        <option value="">{t('believers.noCongregation')}</option>
        {congregations.map((one) => (
          <option key={one.id} value={one.id}>
            {one.name}
          </option>
        ))}
      </Select>

      <Button
        size="sm"
        isLoading={assign.isPending}
        onClick={() => {
          assign.mutate(
            { believerIds: [...selected], congregationId: congregationId || null },
            {
              onSuccess: ({ updated }) => {
                toast.success(t('believers.congregationAssigned', { count: updated }));
                onDone();
              },
              onError: () => {
                toast.error(t('errors.generic'));
              },
            },
          );
        }}
      >
        <MapPin size={14} aria-hidden />
        {t('believers.assignCongregation')}
      </Button>
    </>
  );
}
