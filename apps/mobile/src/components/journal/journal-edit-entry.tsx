import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useJournalEntry } from '@/hooks/use-journal';
import { JournalForm } from './journal-form';
import { JournalEditor } from './journal-editor';
import { Button } from '@/components/ui/button';

export function JournalEditEntry({ id, onClose }: { id: string; onClose: () => void }) {
    const { t } = useTranslation(),
        result = useJournalEntry(id);
    if (result.data) return <JournalForm key={id} entry={result.data} onClose={onClose} />;
    return (
        <JournalEditor title={t('journal.edit')} saving={false} onClose={onClose}>
            <View style={{ gap: 16 }}>
                <Text className="text-foreground">
                    {t(
                        result.isPending
                            ? 'common.loading'
                            : result.isError
                              ? 'errors.generic'
                              : 'errors.notFound',
                    )}
                </Text>
                {result.isError && (
                    <Button title={t('common.retry')} onPress={() => void result.refetch()} />
                )}
            </View>
        </JournalEditor>
    );
}
