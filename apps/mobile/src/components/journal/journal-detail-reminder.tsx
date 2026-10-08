import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import { Button } from '@/components/ui/button';
import { useJournalTheme } from './journal-theme';
import { journalReminderLabel } from './journal-reminder-label';

export function JournalDetailReminder({
    entry,
    canManage,
    busy,
    onAttend,
}: {
    entry: LocalJournalEntry;
    canManage: boolean;
    busy: boolean;
    onAttend: () => void;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    if (!entry.remindAt) return null;
    return (
        <View style={{ backgroundColor: p.surface, borderRadius: 26, padding: 20, gap: 12 }}>
            <Text
                accessibilityRole="header"
                className="font-sans-semibold"
                style={{ color: p.ink, fontSize: 16 }}
            >
                {t(entry.remindDoneAt ? 'journal.reminderAttended' : 'journal.reminderPending')}
            </Text>
            <Text style={{ color: p.secondaryInk, fontSize: 14 }}>
                {journalReminderLabel(entry.remindAt)}
            </Text>
            {entry.remindText && (
                <Text style={{ color: p.ink, fontSize: 15 }}>{entry.remindText}</Text>
            )}
            {canManage && (
                <Button
                    title={t(
                        entry.remindDoneAt ? 'journal.reminderReopen' : 'journal.reminderDone',
                    )}
                    testID="journal-attend"
                    variant="secondary"
                    disabled={busy}
                    onPress={onAttend}
                />
            )}
        </View>
    );
}
