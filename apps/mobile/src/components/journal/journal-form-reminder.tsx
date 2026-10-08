import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { JournalTime } from './journal-time';
import { JournalSection } from './journal-section';
import type { useJournalForm } from '@/hooks/use-journal-form';

export function JournalFormReminder({ form: f }: { form: ReturnType<typeof useJournalForm> }) {
    const { t } = useTranslation();
    return (
        <JournalSection
            title={t('journal.reminderField')}
            icon="alarm-outline"
            open={f.reminderOpen}
            onToggle={() => f.setReminderOpen(!f.reminderOpen)}
        >
            <Switch
                testID="journal-reminder-enabled"
                label={t('journal.reminderField')}
                checked={f.remindOn}
                onChange={f.setRemindOn}
            />
            {f.remindOn && (
                <View style={{ gap: 12 }}>
                    <DatePicker
                        label={t('journal.reminderDate')}
                        error={f.fieldErrors.reminder}
                        value={f.reminder.date || null}
                        placeholder={t('journal.reminderDate')}
                        onChange={(date) => f.setReminder({ ...f.reminder, date })}
                    />
                    <JournalTime
                        value={f.reminder.time}
                        onChange={(time) => f.setReminder({ ...f.reminder, time })}
                    />
                    <TextField
                        label={t('journal.reminderText')}
                        error={f.fieldErrors.remindText}
                        value={f.remindText}
                        onChangeText={f.setRemindText}
                        maxLength={500}
                        placeholder={t('journal.reminderTextPlaceholder')}
                    />
                </View>
            )}
        </JournalSection>
    );
}
