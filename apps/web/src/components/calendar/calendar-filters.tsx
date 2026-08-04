import type { Congregation } from '@navis/shared';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CongregationPills } from '@/components/calendar/congregation-pills';
import { SearchField } from '@/components/ui/search-field';
import type { CalendarParams } from '@/lib/calendar/params';
import { cn } from '@/lib/cn';

/**
 * La segunda línea de la barra: sedes, búsqueda y «solo lo que falta».
 *
 * Ninguno de estos filtros **esconde** el calendario: lo atenúan (§8.3).
 * Vaciar la rejilla haría perder el contexto de la semana, que es justo lo que
 * se está mirando cuando se pregunta «¿y quién más va ese día?».
 */
export function CalendarFilters({
  params,
  congregations,
  personName,
  onAddCongregation,
}: {
  params: CalendarParams;
  congregations: readonly Congregation[];
  /** El nombre de la persona filtrada, si hay una. */
  personName?: string;
  onAddCongregation?: () => void;
}) {
  const { t } = useTranslation();
  const { filters, setFilters, clearFilters, hasFilters } = params;

  return (
    <div className="gap-2 flex flex-wrap items-center">
      <CongregationPills
        congregations={congregations}
        selected={filters.congregationIds}
        onToggle={(id) => {
          setFilters({
            congregationIds: filters.congregationIds.includes(id)
              ? filters.congregationIds.filter((one) => one !== id)
              : [...filters.congregationIds, id],
          });
        }}
        onClear={() => {
          setFilters({ congregationIds: [] });
        }}
        onAdd={onAddCongregation}
      />

      <SearchField
        value={filters.q}
        onChange={(q) => {
          setFilters({ q });
        }}
        label={t('calendar.filterSearch')}
        className="sm:w-56 w-full"
      />

      <button
        type="button"
        aria-pressed={filters.pending}
        onClick={() => {
          setFilters({ pending: !filters.pending });
        }}
        className={cn(
          'h-8 px-3 text-xs font-medium cursor-pointer rounded-full border',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          filters.pending
            ? 'border-warning/40 bg-warning/15 text-warning'
            : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
        )}
      >
        {t('calendar.filterPending')}
      </button>

      {filters.personId && (
        <button
          type="button"
          onClick={() => {
            setFilters({ personId: null });
          }}
          className="h-8 gap-1.5 px-3 text-xs font-medium inline-flex cursor-pointer items-center rounded-full bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {personName ?? t('calendar.filterPerson')}
          <X size={12} aria-hidden />
        </button>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {t('calendar.clearFilters')}
        </button>
      )}
    </div>
  );
}
