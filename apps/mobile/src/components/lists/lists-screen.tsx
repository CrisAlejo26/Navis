import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { createList } from '@/data/repos/lists-repo';
import { useListContext, useListMutation, useLists } from '@/hooks/use-lists';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useStatusBarClaim } from '@/lib/status-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPanel } from './list-panel';
import { ListsBoardHeader } from './lists-board-header';
import { ListForm } from './list-form';

export function ListsScreen() {
    const { t } = useTranslation();
    const lists = useLists();
    const { context, canManage } = useListContext();
    const create = useListMutation(createList);
    const [form, setForm] = useState(false);
    const [inactive, setInactive] = useState(false);
    const bottom = usePageBottomPadding();
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });
    useStatusBarClaim('light');
    const items = lists.data?.filter((one) => inactive || one.isActive) ?? [];
    return (
        <View className="flex-1 bg-background">
            <Animated.FlatList
                data={lists.isPending || lists.isError ? [] : items}
                keyExtractor={(one) => one.id}
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: canManage ? 16 : bottom }}
                ListHeaderComponent={
                    <ListsBoardHeader
                        scrollY={scrollY}
                        count={items.length}
                        inactive={inactive}
                        onChange={setInactive}
                    />
                }
                renderItem={({ item }) => (
                    <View className="px-4 pb-3">
                        <ListPanel
                            list={item}
                            onPress={() =>
                                router.push({ pathname: '/lists/[id]', params: { id: item.id } })
                            }
                        />
                    </View>
                )}
                ListEmptyComponent={
                    lists.isPending ? (
                        <ActivityIndicator accessibilityLabel={t('common.loading')} />
                    ) : (
                        <EmptyState
                            icon={lists.isError ? 'alert-circle-outline' : 'list-outline'}
                            title={t(lists.isError ? 'errors.generic' : 'lists.emptyTitle')}
                            action={
                                lists.isError
                                    ? {
                                          label: t('common.retry'),
                                          onPress: () => void lists.refetch(),
                                      }
                                    : undefined
                            }
                        />
                    )
                }
            />
            {canManage ? (
                <View
                    className="px-4 pt-3 border-t border-border bg-background"
                    style={{ paddingBottom: bottom }}
                >
                    <Button
                        size="lg"
                        title={t('lists.add')}
                        leadingIcon="add"
                        onPress={() => setForm(true)}
                    />
                </View>
            ) : null}
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
