import { believerName } from '@navis/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';

import { BelieverFormSheet, toInput } from '@/components/believers/believer-form-sheet';
import { BelieverHeader } from '@/components/believers/believer-header';
import { NotesBitacora } from '@/components/believers/notes-bitacora';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCongregations } from '@/hooks/use-catalog';
import { useBeliever, useDeleteBeliever, useUpdateBeliever } from '@/hooks/use-believers';

/**
 * La ficha de un hermano (§7.5): quién es arriba —con la sonda a lo ancho y
 * la frase completa— y la bitácora debajo. «Añadir nota» es la acción
 * principal: es lo que más se pulsa y se pulsa de pie.
 */
export default function BelieverDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: believer, isPending, isError, refetch } = useBeliever(id);
  const congregations = useCongregations();
  const updateBeliever = useUpdateBeliever();
  const deleteBeliever = useDeleteBeliever();
  const [editOpen, setEditOpen] = useState(false);

  if (isPending) {
    return (
      <View className="flex-1 bg-background">
        <AppBar title={t('believers.title')} />
        <View className="gap-3 p-4">
          <Skeleton className="h-12 w-2/3 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-40 rounded-2xl w-full" />
        </View>
      </View>
    );
  }

  if (isError || !believer) {
    return (
      <View className="flex-1 bg-background">
        <AppBar title={t('believers.title')} />
        <EmptyState
          icon="person-outline"
          title={t('believers.notFound')}
          action={{ label: t('common.retry'), onPress: () => void refetch() }}
        />
      </View>
    );
  }

  const name = believerName(believer);
  const believerId = believer.id;

  function confirmDelete() {
    Alert.alert(t('believers.deleteTitle', { name }), t('believers.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteBeliever.mutateAsync(believerId);
          router.back();
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 pb-16">
        <BelieverHeader
          believer={believer}
          congregationName={
            congregations.data?.find((one) => one.id === believer.congregationId)?.name ?? null
          }
          onEdit={() => setEditOpen(true)}
          onDelete={confirmDelete}
        />

        <View className="px-4">
          <NotesBitacora believerId={believerId} believerName={name} />
        </View>
      </ScrollView>

      <BelieverFormSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        believer={believer}
        onSave={async (values) => {
          await updateBeliever.mutateAsync({ id: believerId, input: toInput(values) });
        }}
      />
    </View>
  );
}
