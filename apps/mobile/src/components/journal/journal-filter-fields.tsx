import {
    ENTRY_KINDS,
    type JournalQuery,
    type JournalWindow,
    type JournalSortField,
} from '@navis/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { JournalKindChip } from './journal-kind-chip';

export function JournalFilterFields({
    draft,
    setDraft,
}: {
    draft: JournalQuery;
    setDraft: (query: JournalQuery) => void;
}) {
    const { t } = useTranslation();
    return (
        <View style={{ gap: 24 }}>
            <View style={{ gap: 8 }}>
                <Text className="text-sm font-sans-medium text-foreground">
                    {t('journal.kindField')}
                </Text>
                <View style={{ gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                    {ENTRY_KINDS.map((kind) => (
                        <JournalKindChip
                            key={kind}
                            kind={kind}
                            selected={draft.kind?.includes(kind)}
                            onPress={() =>
                                setDraft({
                                    ...draft,
                                    kind: draft.kind?.includes(kind)
                                        ? draft.kind.filter((one) => one !== kind)
                                        : [...(draft.kind ?? []), kind],
                                })
                            }
                        />
                    ))}
                </View>
            </View>
            <Select<JournalWindow>
                label={t('journal.occurredAtField')}
                placeholder={t('journal.windows.all')}
                value={draft.window ?? 'all'}
                options={[
                    { value: 'all', label: t('journal.windows.all') },
                    { value: '7d', label: t('journal.windows.recent') },
                    { value: '30d', label: t('journal.windows.month') },
                    { value: 'year', label: t('journal.windows.year') },
                ]}
                onChange={(window) =>
                    setDraft({ ...draft, window, from: undefined, to: undefined })
                }
            />
            <DateRangePicker
                label={t('journal.filterDateHelp')}
                placeholder={t('journal.windows.all')}
                value={draft.from && draft.to ? { from: draft.from, to: draft.to } : null}
                onChange={(range) =>
                    setDraft({ ...draft, from: range?.from, to: range?.to, window: 'all' })
                }
            />
            <Switch
                label={t('journal.pendingReminderChip')}
                checked={Boolean(draft.pendingReminder)}
                onChange={(pendingReminder) => setDraft({ ...draft, pendingReminder })}
            />
            <Select<JournalSortField>
                label={t('dataTable.sortLabel')}
                placeholder={t('journal.columns.date')}
                value={draft.sort ?? 'date'}
                options={[
                    { value: 'date', label: t('journal.columns.date') },
                    { value: 'title', label: t('journal.columns.title') },
                    { value: 'kind', label: t('journal.columns.kind') },
                ]}
                onChange={(sort) => setDraft({ ...draft, sort })}
            />
            <Select<'asc' | 'desc'>
                label={t('dataTable.sortLabel')}
                placeholder={t('dataTable.sortDescending')}
                value={draft.order ?? 'desc'}
                options={[
                    { value: 'desc', label: t('dataTable.sortDescending') },
                    { value: 'asc', label: t('dataTable.sortAscending') },
                ]}
                onChange={(order) => setDraft({ ...draft, order })}
            />
        </View>
    );
}
