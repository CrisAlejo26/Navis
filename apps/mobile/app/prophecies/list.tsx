import type { PropheciesQuery, ProphecyState, ProphecyWindow } from '@navis/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { Skeleton } from '@/components/ui/skeleton';
import { ProphecyCard } from '@/components/prophecies/prophecy-card';
import { ProphecyFilters } from '@/components/prophecies/prophecy-filters';
import { ProphecyFormSheet, toInput } from '@/components/prophecies/prophecy-form-sheet';
import { ProphecyFulfillmentSheet } from '@/components/prophecies/prophecy-fulfillment-sheet';
import {
    useAddFulfillment,
    useCreateProphecy,
    useProphecies,
    useProphecy,
    useProphecyStats,
    useUpdateProphecy,
} from '@/hooks/use-prophecies';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

/**
 * El listado (§4.5): buscador, pastillas de estado y una tarjeta por
 * profecía — la misma anatomía que `BelieverCard`, a pedido. Sin conmutador
 * de vistas: era más ruido que ayuda para una lista que, en la práctica,
 * pocas veces pasa de un puñado de profecías. Los mismos gestos que
 * `BelieverCard`: a la derecha, anotar un cumplimiento; a la izquierda, editar.
 */
export default function PropheciesListScreen() {
    const { t } = useTranslation();
    const params = useLocalSearchParams<{ state?: ProphecyState; window?: ProphecyWindow }>();
    const [search, setSearch] = useState('');
    // El filtro inicial llega una sola vez, con la navegación desde la portada
    // (las tarjetas-filtro): un inicializador perezoso, no un efecto que
    // dispare `setState` al montar.
    const [query, setQuery] = useState<PropheciesQuery>(() => ({
        state: params.state ? [params.state] : undefined,
        window: params.window,
    }));
    const [formOpen, setFormOpen] = useState(false);
    // Gestos de tarjeta: el cumplimiento va con el identificador (el hook fija
    // la profecía al montarse) y la edición pide la profecía entera —una fila
    // de listado no sirve para editar lo que trunca (CLAUDE.md).
    const [quickFulfillmentId, setQuickFulfillmentId] = useState<string | null>(null);
    const [quickEditId, setQuickEditId] = useState<string | null>(null);

    const debouncedSearch = useDebouncedValue(search);
    const filters = useMemo<PropheciesQuery>(
        () => ({ ...query, search: debouncedSearch.trim() || undefined }),
        [query, debouncedSearch],
    );

    const { data, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useProphecies(filters);
    const stats = useProphecyStats();
    const createProphecy = useCreateProphecy();

    const items = data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <View className="flex-1 bg-background">
            <AppBar
                title={t('prophecies.title')}
                actions={[
                    { icon: 'add', label: t('prophecies.add'), onPress: () => setFormOpen(true) },
                ]}
            />
            <View className="gap-3 px-4 pb-2">
                <SearchField
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t('prophecies.search')}
                />
                <ProphecyFilters query={query} onChange={setQuery} stats={stats.data} />
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
                    icon="sparkles-outline"
                    title={
                        search || query.state
                            ? t('prophecies.noResults')
                            : t('prophecies.emptyTitle')
                    }
                    description={search || query.state ? undefined : t('prophecies.emptyBody')}
                    action={{ label: t('prophecies.add'), onPress: () => setFormOpen(true) }}
                />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="gap-2.5 px-4 pb-24"
                    renderItem={({ item }) => (
                        <ProphecyCard
                            prophecy={item}
                            onPress={() => router.push(`/prophecies/${item.id}`)}
                            onAddFulfillment={setQuickFulfillmentId}
                            onEdit={setQuickEditId}
                        />
                    )}
                    ListFooterComponent={
                        hasNextPage ? (
                            <Button
                                title={t('prophecies.loadMore')}
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

            <ProphecyFormSheet
                visible={formOpen}
                onClose={() => setFormOpen(false)}
                prophecy={null}
                onSave={async (values) => {
                    await createProphecy.mutateAsync(toInput(values));
                }}
            />

            {quickFulfillmentId ? (
                <QuickFulfillmentSheet
                    key={quickFulfillmentId}
                    prophecyId={quickFulfillmentId}
                    onClose={() => setQuickFulfillmentId(null)}
                />
            ) : null}

            {quickEditId ? (
                <QuickEditSheet
                    key={quickEditId}
                    prophecyId={quickEditId}
                    onClose={() => setQuickEditId(null)}
                />
            ) : null}
        </View>
    );
}

/** El gesto de anotar, desde el listado: solo hace falta el identificador. */
function QuickFulfillmentSheet({
    prophecyId,
    onClose,
}: {
    prophecyId: string;
    onClose: () => void;
}) {
    const addFulfillment = useAddFulfillment(prophecyId);
    return (
        <ProphecyFulfillmentSheet
            visible
            onClose={onClose}
            fulfillment={null}
            onSave={async (values) => {
                await addFulfillment.mutateAsync(values);
            }}
        />
    );
}

/**
 * El gesto de editar, desde el listado: la fila trae un `excerpt`, no el
 * cuerpo entero, así que se pide la profecía de verdad antes de abrir el
 * formulario (CLAUDE.md).
 */
function QuickEditSheet({ prophecyId, onClose }: { prophecyId: string; onClose: () => void }) {
    const { data: prophecy } = useProphecy(prophecyId);
    const updateProphecy = useUpdateProphecy();
    if (!prophecy) return null;
    return (
        <ProphecyFormSheet
            visible
            onClose={onClose}
            prophecy={prophecy}
            onSave={async (values) => {
                await updateProphecy.mutateAsync({ id: prophecyId, input: toInput(values) });
            }}
        />
    );
}
