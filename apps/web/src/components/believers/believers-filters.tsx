import type { BelieversSummary, Congregation, Gift, ListSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { StatusPills } from '@/components/believers/status-pills';
import { Select } from '@/components/ui/select';
import type { BelieverFilters } from '@/lib/believers/filters';

interface FiltersProps {
  filters: BelieverFilters;
  summary: BelieversSummary | undefined;
  congregations: readonly Congregation[];
  gifts: readonly Gift[];
  /** Las listas de la iglesia. Vacío para quien no puede verlas (RFC 0010 §8.7). */
  lists: readonly ListSummary[];
}

/**
 * Estado, sede y don. Todo vive en la URL (§7.2): una búsqueda concreta se
 * comparte por enlace y el botón de atrás hace lo que se espera.
 *
 * La sede solo aparece si hay más de una, y los dones solo los activos: filtrar
 * por algo que ya nadie usa es una opción que ocupa sitio y no devuelve nada.
 */
export function BelieversFilters({ filters, summary, congregations, gifts, lists }: FiltersProps) {
  const { t } = useTranslation();
  const active = gifts.filter((gift) => gift.isActive);
  const activas = lists.filter((one) => one.isActive);

  return (
    // Todo en **una fila** que se dobla si no cabe: en dos filas fijas, la
    // cabecera de la tabla se comía un tercio de la pantalla antes del primer
    // nombre.
    <div className="gap-x-3 gap-y-2 flex flex-wrap items-center">
      <StatusPills
        summary={summary}
        selected={filters.status}
        attention={filters.attention}
        onToggle={filters.toggleStatus}
        onToggleAttention={filters.toggleAttention}
      />

      <div className="gap-2 flex flex-wrap items-center">
        {congregations.length > 1 && (
          <Select
            size="sm"
            value={filters.congregationId}
            aria-label={t('believers.congregation')}
            className="sm:w-48"
            onChange={(event) => {
              filters.setCongregation(event.target.value);
            }}
          >
            <option value="">{t('believers.allCongregations')}</option>
            {congregations.map((one) => (
              <option key={one.id} value={one.id}>
                {one.name}
              </option>
            ))}
          </Select>
        )}

        {active.length > 0 && (
          <Select
            size="sm"
            value={filters.giftId}
            aria-label={t('believers.gift')}
            className="sm:w-52"
            onChange={(event) => {
              filters.setGift(event.target.value);
            }}
          >
            <option value="">{t('believers.allGifts')}</option>
            {active.map((gift) => (
              <option key={gift.id} value={gift.id}>
                {gift.name}
              </option>
            ))}
          </Select>
        )}

        {/* Es la vuelta del camino de la RFC 0010 D5: el filtro llena la lista
            y, desde aquí, la lista filtra a quien está en ella. */}
        {activas.length > 0 && (
          <Select
            size="sm"
            value={filters.listId}
            aria-label={t('lists.filterByList')}
            className="sm:w-48"
            onChange={(event) => {
              filters.setList(event.target.value);
            }}
          >
            <option value="">{t('lists.allLists')}</option>
            {activas.map((one) => (
              <option key={one.id} value={one.id}>
                {one.name}
              </option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
}
