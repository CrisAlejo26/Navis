import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { extractTeachingBodyText, toTeachingMarkdown } from '@navis/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TeachingBodyView } from '@/components/teachings/teaching-body-view';
import { TeachingDetailHeader } from '@/components/teachings/teaching-detail-header';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteTeaching, useTeaching, useUpdateTeaching } from '@/hooks/use-teachings';
import { toggleTaskItem } from '@/lib/teachings/body-ops';

/**
 * La ficha (plan `ensenanzas-movil-plan.md` §4.5): la franja con el título y,
 * debajo, el cuerpo a ancho de lectura. Las tareas se marcan aquí mismo, sin
 * entrar en el editor.
 */
export default function TeachingDetailScreen() {
    const bottomPadding = usePageBottomPadding();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: teaching, isPending, isError, refetch } = useTeaching(id);
    const updateTeaching = useUpdateTeaching();
    const deleteTeaching = useDeleteTeaching();

    if (isPending) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('teachings.title')} />
                <View className="gap-3 p-4">
                    <Skeleton className="h-8 w-2/3 rounded-xl" />
                    <Skeleton className="h-24 rounded-2xl w-full" />
                </View>
            </View>
        );
    }

    if (isError || !teaching) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('teachings.title')} />
                <EmptyState
                    icon="school-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void refetch() }}
                />
            </View>
        );
    }

    const current = teaching;
    const { checklist, text } = extractTeachingBodyText(current.body);

    function share() {
        const markdown = toTeachingMarkdown(current, {
            frontmatterTitle: t('teachings.titleField'),
            frontmatterDate: t('teachings.receivedAtField'),
        });
        void Share.share({ title: current.title, message: markdown });
    }

    function confirmDelete() {
        Alert.alert(
            t('teachings.deleteTitle', { title: current.title }),
            t('teachings.deleteBody'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        void deleteTeaching.mutateAsync(current.id);
                        router.back();
                    },
                },
            ],
        );
    }

    return (
        <View className="flex-1 bg-background">
            <TeachingDetailHeader
                title={current.title}
                receivedAt={current.receivedAt}
                checklist={checklist}
                onShare={share}
                onEdit={() =>
                    router.push({ pathname: '/teachings/edit', params: { id: current.id } })
                }
                onDelete={confirmDelete}
            />
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: bottomPadding }}>
                {text === '' && !checklist ? (
                    <Text className="text-muted-foreground">{t('teachings.noNotes')}</Text>
                ) : null}
                <TeachingBodyView
                    body={current.body}
                    onToggleTask={(index) =>
                        void updateTeaching.mutateAsync({
                            id: current.id,
                            input: { body: toggleTaskItem(current.body, index) },
                        })
                    }
                />
            </ScrollView>
        </View>
    );
}
