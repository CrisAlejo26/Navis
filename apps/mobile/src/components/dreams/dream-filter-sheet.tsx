import { DREAM_SORT_FIELDS, type DreamsQuery } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { useEmotions } from '@/hooks/use-emotions';
import { accentHex } from '@/lib/accent';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { useThemeStore } from '@/lib/theme';

/** Cuántos de los filtros de la hoja están puestos: emociones, noches y orden. */
export function countSheetFilters(query: DreamsQuery): number {
    return (
        (query.emotion?.length ? 1 : 0) + (query.from || query.to ? 1 : 0) + (query.sort ? 1 : 0)
    );
}

/** Las claves, una por una: `t()` no admite plantillas armadas al vuelo (Regla 2 §3). */
const SORT_LABEL = {
    dreamed: 'dreams.columns.dreamed',
    fulfilled: 'dreams.columns.fulfilled',
    title: 'dreams.columns.dream',
} as const;

interface DreamFilterSheetProps {
    visible: boolean;
    onClose: () => void;
    draft: DreamsQuery;
    onDraft: (draft: DreamsQuery) => void;
    onApply: () => void;
}

/**
 * La hoja de filtros de sueños (RFC 0005 §7.5): lo que la web filtra además del
 * estado — las emociones (cualquiera de las marcadas), el tramo de noches y el
 * orden. Trabaja sobre un borrador y solo se aplica al pulsar «Aplicar».
 */
export function DreamFilterSheet({
    visible,
    onClose,
    draft,
    onDraft,
    onApply,
}: DreamFilterSheetProps) {
    const { t } = useTranslation();
    const label = useEmotionLabel();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const { data: emotions = [] } = useEmotions();

    function toggleEmotion(id: string) {
        const now = draft.emotion ?? [];
        const next = now.includes(id) ? now.filter((one) => one !== id) : [...now, id];
        onDraft({ ...draft, emotion: next.length ? next : undefined });
    }

    return (
        <FilterSheet
            visible={visible}
            onClose={onClose}
            title={t('dreams.filters')}
            activeCount={countSheetFilters(draft)}
            onClear={() => onDraft({})}
            onApply={onApply}
        >
            <Text className="text-sm font-sans-medium text-foreground">
                {t('dreams.emotionsLabel')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {emotions.map((emotion) => (
                    <Chip
                        key={emotion.id}
                        label={label(emotion)}
                        color={accentHex(emotion.accent, palette)}
                        selected={draft.emotion?.includes(emotion.id) ?? false}
                        onPress={() => toggleEmotion(emotion.id)}
                    />
                ))}
            </View>
            <DateRangePicker
                label={t('common.dateRange')}
                value={draft.from ? { from: draft.from, to: draft.to ?? draft.from } : null}
                placeholder={t('dreams.columns.dreamed')}
                onChange={(range) => onDraft({ ...draft, from: range.from, to: range.to })}
            />
            <Text className="text-sm font-sans-medium text-foreground">
                {t('dreams.sortLabel')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {DREAM_SORT_FIELDS.map((field) => (
                    <Chip
                        key={field}
                        label={t(SORT_LABEL[field])}
                        selected={(draft.sort ?? 'dreamed') === field}
                        onPress={() => onDraft({ ...draft, sort: field })}
                    />
                ))}
                <Chip
                    label={t(draft.order === 'asc' ? 'dreams.orderOldest' : 'dreams.orderNewest')}
                    icon={draft.order === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
                    onPress={() =>
                        onDraft({ ...draft, order: draft.order === 'asc' ? 'desc' : 'asc' })
                    }
                />
            </View>
        </FilterSheet>
    );
}
