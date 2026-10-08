import type { JournalEntryListItem } from '@navis/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { SwipeableRow } from '@/components/ui/swipeable-row';
import { hexBlend } from '@/lib/color';
import { JOURNAL_KINDS } from './journal-kinds';
import { useJournalTheme, kindColor } from './journal-theme';
import { JournalCardCopy } from './journal-card-copy';
import { JournalCardSelection } from './journal-card-selection';

export function JournalCard({
    entry,
    compact,
    selected,
    selectionMode = false,
    onPress,
    onSelect,
    onAttend,
    onEdit,
    onDelete,
    busy = false,
}: {
    entry: JournalEntryListItem;
    compact?: boolean;
    selected?: boolean;
    selectionMode?: boolean;
    onPress: () => void;
    onSelect?: () => void;
    onAttend?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    busy?: boolean;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme(),
        accent = kindColor(entry.kind, p);
    const pending = Boolean(entry.remindAt && !entry.remindDoneAt);
    return (
        <SwipeableRow
            radius={26}
            shadowColor={p.border}
            disabled={busy || selectionMode}
            left={
                onAttend && pending
                    ? {
                          icon: 'checkmark',
                          label: t('journal.reminderDone'),
                          color: p.success,
                          foreground: p.successForeground,
                          onAction: onAttend,
                      }
                    : onEdit
                      ? {
                            icon: 'create-outline',
                            label: t('journal.edit'),
                            color: p.primary,
                            foreground: p.primaryForeground,
                            onAction: onEdit,
                        }
                      : undefined
            }
            right={
                onDelete
                    ? {
                          icon: 'trash-outline',
                          label: t('common.delete'),
                          color: p.destructive,
                          foreground: p.destructiveForeground,
                          onAction: onDelete,
                      }
                    : undefined
            }
        >
            <View
                style={{
                    borderRadius: 26,
                    borderWidth: 1,
                    borderColor: selected ? p.primary : p.border,
                    backgroundColor: hexBlend(
                        p.card,
                        p[JOURNAL_KINDS[entry.kind].token],
                        p.dark ? 0.14 : 0.09,
                    ),
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Pressable
                    testID={`journal-entry-${entry.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={entry.title}
                    accessibilityState={{ disabled: busy, selected: Boolean(selected) }}
                    accessibilityHint={onSelect ? t('journal.mobile.selectionHint') : undefined}
                    disabled={busy}
                    onPress={selectionMode && onSelect ? onSelect : onPress}
                    onLongPress={onSelect}
                    delayLongPress={350}
                    style={({ pressed }) => ({
                        flex: 1,
                        padding: 15,
                        gap: 13,
                        flexDirection: 'row',
                        opacity: pressed ? 0.65 : 1,
                    })}
                >
                    <View
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: hexBlend(p.card, accent, 0.12),
                        }}
                    >
                        <Ionicons
                            accessible={false}
                            name={JOURNAL_KINDS[entry.kind].icon}
                            size={22}
                            color={accent}
                        />
                    </View>
                    <JournalCardCopy entry={entry} compact={compact} />
                </Pressable>
                {selectionMode && onSelect && (
                    <JournalCardSelection
                        selected={selected}
                        busy={busy}
                        title={entry.title}
                        onSelect={onSelect}
                    />
                )}
            </View>
        </SwipeableRow>
    );
}
