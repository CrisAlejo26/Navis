import type { ProphecyFulfillment, ProphecyState } from '@navis/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';

import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ProphecyDetailHeader } from '@/components/prophecies/prophecy-detail-header';
import { ProphecyFormSheet, toInput } from '@/components/prophecies/prophecy-form-sheet';
import { ProphecyFulfillmentCard } from '@/components/prophecies/prophecy-fulfillment-card';
import { ProphecyFulfillmentSheet } from '@/components/prophecies/prophecy-fulfillment-sheet';
import { ProphecyFulfillmentToggle } from '@/components/prophecies/prophecy-fulfillment-toggle';
import {
    useAddFulfillment,
    useDeleteFulfillment,
    useDeleteProphecy,
    useProphecy,
    useUpdateFulfillment,
    useUpdateProphecy,
} from '@/hooks/use-prophecies';
import { formatDay } from '@/lib/format';

function stateOf(fulfilledAt: string | null, lastFulfillmentAt: string | null): ProphecyState {
    if (fulfilledAt) return 'cumplida';
    if (lastFulfillmentAt) return 'camino';
    return 'espera';
}

/**
 * La ficha (§4.5, §5 paso 5): cabecera con degradado por estado, el texto de
 * la profecía siempre a la vista —no escondido detrás de un conmutador—, el
 * interruptor «Ya se cumplió» y el hilo de cumplimientos, del más reciente
 * al más antiguo.
 */
export default function ProphecyDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: prophecy, isPending, isError, refetch } = useProphecy(id);
    const updateProphecy = useUpdateProphecy();
    const deleteProphecy = useDeleteProphecy();
    const addFulfillment = useAddFulfillment(id);
    const updateFulfillment = useUpdateFulfillment(id);
    const deleteFulfillment = useDeleteFulfillment(id);

    const [editOpen, setEditOpen] = useState(false);
    const [fulfillmentSheet, setFulfillmentSheet] = useState<ProphecyFulfillment | null | 'new'>(
        null,
    );

    if (isPending) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('prophecies.title')} />
                <View className="gap-3 p-4">
                    <Skeleton className="h-8 w-2/3 rounded-xl" />
                    <Skeleton className="h-24 rounded-2xl w-full" />
                </View>
            </View>
        );
    }

    if (isError || !prophecy) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('prophecies.title')} />
                <EmptyState
                    icon="sparkles-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void refetch() }}
                />
            </View>
        );
    }

    const state = stateOf(prophecy.fulfilledAt, prophecy.lastFulfillmentAt);
    const current = prophecy;
    const fulfillments = [...current.fulfillments].reverse();

    function confirmDelete() {
        Alert.alert(
            t('prophecies.deleteTitle', { title: current.title }),
            t('prophecies.deleteBody'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        void deleteProphecy.mutateAsync(current.id);
                        router.back();
                    },
                },
            ],
        );
    }

    function confirmDeleteFulfillment(fulfillmentId: string) {
        Alert.alert(t('prophecies.deleteFulfillmentTitle'), t('prophecies.deleteFulfillmentBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => void deleteFulfillment.mutateAsync(fulfillmentId),
            },
        ]);
    }

    return (
        <View className="flex-1 bg-background">
            <ProphecyDetailHeader
                title={prophecy.title}
                state={state}
                onEdit={() => setEditOpen(true)}
                onDelete={confirmDelete}
            />
            <ScrollView contentContainerClassName="gap-4 p-4 pb-24">
                <Card className="rounded-2xl">
                    <Text className="text-xs text-muted-foreground">
                        {t('prophecies.receivedOn', { date: formatDay(prophecy.receivedAt) })}
                        {prophecy.fulfilledAt
                            ? ` · ${t('prophecies.fulfilledOn', { date: formatDay(prophecy.fulfilledAt) })}`
                            : ''}
                    </Text>
                    <Text className="text-base leading-6 text-foreground">{prophecy.body}</Text>
                </Card>

                <Card className="rounded-2xl">
                    <ProphecyFulfillmentToggle
                        fulfilledAt={prophecy.fulfilledAt}
                        onChange={(fulfilledAt) =>
                            void updateProphecy.mutateAsync({
                                id: prophecy.id,
                                input: { fulfilledAt },
                            })
                        }
                    />
                </Card>

                <View className="gap-2.5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-base font-sans-semibold text-foreground">
                            {t('prophecies.fulfillmentsTotal', { total: fulfillments.length })}
                        </Text>
                    </View>

                    <Button
                        title={t('prophecies.addFulfillment')}
                        variant="secondary"
                        onPress={() => setFulfillmentSheet('new')}
                    />

                    {fulfillments.length === 0 ? (
                        <EmptyState
                            icon="sparkles-outline"
                            title={t('prophecies.fulfillmentsEmpty')}
                            description={t('prophecies.fulfillmentsEmptyHint')}
                        />
                    ) : (
                        <View className="gap-2.5">
                            {fulfillments.map((one) => (
                                <ProphecyFulfillmentCard
                                    key={one.id}
                                    fulfillment={one}
                                    onPress={() => setFulfillmentSheet(one)}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <ProphecyFormSheet
                visible={editOpen}
                onClose={() => setEditOpen(false)}
                prophecy={prophecy}
                onSave={async (values) => {
                    await updateProphecy.mutateAsync({ id: prophecy.id, input: toInput(values) });
                }}
            />

            <ProphecyFulfillmentSheet
                visible={fulfillmentSheet !== null}
                onClose={() => setFulfillmentSheet(null)}
                fulfillment={fulfillmentSheet === 'new' ? null : fulfillmentSheet}
                onSave={async (values) => {
                    if (fulfillmentSheet && fulfillmentSheet !== 'new') {
                        await updateFulfillment.mutateAsync({
                            id: fulfillmentSheet.id,
                            input: values,
                        });
                    } else {
                        await addFulfillment.mutateAsync(values);
                    }
                }}
                onDelete={
                    fulfillmentSheet && fulfillmentSheet !== 'new'
                        ? () => confirmDeleteFulfillment(fulfillmentSheet.id)
                        : undefined
                }
            />
        </View>
    );
}
