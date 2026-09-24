import {
  PROPHECY_STATES,
  PROPHECY_WINDOWS,
  type PropheciesQuery,
  type PropheciesStats,
} from '@navis/shared';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { PROPHECY_STATE_ICONS, PROPHECY_STATE_TONE } from '@/components/prophecies/prophecy-icons';

interface ProphecyFiltersProps {
  query: PropheciesQuery;
  onChange: (query: PropheciesQuery) => void;
  stats: PropheciesStats | undefined;
}

/**
 * Buscador aparte; aquí las pastillas de estado con su cuenta —igual que
 * `BelieversFilters`— y una hoja para la ventana de tiempo y un tramo a
 * medida (`DateRangePicker`, ya existente: §4.7).
 */
export function ProphecyFilters({ query, onChange, stats }: ProphecyFiltersProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<PropheciesQuery>({});

  const activeWindow = query.window && query.window !== 'all';
  const activeRange = Boolean(query.from || query.to);
  const filterCount = (activeWindow ? 1 : 0) + (activeRange ? 1 : 0);
  const draftActive =
    (draft.window && draft.window !== 'all' ? 1 : 0) + (draft.from || draft.to ? 1 : 0);

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        <Chip
          label={`${t('prophecies.stats.total')} (${stats?.total ?? 0})`}
          selected={!query.state?.length}
          onPress={() => onChange({ ...query, state: undefined })}
        />
        {PROPHECY_STATES.map((state) => (
          <Chip
            key={state}
            label={`${t(`prophecies.state.${state}`)} (${stats?.byState[state] ?? 0})`}
            icon={PROPHECY_STATE_ICONS[state]}
            tone={PROPHECY_STATE_TONE[state]}
            selected={query.state?.includes(state) ?? false}
            onPress={() =>
              onChange({ ...query, state: query.state?.includes(state) ? undefined : [state] })
            }
          />
        ))}
        <Chip
          label={
            filterCount > 0
              ? t('prophecies.filtersTotal', { total: filterCount })
              : t('prophecies.filters')
          }
          icon="options-outline"
          selected={filterCount > 0}
          onPress={() => {
            setDraft(query);
            setSheetOpen(true);
          }}
        />
      </ScrollView>

      <FilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={
          draftActive > 0
            ? t('prophecies.filtersTotal', { total: draftActive })
            : t('prophecies.filters')
        }
        activeCount={draftActive}
        onClear={() => setDraft({})}
        onApply={() => onChange({ ...query, ...draft })}
      >
        <View className="gap-2 flex-row flex-wrap">
          {PROPHECY_WINDOWS.map((window) => (
            <Chip
              key={window}
              label={t(
                `prophecies.windows.${window === '7d' ? 'recent' : window === '30d' ? 'month' : window}`,
              )}
              selected={draft.window === window && !draft.from && !draft.to}
              onPress={() => setDraft({ window, from: undefined, to: undefined })}
            />
          ))}
        </View>
        <DateRangePicker
          label={t('common.dateRange')}
          value={draft.from ? { from: draft.from, to: draft.to ?? draft.from } : null}
          placeholder={t('prophecies.windows.all')}
          onChange={(range) => setDraft({ from: range.from, to: range.to, window: undefined })}
        />
      </FilterSheet>
    </View>
  );
}
