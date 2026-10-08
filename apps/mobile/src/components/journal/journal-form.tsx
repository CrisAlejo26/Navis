import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { Linking, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import { useJournalForm } from '@/hooks/use-journal-form';
import { JournalEditor } from './journal-editor';
import { JournalFormFields } from './journal-form-fields';
import { JournalFormReminder } from './journal-form-reminder';
import { JournalFormAudios } from './journal-form-audios';

export function JournalForm({
    entry,
    onClose,
}: {
    entry?: LocalJournalEntry;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        form = useJournalForm(entry, onClose);
    if (form.notificationsDenied)
        return (
            <BottomSheet visible title={t('notifications.denied.title')} onClose={onClose}>
                <View className="gap-4 pb-3">
                    <Text className="font-sans text-base text-muted-foreground">
                        {t('notifications.denied.body')}
                    </Text>
                    <Button
                        title={t('notifications.denied.openSettings')}
                        onPress={() => {
                            onClose();
                            void Linking.openSettings();
                        }}
                    />
                    <Button title={t('common.close')} variant="secondary" onPress={onClose} />
                </View>
            </BottomSheet>
        );
    if (form.discarding)
        return (
            <ConfirmationSheet
                title={t('journal.mobile.discard')}
                description={t('journal.mobile.discardBody')}
                confirmLabel={t('journal.mobile.discard')}
                onCancel={form.cancelDiscard}
                onConfirm={form.confirmDiscard}
            />
        );
    return (
        <JournalEditor
            saving={form.saving}
            onSave={() => void form.save()}
            onClose={form.close}
            title={t(entry ? 'journal.edit' : 'journal.add')}
        >
            <View style={{ gap: 24 }}>
                <JournalFormFields form={form} />
                <JournalFormReminder form={form} />
                <JournalFormAudios form={form} entry={entry} />
                {form.error && (
                    <Text accessibilityRole="alert" className="text-sm text-destructive">
                        {form.error}
                    </Text>
                )}
            </View>
        </JournalEditor>
    );
}
