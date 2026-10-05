import { useState } from 'react';
import { Modal, View, Text, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { daysBetween } from '@navis/shared';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { useActivities } from '@/hooks/use-activities';
import { defaultFilters, filterRange, type TaskFilters } from '@/lib/tasks/filters';
import { FilterScope } from './filter-scope';
import { FilterMeta } from './filter-meta';
import { FilterView } from './filter-view';
import { useTaskPalette } from './task-theme';
export function TaskFiltersScreen({
    filters,
    today,
    timezone,
    onApply,
    onClose,
}: {
    filters: TaskFilters;
    today: string;
    timezone: string;
    onApply: (filters: TaskFilters) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState(filters),
        { t } = useTranslation(),
        p = useTaskPalette(),
        insets = useSafeAreaInsets();
    const range = filterRange(draft, today),
        invalid = daysBetween(range.from, range.to) > 92 || range.from > range.to;
    const matches = useActivities(invalid ? defaultFilters() : { ...draft, limit: 1 }, today);
    return (
        <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: p.background }}>
                <AppBar
                    title={t('tasks.mobile.filters')}
                    onBack={onClose}
                    actions={[
                        {
                            icon: 'refresh-outline',
                            label: t('tasks.mobile.reset'),
                            onPress: () => setDraft(defaultFilters()),
                        },
                    ]}
                />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            padding: 22,
                            paddingBottom: 32,
                            gap: 28,
                            width: '100%',
                            maxWidth: 480,
                            alignSelf: 'center',
                        }}
                    >
                        <FilterScope
                            draft={draft}
                            onChange={setDraft}
                            today={today}
                            timezone={timezone}
                        />
                        <FilterMeta draft={draft} onChange={setDraft} />
                        <FilterView draft={draft} onChange={setDraft} />
                        {invalid && (
                            <Text accessibilityRole="alert" className="font-sans text-destructive">
                                {t('tasks.mobile.rangeError')}
                            </Text>
                        )}
                        {matches.isError && (
                            <Button
                                title={t('common.retry')}
                                onPress={() => void matches.refetch()}
                            />
                        )}
                    </ScrollView>
                    <View
                        style={{
                            paddingHorizontal: 22,
                            paddingTop: 12,
                            paddingBottom: insets.bottom + 12,
                            borderTopWidth: 1,
                            borderColor: p.border,
                            backgroundColor: p.card,
                        }}
                    >
                        <Button
                            title={t('tasks.mobile.apply', {
                                count: matches.data?.pages[0]?.total ?? 0,
                            })}
                            className="rounded-2xl"
                            loading={matches.isPending}
                            disabled={invalid || matches.isError}
                            onPress={() => onApply(draft)}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
