import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { useJournalScreen } from '@/hooks/use-journal-screen';
import { JournalList } from './journal-list';
import { JournalHome } from './journal-home';
import { JournalFilters } from './journal-filters';
import { JournalForm } from './journal-form';
import { JournalEditEntry } from './journal-edit-entry';
import { JournalSelectionBar } from './journal-selection-bar';
import { useJournalTheme } from './journal-theme';

export function JournalDirectory({ list = false }: { list?: boolean }) {
    const { t } = useTranslation(),
        p = useJournalTheme(),
        insets = useSafeAreaInsets(),
        s = useJournalScreen(list);
    return (
        <View
            className={p.dark ? 'dark' : undefined}
            style={{ flex: 1, backgroundColor: p.background }}
        >
            <AppBar title={t(list ? 'journal.title' : 'nav.journal')} transparent />
            {list ? (
                <JournalList screen={s} bottom={s.selectionMode ? 24 : insets.bottom + 112} />
            ) : (
                <JournalHome screen={s} bottom={insets.bottom + 112} />
            )}
            {s.actionError && !s.selectionMode && (
                <Text accessibilityRole="alert" style={{ color: p.destructive, padding: 16 }}>
                    {t('errors.generic')}
                </Text>
            )}
            {s.scope.canManage &&
                (s.selectionMode ? (
                    <JournalSelectionBar screen={s} bottom={insets.bottom} />
                ) : (
                    <View
                        style={{
                            position: 'absolute',
                            bottom: insets.bottom + 16,
                            left: 22,
                            right: 22,
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            testID="journal-add"
                            title={t('journal.add')}
                            size="lg"
                            leadingIcon="add"
                            onPress={() => s.setCreating(true)}
                        />
                    </View>
                ))}
            {s.creating && s.scope.canManage && (
                <JournalForm onClose={() => s.setCreating(false)} />
            )}
            {s.editingId && s.scope.canManage && (
                <JournalEditEntry id={s.editingId} onClose={() => s.setEditingId(null)} />
            )}
            {s.filtersOpen && (
                <JournalFilters
                    query={s.query}
                    search={s.search}
                    onChange={s.setQuery}
                    onClose={() => s.setFiltersOpen(false)}
                />
            )}

            {s.deletion && (
                <ConfirmationSheet
                    title={s.deletion.title}
                    description={t('journal.deleteBody')}
                    confirmLabel={t('common.delete')}
                    busy={s.busy}
                    failed={s.actionError}
                    onCancel={s.cancelDeletion}
                    onConfirm={() => void s.deleteConfirmed()}
                />
            )}
        </View>
    );
}
