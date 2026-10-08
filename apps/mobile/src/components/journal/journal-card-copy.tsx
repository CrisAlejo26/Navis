import type { JournalEntryListItem } from '@navis/shared';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDay } from '@/lib/format';
import { JOURNAL_KINDS } from './journal-kinds';
import { useJournalTheme, kindColor } from './journal-theme';
import { journalReminderLabel } from './journal-reminder-label';

export function JournalCardCopy({
    entry,
    compact,
}: {
    entry: JournalEntryListItem;
    compact?: boolean;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme(),
        color = kindColor(entry.kind, p);
    return (
        <View style={{ flex: 1, gap: 7 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Text
                    className="font-sans-semibold"
                    style={{ flex: 1, color: p.ink, fontSize: 15 }}
                    numberOfLines={2}
                >
                    {entry.title}
                </Text>
                <Text className="font-sans-medium" style={{ color: p.secondaryInk, fontSize: 12 }}>
                    {formatDay(entry.occurredAt)}
                </Text>
            </View>
            <Text className="font-sans-medium" style={{ color, fontSize: 12 }}>
                {t(JOURNAL_KINDS[entry.kind].label)}
            </Text>
            {!compact && (
                <Text
                    style={{ color: p.secondaryInk, fontSize: 13, lineHeight: 20 }}
                    numberOfLines={2}
                >
                    {entry.excerpt}
                </Text>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                {entry.remindAt && !entry.remindDoneAt && (
                    <Text style={{ color: p.link, fontSize: 12 }}>
                        {journalReminderLabel(entry.remindAt)}
                    </Text>
                )}
                {entry.hasAudio && (
                    <Ionicons
                        name="mic-outline"
                        size={16}
                        color={p.secondaryInk}
                        accessibilityLabel={t('journal.audiosField')}
                    />
                )}
                {entry.hasLearned && (
                    <Ionicons
                        name="bulb-outline"
                        size={16}
                        color={p.secondaryInk}
                        accessibilityLabel={t('journal.learnedField')}
                    />
                )}
                {!compact && entry.authorName && (
                    <Text style={{ color: p.secondaryInk, fontSize: 12 }} numberOfLines={1}>
                        {entry.authorName}
                    </Text>
                )}
            </View>
        </View>
    );
}
