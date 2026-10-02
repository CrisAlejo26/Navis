import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import type { TeachingsQuery } from '@navis/shared';
import { router } from 'expo-router';
import { themeColorsHex } from '@navis/theme';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';

import { TeachingCard } from '@/components/teachings/teaching-card';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTeachings } from '@/hooks/use-teachings';
import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

type SortChoice = 'newest' | 'oldest' | 'byTitle';

const SORTS: Record<SortChoice, Pick<TeachingsQuery, 'sort' | 'order'>> = {
    newest: { sort: 'received', order: 'desc' },
    oldest: { sort: 'received', order: 'asc' },
    byTitle: { sort: 'title', order: 'asc' },
};

const SORT_ICONS = {
    newest: 'arrow-down',
    oldest: 'arrow-up',
    byTitle: 'text-outline',
} as const;

/**
 * El listado (plan `ensenanzas-movil-plan.md` §4.5): buscador y orden en
 * pastillas que se deslizan, como profecías y creyentes, y una tarjeta por enseñanza. Deslizar una tarjeta abre el editor; la fila solo
 * trae un extracto, así que el editor vuelve a pedir la enseñanza entera.
 */
export default function TeachingsListScreen() {
    const bottomPadding = usePageBottomPadding();
    const { t } = useTranslation();
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const palette = themeColorsHex[resolvedTheme];
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortChoice>('newest');
    const debouncedSearch = useDebouncedValue(search);
    const query = useMemo<TeachingsQuery>(
        () => ({ ...SORTS[sort], search: debouncedSearch.trim() || undefined }),
        [sort, debouncedSearch],
    );

    const { data, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useTeachings(query);
    const items = data?.pages.flatMap((page) => page.items) ?? [];
    const add = () => router.push('/teachings/edit');

    return (
        <View className="flex-1 bg-background">
            <View
                className="mb-3 rounded-b-3xl"
                style={{
                    backgroundColor: hexAlpha(
                        palette.primary,
                        resolvedTheme === 'dark' ? 0.16 : 0.08,
                    ),
                }}
            >
                <AppBar
                    transparent
                    title={t('teachings.title')}
                    actions={[{ icon: 'add', label: t('teachings.add'), onPress: add }]}
                />
                <View className="gap-3 px-4 pb-4">
                    <SearchField
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t('teachings.search')}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerClassName="gap-2"
                    >
                        {(Object.keys(SORTS) as SortChoice[]).map((value) => (
                            <Chip
                                key={value}
                                label={t(`teachings.sort.${value}`)}
                                icon={SORT_ICONS[value]}
                                selected={sort === value}
                                onPress={() => setSort(value)}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>

            {isPending ? (
                <View className="gap-2.5 px-4">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-24 rounded-2xl" />
                    ))}
                </View>
            ) : isError ? (
                <EmptyState
                    icon="cloud-offline-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void refetch() }}
                />
            ) : items.length === 0 ? (
                <EmptyState
                    icon="school-outline"
                    title={search ? t('teachings.noResults') : t('teachings.emptyTitle')}
                    description={search ? undefined : t('teachings.emptyBody')}
                    action={{ label: t('teachings.add'), onPress: add }}
                />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{
                        gap: 10,
                        paddingHorizontal: 16,
                        paddingBottom: bottomPadding,
                    }}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <TeachingCard
                            teaching={item}
                            onPress={() => router.push(`/teachings/${item.id}`)}
                            onEdit={(id) =>
                                router.push({ pathname: '/teachings/edit', params: { id } })
                            }
                        />
                    )}
                    ListFooterComponent={
                        hasNextPage ? (
                            <Button
                                title={t('teachings.loadMore')}
                                variant="secondary"
                                size="sm"
                                loading={isFetchingNextPage}
                                onPress={() => void fetchNextPage()}
                                className="mt-2"
                            />
                        ) : null
                    }
                />
            )}
        </View>
    );
}
