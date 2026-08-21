import type { Congregation } from '@navis/shared';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CongregationPills } from '@/components/calendar/congregation-pills';
import { Chip } from '@/components/ui/chip';
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
    // `flex-1 min-w-0`: en `calendar.tsx` esta fila comparte sitio con el
    // botón «Reparto» dentro de un `justify-between`, que reparte hueco entre
    // los dos en vez de estirarlos — sin esto, el buscador de más abajo solo
    // crecía hasta donde ya llegaban sedes y chips, no hasta el botón.
    <div className="gap-2 min-w-0 flex flex-1 flex-wrap items-center">
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

      {/* `flex-1`: ocupa el resto del ancho de su fila en vez de quedarse en
          los 14rem de antes — con las sedes y los chips ya puestos, sobraba
          hueco vacío al lado del buscador. */}
      <SearchField
        value={filters.q}
        onChange={(q) => {
          setFilters({ q });
        }}
        label={t('calendar.filterSearch')}
        className="min-w-40 flex-1"
      />

      <Chip
        active={filters.pending}
        tone="warning"
        onClick={() => {
          setFilters({ pending: !filters.pending });
        }}
      >
        {t('calendar.filterPending')}
      </Chip>

      {filters.personId && (
        <Chip
          active
          onClick={() => {
            setFilters({ personId: null });
          }}
        >
          {personName ?? t('calendar.filterPerson')}
          <X size={12} aria-hidden />
        </Chip>
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
