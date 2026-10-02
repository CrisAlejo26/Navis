import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { createList } from '@/data/repos/lists-repo';
import { useListContext, useListMutation, useLists } from '@/hooks/use-lists';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { TopBar } from '@/components/ui/top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Switch } from '@/components/ui/switch';
import { ListPanel } from './list-panel';
import { ListForm } from './list-form';

export function ListsScreen() {
    const { t } = useTranslation();
    const lists = useLists();
    const { context, canManage } = useListContext();
    const create = useListMutation(createList);
    const [form, setForm] = useState(false);
    const [inactive, setInactive] = useState(false);
    const bottom = usePageBottomPadding();
    const items = lists.data?.filter((one) => inactive || one.isActive) ?? [];
    return (
        <View className="flex-1 bg-background">
            <View className="gap-3 p-4">
                <TopBar
                    title={t('nav.lists')}
                    subtitle={t('lists.countLists', { count: items.length })}
                    action={
                        canManage
                            ? { icon: 'add', label: t('lists.add'), onPress: () => setForm(true) }
                            : undefined
                    }
                />
                <Switch label={t('lists.showInactive')} checked={inactive} onChange={setInactive} />
            </View>
            {lists.isPending ? (
                <ActivityIndicator accessibilityLabel={t('common.loading')} />
            ) : lists.isError ? (
                <EmptyState
                    icon="alert-circle-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void lists.refetch() }}
                />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(one) => one.id}
                    contentContainerStyle={{
                        gap: 12,
                        paddingHorizontal: 16,
                        paddingBottom: bottom,
                    }}
                    renderItem={({ item }) => (
                        <ListPanel
                            list={item}
                            onPress={() =>
                                router.push({ pathname: '/lists/[id]', params: { id: item.id } })
                            }
                        />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="list-outline"
                            title={t('lists.emptyTitle')}
                            action={
                                canManage
                                    ? { label: t('lists.add'), onPress: () => setForm(true) }
                                    : undefined
                            }
                        />
                    }
                />
            )}
            {form ? (
                <ListForm
                    key={context.churchId}
                    onClose={() => setForm(false)}
                    onSave={(input) => create.mutateAsync(input)}
                />
            ) : null}
        </View>
    );
}
