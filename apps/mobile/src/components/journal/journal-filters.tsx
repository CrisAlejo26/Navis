import {
    ENTRY_KINDS,
    type JournalQuery,
    type JournalWindow,
    type JournalSortField,
} from '@navis/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { KIND_ICON, useJournalPalette } from './journal-theme';

export function JournalFilters({
    query,
    onChange,
    onClose,
}: {
    query: JournalQuery;
    onChange: (query: JournalQuery) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        p = useJournalPalette();
    return (
        <BottomSheet visible onClose={onClose} title={t('journal.filters')}>
            <View style={{ gap: 20, paddingBottom: 8 }}>
                <View style={{ gap: 8 }}>
                    <Text className="text-sm font-sans-medium text-foreground">
                        {t('journal.kindField')}
                    </Text>
                    <View style={{ gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                        {ENTRY_KINDS.map((kind) => (
                            <Chip
                                color={p.link}
                                key={kind}
                                label={t(`journal.kind.${kind}`)}
                                icon={KIND_ICON[kind]}
                                selected={query.kind?.includes(kind)}
                                onPress={() =>
                                    onChange({
                                        ...query,
                                        kind: query.kind?.includes(kind)
                                            ? query.kind.filter((one) => one !== kind)
                                            : [...(query.kind ?? []), kind],
                                    })
                                }
                            />
                        ))}
                    </View>
                </View>
                <Select<JournalWindow>
                    label={t('journal.occurredAtField')}
                    placeholder={t('journal.windows.all')}
                    value={query.window ?? 'all'}
                    options={[
                        { value: 'all', label: t('journal.windows.all') },
                        { value: '7d', label: t('journal.windows.recent') },
                        { value: '30d', label: t('journal.windows.month') },
                        { value: 'year', label: t('journal.windows.year') },
                    ]}
                    onChange={(window) =>
                        onChange({ ...query, window, from: undefined, to: undefined })
                    }
                />
                <DateRangePicker
                    label={t('journal.filterDateHelp')}
                    placeholder={t('journal.windows.all')}
                    value={query.from && query.to ? { from: query.from, to: query.to } : null}
                    onChange={(range) => onChange({ ...query, ...range, window: 'all' })}
                />
                <Switch
                    label={t('journal.pendingReminderChip')}
                    checked={Boolean(query.pendingReminder)}
                    onChange={(pendingReminder) => onChange({ ...query, pendingReminder })}
                />
                <Select<JournalSortField>
                    label={t('dataTable.sortLabel')}
                    placeholder={t('journal.columns.date')}
                    value={query.sort ?? 'date'}
                    options={[
                        { value: 'date', label: t('journal.columns.date') },
                        { value: 'title', label: t('journal.columns.title') },
                        { value: 'kind', label: t('journal.columns.kind') },
                    ]}
                    onChange={(sort) => onChange({ ...query, sort })}
                />
                <Select<'asc' | 'desc'>
                    label={t('dataTable.sortLabel')}
                    placeholder={t('dataTable.sortDescending')}
                    value={query.order ?? 'desc'}
                    options={[
                        { value: 'desc', label: t('dataTable.sortDescending') },
                        { value: 'asc', label: t('dataTable.sortAscending') },
                    ]}
                    onChange={(order) => onChange({ ...query, order })}
                />
                <Button title={t('common.apply')} onPress={onClose} />
                <Button
                    title={t('journal.clearFilters')}
                    variant="ghost"
                    onPress={() => onChange({})}
                />
            </View>
        </BottomSheet>
    );
}
