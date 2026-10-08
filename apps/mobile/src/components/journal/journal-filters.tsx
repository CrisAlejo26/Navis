import { useState } from 'react';
import type { JournalQuery } from '@navis/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useJournal } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { JournalEditor } from './journal-editor';
import { JournalFilterFields } from './journal-filter-fields';

export function JournalFilters({
    query,
    search,
    onChange,
    onClose,
}: {
    query: JournalQuery;
    search?: string;
    onChange: (query: JournalQuery) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        [draft, setDraft] = useState(query);
    const count = useJournal({ ...draft, search: search?.trim() || undefined, limit: 1 });
    return (
        <JournalEditor
            title={t('journal.filters')}
            saving={false}
            onClose={onClose}
            saveTitle={t('journal.mobile.applyCount', { count: count.data?.pages[0]?.total ?? 0 })}
            disabled={count.isPending || count.isError}
            onSave={() => {
                onChange(draft);
                onClose();
            }}
        >
            <View style={{ gap: 24 }}>
                <Button
                    title={t('journal.clearFilters')}
                    variant="ghost"
                    onPress={() => setDraft({})}
                />
                <JournalFilterFields draft={draft} setDraft={setDraft} />
                {count.isError && (
                    <View style={{ gap: 12 }}>
                        <Text accessibilityRole="alert" className="text-destructive">
                            {t('errors.generic')}
                        </Text>
                        <Button title={t('common.retry')} onPress={() => void count.refetch()} />
                    </View>
                )}
            </View>
        </JournalEditor>
    );
}
