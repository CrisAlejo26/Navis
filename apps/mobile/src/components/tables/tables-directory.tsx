import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useTables, useTableContext, useTableMutation } from '@/hooks/use-tables';
import { createTable } from '@/data/repos/tables-writes';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useStatusBarClaim } from '@/lib/status-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TableForm } from './table-form';
import { TablePanel } from './table-panel';
import { TablesBoardHeader } from './tables-board-header';

export function TablesDirectory() {
    const { t } = useTranslation(),
        query = useTables(),
        { canManageStructure, enabled, context } = useTableContext();
    const [form, setForm] = useState(false),
        [inactive, setInactive] = useState(false),
        [search, setSearch] = useState('');
    const create = useTableMutation(createTable),
        bottom = usePageBottomPadding(),
        scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });
    useStatusBarClaim('light');
    const active = query.data?.filter((one) => inactive || one.isActive) ?? [];
    const items = active.filter((one) =>
        one.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    );
    return (
        <View className="flex-1 bg-background">
            <Animated.FlatList
                data={query.isError ? [] : items}
                keyExtractor={(one) => one.id}
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: canManageStructure ? 16 : bottom }}
                ListHeaderComponent={
                    <TablesBoardHeader
                        scrollY={scrollY}
                        count={active.length}
                        search={search}
                        onSearch={setSearch}
                        inactive={inactive}
                        onInactive={setInactive}
                    />
                }
                renderItem={({ item }) => (
                    <View className="px-4 pb-3">
                        <TablePanel
                            table={item}
                            onPress={() =>
                                router.push({ pathname: '/tables/[id]', params: { id: item.id } })
                            }
                        />
                    </View>
                )}
                ListEmptyComponent={
                    enabled && query.isPending ? (
                        <ActivityIndicator accessibilityLabel={t('common.loading')} />
                    ) : (
                        <EmptyState
                            icon={query.isError ? 'alert-circle-outline' : 'grid-outline'}
                            title={t(
                                !enabled
                                    ? 'tables.notFound'
                                    : query.isError
                                      ? 'errors.generic'
                                      : search
                                        ? 'tables.noRowsMatch'
                                        : 'tables.emptyTitle',
                            )}
                            action={
                                query.isError
                                    ? {
                                          label: t('common.retry'),
                                          onPress: () => void query.refetch(),
                                      }
                                    : search
                                      ? {
                                            label: t('dataTable.clear'),
                                            onPress: () => setSearch(''),
                                        }
                                      : undefined
                            }
                        />
                    )
                }
            />
            {canManageStructure ? (
                <View
                    className="px-4 pt-3 border-t border-border bg-background"
                    style={{ paddingBottom: bottom }}
                >
                    <Button
                        size="lg"
                        leadingIcon="add"
                        title={t('tables.newTable')}
                        onPress={() => setForm(true)}
                    />
                </View>
            ) : null}
            {form ? (
                <TableForm
                    key={context.churchId}
                    onClose={() => setForm(false)}
                    onSave={(value) => create.mutateAsync(value)}
                />
            ) : null}
        </View>
    );
}
