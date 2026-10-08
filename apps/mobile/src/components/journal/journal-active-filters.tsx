import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ENTRY_KINDS } from '@navis/shared';
import { Chip } from '@/components/ui/chip';
import { JournalKindChip } from './journal-kind-chip';
import type { useJournalScreen } from '@/hooks/use-journal-screen';
import { useJournalTheme } from './journal-theme';
export function JournalActiveFilters({
    screen: s,
}: {
    screen: ReturnType<typeof useJournalScreen>;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    return (
        <View style={{ gap: 12 }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
            >
                <Chip
                    color={p.link}
                    label={t('common.all')}
                    selected={!s.query.kind?.length}
                    onPress={() => s.setQuery({ ...s.query, kind: undefined })}
                />
                {ENTRY_KINDS.map((kind) => (
                    <JournalKindChip
                        key={kind}
                        kind={kind}
                        selected={s.query.kind?.includes(kind)}
                        onPress={() =>
                            s.setQuery({
                                ...s.query,
                                kind: s.query.kind?.includes(kind)
                                    ? s.query.kind.filter((one) => one !== kind)
                                    : [...(s.query.kind ?? []), kind],
                            })
                        }
                    />
                ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {s.query.pendingReminder && (
                    <Chip
                        label={t('journal.pendingReminderChip')}
                        selected
                        color={p.link}
                        onPress={() => s.setQuery({ ...s.query, pendingReminder: false })}
                    />
                )}
                {(s.query.from || s.query.to || (s.query.window && s.query.window !== 'all')) && (
                    <Chip
                        label={
                            s.query.from || s.query.to
                                ? [s.query.from, s.query.to].filter(Boolean).join(' – ')
                                : t(
                                      s.query.window === '7d'
                                          ? 'journal.windows.recent'
                                          : s.query.window === '30d'
                                            ? 'journal.windows.month'
                                            : 'journal.windows.year',
                                  )
                        }
                        selected
                        color={p.link}
                        onPress={() =>
                            s.setQuery({
                                ...s.query,
                                from: undefined,
                                to: undefined,
                                window: 'all',
                            })
                        }
                    />
                )}
            </View>
        </View>
    );
}
