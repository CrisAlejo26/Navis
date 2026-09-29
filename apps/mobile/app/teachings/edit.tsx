import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TeachingForm } from '@/components/teachings/teaching-form';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeaching } from '@/hooks/use-teachings';

/**
 * Alta (sin `id`) y edición (`?id=…`). En edición se pide la enseñanza entera
 * por identificador —una fila de listado solo trae un extracto— y el formulario
 * se monta con `key` cuando ya está (CLAUDE.md).
 */
export default function TeachingEditScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { data: teaching, isPending, isError, refetch } = useTeaching(id);

    if (!id) return <TeachingForm key="new" />;

    if (isPending) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('teachings.edit')} />
                <View className="gap-3 p-4">
                    <Skeleton className="h-10 w-2/3 rounded-xl" />
                    <Skeleton className="h-32 rounded-2xl w-full" />
                </View>
            </View>
        );
    }

    if (isError || !teaching) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('teachings.edit')} />
                <EmptyState
                    icon="school-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void refetch() }}
                />
            </View>
        );
    }

    return <TeachingForm key={teaching.id} teaching={teaching} />;
}
