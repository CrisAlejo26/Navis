import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { SearchField } from '@/components/ui/search-field';
import type { PublicFilterState } from '@/lib/lists/use-public-filter';

/**
 * Búsqueda y filtros de la página pública (RFC 0010 §8.6).
 *
 * Los mismos `SearchField` y `Chip` de siempre —tokens semánticos, sin marca
 * de la aplicación— porque esta pantalla es un cartel y no un panel (D40): no
 * lleva más chrome del que ya tenían esos componentes.
 *
 * Cada fila de filtro solo aparece si de verdad sirve para algo: con una
 * única sede o labor compartida, filtrar por ella no cambiaría nada, así que
 * ni se enseña (Regla 9 §2, «un hueco no se rellena con un adorno»).
 */
export function PublicSearchFilters({ state }: { state: PublicFilterState }) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 gap-3 flex flex-col">
      <SearchField
        value={state.search}
        onChange={state.setSearch}
        label={t('lists.searchPeople')}
      />

      {state.congregations.length > 1 && (
        <FilterRow
          label={t('believers.congregation')}
          value={state.congregation}
          options={state.congregations}
          onChange={state.setCongregation}
        />
      )}

      {state.ministries.length > 1 && (
        <FilterRow
          label={t('calendar.labor')}
          value={state.ministry}
          options={state.ministries}
          onChange={state.setMinistry}
        />
      )}
    </div>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="gap-1.5 flex flex-wrap">
        {options.map((option) => (
          <Chip
            key={option}
            active={value === option}
            onClick={() => {
              onChange(value === option ? null : option);
            }}
          >
            {option}
          </Chip>
        ))}
      </div>
    </div>
  );
}
