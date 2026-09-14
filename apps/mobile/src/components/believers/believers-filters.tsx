import type { BelieverStatus, BelieversQuery, BelieversSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { Select } from '@/components/ui/select';
import { useState } from 'react';

const STATUSES: BelieverStatus[] = ['activo', 'nuevo', 'inactivo', 'trasladado'];

interface CatalogOption {
  id: string;
  name: string;
}

interface BelieversFiltersProps {
  query: BelieversQuery;
  onChange: (query: BelieversQuery) => void;
  summary: BelieversSummary | undefined;
  congregations: CatalogOption[];
  gifts: CatalogOption[];
  tags: CatalogOption[];
  ministries: CatalogOption[];
}

/**
 * La barra de filtros del listado (§7.2): buscador aparte, y aquí las
 * pastillas de **estado con su cuenta** —la métrica es la navegación— más el
 * atajo «Piden atención» en tono de aviso. Sede, don, labor y etiqueta viven
 * en la hoja, porque son listas y no estados.
 */
export function BelieversFilters({
  query,
  onChange,
  summary,
  congregations,
  gifts,
  tags,
  ministries,
}: BelieversFiltersProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const statusChips = STATUSES.map((status) => ({
    status,
    count: summary?.byStatus[status] ?? 0,
  }));
  const filterCount = [query.congregationId, query.giftId, query.tagId, query.ministry].filter(
    Boolean,
  ).length;

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        <Chip
          label={t('believers.allStatuses')}
          selected={!query.status && !query.attention}
          onPress={() => onChange({ ...query, status: undefined, attention: undefined })}
        />
        {statusChips.map(({ status, count }) => (
          <Chip
            key={status}
            label={`${t(`believers.status.${status}`)} (${count})`}
            selected={query.status?.includes(status) ?? false}
            onPress={() =>
              onChange({
                ...query,
                attention: undefined,
                status: query.status?.includes(status) ? undefined : [status],
              })
            }
          />
        ))}
        <Chip
          label={`${t('believers.onlyAttention')} (${summary?.needsAttention ?? 0})`}
          tone="warning"
          selected={query.attention ?? false}
          onPress={() =>
            onChange({ ...query, status: undefined, attention: query.attention ? undefined : true })
          }
        />
        <Chip
          label={
            filterCount > 0
              ? t('believers.filtersWithCount', { count: filterCount })
              : t('believers.filters')
          }
          icon="options-outline"
          selected={filterCount > 0}
          onPress={() => setSheetOpen(true)}
        />
      </ScrollView>

      <FilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('believers.filters')}
        onApply={() => undefined}
      >
        <Select
          label={t('believers.congregation')}
          value={query.congregationId ?? null}
          placeholder={t('believers.allCongregations')}
          options={congregations.map((one) => ({ value: one.id, label: one.name }))}
          onChange={(value) => onChange({ ...query, congregationId: value })}
        />
        <Select
          label={t('believers.gift')}
          value={query.giftId ?? null}
          placeholder={t('believers.allGifts')}
          options={gifts.map((one) => ({ value: one.id, label: one.name }))}
          onChange={(value) => onChange({ ...query, giftId: value })}
        />
        <Select
          label={t('believers.ministries')}
          value={query.ministry ?? null}
          placeholder={t('ministries.none')}
          options={ministries.map((one) => ({ value: one.id, label: one.name }))}
          onChange={(value) => onChange({ ...query, ministry: value })}
        />
        <Select
          label={t('believers.tag')}
          value={query.tagId ?? null}
          placeholder={t('believers.allTags')}
          options={tags.map((one) => ({ value: one.id, label: one.name }))}
          onChange={(value) => onChange({ ...query, tagId: value })}
        />
      </FilterSheet>
    </View>
  );
}
