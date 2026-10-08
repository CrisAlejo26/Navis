import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useJournalTheme } from './journal-theme';
import type { useJournalScreen } from '@/hooks/use-journal-screen';

export function JournalSelectionBar({
    screen: s,
    bottom,
}: {
    screen: ReturnType<typeof useJournalScreen>;
    bottom: number;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    return (
        <View
            style={{
                padding: 16,
                paddingBottom: bottom + 16,
                gap: 8,
                borderTopWidth: 1,
                borderColor: p.border,
                backgroundColor: p.card,
            }}
        >
            <Text
                accessibilityLiveRegion="polite"
                className="font-sans-semibold"
                style={{ color: p.ink }}
            >
                {t('dataTable.selection.count', { count: s.selected.size })}
            </Text>
            <View style={{ gap: 8 }}>
                <Button
                    testID="journal-export-selected"
                    title={t('journal.bulkExport')}
                    size="sm"
                    leadingIcon="download-outline"
                    disabled={!s.selected.size || s.busy}
                    loading={s.exporting}
                    onPress={() => void s.exportSelection()}
                />
                <Button
                    testID="journal-delete-selected"
                    title={t('journal.mobile.deleteMany', { count: s.selected.size })}
                    size="sm"
                    leadingIcon="trash-outline"
                    variant="ghost"
                    disabled={!s.selected.size || s.busy}
                    onPress={() => s.confirmDelete([...s.selected])}
                />
            </View>
            {s.actionError && (
                <Text accessibilityRole="alert" style={{ color: p.destructive }}>
                    {t('errors.generic')}
                </Text>
            )}
        </View>
    );
}
