import type { JournalEntryListItem } from '@navis/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { formatDay } from '@/lib/format';
import { hexAlpha } from '@/lib/color';
import { KIND_ICON, useJournalPalette, kindColor } from './journal-theme';
import { journalReminderLabel } from './journal-reminder-label';

export function JournalCard({
    entry,
    compact,
    selected,
    selectionMode = false,
    onPress,
    onSelect,
}: {
    entry: JournalEntryListItem;
    compact?: boolean;
    selected?: boolean;
    selectionMode?: boolean;
    onPress: () => void;
    onSelect?: () => void;
}) {
    const { t } = useTranslation(),
        p = useJournalPalette(),
        accent = kindColor(entry.kind, p);
    const pending = entry.remindAt && !entry.remindDoneAt;
    return (
        <View
            style={{
                backgroundColor: p.card,
                borderRadius: compact ? 16 : 22,
                borderWidth: 1,
                borderColor: selected ? p.primary : p.line,
                overflow: 'hidden',
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={entry.title}
                    onPress={selectionMode && onSelect ? onSelect : onPress}
                    onLongPress={onSelect}
                    accessibilityHint={onSelect ? t('journal.mobile.selectionHint') : undefined}
                    style={({ pressed }) => ({
                        flex: 1,
                        padding: compact ? 16 : 20,
                        gap: compact ? 8 : 12,
                        opacity: pressed ? 0.65 : 1,
                    })}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flex: 1, gap: 8 }}>
                            <Text
                                style={{
                                    color: p.ink,
                                    fontSize: compact ? 16 : 19,
                                    fontWeight: '700',
                                    lineHeight: compact ? 23 : 27,
                                }}
                                numberOfLines={2}
                            >
                                {entry.title}
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Ionicons
                                    accessible={false}
                                    name={KIND_ICON[entry.kind]}
                                    size={14}
                                    color={accent}
                                />
                                <Text style={{ color: accent, fontSize: 12, fontWeight: '600' }}>
                                    {t(`journal.kind.${entry.kind}`)}
                                </Text>
                                <Text style={{ color: p.secondaryInk, fontSize: 12 }}>
                                    · {formatDay(entry.occurredAt)}
                                </Text>
                            </View>
                        </View>
                        {!selectionMode && (
                            <Ionicons
                                accessible={false}
                                name={compact ? 'chevron-forward' : KIND_ICON[entry.kind]}
                                size={compact ? 16 : 28}
                                color={compact ? p.secondaryInk : accent}
                            />
                        )}
                    </View>
                    {!compact && (
                        <Text
                            style={{ color: p.secondaryInk, fontSize: 15, lineHeight: 23 }}
                            numberOfLines={2}
                        >
                            {entry.excerpt}
                        </Text>
                    )}
                    {(pending ||
                        entry.hasAudio ||
                        entry.hasLearned ||
                        (!compact && entry.authorName)) && (
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            {pending && (
                                <View
                                    style={{
                                        borderRadius: 8,
                                        paddingHorizontal: 8,
                                        paddingVertical: 5,
                                        backgroundColor: hexAlpha(p.primary, 0.1),
                                        flexDirection: 'row',
                                        gap: 5,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        accessible={false}
                                        name="alarm-outline"
                                        size={14}
                                        color={p.link}
                                    />
                                    <Text
                                        style={{
                                            color: p.link,
                                            fontSize: 12,
                                            fontWeight: '600',
                                        }}
                                    >
                                        {journalReminderLabel(entry.remindAt!)}
                                    </Text>
                                </View>
                            )}
                            {entry.hasAudio && (
                                <Ionicons
                                    accessibilityLabel={t('journal.audiosField')}
                                    name="mic-outline"
                                    size={16}
                                    color={p.secondaryInk}
                                />
                            )}
                            {entry.hasLearned && (
                                <Ionicons
                                    accessibilityLabel={t('journal.learnedField')}
                                    name="bulb-outline"
                                    size={16}
                                    color={p.secondaryInk}
                                />
                            )}
                            {!compact && entry.authorName && (
                                <Text
                                    style={{ color: p.secondaryInk, fontSize: 12 }}
                                    numberOfLines={1}
                                >
                                    {entry.authorName}
                                </Text>
                            )}
                        </View>
                    )}
                </Pressable>
                {selectionMode && onSelect && (
                    <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: Boolean(selected) }}
                        accessibilityLabel={t('journal.selectOne', { title: entry.title })}
                        onPress={onSelect}
                        style={({ pressed }) => ({
                            width: 48,
                            height: 48,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.6 : 1,
                        })}
                    >
                        <Ionicons
                            name={selected ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={selected ? p.link : p.secondaryInk}
                        />
                    </Pressable>
                )}
            </View>
        </View>
    );
}
