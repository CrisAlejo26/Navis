import type { DreamState, DreamsQuery } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { DreamCard } from '@/components/dreams/dream-card';
import { DreamFilters } from '@/components/dreams/dream-filters';
import { DreamFormSheet } from '@/components/dreams/dream-form-sheet';
import { QuickEditSheet, QuickFulfillSheet } from '@/components/dreams/dream-quick-sheets';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSaveDream } from '@/hooks/use-dream-save';
import { useDreams, useDreamsStats } from '@/hooks/use-dreams';
import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

/**
 * El listado (RFC 0005 §7.5): buscador, pastillas de estado y una tarjeta por
 * sueño, con la misma anatomía que el de profecías. La pregunta que responde es
 * «¿qué soñé, y cuándo?», así que el orden por defecto es por noche hacia
 * atrás. A la derecha de la tarjeta, marcarlo como cumplido; a la izquierda,
 * editarlo. Los filtros llegan de la portada (D16) como parámetros de ruta.
 */
export default function DreamsListScreen() {
    const { t } = useTranslation();
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const palette = themeColorsHex[resolvedTheme];
    const params = useLocalSearchParams<{
        state?: DreamState;
        from?: string;
        to?: string;
        emotion?: string;
    }>();
    const [search, setSearch] = useState('');
    // El filtro inicial llega una sola vez, con la navegación desde la portada: un
    // inicializador perezoso, no un efecto que dispare `setState` al montar.
    const [query, setQuery] = useState<DreamsQuery>(() => ({
        state: params.state ? [params.state] : undefined,
        from: params.from || undefined,
        to: params.to || undefined,
        emotion: params.emotion ? [params.emotion] : undefined,
    }));
    const [formOpen, setFormOpen] = useState(false);
    const [quickFulfillId, setQuickFulfillId] = useState<string | null>(null);
    const [quickEditId, setQuickEditId] = useState<string | null>(null);
    const save = useSaveDream();

    const debouncedSearch = useDebouncedValue(search);
    const filters = useMemo<DreamsQuery>(
        () => ({ ...query, search: debouncedSearch.trim() || undefined }),
        [query, debouncedSearch],
    );
    const { data, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useDreams(filters);
    const stats = useDreamsStats();
    const items = data?.pages.flatMap((page) => page.items) ?? [];
    const filtered = Boolean(search || query.state || query.emotion || query.from || query.to);

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
                    title={t('dreams.title')}
                    actions={[
                        { icon: 'add', label: t('dreams.add'), onPress: () => setFormOpen(true) },
                    ]}
                />
                <View className="gap-3 px-4 pb-4">
                    <SearchField
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t('dreams.search')}
                    />
                    <DreamFilters query={query} onChange={setQuery} stats={stats.data} />
                </View>
            </View>

            {isPending ? (
                <View className="gap-2.5 px-4">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-28 rounded-2xl" />
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
                    icon="moon-outline"
                    title={filtered ? t('dreams.noResults') : t('dreams.emptyTitle')}
                    description={filtered ? undefined : t('dreams.emptyBody')}
                    action={{ label: t('dreams.add'), onPress: () => setFormOpen(true) }}
                />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="gap-2.5 px-4 pb-24"
                    renderItem={({ item }) => (
                        <DreamCard
                            dream={item}
                            onPress={() => router.push(`/dreams/${item.id}`)}
                            onFulfill={setQuickFulfillId}
                            onEdit={setQuickEditId}
                        />
                    )}
                    ListFooterComponent={
                        hasNextPage ? (
                            <Button
                                title={t('dreams.loadMore')}
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

            <DreamFormSheet
                visible={formOpen}
                onClose={() => setFormOpen(false)}
                dream={null}
                onSave={(values) => save(values, null)}
            />
            {quickFulfillId ? (
                <QuickFulfillSheet
                    key={quickFulfillId}
                    dreamId={quickFulfillId}
                    onClose={() => setQuickFulfillId(null)}
                />
            ) : null}
            {quickEditId ? (
                <QuickEditSheet
                    key={quickEditId}
                    dreamId={quickEditId}
                    onClose={() => setQuickEditId(null)}
                />
            ) : null}
        </View>
    );
}
