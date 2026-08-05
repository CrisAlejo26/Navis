import { useCongregations, useGifts, useMinistries } from '@navis/api-client';
import { BELIEVER_STATUSES, type BelieverStatus, type BelieversQuery } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { SearchField } from '@/components/ui/search-field';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';

/**
 * Los filtros con los que se llena una lista (RFC 0010 D5): labor, sede, don y
 * estado, más la búsqueda por nombre.
 *
 * Son **los mismos** que los del listado de creyentes y no una copia con otras
 * opciones: quien busca aquí ya sabe cómo se busca allí.
 */
export function AddMembersFilters({
  query,
  onChange,
}: {
  query: BelieversQuery;
  onChange: (query: BelieversQuery) => void;
}) {
  const { t } = useTranslation();
  const { data: congregations = [] } = useCongregations(api);
  const { data: gifts = [] } = useGifts(api);
  const { data: ministries = [] } = useMinistries(api);

  const set = (patch: Partial<BelieversQuery>) => {
    onChange({ ...query, ...patch });
  };

  return (
    <div className="gap-2.5 flex flex-col">
      <SearchField
        value={query.search ?? ''}
        label={t('believers.search')}
        onChange={(search) => {
          set({ search: search || undefined });
        }}
      />

      <div className="gap-2 sm:grid-cols-3 grid">
        <Select
          size="sm"
          aria-label={t('believers.ministries')}
          value={query.ministry ?? ''}
          onChange={(event) => {
            set({ ministry: event.target.value || undefined });
          }}
        >
          <option value="">{t('lists.anyMinistry')}</option>
          {ministries
            .filter((one) => one.isActive)
            .map((one) => (
              <option key={one.slug} value={one.slug}>
                {one.name}
              </option>
            ))}
        </Select>

        <Select
          size="sm"
          aria-label={t('calendar.congregation')}
          value={query.congregationId ?? ''}
          onChange={(event) => {
            set({ congregationId: event.target.value || undefined });
          }}
        >
          <option value="">{t('lists.anyCongregation')}</option>
          {congregations.map((one) => (
            <option key={one.id} value={one.id}>
              {one.name}
            </option>
          ))}
        </Select>

        <Select
          size="sm"
          aria-label={t('believers.gifts')}
          value={query.giftId ?? ''}
          onChange={(event) => {
            set({ giftId: event.target.value || undefined });
          }}
        >
          <option value="">{t('lists.anyGift')}</option>
          {gifts
            .filter((one) => one.isActive)
            .map((one) => (
              <option key={one.id} value={one.id}>
                {one.name}
              </option>
            ))}
        </Select>
      </div>

      <div className="gap-1.5 flex flex-wrap">
        {BELIEVER_STATUSES.map((status: BelieverStatus) => {
          const active = query.status?.includes(status) ?? false;

          return (
            <Chip
              key={status}
              active={active}
              onClick={() => {
                const current = query.status ?? [];
                set({
                  status: active ? current.filter((one) => one !== status) : [...current, status],
                });
              }}
            >
              {t(`believers.status.${status}`)}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
