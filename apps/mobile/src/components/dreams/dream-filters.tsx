import { DREAM_STATES, type DreamsQuery, type DreamsStats } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { DreamFilterSheet, countSheetFilters } from '@/components/dreams/dream-filter-sheet';
import { DREAM_STATE_ICONS, DREAM_STATE_TONE } from '@/components/dreams/dream-icons';
import { Chip } from '@/components/ui/chip';

interface DreamFiltersProps {
    query: DreamsQuery;
    onChange: (query: DreamsQuery) => void;
    stats: DreamsStats | undefined;
}

/**
 * El buscador va aparte; aquí las pastillas de estado —con su cuenta, como en
 * profecías— y una hoja con lo demás que la web filtra: las emociones, el tramo
 * de noches y el orden (RFC 0005 §7.5). El estado se cuenta con las cuentas de
 * la portada, así que no cuesta otra consulta.
 */
export function DreamFilters({ query, onChange, stats }: DreamFiltersProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DreamsQuery>({});

    const count = countSheetFilters;

    return (
        <View className="gap-2">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
            >
                <Chip
                    label={`${t('dreams.stats.total')} (${stats?.total ?? 0})`}
                    selected={!query.state?.length}
                    onPress={() => onChange({ ...query, state: undefined })}
                />
                {DREAM_STATES.map((state) => (
                    <Chip
                        key={state}
                        label={t(`dreams.state.${state}`)}
                        icon={DREAM_STATE_ICONS[state]}
                        tone={DREAM_STATE_TONE[state]}
                        selected={query.state?.includes(state) ?? false}
                        onPress={() =>
                            onChange({
                                ...query,
                                state: query.state?.includes(state) ? undefined : [state],
                            })
                        }
                    />
                ))}
                <Chip
                    label={
                        count(query) > 0
                            ? t('dreams.filtersTotal', { total: count(query) })
                            : t('dreams.filters')
                    }
                    icon="options-outline"
                    selected={count(query) > 0}
                    onPress={() => {
                        setDraft(query);
                        setOpen(true);
                    }}
                />
            </ScrollView>

            <DreamFilterSheet
                visible={open}
                onClose={() => setOpen(false)}
                draft={draft}
                onDraft={setDraft}
                onApply={() => onChange({ ...query, ...draft })}
            />
        </View>
    );
}
