import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { JournalCover } from './journal-cover';
import { JournalCard } from './journal-card';
import { JournalCardSkeleton } from './journal-card-skeleton';
import { JournalOverview } from './journal-overview';
import { openJournalEntry, openJournalList } from './journal-navigation';
import { useJournalTheme } from './journal-theme';
import type { useJournalScreen } from '@/hooks/use-journal-screen';

export function JournalHome({
    screen: s,
    bottom,
}: {
    screen: ReturnType<typeof useJournalScreen>;
    bottom: number;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    return (
        <ScrollView
            contentContainerStyle={{
                paddingHorizontal: 22,
                paddingTop: 12,
                paddingBottom: bottom,
                gap: 24,
                maxWidth: 480,
                width: '100%',
                alignSelf: 'center',
            }}
        >
            <JournalCover
                total={s.stats.data?.total ?? 0}
                pending={s.stats.data?.pendingReminders ?? 0}
                thisMonth={s.stats.data?.thisMonth ?? 0}
            />
            {s.stats.isPending ? (
                <JournalCardSkeleton />
            ) : s.stats.isError ? (
                <Button title={t('common.retry')} onPress={() => void s.stats.refetch()} />
            ) : (
                s.stats.data && <JournalOverview stats={s.stats.data} onOpen={openJournalList} />
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <Text
                    accessibilityRole="header"
                    className="font-sans-semibold"
                    style={{ color: p.ink, fontSize: 18, flex: 1 }}
                >
                    {t('journal.mobile.recent')}
                </Text>
                <Button
                    title={t('journal.mobile.seeAll')}
                    variant="ghost"
                    size="sm"
                    onPress={() => openJournalList({})}
                />
            </View>
            {s.notes.isPending ? (
                <JournalCardSkeleton />
            ) : s.notes.isError ? (
                <Button title={t('common.retry')} onPress={() => void s.notes.refetch()} />
            ) : s.rows.length ? (
                s.rows
                    .slice(0, 3)
                    .map((entry) => (
                        <JournalCard
                            key={entry.id}
                            entry={entry}
                            compact
                            onPress={() => openJournalEntry(entry.id)}
                        />
                    ))
            ) : (
                <EmptyState
                    icon="book-outline"
                    title={t('journal.emptyTitle')}
                    description={t('journal.emptyBody')}
                />
            )}
        </ScrollView>
    );
}
