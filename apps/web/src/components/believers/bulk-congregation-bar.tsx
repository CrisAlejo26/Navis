import { useSetCongregation } from '@navis/api-client';
import type { Congregation } from '@navis/shared';
import { MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * La barra que aparece al marcar personas en el listado (§7.4).
 *
 * Existe por una razón concreta: quien se da de alta desde el selector de
 * predicadores del calendario nace **sin sede** —allí no se pregunta—, y
 * ponérsela a treinta hermanos abriendo treinta fichas es la clase de fricción
 * que acaba en «ya lo haré». Es la única acción en lote, y a propósito: borrar
 * a veinte personas de un clic no es una comodidad, es un accidente esperando.
 */
export function BulkCongregationBar({
  selected,
  congregations,
  onDone,
  onClear,
}: {
  selected: readonly string[];
  congregations: readonly Congregation[];
  onDone: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const assign = useSetCongregation(api);
  const [congregationId, setCongregationId] = useState('');

  if (selected.length === 0) return null;

  return (
    <div className="gap-3 p-3 sm:flex-row sm:items-center flex flex-col rounded-xl border border-primary/30 bg-primary/5">
      <p className="text-sm font-medium tabular-nums">
        {t('believers.selected', { count: selected.length })}
      </p>

      <div className="gap-2 sm:ml-auto flex items-center">
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

        <Button
          variant="ghost"
          size="icon"
          aria-label={t('believers.clearSelection')}
          onClick={onClear}
        >
          <X size={15} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
