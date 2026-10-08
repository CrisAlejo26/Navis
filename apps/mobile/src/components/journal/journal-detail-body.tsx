import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import { formatDay } from '@/lib/format';
import { hexAlpha } from '@/lib/color';
import { useJournalTheme, kindColor } from './journal-theme';
import { JOURNAL_KINDS } from './journal-kinds';

export function JournalDetailBody({ entry }: { entry: LocalJournalEntry }) {
    const { t } = useTranslation(),
        p = useJournalTheme(),
        color = kindColor(entry.kind, p);
    return (
        <View style={{ gap: 20 }}>
            <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                    <View
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 18,
                            backgroundColor: hexAlpha(color, 0.12),
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons
                            accessible={false}
                            name={JOURNAL_KINDS[entry.kind].icon}
                            color={color}
                            size={26}
                        />
                    </View>
                    <Text className="font-sans-medium" style={{ color, flex: 1 }}>
                        {t(JOURNAL_KINDS[entry.kind].label)}
                    </Text>
                </View>
                <Text
                    testID="journal-detail-title"
                    accessibilityRole="header"
                    className="font-sans-semibold"
                    style={{ color: p.ink, fontSize: 26, lineHeight: 36 }}
                >
                    {entry.title}
                </Text>
                <Text style={{ color: p.secondaryInk, fontSize: 14 }}>
                    {formatDay(entry.occurredAt)}
                </Text>
                <Text style={{ color: p.secondaryInk, fontSize: 12 }}>
                    {t('journal.authorLabel', {
                        name: entry.authorName ?? t('journal.unknownAuthor'),
                    })}
                </Text>
            </View>
            {[
                { label: t('journal.annotationField'), text: entry.annotation },
                { label: t('journal.learnedField'), text: entry.learned },
            ]
                .filter((one) => Boolean(one.text))
                .map((one) => (
                    <View
                        key={one.label}
                        style={{
                            gap: 12,
                            padding: 20,
                            borderRadius: 26,
                            backgroundColor: p.surface,
                        }}
                    >
                        <Text
                            accessibilityRole="header"
                            className="font-sans-semibold"
                            style={{ color: p.ink, fontSize: 17 }}
                        >
                            {one.label}
                        </Text>
                        <Text style={{ color: p.ink, fontSize: 15, lineHeight: 25 }}>
                            {one.text}
                        </Text>
                    </View>
                ))}
        </View>
    );
}
