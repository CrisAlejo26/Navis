import { dreamState } from '@navis/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';

import { DreamDetailHeader } from '@/components/dreams/dream-detail-header';
import { DreamFormSheet } from '@/components/dreams/dream-form-sheet';
import { DreamFulfillSheet } from '@/components/dreams/dream-fulfill-sheet';
import { DreamJourney } from '@/components/dreams/dream-journey';
import { DreamAudios } from '@/components/dreams/dream-audios-card';
import { DreamFulfillment } from '@/components/dreams/dream-fulfillment-card';
import { DreamBody, DreamInterpretation } from '@/components/dreams/dream-sections';
import { AppBar } from '@/components/ui/app-bar';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSaveDream } from '@/hooks/use-dream-save';
import {
    useAddDreamAudio,
    useDeleteDream,
    useDeleteDreamAudio,
    useDream,
    useUpdateDream,
} from '@/hooks/use-dreams';
import { DREAM_DETAIL_VIEWS, useDreamDetailViewStore } from '@/stores/dream-view';

const VIEW_LABEL = {
    completo: 'dreams.detailViews.completo',
    lectura: 'dreams.detailViews.lectura',
    interpretacion: 'dreams.detailViews.interpretacion',
    recorrido: 'dreams.detailViews.recorrido',
} as const;

/**
 * La ficha de un sueño (RFC 0005 §7.6): cabecera con degradado por estado y, debajo,
 * **cuatro lecturas** que responden a cuatro preguntas — enséñamelo todo,
 * déjame releerlo, quiero trabajar su significado, qué ha pasado con él — y que
 * se recuerdan entre sesiones. La cabecera y las acciones no cambian con la vista.
 */
export default function DreamDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: dream, isPending, isError, refetch } = useDream(id);
    const update = useUpdateDream();
    const remove = useDeleteDream();
    const addAudio = useAddDreamAudio();
    const removeAudio = useDeleteDreamAudio();
    const save = useSaveDream();
    const view = useDreamDetailViewStore((state) => state.view);
    const setView = useDreamDetailViewStore((state) => state.setView);
    const [editOpen, setEditOpen] = useState(false);
    const [fulfillOpen, setFulfillOpen] = useState(false);

    if (isPending) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('dreams.title')} />
                <View className="gap-3 p-4">
                    <Skeleton className="h-8 w-2/3 rounded-xl" />
                    <Skeleton className="h-24 rounded-2xl w-full" />
                </View>
            </View>
        );
    }

    if (isError || !dream) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('dreams.title')} />
                <EmptyState
                    icon="moon-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void refetch() }}
                />
            </View>
        );
    }

    const current = dream;
    const title = current.title ?? t('dreams.untitled');

    function confirmDelete() {
        Alert.alert(t('dreams.deleteTitle', { title }), t('dreams.deleteBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                    void remove.mutateAsync(current.id);
                    router.back();
                },
            },
        ]);
    }

    const interpretation = <DreamInterpretation dream={current} onEdit={() => setEditOpen(true)} />;

    return (
        <View className="flex-1 bg-background">
            <DreamDetailHeader
                title={title}
                dreamedAt={current.dreamedAt}
                state={dreamState(current)}
                onEdit={() => setEditOpen(true)}
                onDelete={confirmDelete}
            />
            <ScrollView contentContainerClassName="gap-4 p-4 pb-24">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2"
                >
                    {DREAM_DETAIL_VIEWS.map((one) => (
                        <Chip
                            key={one}
                            label={t(VIEW_LABEL[one])}
                            selected={view === one}
                            onPress={() => setView(one)}
                        />
                    ))}
                </ScrollView>

                {view === 'completo' ? (
                    <>
                        <DreamBody dream={current} />
                        {interpretation}
                        <DreamAudios
                            dream={current}
                            onAdd={(audio) =>
                                void addAudio.mutateAsync({ dreamId: current.id, audio })
                            }
                            onRemove={(audioId) => void removeAudio.mutateAsync(audioId)}
                        />
                        <DreamFulfillment
                            dream={current}
                            onFulfill={() => setFulfillOpen(true)}
                            onReopen={() =>
                                void update.mutateAsync({
                                    id: current.id,
                                    input: { fulfilledAt: null },
                                })
                            }
                        />
                    </>
                ) : null}
                {view === 'lectura' ? <DreamBody dream={current} large /> : null}
                {view === 'interpretacion' ? (
                    <>
                        <DreamBody dream={current} />
                        {interpretation}
                    </>
                ) : null}
                {view === 'recorrido' ? <DreamJourney dream={current} /> : null}
            </ScrollView>

            <DreamFormSheet
                visible={editOpen}
                onClose={() => setEditOpen(false)}
                dream={current}
                onSave={(values) => save(values, current.id)}
            />
            <DreamFulfillSheet
                visible={fulfillOpen}
                onClose={() => setFulfillOpen(false)}
                current={{
                    fulfilledAt: current.fulfilledAt,
                    meaning: current.fulfillmentMeaning,
                }}
                onSave={async ({ fulfilledAt, meaning }) => {
                    await update.mutateAsync({
                        id: current.id,
                        input: { fulfilledAt, fulfillmentMeaning: meaning },
                    });
                }}
            />
        </View>
    );
}
